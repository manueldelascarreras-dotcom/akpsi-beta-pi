/*
 * AKPsi Beta Pi API on Firebase (Cloud Functions).
 *
 * Same routes as the local server.js, but data lives in Firestore and files
 * in Cloud Storage instead of on disk. Firebase Hosting sends /api/** here.
 *
 *   Firestore  content/{site|members|events|gallery}   public site data ({ json })
 *              private/{admin|settings|updates}        CMS login, self-update settings, update log
 *              applications/{id}                        rush applications
 *              backups/{auto}                           previous versions of content (last 30 each)
 *   Storage    public/{gallery|members|values|site}/…  images and video shown on the site
 *              private/uploads/{term}/…                 applicant resumes and headshots
 */
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');

initializeApp();
const db = getFirestore();
const bucket = getStorage().bucket('umiami-akpsi.firebasestorage.app');

const MB = 1024 * 1024;
const MEMBER_GROUPS = ['eboard', 'pledgeEducators', 'brothers', 'nibs'];
const EDITABLE_DATA = ['site', 'members', 'events', 'gallery'];
const UPLOAD_FOLDERS = ['gallery', 'members', 'values', 'site'];
const SESSION_HOURS = 12;
const COOKIE = '__session';   // the only cookie Firebase Hosting passes through to functions

/* ───────────────────────── helpers ───────────────────────── */

const send = (res, status, body, headers = {}) => {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.set({ 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.status(status).send(isObj ? JSON.stringify(body) : body);
};

const fail = (status, message) => Object.assign(new Error(message), { status });

const readJSONBody = req => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(req.rawBody?.toString('utf8') || '{}'); } catch { throw fail(400, 'Invalid JSON'); }
};

/* Parse multipart/form-data from the buffered body using the built-in fetch Request. */
const readForm = async (req, limit) => {
  if ((req.rawBody?.length || 0) > limit) throw fail(413, 'Upload too large');
  const request = new Request('http://localhost/', { method: 'POST', headers: { 'content-type': req.headers['content-type'] || '' }, body: req.rawBody });
  return request.formData();
};

/* Identify file types from their first bytes, not the name the browser sent. */
const sniff = buf => {
  const h = buf.subarray(0, 12);
  if (h.subarray(0, 4).toString() === '%PDF') return { ext: '.pdf', kind: 'pdf', type: 'application/pdf' };
  if (h[0] === 0xFF && h[1] === 0xD8 && h[2] === 0xFF) return { ext: '.jpg', kind: 'image', type: 'image/jpeg' };
  if (h[0] === 0x89 && h.subarray(1, 4).toString() === 'PNG') return { ext: '.png', kind: 'image', type: 'image/png' };
  if (h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP') return { ext: '.webp', kind: 'image', type: 'image/webp' };
  if (h.subarray(0, 3).toString() === 'GIF') return { ext: '.gif', kind: 'image', type: 'image/gif' };
  if (h.subarray(4, 8).toString() === 'ftyp') {
    const brand = h.subarray(8, 12).toString();
    if (/hei[cfsx]|mif1|msf1/.test(brand)) return { ext: '.heic', kind: 'heic' };
    if (brand === 'qt  ') return { ext: '.mov', kind: 'video', type: 'video/quicktime' };
    return { ext: '.mp4', kind: 'video', type: 'video/mp4' };
  }
  if (h[0] === 0x1A && h[1] === 0x45 && h[2] === 0xDF && h[3] === 0xA3) return { ext: '.webm', kind: 'video', type: 'video/webm' };
  return null;
};

const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'file';
const clean = (v, max = 500) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const clientIp = req => String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

/* ───────────────────────── storage ───────────────────────── */

const contentRef = name => db.collection('content').doc(name);
const privateRef = name => db.collection('private').doc(name);

async function readContent(name, fallback, tx) {
  const snap = tx ? await tx.get(contentRef(name)) : await contentRef(name).get();
  if (!snap.exists) return fallback;
  try { return JSON.parse(snap.data().json); } catch { return fallback; }
}

/* Write public site data, keeping the previous version in backups (last 30 per file). */
async function saveContent(name, body, tx) {
  const ref = contentRef(name);
  const prev = await tx.get(ref);
  if (prev.exists) tx.set(db.collection('backups').doc(), { name, json: prev.data().json, at: FieldValue.serverTimestamp() });
  tx.set(ref, { json: JSON.stringify(body), updatedAt: FieldValue.serverTimestamp() });
}
async function pruneBackups(name) {
  const snap = await db.collection('backups').where('name', '==', name).get();
  const docs = snap.docs.sort((a, b) => (b.data().at?.toMillis() || 0) - (a.data().at?.toMillis() || 0));
  await Promise.all(docs.slice(30).map(d => d.ref.delete()));
}

const publicUrl = path => `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;
const pathFromUrl = url => {
  const m = String(url).match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : String(url);
};
const saveFile = (path, buf, contentType, cacheControl) => bucket.file(path).save(buf, { resumable: false, contentType, metadata: { cacheControl } });
const removeFile = path => bucket.file(path).delete({ ignoreNotFound: true });

/* ───────────────────────── admin auth ───────────────────────── */

const loginAttempts = new Map();          // ip → { count, until }   (per instance, best effort)

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) =>
  ({ salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });

const checkPassword = (password, { salt, hash }) => {
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
};

const getAdmin = async () => { const s = await privateRef('admin').get(); return s.exists ? s.data() : null; };

/* Sessions are signed tokens (expiry + HMAC), so any function instance can check them.
   Changing the password rotates the secret, which signs everyone out. */
const sign = (exp, secret) => crypto.createHmac('sha256', secret).update(String(exp)).digest('hex');
const cookieToken = req => (req.headers.cookie || '').split(/;\s*/).map(c => c.split('=')).find(([k]) => k === COOKIE)?.[1];

const isAdmin = (req, admin) => {
  const t = cookieToken(req);
  if (!t || !admin?.secret) return false;
  const [exp, mac] = t.split('.');
  if (!exp || !mac || +exp < Date.now()) return false;
  const good = sign(exp, admin.secret);
  return mac.length === good.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good));
};

const startSession = (res, secret) => {
  const exp = Date.now() + SESSION_HOURS * 3600e3;
  res.set('Set-Cookie', `${COOKIE}=${exp}.${sign(exp, secret)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`);
};

const rateLimited = ip => {
  const a = loginAttempts.get(ip);
  return a && a.count >= 8 && a.until > Date.now();
};
const noteFailure = ip => {
  const a = loginAttempts.get(ip) || { count: 0, until: 0 };
  a.count += 1; a.until = Date.now() + 15 * 60e3;
  loginAttempts.set(ip, a);
};

/* ───────────────────────── applications ───────────────────────── */

const APP_FIELDS = {
  name:      { max: 120, required: true },
  email:     { max: 160, required: true },
  phone:     { max: 40,  required: true },
  major:     { max: 160, required: true },
  minor:     { max: 160 },
  gradTerm:  { max: 40,  required: true },
  year:      { max: 40,  required: true },
  hometown:  { max: 160, required: true },
  gpa:       { max: 10 },
  linkedin:  { max: 300 },
  instagram: { max: 100 },
  heardFrom: { max: 200 },
  why:       { max: 4000, required: true },
  about:     { max: 4000 },
};

async function handleApply(req, res) {
  const site = await readContent('site', {});
  const rush = site.apply || {};
  if (rush.open === false) return send(res, 403, { error: 'Applications are closed right now.' });

  let form;
  try { form = await readForm(req, 20 * MB); }
  catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'Your files are too large. Keep the resume under 5 MB and the headshot under 10 MB.' : 'Could not read the form. Please try again.' }); }

  if (clean(form.get('website'))) return send(res, 200, { ok: true });   // honeypot: bots fill hidden fields

  const record = {};
  for (const [key, rule] of Object.entries(APP_FIELDS)) {
    record[key] = clean(form.get(key), rule.max);
    if (rule.required && !record[key]) return send(res, 400, { error: 'Please fill out every required field.', field: key });
  }
  record.email = record.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) return send(res, 400, { error: 'Please enter a valid email address.', field: 'email' });

  const resume = form.get('resume'), headshot = form.get('headshot');
  if (!(resume instanceof File) || !resume.size) return send(res, 400, { error: 'Please attach your resume.', field: 'resume' });
  if (!(headshot instanceof File) || !headshot.size) return send(res, 400, { error: 'Please attach your professional headshot.', field: 'headshot' });
  if (resume.size > 5 * MB) return send(res, 400, { error: 'Your resume must be under 5 MB.', field: 'resume' });
  if (headshot.size > 10 * MB) return send(res, 400, { error: 'Your headshot must be under 10 MB.', field: 'headshot' });

  const resumeBuf = Buffer.from(await resume.arrayBuffer());
  const headBuf = Buffer.from(await headshot.arrayBuffer());
  const rType = sniff(resumeBuf), hType = sniff(headBuf);
  if (rType?.kind !== 'pdf') return send(res, 400, { error: 'Please upload your resume as a PDF.', field: 'resume' });
  if (hType?.kind === 'heic') return send(res, 400, { error: 'iPhone HEIC photos are not supported. Please export your headshot as a JPG or PNG.', field: 'headshot' });
  if (hType?.kind !== 'image') return send(res, 400, { error: 'Please upload your headshot as a JPG, PNG, or WEBP image.', field: 'headshot' });

  const term = clean(rush.term || 'Unassigned', 60);
  const termDir = slug(term);
  const now = new Date();
  const deadline = rush.deadline ? new Date(rush.deadline) : null;

  /* A resubmission (same email, same term) replaces the earlier one */
  const dupes = await db.collection('applications').where('email', '==', record.email).get();
  const existing = dupes.docs.map(d => d.data()).find(a => a.term === term);
  const id = existing?.id || crypto.randomBytes(8).toString('hex');
  const base = `${termDir}/${id}-${slug(record.name)}`;
  const resumePath = `${base}-resume.pdf`, headPath = `${base}-headshot${hType.ext}`;
  if (existing) for (const f of [existing.resume, existing.headshot]) if (f && ![resumePath, headPath].includes(f)) await removeFile(`private/uploads/${f}`);
  await saveFile(`private/uploads/${resumePath}`, resumeBuf, rType.type, 'private, max-age=0');
  await saveFile(`private/uploads/${headPath}`, headBuf, hType.type, 'private, max-age=0');

  const entry = {
    ...record, id, term,
    submittedAt: now.toISOString(),
    deadline: deadline ? deadline.toISOString() : null,
    late: deadline ? now > deadline : false,
    resume: resumePath, headshot: headPath,
    status: existing?.status || 'New',
    notes: existing?.notes || '',
    resubmitted: Boolean(existing),
    firstSubmittedAt: existing?.firstSubmittedAt || existing?.submittedAt || now.toISOString(),
  };
  await db.collection('applications').doc(id).set(entry);

  console.log(`New application: ${entry.name} (${entry.term})${entry.late ? ' [late]' : ''}`);
  send(res, 200, { ok: true, term: entry.term, late: entry.late, resubmitted: entry.resubmitted });
}

/* ───────────────────────── member self-updates ───────────────────────── */

const UPDATE_FIELDS = { linkedin: 300, major: 160, minor: 160, class: 60, year: 4 };

async function getSettings() {
  const snap = await privateRef('settings').get();
  const s = snap.exists ? snap.data() : null;
  if (s?.updateCode) return { updatesEnabled: true, updatesNeedApproval: false, ...s };
  /* First run: create a random code the e-board can change in the CMS */
  const fresh = { updateCode: crypto.randomBytes(3).toString('hex').toUpperCase(), updatesEnabled: true, updatesNeedApproval: false, ...(s || {}) };
  await privateRef('settings').set(fresh);
  return fresh;
}

const readUpdates = async tx => {
  const snap = tx ? await tx.get(privateRef('updates')) : await privateRef('updates').get();
  try { return snap.exists ? JSON.parse(snap.data().json) : []; } catch { return []; }
};
const writeUpdates = (tx, updates) => tx.set(privateRef('updates'), { json: JSON.stringify(updates.slice(0, 2000)) });

/* Apply changes to every entry with this name (a person can be in several groups).
   Returns the previous values so the change can be undone. */
function applyMemberPatch(members, name, changes) {
  const previous = {};
  const key = name.trim().toLowerCase();
  for (const g of MEMBER_GROUPS) for (const m of members[g] || []) {
    if (m.name.trim().toLowerCase() !== key) continue;
    for (const [k, v] of Object.entries(changes)) {
      if (!(k in previous)) previous[k] = m[k] ?? '';
      if (v === '' || v == null) delete m[k]; else m[k] = v;
    }
  }
  return previous;
}

const updateAttempts = new Map();   // ip → { fails, sends, since }   (per instance, best effort)
function updateLimiter(ip) {
  const now = Date.now();
  let a = updateAttempts.get(ip);
  if (!a || now - a.since > 60 * 60e3) { a = { fails: 0, sends: 0, since: now }; updateAttempts.set(ip, a); }
  return a;
}

async function handleMemberUpdate(req, res) {
  const settings = await getSettings();
  if (!settings.updatesEnabled) return send(res, 403, { error: 'Profile updates are turned off right now.' });
  const limit = updateLimiter(clientIp(req));
  if (limit.fails >= 10 || limit.sends >= 30) return send(res, 429, { error: 'Too many attempts. Please try again in an hour.' });

  let form;
  try { form = await readForm(req, 12 * MB); }
  catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'Your photo is too large. Please keep it under 10 MB.' : 'Could not read the form. Please try again.' }); }

  if (clean(form.get('code')).toUpperCase() !== settings.updateCode.toUpperCase()) {
    limit.fails++;
    return send(res, 403, { error: "That chapter code isn't right. Ask the e-board for the current code.", field: 'code' });
  }

  const name = clean(form.get('name'), 120);
  const members = await readContent('members', {});
  const current = MEMBER_GROUPS.flatMap(g => members[g] || []).find(m => m.name.trim().toLowerCase() === name.toLowerCase());
  if (!current) return send(res, 404, { error: "We couldn't find that name on the roster. Contact the e-board to be added.", field: 'name' });

  /* Only non-empty values that differ from what's on the site count as changes */
  const changes = {};
  for (const [k, max] of Object.entries(UPDATE_FIELDS)) {
    let v = clean(form.get(k), max);
    if (!v) continue;
    if (k === 'linkedin') {
      v = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
      let u; try { u = new URL(v); } catch {}
      if (!u || !/(^|\.)linkedin\.com$/i.test(u.hostname) || !/^\/in\/[^/]+/i.test(u.pathname)) {
        return send(res, 400, { error: 'Please paste your LinkedIn profile link. It looks like linkedin.com/in/your-name.', field: 'linkedin' });
      }
      v = `https://www.linkedin.com${u.pathname.replace(/\/+$/, '')}`;
    }
    if (k === 'year') {
      if (!/^20\d{2}$/.test(v)) return send(res, 400, { error: 'Graduation year should look like 2028.', field: 'year' });
      v = +v;
    }
    if (String(current[k] ?? '') !== String(v)) changes[k] = v;
  }

  const photo = form.get('photo');
  if (photo instanceof File && photo.size) {
    if (photo.size > 10 * MB) return send(res, 400, { error: 'Your photo must be under 10 MB.', field: 'photo' });
    const buf = Buffer.from(await photo.arrayBuffer());
    const type = sniff(buf);
    if (type?.kind === 'heic') return send(res, 400, { error: 'iPhone HEIC photos are not supported. Please export it as a JPG or PNG.', field: 'photo' });
    if (type?.kind !== 'image') return send(res, 400, { error: 'Please upload your headshot as a JPG, PNG, or WEBP image.', field: 'photo' });
    const file = `public/members/${slug(current.name)}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
    await saveFile(file, buf, type.type, 'public, max-age=31536000');
    changes.photo = publicUrl(file);
  }

  if (!Object.keys(changes).length) return send(res, 400, { error: "Nothing changed. Add a photo or update a field, then submit." });
  limit.sends++;

  const status = await db.runTransaction(async tx => {
    const updates = await readUpdates(tx);
    const fresh = settings.updatesNeedApproval ? null : await readContent('members', {}, tx);
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      name: current.name,
      changes,
      submittedAt: new Date().toISOString(),
      status: settings.updatesNeedApproval ? 'pending' : 'applied',
    };
    if (fresh) {
      entry.previous = applyMemberPatch(fresh, current.name, changes);
      await saveContent('members', fresh, tx);
    }
    updates.unshift(entry);
    writeUpdates(tx, updates);
    return entry.status;
  });
  if (status === 'applied') pruneBackups('members').catch(() => {});

  console.log(`Profile update: ${current.name} (${Object.keys(changes).join(', ')}) [${status}]`);
  send(res, 200, { ok: true, status, name: current.name });
}

/* ───────────────────────── admin API ───────────────────────── */

async function handleAdmin(req, res, route) {
  const ip = clientIp(req);
  const admin = await getAdmin();

  if (route === 'session' && req.method === 'GET') {
    return send(res, 200, { authed: isAdmin(req, admin), setup: !admin?.hash });
  }

  if (route === 'setup' && req.method === 'POST') {
    if (admin?.hash) return send(res, 403, { error: 'A password is already set.' });
    const { password } = readJSONBody(req);
    if (!password || password.length < 8) return send(res, 400, { error: 'Use at least 8 characters.' });
    const secret = crypto.randomBytes(32).toString('hex');
    await privateRef('admin').set({ ...hashPassword(password), secret });
    startSession(res, secret);
    return send(res, 200, { ok: true });
  }

  if (route === 'login' && req.method === 'POST') {
    if (rateLimited(ip)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const { password } = readJSONBody(req);
    if (!admin?.hash || !password || !checkPassword(password, admin)) { noteFailure(ip); return send(res, 401, { error: 'Wrong password.' }); }
    loginAttempts.delete(ip);
    let secret = admin.secret;
    if (!secret) { secret = crypto.randomBytes(32).toString('hex'); await privateRef('admin').set({ secret }, { merge: true }); }
    startSession(res, secret);
    return send(res, 200, { ok: true });
  }

  if (route === 'logout' && req.method === 'POST') {
    res.set('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
    return send(res, 200, { ok: true });
  }

  /* Everything below requires a logged-in admin */
  if (!isAdmin(req, admin)) return send(res, 401, { error: 'Please log in.' });

  if (route === 'password' && req.method === 'POST') {
    const { current, next } = readJSONBody(req);
    if (!checkPassword(current || '', admin)) return send(res, 401, { error: 'Current password is wrong.' });
    if (!next || next.length < 8) return send(res, 400, { error: 'Use at least 8 characters.' });
    const secret = crypto.randomBytes(32).toString('hex');
    await privateRef('admin').set({ ...hashPassword(next), secret });
    startSession(res, secret);
    return send(res, 200, { ok: true });
  }

  if (route === 'applications' && req.method === 'GET') {
    const snap = await db.collection('applications').get();
    return send(res, 200, snap.docs.map(d => d.data()).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)));
  }

  const appMatch = route.match(/^applications\/([a-f0-9]{16})$/);
  if (appMatch && req.method === 'PATCH') {
    const patch = readJSONBody(req);
    const ref = db.collection('applications').doc(appMatch[1]);
    const updated = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const a = snap.data();
      if (typeof patch.status === 'string') a.status = clean(patch.status, 40);
      if (typeof patch.notes === 'string') a.notes = clean(patch.notes, 5000);
      if (typeof patch.term === 'string' && patch.term.trim()) a.term = clean(patch.term, 60);
      tx.set(ref, a);
      return a;
    });
    return updated ? send(res, 200, updated) : send(res, 404, { error: 'Not found' });
  }
  if (appMatch && req.method === 'DELETE') {
    const ref = db.collection('applications').doc(appMatch[1]);
    const snap = await ref.get();
    if (!snap.exists) return send(res, 404, { error: 'Not found' });
    const a = snap.data();
    for (const f of [a.resume, a.headshot]) if (f) await removeFile(`private/uploads/${f}`);
    await ref.delete();
    return send(res, 200, { ok: true });
  }

  /* Save one of the public data files (with a backup of the previous version) */
  const dataMatch = route.match(/^data\/(\w+)$/);
  if (dataMatch && req.method === 'PUT') {
    const name = dataMatch[1];
    if (!EDITABLE_DATA.includes(name)) return send(res, 404, { error: 'Unknown data file' });
    const body = readJSONBody(req);
    const shapeOk = { site: !Array.isArray(body) && typeof body === 'object', members: !Array.isArray(body) && typeof body === 'object', events: Array.isArray(body), gallery: Array.isArray(body) }[name];
    if (!shapeOk) return send(res, 400, { error: `That doesn't look like valid ${name} data.` });
    await db.runTransaction(tx => saveContent(name, body, tx));
    pruneBackups(name).catch(() => {});
    return send(res, 200, { ok: true });
  }

  /* Member self-updates: settings + submissions */
  if (route === 'updates' && req.method === 'GET') {
    return send(res, 200, { settings: await getSettings(), updates: await readUpdates() });
  }
  if (route === 'update-settings' && req.method === 'PUT') {
    const body = readJSONBody(req);
    const s = await getSettings();
    if (typeof body.updateCode === 'string') {
      const code = clean(body.updateCode, 40);
      if (code.length < 4) return send(res, 400, { error: 'The code needs at least 4 characters.' });
      s.updateCode = code;
    }
    if (typeof body.updatesEnabled === 'boolean') s.updatesEnabled = body.updatesEnabled;
    if (typeof body.updatesNeedApproval === 'boolean') s.updatesNeedApproval = body.updatesNeedApproval;
    await privateRef('settings').set(s);
    return send(res, 200, s);
  }
  const upMatch = route.match(/^updates\/([a-f0-9]{16})\/(approve|reject)$/);
  if (upMatch && req.method === 'POST') {
    const [, id, action] = upMatch;
    const result = await db.runTransaction(async tx => {
      const updates = await readUpdates(tx);
      const u = updates.find(x => x.id === id);
      if (!u) return null;
      const members = await readContent('members', {}, tx);
      let changed = false;
      if (action === 'approve' && u.status === 'pending') {
        u.previous = applyMemberPatch(members, u.name, u.changes);
        u.status = 'applied';
        changed = true;
      } else if (action === 'reject') {
        if (u.status === 'applied' && u.previous) { applyMemberPatch(members, u.name, u.previous); changed = true; }
        u.status = 'rejected';
      }
      u.reviewedAt = new Date().toISOString();
      if (changed) await saveContent('members', members, tx);
      writeUpdates(tx, updates);
      return u;
    });
    return result ? send(res, 200, result) : send(res, 404, { error: 'Not found' });
  }

  /* Upload a public image or video for the site (gallery, member photos, value photos, video) */
  if (route === 'upload' && req.method === 'POST') {
    const folder = String(req.query.folder || '');
    if (!UPLOAD_FOLDERS.includes(folder)) return send(res, 400, { error: 'Unknown folder' });
    let form;
    try { form = await readForm(req, 30 * MB); }
    catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'Files are too large (30 MB per upload). For a longer video, paste a YouTube link instead.' : 'Upload failed.' }); }
    const files = form.getAll('file').filter(f => f instanceof File && f.size);
    if (!files.length) return send(res, 400, { error: 'No file received.' });
    const out = [];
    for (const f of files) {
      const buf = Buffer.from(await f.arrayBuffer());
      const type = sniff(buf);
      if (type?.kind === 'heic') return send(res, 400, { error: `${f.name}: HEIC photos are not supported. Export as JPG first.` });
      if (!type || !['image', 'video'].includes(type.kind)) return send(res, 400, { error: `${f.name}: only JPG, PNG, WEBP, GIF images or MP4/WEBM/MOV videos.` });
      if (type.kind === 'video' && folder !== 'site') return send(res, 400, { error: 'Videos can only be uploaded for the About page.' });
      if (type.kind === 'image' && buf.length > 25 * MB) return send(res, 400, { error: `${f.name}: images must be under 25 MB.` });
      const name = `public/${folder}/${slug(f.name.replace(/\.[^.]+$/, ''))}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
      await saveFile(name, buf, type.type, 'public, max-age=31536000');
      out.push({ path: publicUrl(name), name: f.name });
    }
    return send(res, 200, { files: out });
  }

  /* Delete an uploaded public file (only inside the upload folders) */
  if (route === 'upload' && req.method === 'DELETE') {
    const { path: p } = readJSONBody(req);
    const target = pathFromUrl(p || '');
    if (!UPLOAD_FOLDERS.some(f => target.startsWith(`public/${f}/`)) || target.includes('..')) return send(res, 400, { error: 'Not allowed' });
    await removeFile(target);
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Not found' });
}

/* Applicant resumes and headshots: only for logged-in admins */
async function handlePrivateFile(req, res) {
  if (!isAdmin(req, await getAdmin())) return send(res, 401, 'Please log in to the CMS.');
  const rel = String(req.query.path || '');
  if (!rel || rel.includes('..')) return send(res, 403, 'Forbidden');
  const file = bucket.file(`private/uploads/${rel}`);
  try {
    const [[data], [meta]] = await Promise.all([file.download(), file.getMetadata()]);
    send(res, 200, data, {
      'Content-Type': meta.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
      ...(req.query.download ? { 'Content-Disposition': `attachment; filename="${rel.split('/').pop()}"` } : {}),
    });
  } catch { send(res, 404, 'Not found'); }
}

/* ───────────────────────── router ───────────────────────── */

exports.api = onRequest({ region: 'us-central1', memory: '512MiB', timeoutSeconds: 120, maxInstances: 3 }, async (req, res) => {
  try {
    const pathname = decodeURIComponent(req.path);
    if (pathname === '/api/apply' && req.method === 'POST') return await handleApply(req, res);
    if (pathname === '/api/update' && req.method === 'POST') return await handleMemberUpdate(req, res);
    if (pathname === '/api/update/config' && req.method === 'GET') return send(res, 200, { enabled: (await getSettings()).updatesEnabled });
    if (pathname === '/api/admin/file') return await handlePrivateFile(req, res);
    if (pathname.startsWith('/api/admin/')) return await handleAdmin(req, res, pathname.slice('/api/admin/'.length));
    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong.' });
  }
});
