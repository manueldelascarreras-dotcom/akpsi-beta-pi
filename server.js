/*
 * AKPsi Beta Pi site server.
 *
 * Serves the public site, accepts rush applications (with resume and headshot
 * uploads), and powers the CMS at /admin.html. No npm packages needed.
 *
 *   data/       public content the site reads (members, events, gallery, site)
 *   images/     public images (crest, gallery, members, values)
 *   private/    never served directly: applications, uploads, admin login, backups
 */
const http   = require('http');
const fs     = require('fs');
const fsp    = fs.promises;
const path   = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

const PORT        = process.env.PORT || 3457;
const BASE_DIR    = __dirname;
const DATA_DIR    = path.join(BASE_DIR, 'data');
const PRIVATE_DIR = path.join(BASE_DIR, 'private');
const UPLOADS_DIR = path.join(PRIVATE_DIR, 'uploads');
const APPS_FILE   = path.join(PRIVATE_DIR, 'applications.json');
const ADMIN_FILE  = path.join(PRIVATE_DIR, 'admin.json');
const BACKUP_DIR  = path.join(PRIVATE_DIR, 'backups');
const UPDATES_FILE  = path.join(PRIVATE_DIR, 'updates.json');
const SETTINGS_FILE = path.join(PRIVATE_DIR, 'settings.json');
const MEMBERS_FILE  = path.join(DATA_DIR, 'members.json');
const MEMBER_GROUPS = ['eboard', 'pledgeEducators', 'brothers', 'nibs'];

const MB = 1024 * 1024;
const EDITABLE_DATA = ['site', 'members', 'events', 'gallery'];
const UPLOAD_FOLDERS = ['gallery', 'members', 'values', 'site'];
const SESSION_HOURS = 12;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
  '.txt':  'text/plain; charset=utf-8',
};

/* ───────────────────────── helpers ───────────────────────── */

const send = (res, status, body, headers = {}) => {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, {
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isObj ? JSON.stringify(body) : body);
};

const readJSON = async (file, fallback) => {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch { return fallback; }
};

/* Write to a temp file then rename, so a crash never leaves half-written JSON. */
const writeJSON = async (file, data) => {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2));
  await fsp.rename(tmp, file);
};

/* Simple in-process lock so two applications arriving together can't overwrite each other. */
let appsQueue = Promise.resolve();
const withApps = fn => (appsQueue = appsQueue.then(async () => {
  const apps = await readJSON(APPS_FILE, []);
  const result = await fn(apps);
  await writeJSON(APPS_FILE, apps);
  return result;
}));

const readBody = (req, limit) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', c => {
    size += c.length;
    if (size > limit) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); }
    else chunks.push(c);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const readJSONBody = async (req, limit = 2 * MB) => {
  const buf = await readBody(req, limit);
  try { return JSON.parse(buf.toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
};

/* Parse multipart/form-data using Node's built-in fetch Request. */
const readForm = async (req, limit) => {
  const len = +req.headers['content-length'] || 0;
  if (len > limit) throw Object.assign(new Error('Upload too large'), { status: 413 });
  const request = new Request(`http://localhost${req.url}`, {
    method: 'POST', headers: req.headers, body: Readable.toWeb(req), duplex: 'half',
  });
  return request.formData();
};

/* Identify file types from their first bytes, not the name the browser sent. */
const sniff = buf => {
  const h = buf.subarray(0, 12);
  if (h.subarray(0, 4).toString() === '%PDF') return { ext: '.pdf', kind: 'pdf' };
  if (h[0] === 0xFF && h[1] === 0xD8 && h[2] === 0xFF) return { ext: '.jpg', kind: 'image' };
  if (h[0] === 0x89 && h.subarray(1, 4).toString() === 'PNG') return { ext: '.png', kind: 'image' };
  if (h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP') return { ext: '.webp', kind: 'image' };
  if (h.subarray(0, 3).toString() === 'GIF') return { ext: '.gif', kind: 'image' };
  if (h.subarray(4, 8).toString() === 'ftyp') {
    const brand = h.subarray(8, 12).toString();
    if (/hei[cfsx]|mif1|msf1/.test(brand)) return { ext: '.heic', kind: 'heic' };
    if (brand === 'qt  ') return { ext: '.mov', kind: 'video' };
    return { ext: '.mp4', kind: 'video' };
  }
  if (h[0] === 0x1A && h[1] === 0x45 && h[2] === 0xDF && h[3] === 0xA3) return { ext: '.webm', kind: 'video' };
  return null;
};

const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'file';
const clean = (v, max = 500) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, max);

/* ───────────────────────── admin auth ───────────────────────── */

const sessions = new Map();               // token → expiry (ms)
const loginAttempts = new Map();          // ip → { count, until }

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) =>
  ({ salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });

const checkPassword = (password, { salt, hash }) => {
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
};

const cookieToken = req => (req.headers.cookie || '').split(/;\s*/).map(c => c.split('=')).find(([k]) => k === 'akpsi_admin')?.[1];

const isAdmin = req => {
  const t = cookieToken(req);
  if (!t || !sessions.has(t)) return false;
  if (sessions.get(t) < Date.now()) { sessions.delete(t); return false; }
  return true;
};

const startSession = res => {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_HOURS * 3600e3);
  res.setHeader('Set-Cookie', `akpsi_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`);
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
  const site = await readJSON(path.join(DATA_DIR, 'site.json'), {});
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

  const saved = await withApps(async apps => {
    const existing = apps.find(a => a.term === term && a.email === record.email);
    const id = existing?.id || crypto.randomBytes(8).toString('hex');
    const base = `${termDir}/${id}-${slug(record.name)}`;
    await fsp.mkdir(path.join(UPLOADS_DIR, termDir), { recursive: true });
    if (existing) {                                   // resubmission replaces the old files
      for (const f of [existing.resume, existing.headshot]) if (f) await fsp.rm(path.join(UPLOADS_DIR, f), { force: true });
    }
    const resumePath = `${base}-resume.pdf`, headPath = `${base}-headshot${hType.ext}`;
    await fsp.writeFile(path.join(UPLOADS_DIR, resumePath), resumeBuf);
    await fsp.writeFile(path.join(UPLOADS_DIR, headPath), headBuf);

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
    if (existing) apps[apps.indexOf(existing)] = entry; else apps.push(entry);
    return entry;
  });

  console.log(`  New application: ${saved.name} (${saved.term})${saved.late ? ' [late]' : ''}`);
  send(res, 200, { ok: true, term: saved.term, late: saved.late, resubmitted: saved.resubmitted });
}

/* ───────────────────────── data files ───────────────────────── */

/* All writes to data files go through one queue so CMS saves and member
   self-updates can't overwrite each other. */
let dataQueue = Promise.resolve();
const queued = fn => { const run = dataQueue.then(fn); dataQueue = run.catch(() => {}); return run; };

/* Write a public data file, keeping a backup of the previous version (last 30). */
async function saveDataFile(name, body) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    await fsp.copyFile(file, path.join(BACKUP_DIR, `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
    const old = (await fsp.readdir(BACKUP_DIR)).filter(f => f.startsWith(name + '-')).sort();
    for (const f of old.slice(0, -30)) await fsp.rm(path.join(BACKUP_DIR, f), { force: true });
  } catch { /* first save: nothing to back up */ }
  await writeJSON(file, body);
}

/* ───────────────────────── member self-updates ───────────────────────── */

const UPDATE_FIELDS = { linkedin: 300, major: 160, minor: 160, class: 60, year: 4 };

async function getSettings() {
  const s = await readJSON(SETTINGS_FILE, null);
  if (s?.updateCode) return { updatesEnabled: true, updatesNeedApproval: false, ...s };
  /* First run: create a random code the e-board can change in the CMS */
  const fresh = { updateCode: crypto.randomBytes(3).toString('hex').toUpperCase(), updatesEnabled: true, updatesNeedApproval: false, ...(s || {}) };
  await writeJSON(SETTINGS_FILE, fresh);
  return fresh;
}

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

const updateAttempts = new Map();   // ip → { fails, sends, since }
function updateLimiter(ip) {
  const now = Date.now();
  let a = updateAttempts.get(ip);
  if (!a || now - a.since > 60 * 60e3) { a = { fails: 0, sends: 0, since: now }; updateAttempts.set(ip, a); }
  return a;
}

async function handleMemberUpdate(req, res) {
  const settings = await getSettings();
  if (!settings.updatesEnabled) return send(res, 403, { error: 'Profile updates are turned off right now.' });
  const limit = updateLimiter(req.socket.remoteAddress);
  if (limit.fails >= 10 || limit.sends >= 30) return send(res, 429, { error: 'Too many attempts. Please try again in an hour.' });

  let form;
  try { form = await readForm(req, 12 * MB); }
  catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'Your photo is too large. Please keep it under 10 MB.' : 'Could not read the form. Please try again.' }); }

  if (clean(form.get('code')).toUpperCase() !== settings.updateCode.toUpperCase()) {
    limit.fails++;
    return send(res, 403, { error: "That chapter code isn't right. Ask the e-board for the current code.", field: 'code' });
  }

  const name = clean(form.get('name'), 120);
  const members = await readJSON(MEMBERS_FILE, {});
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
    const file = `${slug(current.name)}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
    await fsp.mkdir(path.join(BASE_DIR, 'images', 'members'), { recursive: true });
    await fsp.writeFile(path.join(BASE_DIR, 'images', 'members', file), buf);
    changes.photo = `images/members/${file}`;
  }

  if (!Object.keys(changes).length) return send(res, 400, { error: "Nothing changed. Add a photo or update a field, then submit." });
  limit.sends++;

  const status = await queued(async () => {
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      name: current.name,
      changes,
      submittedAt: new Date().toISOString(),
      status: settings.updatesNeedApproval ? 'pending' : 'applied',
    };
    if (!settings.updatesNeedApproval) {
      const fresh = await readJSON(MEMBERS_FILE, {});
      entry.previous = applyMemberPatch(fresh, current.name, changes);
      await saveDataFile('members', fresh);
    }
    const updates = await readJSON(UPDATES_FILE, []);
    updates.unshift(entry);
    await writeJSON(UPDATES_FILE, updates.slice(0, 2000));
    return entry.status;
  });

  console.log(`  Profile update: ${current.name} (${Object.keys(changes).join(', ')}) [${status}]`);
  send(res, 200, { ok: true, status, name: current.name });
}

/* ───────────────────────── admin API ───────────────────────── */

async function handleAdmin(req, res, route) {
  const ip = req.socket.remoteAddress;
  const admin = await readJSON(ADMIN_FILE, null);

  if (route === 'session' && req.method === 'GET') {
    return send(res, 200, { authed: isAdmin(req), setup: !admin });
  }

  if (route === 'setup' && req.method === 'POST') {
    if (admin) return send(res, 403, { error: 'A password is already set.' });
    const { password } = await readJSONBody(req);
    if (!password || password.length < 8) return send(res, 400, { error: 'Use at least 8 characters.' });
    await writeJSON(ADMIN_FILE, hashPassword(password));
    startSession(res);
    return send(res, 200, { ok: true });
  }

  if (route === 'login' && req.method === 'POST') {
    if (rateLimited(ip)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const { password } = await readJSONBody(req);
    if (!admin || !password || !checkPassword(password, admin)) { noteFailure(ip); return send(res, 401, { error: 'Wrong password.' }); }
    loginAttempts.delete(ip);
    startSession(res);
    return send(res, 200, { ok: true });
  }

  if (route === 'logout' && req.method === 'POST') {
    sessions.delete(cookieToken(req));
    res.setHeader('Set-Cookie', 'akpsi_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return send(res, 200, { ok: true });
  }

  /* Everything below requires a logged-in admin */
  if (!isAdmin(req)) return send(res, 401, { error: 'Please log in.' });

  if (route === 'password' && req.method === 'POST') {
    const { current, next } = await readJSONBody(req);
    if (!checkPassword(current || '', admin)) return send(res, 401, { error: 'Current password is wrong.' });
    if (!next || next.length < 8) return send(res, 400, { error: 'Use at least 8 characters.' });
    await writeJSON(ADMIN_FILE, hashPassword(next));
    return send(res, 200, { ok: true });
  }

  if (route === 'applications' && req.method === 'GET') {
    return send(res, 200, await readJSON(APPS_FILE, []));
  }

  const appMatch = route.match(/^applications\/([a-f0-9]{16})$/);
  if (appMatch && req.method === 'PATCH') {
    const patch = await readJSONBody(req);
    const updated = await withApps(async apps => {
      const a = apps.find(x => x.id === appMatch[1]);
      if (!a) return null;
      if (typeof patch.status === 'string') a.status = clean(patch.status, 40);
      if (typeof patch.notes === 'string') a.notes = clean(patch.notes, 5000);
      if (typeof patch.term === 'string' && patch.term.trim()) a.term = clean(patch.term, 60);
      return a;
    });
    return updated ? send(res, 200, updated) : send(res, 404, { error: 'Not found' });
  }
  if (appMatch && req.method === 'DELETE') {
    const removed = await withApps(async apps => {
      const i = apps.findIndex(x => x.id === appMatch[1]);
      if (i < 0) return null;
      const [a] = apps.splice(i, 1);
      for (const f of [a.resume, a.headshot]) if (f) await fsp.rm(path.join(UPLOADS_DIR, f), { force: true });
      return a;
    });
    return removed ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Not found' });
  }

  /* Save one of the public data files (with a backup of the previous version) */
  const dataMatch = route.match(/^data\/(\w+)$/);
  if (dataMatch && req.method === 'PUT') {
    const name = dataMatch[1];
    if (!EDITABLE_DATA.includes(name)) return send(res, 404, { error: 'Unknown data file' });
    const body = await readJSONBody(req, 5 * MB);
    const shapeOk = { site: !Array.isArray(body) && typeof body === 'object', members: !Array.isArray(body) && typeof body === 'object', events: Array.isArray(body), gallery: Array.isArray(body) }[name];
    if (!shapeOk) return send(res, 400, { error: `That doesn't look like valid ${name} data.` });
    await queued(() => saveDataFile(name, body));
    return send(res, 200, { ok: true });
  }

  /* Member self-updates: settings + submissions */
  if (route === 'updates' && req.method === 'GET') {
    return send(res, 200, { settings: await getSettings(), updates: await readJSON(UPDATES_FILE, []) });
  }
  if (route === 'update-settings' && req.method === 'PUT') {
    const body = await readJSONBody(req);
    const s = await getSettings();
    if (typeof body.updateCode === 'string') {
      const code = clean(body.updateCode, 40);
      if (code.length < 4) return send(res, 400, { error: 'The code needs at least 4 characters.' });
      s.updateCode = code;
    }
    if (typeof body.updatesEnabled === 'boolean') s.updatesEnabled = body.updatesEnabled;
    if (typeof body.updatesNeedApproval === 'boolean') s.updatesNeedApproval = body.updatesNeedApproval;
    await writeJSON(SETTINGS_FILE, s);
    return send(res, 200, s);
  }
  const upMatch = route.match(/^updates\/([a-f0-9]{16})\/(approve|reject)$/);
  if (upMatch && req.method === 'POST') {
    const [, id, action] = upMatch;
    const result = await queued(async () => {
      const updates = await readJSON(UPDATES_FILE, []);
      const u = updates.find(x => x.id === id);
      if (!u) return null;
      const members = await readJSON(MEMBERS_FILE, {});
      if (action === 'approve' && u.status === 'pending') {
        u.previous = applyMemberPatch(members, u.name, u.changes);
        u.status = 'applied';
        await saveDataFile('members', members);
      } else if (action === 'reject') {
        if (u.status === 'applied' && u.previous) { applyMemberPatch(members, u.name, u.previous); await saveDataFile('members', members); }
        u.status = 'rejected';
      }
      u.reviewedAt = new Date().toISOString();
      await writeJSON(UPDATES_FILE, updates);
      return u;
    });
    return result ? send(res, 200, result) : send(res, 404, { error: 'Not found' });
  }

  /* Upload a public image or video for the site (gallery, member photos, value photos, video) */
  if (route === 'upload' && req.method === 'POST') {
    const folder = new URL(req.url, 'http://x').searchParams.get('folder');
    if (!UPLOAD_FOLDERS.includes(folder)) return send(res, 400, { error: 'Unknown folder' });
    let form;
    try { form = await readForm(req, 300 * MB); }
    catch (e) { return send(res, e.status || 400, { error: e.status === 413 ? 'File is too large (300 MB max).' : 'Upload failed.' }); }
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
      const name = `${slug(path.parse(f.name).name)}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
      await fsp.mkdir(path.join(BASE_DIR, 'images', folder), { recursive: true });
      await fsp.writeFile(path.join(BASE_DIR, 'images', folder, name), buf);
      out.push({ path: `images/${folder}/${name}`, name: f.name });
    }
    return send(res, 200, { files: out });
  }

  /* Delete an uploaded public file (only inside the upload folders) */
  if (route === 'upload' && req.method === 'DELETE') {
    const { path: p } = await readJSONBody(req);
    const full = path.resolve(BASE_DIR, String(p || ''));
    const allowed = UPLOAD_FOLDERS.some(f => full.startsWith(path.join(BASE_DIR, 'images', f) + path.sep));
    if (!allowed) return send(res, 400, { error: 'Not allowed' });
    await fsp.rm(full, { force: true });
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Not found' });
}

/* Applicant resumes and headshots: only for logged-in admins */
async function handlePrivateFile(req, res) {
  if (!isAdmin(req)) return send(res, 401, 'Please log in to the CMS.');
  const rel = new URL(req.url, 'http://x').searchParams.get('path') || '';
  const full = path.resolve(UPLOADS_DIR, rel);
  if (!full.startsWith(UPLOADS_DIR + path.sep)) return send(res, 403, 'Forbidden');
  try {
    const data = await fsp.readFile(full);
    const download = new URL(req.url, 'http://x').searchParams.get('download');
    send(res, 200, data, {
      'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
      ...(download ? { 'Content-Disposition': `attachment; filename="${path.basename(full)}"` } : {}),
    });
  } catch { send(res, 404, 'Not found'); }
}

/* ───────────────────────── static files ───────────────────────── */

const BLOCKED = /^\/(private|node_modules|\.|server\.js|package(-lock)?\.json)/i;

async function handleStatic(req, res, pathname) {
  if (BLOCKED.test(pathname) || pathname.split('/').some(seg => seg.startsWith('.'))) return send(res, 404, 'Not found');
  let filePath = path.join(BASE_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(BASE_DIR + path.sep) && filePath !== BASE_DIR) return send(res, 403, 'Forbidden');
  try {
    let stat = await fsp.stat(filePath);
    if (stat.isDirectory()) { filePath = path.join(filePath, 'index.html'); stat = await fsp.stat(filePath); }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

    /* Videos need byte ranges so browsers can seek */
    const range = req.headers.range;
    if (range && type.startsWith('video/')) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = +s, end = e ? +e : stat.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      /* Pages, scripts, styles, and data always revalidate so CMS edits show up immediately */
      'Cache-Control': /^(text\/|application\/(javascript|json))/.test(type) ? 'no-cache' : 'public, max-age=300',
      'Last-Modified': stat.mtime.toUTCString(),
    });
    fs.createReadStream(filePath).pipe(res);
  } catch { send(res, 404, 'Not found'); }
}

/* ───────────────────────── router ───────────────────────── */

http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pathname === '/api/apply' && req.method === 'POST') return await handleApply(req, res);
    if (pathname === '/api/update' && req.method === 'POST') return await handleMemberUpdate(req, res);
    if (pathname === '/api/update/config' && req.method === 'GET') return send(res, 200, { enabled: (await getSettings()).updatesEnabled });
    if (pathname === '/api/admin/file') return await handlePrivateFile(req, res);
    if (pathname.startsWith('/api/admin/')) return await handleAdmin(req, res, pathname.slice('/api/admin/'.length));
    if (pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    return await handleStatic(req, res, pathname);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong.' });
  }
}).listen(PORT, () => {
  console.log(`\n  AKPsi Beta Pi running at  →  http://localhost:${PORT}`);
  console.log(`  CMS                       →  http://localhost:${PORT}/admin.html\n`);
});
