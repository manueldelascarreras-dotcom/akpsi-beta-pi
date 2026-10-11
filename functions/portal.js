/*
 * Pledge portal API: /api/portal/*
 *
 * Every request carries a Firebase Auth ID token (Authorization: Bearer …).
 * The role in users/{uid} decides what that person may read and change:
 *   pledge    their own program, submissions, and feedback
 *   educator  the pledges assigned to them, and reviewing their work
 *   vpm       everything, plus editing the program and managing people
 */
const crypto = require('crypto');
const { getAuth } = require('firebase-admin/auth');

const ROLES = ['pledge', 'educator', 'vpm'];
const WEEKS = 8;
const MB = 1024 * 1024;
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O or 1/I lookalikes
const OFFICE = { '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };

const DEFAULT_WEEKS = [
  ['Orientation', 'The first tee'], ['History & Ritual', 'Learning the course'], ['Brotherhood', 'Playing as a group'],
  ['Professional Development', 'Reading the green'], ['Service', 'Course care'], ['Leadership', 'Calling the shot'],
  ['Chapter Operations', 'The back nine'], ['Initiation', 'The final green'],
].map(([title, hole]) => ({ title, hole, summary: '', image: '' }));

module.exports = ({ db, bucket, send, readForm, readJSONBody, sniff, clean, slug, saveFile, removeFile, clientIp }) => {
  const fail = (status, message) => Object.assign(new Error(message), { status });
  const now = () => new Date().toISOString();

  /* ───────────── who is asking ───────────── */

  async function identify(req) {
    const m = String(req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (!m) throw fail(401, 'Please sign in.');
    let token;
    try { token = await getAuth().verifyIdToken(m[1]); } catch { throw fail(401, 'Your session expired. Please sign in again.'); }
    const snap = await db.collection('users').doc(token.uid).get();
    return { token, uid: token.uid, user: snap.exists ? snap.data() : null };
  }

  const requireRole = (me, ...roles) => {
    if (!me.user) throw fail(403, 'Your account is not set up yet. Enter your invite code.');
    if (me.user.active === false) throw fail(403, 'Your portal access is turned off. Contact the VPM.');
    if (roles.length && !roles.includes(me.user.role)) throw fail(403, "You don't have access to that.");
  };

  /* ───────────── data helpers ───────────── */

  const all = async name => (await db.collection(name).get()).docs.map(d => ({ id: d.id, ...d.data() }));

  async function getProgram() {
    const snap = await db.collection('portal').doc('program').get();
    const p = snap.exists ? snap.data() : {};
    const weeks = Array.from({ length: WEEKS }, (_, i) => ({ ...DEFAULT_WEEKS[i], ...(p.weeks?.[i] || {}) }));
    return {
      className: p.className || 'Pledge Class', startDate: p.startDate || '', weeks,
      programName: p.programName || 'Pledge Education Program',
      subtitle: p.subtitle || 'A stronger you',
      tagline: p.tagline || 'Keep showing up. Different looks good on you.',
      quote: p.quote || 'Discipline today builds the leaders of tomorrow.',
      heroImage: p.heroImage || '',
    };
  }

  /* An educator may see a pledge if that pledge is assigned to them. VPMs see everyone. */
  const canSeePledge = (me, pledge) => me.user.role === 'vpm' || me.uid === pledge?.uid || (me.user.role === 'educator' && pledge?.educatorUid === me.uid);

  const publicUser = (u, full) => ({
    uid: u.uid, name: u.name, role: u.role, educatorUid: u.educatorUid || '',
    ...(full ? { email: u.email, active: u.active !== false, createdAt: u.createdAt } : {}),
  });

  /* ───────────── routes ───────────── */

  const claimAttempts = new Map();   // ip → { count, since }  (per instance, best effort)

  async function claim(req, res, me) {
    if (me.user) return send(res, 400, { error: 'Your account is already set up.' });
    const ip = clientIp(req);
    const a = claimAttempts.get(ip) || { count: 0, since: Date.now() };
    if (Date.now() - a.since > 3600e3) { a.count = 0; a.since = Date.now(); }
    if (a.count >= 10) return send(res, 429, { error: 'Too many attempts. Try again in an hour.' });

    const body = readJSONBody(req);
    const code = clean(body.code, 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const name = clean(body.name, 100);
    if (!name) return send(res, 400, { error: 'Please enter your full name.', field: 'name' });
    if (!code) return send(res, 400, { error: 'Please enter your invite code.', field: 'code' });

    const result = await db.runTransaction(async tx => {
      const ref = db.collection('invites').doc(code);
      const inv = await tx.get(ref);
      if (!inv.exists || inv.data().usedBy || (inv.data().expiresAt && inv.data().expiresAt < now())) return null;
      const i = inv.data();
      const user = { uid: me.uid, name, email: me.token.email || '', role: i.role, educatorUid: i.role === 'pledge' ? (i.educatorUid || '') : '', active: true, createdAt: now() };
      tx.set(db.collection('users').doc(me.uid), user);
      tx.update(ref, { usedBy: me.uid, usedByName: name, usedAt: now() });
      return user;
    });
    if (!result) { a.count++; claimAttempts.set(ip, a); return send(res, 400, { error: "That invite code isn't valid, has expired, or was already used.", field: 'code' }); }
    return send(res, 200, { ok: true, role: result.role });
  }

  async function bootstrap(req, res, me) {
    requireRole(me);
    const role = me.user.role;
    const [program, deliverables, resources, announcements, events, users, submissions] = await Promise.all([
      getProgram(), all('deliverables'), all('resources'), all('announcements'), all('portalEvents'), all('users'), all('submissions'),
    ]);
    const notes = await all('notes');
    const byUid = Object.fromEntries(users.map(u => [u.uid, u]));
    const visiblePledges = users.filter(u => u.role === 'pledge' && u.active !== false && canSeePledge(me, u));
    const visibleSubs = submissions.filter(s => canSeePledge(me, byUid[s.pledgeUid]));

    let people;
    if (role === 'vpm') people = users.map(u => publicUser(u, true));
    else {
      const keep = new Set([me.uid, ...visiblePledges.map(p => p.uid)]);
      if (me.user.educatorUid) keep.add(me.user.educatorUid);
      /* Like a class roster: names and roles of everyone active (no emails) */
      people = users.filter(u => keep.has(u.uid) || u.active !== false).map(u => publicUser(u, false));
    }

    const out = {
      me: publicUser({ ...me.user, uid: me.uid }, true),
      program,
      deliverables: deliverables.sort((a, b) => a.week - b.week || (a.order || 0) - (b.order || 0) || String(a.dueAt).localeCompare(String(b.dueAt))),
      resources, events,
      announcements: announcements.sort((a, b) => (b.pinned === true) - (a.pinned === true) || String(b.createdAt).localeCompare(String(a.createdAt))),
      people,
      submissions: visibleSubs,
    };
    out.notes = notes.filter(n => canSeePledge(me, byUid[n.pledgeUid])).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (role === 'vpm') out.invites = (await all('invites')).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return send(res, 200, out);
  }

  /* Pledge turns in work: files (PDF, images, Office), a link, and/or a note. */
  async function submit(req, res, me, deliverableId) {
    requireRole(me, 'pledge');
    const dSnap = await db.collection('deliverables').doc(deliverableId).get();
    if (!dSnap.exists) return send(res, 404, { error: 'That deliverable no longer exists.' });
    const d = dSnap.data();

    let form;
    try { form = await readForm(req, 30 * MB); }
    catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'Files are too large. Keep the total under 25 MB.' : 'Could not read your upload. Please try again.' }); }

    const note = clean(form.get('note'), 4000);
    let link = clean(form.get('link'), 600);
    if (link && !/^https?:\/\//i.test(link)) link = `https://${link}`;
    if (link) { try { new URL(link); } catch { return send(res, 400, { error: 'That link does not look right.', field: 'link' }); } }

    const files = form.getAll('file').filter(f => f instanceof File && f.size);
    if (files.reduce((n, f) => n + f.size, 0) > 25 * MB) return send(res, 400, { error: 'Files are too large. Keep the total under 25 MB.' });
    const keepFiles = form.get('keepFiles') === '1';
    if (!files.length && !link && !note && !keepFiles) return send(res, 400, { error: 'Attach a file, add a link, or write a note before submitting.' });

    const id = `${deliverableId}__${me.uid}`;
    const ref = db.collection('submissions').doc(id);
    const prev = (await ref.get()).data();
    if (prev?.status === 'approved') return send(res, 400, { error: 'This deliverable is already approved.' });

    const saved = [];
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const ext = (f.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
      let type = sniff(buf);
      if (!type && buf[0] === 0x50 && buf[1] === 0x4B && OFFICE[ext]) type = { ext, kind: 'office', type: OFFICE[ext] };
      if (type?.kind === 'heic') return send(res, 400, { error: `${f.name}: iPhone HEIC photos aren't supported. Export as JPG first.` });
      if (!type || !['pdf', 'image', 'office'].includes(type.kind)) return send(res, 400, { error: `${f.name}: upload a PDF, an image, or a Word, PowerPoint, or Excel file.` });
      const path = `private/portal/submissions/${me.uid}/${deliverableId}/${slug(f.name.replace(/\.[^.]+$/, ''))}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
      await saveFile(path, buf, type.type, 'private, max-age=0');
      saved.push({ name: clean(f.name, 160), path, type: type.type, size: buf.length });
    }
    /* A resubmission with new files replaces the old ones */
    if (saved.length && prev?.files?.length) for (const f of prev.files) await removeFile(f.path);

    const at = now();
    const late = Boolean(d.dueAt && at > d.dueAt);
    const entry = {
      deliverableId, pledgeUid: me.uid, week: d.week,
      files: saved.length ? saved : (keepFiles ? prev?.files || [] : []),
      note, link, status: 'submitted', late,
      submittedAt: at, firstSubmittedAt: prev?.firstSubmittedAt || at,
      reviewedAt: null, reviewedBy: null,
      history: [...(prev?.history || []), { at, by: me.uid, byName: me.user.name, action: prev ? 'resubmitted' : 'submitted', comment: note }],
    };
    await ref.set(entry);
    return send(res, 200, { ok: true, submission: { id, ...entry } });
  }

  /* Educator or VPM: approve, request a revision, or just comment. */
  async function review(req, res, me, id) {
    requireRole(me, 'educator', 'vpm');
    const { action, comment: raw, grade: rawGrade } = readJSONBody(req);
    const comment = clean(raw, 4000);
    /* Optional grade out of 100 (one decimal) */
    let grade = null;
    if (rawGrade !== undefined && rawGrade !== null && rawGrade !== '') {
      grade = Math.round(Number(rawGrade) * 10) / 10;
      if (!Number.isFinite(grade) || grade < 0 || grade > 100) return send(res, 400, { error: 'Grades go from 0 to 100.', field: 'grade' });
    }
    if (!['approve', 'revise', 'comment'].includes(action)) return send(res, 400, { error: 'Unknown action.' });
    if (action !== 'approve' && !comment && !(action === 'comment' && grade !== null)) return send(res, 400, { error: action === 'revise' ? 'Tell the pledge what to change.' : 'Write a comment first.', field: 'comment' });

    const ref = db.collection('submissions').doc(id);
    const result = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw fail(404, 'Submission not found.');
      const s = snap.data();
      const pledge = (await tx.get(db.collection('users').doc(s.pledgeUid))).data();
      if (!canSeePledge(me, pledge)) throw fail(403, 'This pledge is not assigned to you.');
      const at = now();
      if (action === 'approve') s.status = 'approved';
      if (action === 'revise') s.status = 'needs_revision';
      if (action !== 'comment') { s.reviewedAt = at; s.reviewedBy = me.uid; s.reviewedByName = me.user.name; }
      if (grade !== null) { s.grade = grade; s.gradedAt = at; s.gradedBy = me.uid; s.gradedByName = me.user.name; }
      s.history = [...(s.history || []), { at, by: me.uid, byName: me.user.name, action: { approve: 'approved', revise: 'requested revision', comment: 'commented' }[action], comment, ...(grade !== null ? { grade } : {}) }];
      tx.set(ref, s);
      return { id, ...s };
    });
    return send(res, 200, { ok: true, submission: result });
  }

  /* Open a submitted file or a resource in the browser, if you're allowed to see it. */
  async function file(req, res, me) {
    requireRole(me);
    const path = String(req.query.path || '');
    if (!path || path.includes('..')) return send(res, 403, 'Forbidden');
    let ok = false;
    const sub = path.match(/^private\/portal\/submissions\/([^/]+)\//);
    if (sub) {
      const pledge = sub[1] === me.uid ? { ...me.user, uid: me.uid } : (await db.collection('users').doc(sub[1]).get()).data();
      ok = canSeePledge(me, pledge && { ...pledge, uid: sub[1] });
    } else if (path.startsWith('private/portal/resources/')) ok = true;
    if (!ok) return send(res, 403, "You don't have access to this file.");
    try {
      const f = bucket.file(path);
      const [[data], [meta]] = await Promise.all([f.download(), f.getMetadata()]);
      const name = path.split('/').pop();
      send(res, 200, data, {
        'Content-Type': meta.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
        'Content-Disposition': `${req.query.download ? 'attachment' : 'inline'}; filename="${name}"`,
      });
    } catch { send(res, 404, 'File not found.'); }
  }

  /* ───────────── VPM: program content ───────────── */

  const isoOrEmpty = v => { const s = clean(v, 40); if (!s) return ''; const d = new Date(s); return isNaN(d) ? '' : d.toISOString(); };
  const weekNum = (v, min = 1) => Math.min(WEEKS, Math.max(min, parseInt(v, 10) || min));
  const links = v => (Array.isArray(v) ? v : []).slice(0, 20).map(r => ({ name: clean(r?.name, 160), url: clean(r?.url, 600), path: clean(r?.path, 400) })).filter(r => r.name && (r.url || r.path));

  const ITEMS = {
    deliverables: b => ({ name: clean(b.name, 160), week: weekNum(b.week), instructions: clean(b.instructions, 8000), dueAt: isoOrEmpty(b.dueAt), resources: links(b.resources), order: parseInt(b.order, 10) || 0 }),
    resources: b => ({ title: clean(b.title, 160), week: weekNum(b.week, 0), description: clean(b.description, 2000), url: clean(b.url, 600), path: clean(b.path, 400), fileName: clean(b.fileName, 160) }),
    announcements: b => ({ title: clean(b.title, 160), body: clean(b.body, 6000), pinned: b.pinned === true }),
    portalEvents: b => ({ title: clean(b.title, 160), date: /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : '', time: clean(b.time, 40), location: clean(b.location, 200), week: weekNum(b.week, 0), kind: ['meeting', 'event', 'deadline'].includes(b.kind) ? b.kind : 'event', details: clean(b.details, 2000) }),
  };
  const REQUIRED = { deliverables: ['name'], resources: ['title'], announcements: ['title'], portalEvents: ['title', 'date'] };

  async function items(req, res, me, collection, id) {
    requireRole(me, 'vpm');
    const shape = ITEMS[collection];
    if (!shape) return send(res, 404, { error: 'Not found' });
    const ref = id ? db.collection(collection).doc(id) : db.collection(collection).doc();
    if (req.method === 'DELETE') {
      const snap = await ref.get();
      const old = snap.data() || {};
      for (const p of [old.path, ...(old.resources || []).map(r => r.path)]) if (p?.startsWith('private/portal/resources/')) await removeFile(p);
      await ref.delete();
      return send(res, 200, { ok: true });
    }
    const item = shape(readJSONBody(req));
    const missing = REQUIRED[collection].find(k => !item[k]);
    if (missing) return send(res, 400, { error: `Please fill in the ${missing === 'name' || missing === 'title' ? 'title' : missing}.`, field: missing });
    if (collection === 'announcements') {
      const prev = id ? (await ref.get()).data() : null;
      Object.assign(item, { author: prev?.author || me.user.name, createdAt: prev?.createdAt || now(), editedAt: id ? now() : null });
    }
    await ref.set(item);
    return send(res, 200, { ok: true, item: { id: ref.id, ...item } });
  }

  /* Upload a template or resource file (VPM). Returns a private path for an item to reference. */
  async function upload(req, res, me) {
    requireRole(me, 'vpm');
    let form;
    try { form = await readForm(req, 30 * MB); }
    catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'File is too large (25 MB max).' : 'Upload failed.' }); }
    const f = form.get('file');
    if (!(f instanceof File) || !f.size) return send(res, 400, { error: 'No file received.' });
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = (f.name.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
    let type = sniff(buf);
    if (!type && buf[0] === 0x50 && buf[1] === 0x4B && OFFICE[ext]) type = { ext, kind: 'office', type: OFFICE[ext] };
    if (!type || !['pdf', 'image', 'office'].includes(type.kind)) return send(res, 400, { error: 'Upload a PDF, an image, or a Word, PowerPoint, or Excel file.' });
    const path = `private/portal/resources/${slug(f.name.replace(/\.[^.]+$/, ''))}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
    await saveFile(path, buf, type.type, 'private, max-age=0');
    return send(res, 200, { ok: true, path, name: clean(f.name, 160) });
  }

  async function saveProgram(req, res, me) {
    requireRole(me, 'vpm');
    const b = readJSONBody(req);
    const program = {
      className: clean(b.className, 80) || 'Pledge Class',
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(b.startDate) ? b.startDate : '',
      programName: clean(b.programName, 80), subtitle: clean(b.subtitle, 80),
      tagline: clean(b.tagline, 160), quote: clean(b.quote, 200), heroImage: clean(b.heroImage, 600),
      weeks: Array.from({ length: WEEKS }, (_, i) => {
        const w = b.weeks?.[i] || {};
        return { title: clean(w.title, 80), hole: clean(w.hole, 80), summary: clean(w.summary, 2000), image: clean(w.image, 600) };
      }),
    };
    await db.collection('portal').doc('program').set(program);
    return send(res, 200, { ok: true, program: await getProgram() });
  }

  /* ───────────── VPM: people ───────────── */

  async function updateUser(req, res, me, uid) {
    requireRole(me, 'vpm');
    const b = readJSONBody(req);
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return send(res, 404, { error: 'User not found.' });
    const patch = {};
    if (typeof b.name === 'string' && clean(b.name, 100)) patch.name = clean(b.name, 100);
    if (ROLES.includes(b.role)) patch.role = b.role;
    if (typeof b.active === 'boolean') patch.active = b.active;
    if (typeof b.educatorUid === 'string') {
      if (b.educatorUid) {
        const ed = (await db.collection('users').doc(b.educatorUid).get()).data();
        if (!ed || !['educator', 'vpm'].includes(ed.role)) return send(res, 400, { error: 'Pick a pledge educator.' });
      }
      patch.educatorUid = b.educatorUid;
    }
    /* Never lock the chapter out: keep at least one active VPM */
    if (uid === me.uid && (patch.role && patch.role !== 'vpm' || patch.active === false)) {
      const vpms = (await db.collection('users').where('role', '==', 'vpm').get()).docs.filter(d => d.data().active !== false);
      if (vpms.length <= 1) return send(res, 400, { error: "You're the only VPM. Make someone else a VPM first." });
    }
    await ref.update(patch);
    return send(res, 200, { ok: true, user: publicUser({ ...snap.data(), ...patch, uid }, true) });
  }

  const newCode = () => Array.from(crypto.randomBytes(8), b => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');

  async function createInvites(req, res, me) {
    requireRole(me, 'vpm');
    const b = readJSONBody(req);
    if (!ROLES.includes(b.role)) return send(res, 400, { error: 'Pick a role.' });
    const names = (Array.isArray(b.names) && b.names.length ? b.names : ['']).slice(0, 60).map(n => clean(n, 100));
    const expiresAt = new Date(Date.now() + 30 * 864e5).toISOString();
    const created = [];
    for (const name of names) {
      const code = newCode();
      const invite = { role: b.role, name, educatorUid: b.role === 'pledge' ? clean(b.educatorUid, 128) : '', createdBy: me.uid, createdByName: me.user.name, createdAt: now(), expiresAt, usedBy: null, usedAt: null };
      await db.collection('invites').doc(code).set(invite);
      created.push({ id: code, ...invite });
    }
    return send(res, 200, { ok: true, invites: created });
  }

  async function deleteInvite(req, res, me, code) {
    requireRole(me, 'vpm');
    const ref = db.collection('invites').doc(code);
    const snap = await ref.get();
    if (!snap.exists) return send(res, 404, { error: 'Invite not found.' });
    if (snap.data().usedBy) return send(res, 400, { error: 'That code was already used.' });
    await ref.delete();
    return send(res, 200, { ok: true });
  }

  /* ───────────── caddie notes: a personal note from a VPM or educator to a pledge ───────────── */

  async function createNote(req, res, me) {
    requireRole(me, 'educator', 'vpm');
    const b = readJSONBody(req);
    const body = clean(b.body, 2000);
    if (!body) return send(res, 400, { error: 'Write the note first.', field: 'body' });
    const pledgeSnap = await db.collection('users').doc(clean(b.pledgeUid, 128)).get();
    const pledge = pledgeSnap.exists ? { ...pledgeSnap.data(), uid: pledgeSnap.id } : null;
    if (!pledge || pledge.role !== 'pledge') return send(res, 404, { error: 'Pledge not found.' });
    if (!canSeePledge(me, pledge)) return send(res, 403, { error: 'This pledge is not assigned to you.' });
    const note = { pledgeUid: pledge.uid, by: me.uid, byName: me.user.name, byRole: me.user.role, body, at: now() };
    const ref = await db.collection('notes').add(note);
    return send(res, 200, { ok: true, note: { id: ref.id, ...note } });
  }

  async function deleteNote(req, res, me, id) {
    requireRole(me, 'educator', 'vpm');
    const ref = db.collection('notes').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return send(res, 404, { error: 'Note not found.' });
    if (snap.data().by !== me.uid && me.user.role !== 'vpm') return send(res, 403, { error: 'Only the author or a VPM can delete this note.' });
    await ref.delete();
    return send(res, 200, { ok: true });
  }

  /* ───────────── router ───────────── */

  return async function handle(req, res, route) {
    const me = await identify(req);
    const parts = route.split('/').filter(Boolean);
    const [head, a, b] = parts;
    const M = req.method;
    if (head === 'claim' && M === 'POST') return claim(req, res, me);
    if (head === 'bootstrap' && M === 'GET') return bootstrap(req, res, me);
    if (head === 'submit' && a && M === 'POST') return submit(req, res, me, a);
    if (head === 'review' && a && M === 'POST') return review(req, res, me, a);
    if (head === 'file' && M === 'GET') return file(req, res, me);
    if (head === 'program' && M === 'PUT') return saveProgram(req, res, me);
    if (head === 'upload' && M === 'POST') return upload(req, res, me);
    if (head === 'items' && a && ['POST', 'PUT', 'DELETE'].includes(M)) return items(req, res, me, a, b);
    if (head === 'users' && a && M === 'PATCH') return updateUser(req, res, me, a);
    if (head === 'invites' && !a && M === 'POST') return createInvites(req, res, me);
    if (head === 'invites' && a && M === 'DELETE') return deleteInvite(req, res, me, a);
    if (head === 'notes' && !a && M === 'POST') return createNote(req, res, me);
    if (head === 'notes' && a && M === 'DELETE') return deleteNote(req, res, me, a);
    return send(res, 404, { error: 'Not found' });
  };
};
