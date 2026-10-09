/* Beta Pi Pledge Portal
 *
 * One page, three experiences. After sign-in, /api/portal/bootstrap returns
 * everything this person may see, and the role picks the dashboard:
 *   pledge    Home · Program (Weeks 1–8) · Calendar · Resources
 *   educator  Dashboard · Review queue · My pledges · Program · Calendar · Resources
 *   vpm       Dashboard (progress matrix) · Review · Pledges · People · Program CMS · Calendar
 */

/* ───────────── Firebase ───────────── */

firebase.initializeApp({
  apiKey: 'AIzaSyBhhfnypX71LUm37QP0qkBOJ3Is2FjjNbI',
  authDomain: 'umiami-akpsi.firebaseapp.com',
  projectId: 'umiami-akpsi',
  appId: '1:472693490074:web:e18c73e68e352872ebba23',
});
const auth = firebase.auth();
/* Local testing runs against the Firebase emulators (firebase emulators:start) */
const EMULATED = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.port === '5002';
if (EMULATED) auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });

/* ───────────── helpers ───────────── */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const first = n => String(n || '').trim().split(/\s+/)[0];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/* Turn bare URLs in text into links (text is escaped first) */
const linkify = s => esc(s).replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 9a3 3 0 0 1 0 6"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};

/* Real golf-course photography (Unsplash). Week n uses PHOTOS[n-1] unless the VPM picks another. */
const PHOTOS = ['1538648759472-7251f7cb2c2f', '1709525616662-8d9f9a995ceb', '1500932334442-8761ee4810a7', '1592937238247-cd0090e02f65', '1605144884374-ecbb643615f6', '1748331700730-131cf72c4a67', '1761074936575-e04432667eaf', '1611273261014-420a44179f56', '1672871583167-bedd74c24995', '1637345853431-2ad143458e7a'];
const photo = (id, w = 1400) => id?.startsWith('http') ? id : `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;
const weekPhoto = (n, w) => photo(S.program.weeks[n - 1]?.image || PHOTOS[(n - 1) % PHOTOS.length], w);

let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = `toast show${err ? ' err' : ''}`;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), err ? 5000 : 2800);
}

/* ───────────── dates ───────────── */

const DAY = 864e5;
const fmt = (d, o) => new Date(d).toLocaleString('en-US', o);
const fmtDue = iso => fmt(iso, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + fmt(iso, { hour: 'numeric', minute: '2-digit' });
const fmtDay = d => fmt(d, { month: 'short', day: 'numeric' });
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toLocalInput = iso => { if (!iso) return ''; const d = new Date(iso); return `${isoDay(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function ago(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return fmtDay(iso);
}
function dueInfo(d, done) {
  if (!d.dueAt) return { text: 'No due date', cls: '' };
  const ms = Date.parse(d.dueAt) - Date.now();
  const when = fmtDue(d.dueAt);
  if (done) return { text: `Due ${when}`, cls: '' };
  if (ms < 0) { const days = Math.floor(-ms / DAY); return { text: `${days ? `Overdue by ${plural(days, 'day')}` : 'Overdue'} · was due ${when}`, cls: 'over' }; }
  const days = Math.floor(ms / DAY);
  const rel = isoDay(new Date(d.dueAt)) === isoDay(new Date()) ? 'today' : days < 1 ? 'tomorrow' : `in ${plural(days, 'day')}`;
  return { text: `Due ${when} · ${rel}`, cls: ms < 2 * DAY ? 'soon' : '' };
}

/* ───────────── state ───────────── */

const S = { me: null, program: { weeks: [] }, deliverables: [], resources: [], events: [], announcements: [], people: [], submissions: [], invites: [], subs: {} };
const role = () => S.me?.role;
const isStaff = () => ['educator', 'vpm'].includes(role());
const byUid = uid => S.people.find(p => p.uid === uid);
const pledges = () => S.people.filter(p => p.role === 'pledge' && p.active !== false && (role() === 'vpm' || role() === 'pledge' || p.educatorUid === S.me.uid)).sort((a, b) => a.name.localeCompare(b.name));
const educators = () => S.people.filter(p => ['educator', 'vpm'].includes(p.role) && p.active !== false).sort((a, b) => a.name.localeCompare(b.name));
const deliv = id => S.deliverables.find(d => d.id === id);
const indexSubs = () => { S.subs = Object.fromEntries(S.submissions.map(s => [s.id, s])); };
const subFor = (dId, uid) => S.subs[`${dId}__${uid}`];

/* Approved → Needs Revision → Submitted (Late if after the due date). No submission: Late once past due. */
function statusOf(d, uid) {
  const s = subFor(d.id, uid);
  if (s?.status === 'approved') return { key: 'approved', label: 'Approved', s };
  if (s?.status === 'needs_revision') return { key: 'revision', label: 'Needs Revision', s };
  if (s) return s.late ? { key: 'late', label: 'Late', s, cell: 'late-sub' } : { key: 'submitted', label: 'Submitted', s };
  if (d.dueAt && Date.now() > Date.parse(d.dueAt)) return { key: 'missing', label: 'Late', missing: true };
  return { key: 'notstarted', label: 'Not Started' };
}
const pill = st => `<span class="pill ${st.key}">${st.label}${st.missing ? ' · missing' : ''}</span>`;

function weekRange(n) {
  if (!S.program.startDate) return null;
  const a = new Date(S.program.startDate + 'T00:00'); a.setDate(a.getDate() + 7 * (n - 1));
  const b = new Date(a); b.setDate(b.getDate() + 6);
  return [a, b];
}
const rangeText = n => { const r = weekRange(n); return r ? `${fmtDay(r[0])} – ${fmtDay(r[1])}` : ''; };
/* 0 = before the program starts; 1–8 = current week */
function currentWeek() {
  if (!S.program.startDate) return 1;
  const days = Math.floor((Date.now() - Date.parse(S.program.startDate + 'T00:00')) / DAY);
  return days < 0 ? 0 : Math.min(8, Math.floor(days / 7) + 1);
}
const weekLabel = n => `Week ${n} · Hole ${n}`;
const weekDelivs = n => S.deliverables.filter(d => d.week === n);

/* ───────────── API ───────────── */

async function api(method, path, body) {
  const token = await auth.currentUser.getIdToken();
  const opts = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(`/api/portal/${path}`, opts);
  let data = {}; try { data = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(data.error || `Something went wrong (${res.status}).`), { status: res.status, field: data.field });
  return data;
}

/* Upload with a progress callback (fetch can't report upload progress) */
async function apiUpload(path, fd, onProgress) {
  const token = await auth.currentUser.getIdToken();
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', `/api/portal/${path}`);
    x.setRequestHeader('Authorization', `Bearer ${token}`);
    x.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
    x.onload = () => {
      let data = {}; try { data = JSON.parse(x.responseText); } catch {}
      x.status < 300 ? resolve(data) : reject(Object.assign(new Error(data.error || `Upload failed (${x.status}).`), { field: data.field }));
    };
    x.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    x.send(fd);
  });
}

/* Private files need the sign-in token, so they're fetched and shown as blob URLs */
const blobCache = new Map();
async function fileBlobUrl(path) {
  if (blobCache.has(path)) return blobCache.get(path);
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(`/api/portal/file?path=${encodeURIComponent(path)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error((await res.text()) || 'Could not open the file.');
  const url = URL.createObjectURL(await res.blob());
  blobCache.set(path, url);
  return url;
}
async function openFile(path) {
  const w = window.open('', '_blank');   // open now so popup blockers allow it
  try { const url = await fileBlobUrl(path); if (w) w.location = url; else location.href = url; }
  catch (e) { w?.close(); toast(e.message, true); }
}
const fileName = p => decodeURIComponent(String(p).split('/').pop()).replace(/-[0-9a-f]{6}(\.\w+)$/, '$1');

/* ───────────── auth screens ───────────── */

let signingUp = false;
const AUTH_ERRORS = {
  'auth/invalid-credential': 'That email and password don’t match.', 'auth/wrong-password': 'That email and password don’t match.',
  'auth/user-not-found': 'That email and password don’t match.', 'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with that email already exists. Sign in instead.', 'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.', 'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/missing-password': 'Please enter your password.',
};
const authError = e => AUTH_ERRORS[e.code] || e.message || 'Something went wrong.';

function showAuth(mode = 'signin', msg = '', prefill = {}) {
  $('#boot').hidden = true; $('#app').hidden = true; $('#auth').hidden = false;
  const body = $('#authBody');
  const views = {
    signin: `
      <h2>Sign in</h2><p class="lead">Welcome back to the pledge portal.</p>
      <form id="aForm" novalidate>
        <label class="f"><span>Email</span><input class="input" type="email" name="email" autocomplete="email" placeholder="you@miami.edu" required></label>
        <label class="f"><span class="row">Password<span class="grow"></span><button type="button" class="linkish small" data-auth="reset">Forgot?</button></span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
        <p class="error" id="aErr" role="alert">${esc(msg)}</p>
        <button class="btn primary" type="submit">Sign in</button>
      </form>
      <div class="auth-or"><span>New pledge?</span></div>
      <form id="codeForm" class="code-form" novalidate>
        <label class="f"><span>Invite code</span>
          <div class="code-row"><input class="input code-input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD2345" maxlength="12" required><button class="btn" type="submit">Continue</button></div>
          <small>From your VPM. It sets up your account once.</small></label>
      </form>`,
    signup: `
      <h2>Create your account</h2><p class="lead">You’ll need the invite code from your VPM. It works once.</p>
      <form id="aForm" novalidate>
        <label class="f"><span>Invite code</span><input class="input code-input" name="code" autocomplete="off" value="${esc(prefill.code || '')}" required></label>
        <label class="f"><span>Full name</span><input class="input" name="name" autocomplete="name" required></label>
        <label class="f"><span>Email</span><input class="input" type="email" name="email" autocomplete="email" required></label>
        <label class="f"><span>Password</span><input class="input" type="password" name="password" autocomplete="new-password" minlength="8" required><small>At least 8 characters.</small></label>
        <p class="error" id="aErr">${esc(msg)}</p>
        <button class="btn primary" type="submit">Create account</button>
      </form>
      <p class="auth-alt">Already have an account? <button data-auth="signin">Sign in</button></p>`,
    reset: `
      <h2>Reset password</h2><p class="lead">We’ll email you a link to choose a new one.</p>
      <form id="aForm" novalidate>
        <label class="f"><span>Email</span><input class="input" type="email" name="email" autocomplete="email" required></label>
        <p class="error" id="aErr">${esc(msg)}</p>
        <button class="btn primary" type="submit">Send reset link</button>
      </form>
      <p class="auth-alt"><button data-auth="signin">Back to sign in</button></p>`,
    claim: `
      <h2>One more step</h2><p class="lead">Enter the invite code from your VPM to finish setting up <b>${esc(auth.currentUser?.email || '')}</b>.</p>
      <form id="aForm" novalidate>
        <label class="f"><span>Full name</span><input class="input" name="name" autocomplete="name" required></label>
        <label class="f"><span>Invite code</span><input class="input code-input" name="code" autocomplete="off" required></label>
        <p class="error" id="aErr">${esc(msg)}</p>
        <button class="btn primary" type="submit">Continue</button>
      </form>
      <p class="auth-alt"><button data-auth="signout">Use a different account</button></p>`,
    inactive: `
      <h2>Access paused</h2><p class="lead">${esc(msg)}</p>
      <p class="auth-alt"><button data-auth="signout">Sign out</button></p>`,
  };
  /* Local emulator only: one-click sign-in as the sample accounts from scripts/seed-emulator.js */
  const demo = EMULATED && ['signin', 'signup', 'claim'].includes(mode) ? `
    <div class="auth-note"><b>Local test mode.</b> Jump in as a sample account:
      <div class="row wrap" style="margin-top:10px;gap:8px">
        <button class="btn sm primary" data-demo="pledge1@test.local">Pledge</button>
        <button class="btn sm" data-demo="educator@test.local">Pledge Educator</button>
        <button class="btn sm" data-demo="vpm@test.local">VPM</button>
      </div></div>` : '';
  body.innerHTML = views[mode] + demo;
  $$('[data-demo]', body).forEach(b => b.onclick = async () => {
    b.disabled = true;
    try { if (auth.currentUser) await auth.signOut(); await auth.signInWithEmailAndPassword(b.dataset.demo, 'emulator-only-123'); location.hash = '#/home'; }
    catch (x) { b.disabled = false; $('#aErr') && ($('#aErr').textContent = `${authError(x)} Run node scripts/seed-emulator.js first.`); }
  });
  const form = $('#aForm');
  setTimeout(() => (prefill.code ? form?.querySelector('[name=name]') : form?.querySelector('input'))?.focus(), 30);
  /* Invite code below sign-in: carry the code into account creation */
  $('#codeForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const code = new FormData(e.target).get('code').trim().toUpperCase();
    if (!code) { e.target.querySelector('input').focus(); return; }
    showAuth('signup', '', { code });
  });
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    const btn = $('button[type=submit]', form), err = $('#aErr');
    btn.disabled = true; err.textContent = '';
    try {
      if (mode === 'signin') await auth.signInWithEmailAndPassword(f.email.trim(), f.password);
      if (mode === 'reset') { await auth.sendPasswordResetEmail(f.email.trim()); err.style.color = 'var(--ok)'; err.textContent = 'Check your inbox for the reset link.'; btn.disabled = false; return; }
      if (mode === 'signup') {
        if (!f.name.trim() || !f.code.trim()) throw new Error('Please fill in every field.');
        if (f.password.length < 8) throw new Error('Use at least 8 characters for your password.');
        signingUp = true;
        try { await auth.createUserWithEmailAndPassword(f.email.trim(), f.password); }
        catch (x) { signingUp = false; throw x; }
        try { await api('POST', 'claim', { code: f.code, name: f.name }); }
        catch (x) { signingUp = false; return showAuth('claim', x.message); }
        signingUp = false;
        await load();
      }
      if (mode === 'claim') { await api('POST', 'claim', { code: f.code, name: f.name }); await load(); }
    } catch (x) { err.style.color = ''; err.textContent = authError(x); btn.disabled = false; }
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-auth]');
  if (!b) return;
  if (b.dataset.auth === 'signout') auth.signOut();
  else showAuth(b.dataset.auth);
});

/* ───────────── boot ───────────── */

auth.onAuthStateChanged(user => {
  if (signingUp) return;
  if (!user) { S.me = null; return showAuth('signin'); }
  load();
});

async function load() {
  try {
    const data = await api('GET', 'bootstrap');
    Object.assign(S, data);
    indexSubs();
    $('#boot').hidden = true; $('#auth').hidden = true; $('#app').hidden = false;
    renderShell();
    route();
  } catch (e) {
    if (e.status === 403 && /not set up/.test(e.message)) return showAuth('claim');
    if (e.status === 403) return showAuth('inactive', e.message);
    if (e.status === 401) return auth.signOut();
    $('#boot').hidden = true;
    showAuth('signin', e.message);
  }
}

/* ───────────── shell + routing ───────────── */

const NAV = {
  pledge: [['home', 'Home', I.home], ['program', 'Program', I.flag], ['calendar', 'Calendar', I.cal], ['resources', 'Resources', I.book]],
  educator: [['home', 'Dashboard', I.home], ['review', 'Review queue', I.inbox, 'queue'], ['pledges', 'My pledges', I.users], '—Program', ['program', 'Weeks 1–8', I.flag], ['calendar', 'Calendar', I.cal], ['resources', 'Resources', I.book]],
  vpm: [['home', 'Dashboard', I.grid], ['review', 'Review queue', I.inbox, 'queue'], ['pledges', 'Pledges', I.users], ['people', 'People & access', I.users], '—Program CMS', ['cms/program', 'Weeks & class', I.flag], ['cms/deliverables', 'Deliverables', I.list], ['cms/resources', 'Resources', I.book], ['cms/announcements', 'Announcements', I.megaphone], ['calendar', 'Calendar', I.cal]],
};
const ROLE_NAME = { pledge: 'Pledge', educator: 'Pledge Educator', vpm: 'VPM' };
const reviewQueue = () => S.submissions.filter(s => s.status === 'submitted' && deliv(s.deliverableId)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

function renderShell() {
  const items = NAV[role()] || [];
  const q = reviewQueue().length;
  $('#sideNav').innerHTML = items.map(it => typeof it === 'string'
    ? `<div class="group">${it.slice(1)}</div>`
    : `<a href="#/${it[0]}" data-nav="${it[0]}">${it[2]}<span>${it[1]}</span>${it[3] === 'queue' && q ? `<span class="count">${q}</span>` : ''}</a>`).join('');
  $('#sideUser').innerHTML = `
    <div class="avatar ${role() === 'vpm' ? 'gold' : role() === 'educator' ? 'navy' : ''}">${initials(S.me.name)}</div>
    <div class="who"><b>${esc(S.me.name)}</b><small>${ROLE_NAME[role()]}</small></div>
    <button class="icon-btn" data-auth="signout" title="Sign out" aria-label="Sign out">${I.out}</button>`;
  const wk = currentWeek();
  $('#topWeek').innerHTML = wk === 0
    ? `<span class="lbl">${esc(S.program.className)} ·</span> <b>Starts ${fmtDay(S.program.startDate + 'T00:00')}</b>`
    : `<span class="flag"></span><span class="lbl">${esc(S.program.className)} ·</span> <b>Week ${wk}</b><span class="lbl muted">· Hole ${wk}</span>`;
}

const ROUTES = {
  pledge: { home: vPledgeHome, program: vProgram, week: vWeek, calendar: vCalendar, resources: vResources },
  educator: { home: vEducatorHome, review: vReviewList, pledges: vPledges, pledge: vPledge, program: vProgram, week: vWeek, calendar: vCalendar, resources: vResources },
  vpm: { home: vVpmHome, review: vReviewList, pledges: vPledges, pledge: vPledge, people: vPeople, program: vProgram, week: vWeek, calendar: vCalendar, resources: vResources,
    'cms/program': vCmsProgram, 'cms/deliverables': vCmsDeliverables, 'cms/resources': vCmsResources, 'cms/announcements': vCmsAnnouncements },
};

function route() {
  if (!S.me) return;
  const [path, query] = (location.hash.replace(/^#\/?/, '') || 'home').split('?');
  const parts = path.split('/');
  const table = ROUTES[role()];
  let fn, arg;
  if (table[path]) fn = table[path];
  else if (table[parts.slice(0, 2).join('/')]) fn = table[parts.slice(0, 2).join('/')];
  else if (table[parts[0]]) { fn = table[parts[0]]; arg = parts[1]; }
  if (parts[0] === 'review' && parts[1] && isStaff()) { fn = vReview; arg = parts[1]; }
  if (!fn) { location.hash = '#/home'; return; }
  const navKey = parts[0] === 'week' ? 'program' : parts[0] === 'pledge' ? 'pledges' : parts[0] === 'cms' ? path : parts[0];
  $$('#sideNav a').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey));
  $('#side').classList.remove('open');
  document.onkeydown = null;
  $('#view').onclick = null;
  fn(arg, new URLSearchParams(query || ''));
}
window.addEventListener('hashchange', () => { closeDrawer(); route(); window.scrollTo(0, 0); });
$('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
const setTitle = t => { $('#topTitle').textContent = t; document.title = `${t} | Beta Pi Pledge Portal`; };
const view = html => { $('#view').innerHTML = html; };

/* ───────────── shared view pieces ───────────── */

function ditem(d, uid = S.me.uid) {
  const st = statusOf(d, uid);
  const due = st.key === 'revision' ? { text: `Revision requested ${ago([...st.s.history].reverse().find(h => h.action === 'requested revision')?.at || st.s.submittedAt)}`, cls: 'soon' } : dueInfo(d, Boolean(st.s));
  const cta = st.key === 'approved' ? '' : st.key === 'revision' ? 'Resubmit' : st.s ? '' : 'Submit';
  return `<li class="ditem" data-open-d="${d.id}">
    <div class="wk"><span>Week</span><b>${d.week}</b></div>
    <div class="body"><div class="name">${esc(d.name)}</div><div class="due ${due.cls}">${due.text}</div></div>
    <div class="act">${pill(st)}${cta ? `<button class="btn sm ${st.key === 'revision' ? 'fix' : ''}">${cta}</button>` : ''}</div>
  </li>`;
}

function scorecard(uid) {
  const wk = currentWeek();
  const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
  const par = weeks.map(n => weekDelivs(n).length);
  const done = weeks.map(n => weekDelivs(n).filter(d => statusOf(d, uid).key === 'approved').length);
  const short = weeks.map(n => weekDelivs(n).some(d => statusOf(d, uid).key === 'missing'));
  const cell = (n, inner) => `<td class="${n === wk ? 'now' : ''}"><a href="#/week/${n}">${inner}</a></td>`;
  return `<table class="scorecard">
    <thead><tr><th>Hole</th>${weeks.map(n => `<th class="${n === wk ? 'now' : ''}">${n}</th>`).join('')}<th>Total</th></tr></thead>
    <tbody>
      <tr><td>Deliverables</td>${weeks.map((n, i) => cell(n, par[i] || '–')).join('')}<td><b>${par.reduce((a, b) => a + b, 0)}</b></td></tr>
      <tr><td>Approved</td>${weeks.map((n, i) => cell(n, `<span class="score ${par[i] && done[i] === par[i] ? 'under' : short[i] ? 'short' : ''}">${par[i] ? done[i] : '–'}</span>`)).join('')}<td><span class="score">${done.reduce((a, b) => a + b, 0)}</span></td></tr>
    </tbody></table>`;
}

function announcementsCard(limit = 4) {
  const list = S.announcements.slice(0, limit);
  return `<div class="card announce"><div class="card-head"><h2>Announcements</h2></div>
    ${list.length ? `<ul class="feed">${list.map(a => `<li><div class="txt">
      ${a.pinned ? '<div class="pin">Pinned</div>' : ''}<h3>${esc(a.title)}</h3>
      <p>${linkify(a.body)}</p><div class="when">${esc(a.author || '')} · ${ago(a.createdAt)}</div></div></li>`).join('')}</ul>`
      : '<div class="empty">No announcements yet.</div>'}</div>`;
}

function timeline(s) {
  const cls = { approved: 'approved', 'requested revision': 'revision', commented: 'comment', submitted: 'submit', resubmitted: 'submit' };
  return `<ul class="timeline">${[...(s.history || [])].reverse().map(h => `
    <li class="${cls[h.action] || ''}"><div class="t-head"><b>${esc(h.by === S.me.uid ? 'You' : h.byName)}</b> ${esc(h.action)}<span class="when">${ago(h.at)}</span></div>
    ${h.comment ? `<div class="t-body">${linkify(h.comment)}</div>` : ''}</li>`).join('')}</ul>`;
}

const resourceRow = r => r.path
  ? `<button class="link-row" data-file="${esc(r.path)}">${I.file}<span>${esc(r.name || r.title || r.fileName || fileName(r.path))}</span><small>Open</small></button>`
  : `<a class="link-row" href="${esc(r.url)}" target="_blank" rel="noopener">${I.link}<span>${esc(r.name || r.title)}</span><small>${esc((() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return 'Link'; } })())}</small></a>`;

const stat = (k, v, s = '', cls = '', href = '') => `<${href ? `a href="${href}"` : 'div'} class="stat ${cls}"><div class="k">${k}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</${href ? 'a' : 'div'}>`;

/* ───────────── pledge: home ───────────── */

function vPledgeHome() {
  setTitle(`Welcome, ${first(S.me.name)}`);
  const wk = currentWeek();
  const n = wk || 1;
  const W = S.program.weeks[n - 1] || {};
  const thisWeek = weekDelivs(n);
  const approved = thisWeek.filter(d => statusOf(d, S.me.uid).key === 'approved').length;
  const order = { revision: 0, missing: 1, notstarted: 2, late: 3, submitted: 4 };
  const open = S.deliverables.map(d => ({ d, st: statusOf(d, S.me.uid) })).filter(x => x.st.key !== 'approved')
    .sort((a, b) => order[a.st.key] - order[b.st.key] || String(a.d.dueAt || '9').localeCompare(String(b.d.dueAt || '9')));
  const action = open.filter(x => ['revision', 'missing', 'notstarted'].includes(x.st.key));
  const next = action[0]?.d;
  const feedback = S.submissions.flatMap(s => (s.history || []).filter(h => h.by !== S.me.uid && (h.comment || h.action !== 'commented')).map(h => ({ ...h, s })))
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);

  view(`
    <section class="week-hero"><div class="wh-photo" style="background-image:url('${weekPhoto(n)}')" role="img" aria-label="Golf course, hole ${n}"></div><div class="wh-copy">
      <p class="eyebrow light">${wk === 0 ? `Starts ${fmtDay(S.program.startDate + 'T00:00')} · Hole 1` : weekLabel(n)}</p>
      <h1>${esc(W.title || `Week ${n}`)}</h1>
      ${W.hole ? `<div class="hole">${esc(W.hole)}</div>` : ''}
      ${W.summary ? `<p>${esc(W.summary)}</p>` : ''}
      <div class="meta">
        ${rangeText(n) ? `<span><b>${rangeText(n)}</b></span>` : ''}
        <span><b>${approved}/${thisWeek.length}</b> approved this week</span>
        ${next ? `<span>Next due: <b>${esc(next.name)}</b></span>` : ''}
      </div>
      ${next ? `<button class="btn gold" data-open-d="${next.id}">${statusOf(next, S.me.uid).key === 'revision' ? 'Fix and resubmit' : 'Submit'} ${esc(next.name)}</button>` : ''}
    </div></section>
    <div class="cols">
      <div>
        <div class="card"><div class="card-head"><h2>Up next</h2><span class="grow"></span><a class="btn sm ghost" href="#/program">Full program</a></div>
          ${open.length ? `<ul class="dlist">${open.slice(0, 7).map(x => ditem(x.d)).join('')}</ul>` : `<div class="empty"><b>All caught up</b>Everything assigned so far is approved.</div>`}
        </div>
        <div class="card"><div class="card-head"><h2>Scorecard</h2><span class="grow"></span><span class="small muted">Approved per week</span></div>${scorecard(S.me.uid)}</div>
      </div>
      <div>
        <div class="card"><div class="card-head"><h2>Feedback</h2></div>
          ${feedback.length ? `<ul class="feed">${feedback.map(h => `<li data-open-d="${h.s.deliverableId}" style="cursor:pointer">
            <div class="avatar sm navy">${initials(h.byName)}</div>
            <div class="txt"><b>${esc(h.byName)}</b> <span class="muted">${esc(h.action)} · ${esc(deliv(h.s.deliverableId)?.name || '')}</span>
            ${h.comment ? `<p>${linkify(h.comment)}</p>` : ''}<div class="when">${ago(h.at)}</div></div></li>`).join('')}</ul>`
            : '<div class="empty">Feedback from your pledge educator will show up here.</div>'}
        </div>
        ${announcementsCard()}
      </div>
    </div>`);
}

/* ───────────── program + week (all roles) ───────────── */

function classProgress(list) {
  const ps = pledges();
  const total = list.length * ps.length;
  const done = list.reduce((n, d) => n + ps.filter(p => statusOf(d, p.uid).key === 'approved').length, 0);
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

function vProgram() {
  setTitle('Program');
  const wk = currentWeek();
  view(`
    <div class="page-intro"><p class="eyebrow">${esc(S.program.className)}</p><p>Eight weeks, played one hole at a time. Open a week to see its deliverables, resources, and events.</p></div>
    <div class="holes">${S.program.weeks.map((W, i) => {
      const n = i + 1, list = weekDelivs(n);
      const prog = role() === 'pledge'
        ? { done: list.filter(d => statusOf(d, S.me.uid).key === 'approved').length, total: list.length }
        : classProgress(list);
      const pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0;
      return `<a class="hole-card" href="#/week/${n}">
        <div class="ph" style="background-image:url('${weekPhoto(n, 700)}')">${n === wk ? '<span class="now-tag"><span class="flag"></span>This week</span>' : ''}<span class="wk-name">Week ${n}</span><small>Hole ${n}</small></div>
        <div class="info"><h3>${esc(W.title || `Week ${n}`)}</h3><p>${esc([W.hole, rangeText(n)].filter(Boolean).join(' · ')) || '&nbsp;'}</p>
          <div class="row"><div class="bar grow"><i style="width:${pct}%"></i></div><span>${role() === 'pledge' ? `${prog.done}/${prog.total}` : `${pct}%`}</span></div>
        </div></a>`;
    }).join('')}</div>`);
}

function vWeek(nStr) {
  const n = Math.min(8, Math.max(1, parseInt(nStr, 10) || 1));
  const W = S.program.weeks[n - 1] || {};
  setTitle(`Week ${n}`);
  const list = weekDelivs(n);
  const res = S.resources.filter(r => r.week === n);
  const evs = S.events.filter(e => e.week === n || (weekRange(n) && e.date >= isoDay(weekRange(n)[0]) && e.date <= isoDay(weekRange(n)[1]))).sort((a, b) => a.date.localeCompare(b.date));
  const staffRow = d => { const c = classProgress([d]); const sub = pledges().filter(p => ['submitted', 'late'].includes(statusOf(d, p.uid).key)).length; const miss = pledges().filter(p => statusOf(d, p.uid).key === 'missing').length;
    return `<li class="ditem" data-open-d="${d.id}"><div class="wk"><span>Week</span><b>${n}</b></div><div class="body"><div class="name">${esc(d.name)}</div><div class="due">${dueInfo(d, true).text}</div></div>
      <div class="act"><span class="pill approved">${c.done}/${pledges().length}</span>${sub ? `<span class="pill submitted">${sub} to review</span>` : ''}${miss ? `<span class="pill missing">${miss} missing</span>` : ''}</div></li>`; };
  view(`
    <section class="week-hero"><div class="wh-photo" style="background-image:url('${weekPhoto(n)}')" role="img" aria-label="Golf course, hole ${n}"></div><div class="wh-copy">
      <p class="eyebrow light">${weekLabel(n)}${n === currentWeek() ? ' · This week' : ''}</p>
      <h1>${esc(W.title || `Week ${n}`)}</h1>
      ${W.hole ? `<div class="hole">${esc(W.hole)}</div>` : ''}
      ${W.summary ? `<p>${esc(W.summary)}</p>` : ''}
      <div class="meta">${rangeText(n) ? `<span><b>${rangeText(n)}</b></span>` : ''}<span><b>${plural(list.length, 'deliverable')}</b></span></div>
    </div></section>
    <div class="row" style="margin:-8px 0 18px">
      ${n > 1 ? `<a class="btn sm" href="#/week/${n - 1}">${I.left}Week ${n - 1}</a>` : ''}<span class="grow"></span>
      ${n < 8 ? `<a class="btn sm" href="#/week/${n + 1}">Week ${n + 1}${I.right}</a>` : ''}
    </div>
    <div class="cols">
      <div><div class="card"><div class="card-head"><h2>Deliverables</h2>${role() === 'vpm' ? `<span class="grow"></span><a class="btn sm" href="#/cms/deliverables">${I.edit}Edit</a>` : ''}</div>
        ${list.length ? `<ul class="dlist">${list.map(d => role() === 'pledge' ? ditem(d) : staffRow(d)).join('')}</ul>` : '<div class="empty">Nothing assigned for this week yet.</div>'}
      </div></div>
      <div>
        <div class="card"><div class="card-head"><h2>Resources</h2></div>
          ${res.length ? `<div class="card-body links">${res.map(resourceRow).join('')}</div>` : '<div class="empty">No resources for this week.</div>'}</div>
        <div class="card"><div class="card-head"><h2>Meetings & events</h2></div>
          ${evs.length ? `<ul class="feed">${evs.map(e => `<li><div class="txt"><b>${esc(e.title)}</b><p>${fmt(e.date + 'T00:00', { weekday: 'short', month: 'short', day: 'numeric' })}${e.time ? ` · ${esc(e.time)}` : ''}${e.location ? ` · ${esc(e.location)}` : ''}</p>${e.details ? `<p>${linkify(e.details)}</p>` : ''}</div></li>`).join('')}</ul>` : '<div class="empty">No meetings scheduled.</div>'}</div>
      </div>
    </div>`);
}

/* ───────────── deliverable drawer ───────────── */

let staged = [];   // files picked for the open drawer

function openDrawer(html) {
  $('#drawer').innerHTML = html;
  $('#drawerWrap').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  $('#drawerWrap').hidden = true; document.body.style.overflow = ''; staged = [];
}
$('#drawerWrap').addEventListener('click', e => { if (e.target.id === 'drawerWrap' || e.target.closest('[data-close]')) closeDrawer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#drawerWrap').hidden) closeDrawer(); });

function deliverableDrawer(id, files = []) {
  const d = deliv(id);
  if (!d) return;
  if (role() !== 'pledge') return staffDrawer(d);
  staged = files;
  const st = statusOf(d, S.me.uid), s = st.s;
  const due = dueInfo(d, Boolean(st.s));
  const lastRevise = [...(s?.history || [])].reverse().find(h => h.action === 'requested revision');
  const canSubmit = st.key !== 'approved';
  openDrawer(`
    <div class="drawer-head"><div class="grow">
      <p class="eyebrow">${weekLabel(d.week)}</p><h2>${esc(d.name)}</h2>
      <div class="meta">${pill(st)}<span class="${due.cls === 'over' ? 'muted' : ''}">${due.text}</span></div>
    </div><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
    <div class="drawer-body">
      ${st.key === 'revision' ? `<section><div class="banner revision"><div><b>Revision requested${lastRevise ? ` by ${esc(lastRevise.byName)}` : ''}</b>${lastRevise ? linkify(lastRevise.comment) : 'Make the requested changes and resubmit.'}</div></div></section>` : ''}
      ${st.key === 'approved' ? `<section><div class="banner approved"><div><b>Approved${s.reviewedByName ? ` by ${esc(s.reviewedByName)}` : ''}</b>Nice work. Nothing else to do here.</div></div></section>` : ''}
      ${st.key === 'missing' ? `<section><div class="banner late"><div><b>This is past due</b>You can still submit it. It will be marked late.</div></div></section>` : ''}
      ${d.instructions ? `<section><h4>Instructions</h4><div class="prose">${linkify(d.instructions)}</div></section>` : ''}
      ${d.resources?.length ? `<section><h4>Templates & resources</h4><div class="links">${d.resources.map(resourceRow).join('')}</div></section>` : ''}
      ${canSubmit ? `<section><h4>${s ? 'Resubmit' : 'Your work'}</h4>
        <label class="drop" id="dz"><input type="file" id="dzInput" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.pptx,.xlsx">
          ${I.upload}<b>Drop your file here or click to choose</b><span>PDF, image, Word, PowerPoint, or Excel · 25 MB total</span></label>
        <div class="chips" id="dzChips"></div>
        <button class="linkish more-toggle" id="moreToggle" type="button">${s?.link || s?.note ? 'Edit link or note' : '+ Add a link or note'}</button>
        <div id="moreFields" class="stack" style="margin-top:12px" hidden>
          <label class="f"><span>Link (Google Doc, LinkedIn, etc.)</span><input class="input" id="subLink" value="${esc(s?.link || '')}" placeholder="https://"></label>
          <label class="f"><span>Note to your educator</span><textarea class="textarea" id="subNote" rows="3">${esc(s?.note || '')}</textarea></label>
        </div>
        ${s?.files?.length ? `<p class="small muted" style="margin-top:12px">New files replace your current ones. Submitting without new files keeps them.</p>` : ''}
      </section>` : ''}
      ${s ? `<section><h4>Submitted ${ago(s.submittedAt)}${s.late ? ' · late' : ''}</h4>
        <div class="links">${(s.files || []).map(f => `<button class="link-row" data-file="${esc(f.path)}">${I.file}<span>${esc(f.name)}</span><small>Open</small></button>`).join('')}
        ${s.link ? `<a class="link-row" href="${esc(s.link)}" target="_blank" rel="noopener">${I.link}<span>${esc(s.link)}</span><small>Open</small></a>` : ''}</div>
      </section>
      <section><h4>Activity</h4>${timeline(s)}</section>` : ''}
    </div>
    ${canSubmit ? `<div class="drawer-foot"><div class="progress" id="upProg" hidden><i></i></div><span class="grow small muted" id="upMsg"></span>
      <button class="btn primary lg" id="submitBtn">${s ? 'Resubmit' : 'Submit'}</button></div>` : ''}`);
  if (!canSubmit) return;

  const renderChips = () => {
    $('#dzChips').innerHTML = staged.map((f, i) => `<span class="chip">${I.file}<span>${esc(f.name)}</span><button data-unstage="${i}" aria-label="Remove">${I.x}</button></span>`).join('');
    $('#submitBtn').classList.toggle('gold', staged.length > 0);
  };
  const add = list => { staged.push(...[...list]); renderChips(); };
  const dz = $('#dz');
  $('#dzInput').onchange = e => { add(e.target.files); e.target.value = ''; };
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
  dz.ondragleave = () => dz.classList.remove('over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); add(e.dataTransfer.files); };
  $('#dzChips').onclick = e => { const b = e.target.closest('[data-unstage]'); if (b) { staged.splice(+b.dataset.unstage, 1); renderChips(); } };
  $('#moreToggle').onclick = () => { $('#moreFields').hidden = !$('#moreFields').hidden; };
  renderChips();

  $('#submitBtn').onclick = async () => {
    const link = $('#subLink').value.trim(), note = $('#subNote').value.trim();
    if (!staged.length && !link && !note && !s?.files?.length) { toast('Attach a file, add a link, or write a note first.', true); return; }
    const fd = new FormData();
    staged.forEach(f => fd.append('file', f));
    fd.append('link', link); fd.append('note', note);
    if (!staged.length) fd.append('keepFiles', '1');
    const btn = $('#submitBtn'), prog = $('#upProg');
    btn.disabled = true; prog.hidden = false; $('#upMsg').textContent = staged.length ? 'Uploading…' : 'Submitting…';
    try {
      const r = await apiUpload(`submit/${d.id}`, fd, p => { $('i', prog).style.width = `${Math.round(p * 100)}%`; });
      const i = S.submissions.findIndex(x => x.id === r.submission.id);
      if (i >= 0) S.submissions[i] = r.submission; else S.submissions.push(r.submission);
      indexSubs();
      toast(r.submission.late ? 'Submitted (marked late). Your educator will review it.' : 'Submitted. Your educator will review it.');
      route();
      deliverableDrawer(d.id);
    } catch (e) { toast(e.message, true); btn.disabled = false; prog.hidden = true; $('#upMsg').textContent = ''; }
  };
}

/* Staff view of a deliverable: instructions and every visible pledge's status */
function staffDrawer(d) {
  const rows = pledges().map(p => ({ p, st: statusOf(d, p.uid) }));
  openDrawer(`
    <div class="drawer-head"><div class="grow"><p class="eyebrow">${weekLabel(d.week)}</p><h2>${esc(d.name)}</h2>
      <div class="meta"><span>${dueInfo(d, true).text}</span></div></div>
      ${role() === 'vpm' ? `<button class="btn sm" data-edit-d="${d.id}">${I.edit}Edit</button>` : ''}
      <button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
    <div class="drawer-body">
      ${d.instructions ? `<section><h4>Instructions</h4><div class="prose">${linkify(d.instructions)}</div></section>` : ''}
      ${d.resources?.length ? `<section><h4>Templates & resources</h4><div class="links">${d.resources.map(resourceRow).join('')}</div></section>` : ''}
      <section><h4>Pledges</h4>
        ${rows.length ? `<ul class="queue">${rows.map(({ p, st }) => `<${st.s ? `a href="#/review/${st.s.id}"` : 'div'} class="qitem">
          <div class="avatar sm">${initials(p.name)}</div><div class="body"><div class="name">${esc(p.name)}</div>${st.s ? `<div class="sub">Submitted ${ago(st.s.submittedAt)}</div>` : ''}</div>${pill(st)}</${st.s ? 'a' : 'div'}>`).join('')}</ul>` : '<div class="empty">No pledges yet.</div>'}
      </section>
    </div>`);
}

/* Global clicks: open deliverables and files from anywhere */
document.addEventListener('click', e => {
  const f = e.target.closest('[data-file]');
  if (f) { e.preventDefault(); return openFile(f.dataset.file); }
  const ed = e.target.closest('[data-edit-d]');
  if (ed) { closeDrawer(); return deliverableModal(ed.dataset.editD); }
  const o = e.target.closest('[data-open-d]');
  if (o && !e.target.closest('a[href]')) deliverableDrawer(o.dataset.openD);
});
/* Drag a file straight onto a deliverable row to start a submission */
document.addEventListener('dragover', e => {
  const row = e.target.closest('.ditem[data-open-d]');
  if (!row || role() !== 'pledge') return;
  e.preventDefault(); $$('.ditem.drop').forEach(r => r !== row && r.classList.remove('drop')); row.classList.add('drop');
});
document.addEventListener('dragleave', e => { const row = e.target.closest('.ditem'); if (row && !row.contains(e.relatedTarget)) row.classList.remove('drop'); });
document.addEventListener('drop', e => {
  const row = e.target.closest('.ditem[data-open-d]');
  if (!row || role() !== 'pledge') return;
  e.preventDefault(); row.classList.remove('drop');
  if (statusOf(deliv(row.dataset.openD), S.me.uid).key === 'approved') return toast('That one is already approved.');
  deliverableDrawer(row.dataset.openD, [...e.dataTransfer.files]);
});

/* ───────────── calendar ───────────── */

let calMonth = null;
function vCalendar() {
  setTitle('Calendar');
  if (!calMonth) { const d = new Date(); calMonth = new Date(d.getFullYear(), d.getMonth(), 1); }
  const today = isoDay(new Date());
  const items = {};
  S.events.forEach(e => (items[e.date] = items[e.date] || []).push(`<button class="cal-ev ${e.kind}" data-ev="${e.id}" title="${esc(e.title)}${e.time ? ' · ' + esc(e.time) : ''}">${esc(e.time ? e.time.replace(':00', '').replace(' ', '').toLowerCase() + ' ' : '')}${esc(e.title)}</button>`));
  S.deliverables.filter(d => d.dueAt).forEach(d => {
    const k = isoDay(new Date(d.dueAt));
    const done = role() === 'pledge' && statusOf(d, S.me.uid).key === 'approved';
    (items[k] = items[k] || []).push(`<button class="cal-ev due${done ? ' done' : ''}" data-open-d="${d.id}" title="Due: ${esc(d.name)}">${esc(d.name)}</button>`);
  });
  const n = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const cells = Array(calMonth.getDay()).fill(null);
  for (let k = 1; k <= n; k++) cells.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), k));
  while (cells.length % 7) cells.push(null);
  const edit = role() === 'vpm';
  const upcoming = [...S.events.filter(e => e.date >= today).map(e => ({ at: e.date, t: e.title, sub: [e.time, e.location].filter(Boolean).join(' · '), kind: e.kind })),
    ...S.deliverables.filter(d => d.dueAt && d.dueAt >= new Date().toISOString()).map(d => ({ at: isoDay(new Date(d.dueAt)), t: `Due: ${d.name}`, sub: fmtDue(d.dueAt), kind: 'due', id: d.id }))]
    .sort((a, b) => a.at.localeCompare(b.at)).slice(0, 8);
  view(`
    <div class="cal-layout">
      <div><div class="card">
        <div class="cal-toolbar">
          <button class="icon-btn" id="calPrev" aria-label="Previous month">${I.left}</button>
          <h2 class="cal-title">${fmt(calMonth, { month: 'long' })} <span>${calMonth.getFullYear()}</span></h2>
          <button class="icon-btn" id="calNext" aria-label="Next month">${I.right}</button>
          <button class="btn sm" id="calToday">Today</button><span class="grow"></span>
          ${edit ? `<span class="small muted">Click a day to add an event</span>` : ''}
        </div>
        <div class="cal">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-dow">${d}</div>`).join('')}
          ${cells.map(d => { if (!d) return '<div class="cal-blank"></div>'; const k = isoDay(d);
            return `<div class="cal-day ${k === today ? 'today' : ''} ${k < today ? 'past' : ''} ${edit ? 'editable' : ''}" data-day="${k}"><span class="cal-num">${d.getDate()}</span>${(items[k] || []).join('')}</div>`; }).join('')}
        </div>
        <div class="cal-legend"><span><i style="background:var(--navy)"></i>Meeting</span><span><i style="background:var(--brand-ink)"></i>Event</span><span><i style="background:var(--gold)"></i>Due date</span></div>
      </div></div>
      <div><div class="card"><div class="card-head"><h2>Coming up</h2></div>
        ${upcoming.length ? `<ul class="feed">${upcoming.map(u => `<li ${u.id ? `data-open-d="${u.id}" style="cursor:pointer"` : ''}><div class="txt"><b>${esc(u.t)}</b><p>${fmt(u.at + 'T00:00', { weekday: 'short', month: 'short', day: 'numeric' })}${u.sub && u.kind !== 'due' ? ` · ${esc(u.sub)}` : ''}</p></div></li>`).join('')}</ul>` : '<div class="empty">Nothing scheduled.</div>'}
      </div></div>
    </div>`);
  $('#calPrev').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); vCalendar(); };
  $('#calNext').onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); vCalendar(); };
  $('#calToday').onclick = () => { calMonth = null; vCalendar(); };
  $('.cal').onclick = e => {
    const ev = e.target.closest('[data-ev]');
    if (ev) { const x = S.events.find(v => v.id === ev.dataset.ev); return edit ? eventModal(x) : showEvent(x); }
    if (e.target.closest('[data-open-d]')) return;
    const day = e.target.closest('[data-day]');
    if (day && edit) eventModal(null, day.dataset.day);
  };
}
function showEvent(e) {
  const m = modal(e.title, `<div class="stack"><p><b>${fmt(e.date + 'T00:00', { weekday: 'long', month: 'long', day: 'numeric' })}</b>${e.time ? ` · ${esc(e.time)}` : ''}</p>${e.location ? `<p>${esc(e.location)}</p>` : ''}${e.details ? `<p class="prose">${linkify(e.details)}</p>` : ''}</div>`, null);
  return m;
}

/* ───────────── resources ───────────── */

function vResources() {
  setTitle('Resources');
  const groups = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(w => ({ w, list: S.resources.filter(r => (r.week || 0) === w) })).filter(g => g.list.length);
  view(`<div class="page-intro"><p>Guides, templates, and links for the program.${role() === 'vpm' ? ' <a href="#/cms/resources">Manage resources</a>' : ''}</p></div>
    ${groups.length ? groups.map(g => `<div class="card" style="margin-bottom:18px"><div class="card-head"><h2>${g.w ? `Week ${g.w}` : 'General'}</h2>${g.w ? `<span class="small muted">Hole ${g.w} · ${esc(S.program.weeks[g.w - 1]?.title || '')}</span>` : ''}</div>
      <div class="card-body links">${g.list.map(r => `<div>${resourceRow(r)}${r.description ? `<p class="small muted" style="margin:4px 4px 0">${esc(r.description)}</p>` : ''}</div>`).join('')}</div></div>`).join('')
    : '<div class="card"><div class="empty"><b>No resources yet</b>Your VPM will add guides and templates here.</div></div>'}`);
}

/* ───────────── educator + VPM: dashboards ───────────── */

function pledgeStats(p) {
  const st = S.deliverables.map(d => statusOf(d, p.uid));
  const c = k => st.filter(x => x.key === k).length;
  return { approved: c('approved'), review: c('submitted') + c('late'), revision: c('revision'), missing: c('missing'), total: S.deliverables.length,
    pct: S.deliverables.length ? Math.round(c('approved') / S.deliverables.length * 100) : 0 };
}

function queueList(list, empty = 'Nothing waiting for review.') {
  return list.length ? `<ul class="queue">${list.map(s => { const d = deliv(s.deliverableId), p = byUid(s.pledgeUid); const st = statusOf(d, s.pledgeUid);
    return `<a class="qitem" href="#/review/${s.id}"><div class="avatar sm">${initials(p?.name)}</div>
      <div class="body"><div class="name">${esc(p?.name || 'Unknown')}</div><div class="sub">${esc(d.name)} · Week ${d.week}</div></div>
      ${pill(st)}<div class="when">${ago(s.submittedAt)}</div></a>`; }).join('')}</ul>` : `<div class="empty">${empty}</div>`;
}

function pledgeTable(list) {
  return list.length ? `<div class="table-wrap"><table class="t">
    <thead><tr><th>Pledge</th>${role() === 'vpm' ? '<th>Educator</th>' : ''}<th style="width:28%">Progress</th><th>To review</th><th>Revision</th><th>Missing</th></tr></thead>
    <tbody>${list.map(p => { const x = pledgeStats(p); return `<tr class="click" data-go="#/pledge/${p.uid}">
      <td><div class="person"><div class="avatar sm">${initials(p.name)}</div><b>${esc(p.name)}</b></div></td>
      ${role() === 'vpm' ? `<td>${esc(byUid(p.educatorUid)?.name || '—')}</td>` : ''}
      <td><div class="row"><div class="bar grow"><i style="width:${x.pct}%"></i></div><span class="small">${x.approved}/${x.total}</span></div></td>
      <td>${x.review ? `<span class="pill submitted">${x.review}</span>` : '<span class="muted">0</span>'}</td>
      <td>${x.revision ? `<span class="pill revision">${x.revision}</span>` : '<span class="muted">0</span>'}</td>
      <td>${x.missing ? `<span class="pill missing">${x.missing}</span>` : '<span class="muted">0</span>'}</td></tr>`; }).join('')}</tbody></table></div>`
    : '<div class="empty"><b>No pledges yet</b>' + (role() === 'vpm' ? 'Create invite codes in People & access.' : 'Your VPM assigns pledges to you.') + '</div>';
}
document.addEventListener('click', e => { const r = e.target.closest('tr[data-go]'); if (r && !e.target.closest('select, input, button, a')) location.hash = r.dataset.go; });

function vEducatorHome() {
  setTitle(`Welcome, ${first(S.me.name)}`);
  const ps = pledges(), q = reviewQueue();
  const all = ps.map(pledgeStats);
  const sum = k => all.reduce((n, x) => n + x[k], 0);
  view(`
    <div class="stats">
      ${stat('To review', q.length, q.length ? `Oldest ${ago(q[0].submittedAt)}` : 'All caught up', '', '#/review')}
      ${stat('Needs revision', sum('revision'), 'Waiting on pledges', sum('revision') ? 'warn' : '')}
      ${stat('Missing / late', sum('missing'), 'Past due, not submitted', sum('missing') ? 'alert' : '', '#/pledges?f=missing')}
      ${stat('My pledges', ps.length, ps.length ? `${Math.round(all.reduce((n, x) => n + x.pct, 0) / ps.length)}% average progress` : '')}
    </div>
    <div class="cols">
      <div><div class="card"><div class="card-head"><h2>My pledges</h2></div>${pledgeTable(ps)}</div></div>
      <div>
        <div class="card"><div class="card-head"><h2>Review queue</h2><span class="grow"></span>${q.length ? `<a class="btn sm primary" href="#/review/${q[0].id}">Start reviewing</a>` : ''}</div>${queueList(q.slice(0, 6))}</div>
        ${announcementsCard(3)}
      </div>
    </div>`);
}

function matrix(ps) {
  const ds = S.deliverables;
  if (!ds.length) return '<div class="empty"><b>No deliverables yet</b><a href="#/cms/deliverables">Add the first deliverable</a> to start tracking.</div>';
  if (!ps.length) return '<div class="empty"><b>No pledges yet</b><a href="#/people">Invite your pledge class</a> to fill the matrix.</div>';
  const weeks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ n, list: ds.filter(d => d.week === n) })).filter(w => w.list.length);
  const firstOf = new Set(weeks.map(w => w.list[0].id));
  return `<div class="matrix-wrap"><table class="matrix">
    <thead>
      <tr class="wk-row"><th class="corner" rowspan="2">Pledge</th>${weeks.map(w => `<th colspan="${w.list.length}">Week ${w.n}<small>Hole ${w.n}</small></th>`).join('')}<th rowspan="2" class="corner" style="position:sticky;left:auto;border-left:1px solid var(--rule)">Done</th></tr>
      <tr class="d-row">${weeks.flatMap(w => w.list).map(d => `<th class="${firstOf.has(d.id) ? 'first-of-week' : ''}" title="${esc(d.name)}"><span>${esc(d.name)}</span></th>`).join('')}</tr>
    </thead>
    <tbody>${ps.map(p => { const x = pledgeStats(p); return `<tr>
      <td class="who"><a href="#/pledge/${p.uid}" style="color:inherit"><b>${esc(p.name)}</b></a><small>${esc(byUid(p.educatorUid)?.name || 'No educator')}</small></td>
      ${weeks.flatMap(w => w.list).map(d => { const st = statusOf(d, p.uid); const cls = st.cell || st.key; const tip = `${p.name} · ${d.name}: ${st.label}${st.missing ? ' (missing)' : ''}`;
        return `<td class="cell ${firstOf.has(d.id) ? 'first-of-week' : ''}">${st.s ? `<a class="sq ${cls}" href="#/review/${st.s.id}" title="${esc(tip)}"></a>` : `<span class="sq ${cls}" title="${esc(tip)}"></span>`}</td>`; }).join('')}
      <td class="pct">${x.pct}%</td></tr>`; }).join('')}</tbody>
  </table></div>
  <div class="card-body" style="border-top:1px solid var(--rule-2)"><div class="legend">
    <span><i class="sq approved"></i>Approved</span><span><i class="sq submitted"></i>Submitted, waiting for review</span><span><i class="sq revision"></i>Needs revision</span>
    <span><i class="sq late-sub"></i>Submitted late</span><span><i class="sq missing"></i>Missing (past due)</span><span><i class="sq"></i>Not due yet</span>
  </div></div>`;
}

function vVpmHome(_, qs) {
  setTitle('Dashboard');
  const edFilter = qs.get('ed') || '';
  const all = pledges();
  const ps = edFilter ? all.filter(p => p.educatorUid === edFilter) : all;
  const stats = ps.map(pledgeStats);
  const sum = k => stats.reduce((n, x) => n + x[k], 0);
  const totalCells = S.deliverables.length * ps.length;
  const wk = currentWeek();
  const byWeek = [1, 2, 3, 4, 5, 6, 7, 8].map(n => classProgress(weekDelivs(n)));
  const eds = educators();
  view(`
    <div class="stats">
      ${stat('Pledges', ps.length, `${plural(eds.filter(e => e.role === 'educator').length, 'educator')}`, '', '#/pledges')}
      ${stat('Class completion', `${totalCells ? Math.round(sum('approved') / totalCells * 100) : 0}%`, `${sum('approved')} of ${totalCells} approved`)}
      ${stat('To review', reviewQueue().length, 'Waiting on educators', '', '#/review')}
      ${stat('Needs revision', sum('revision'), 'Waiting on pledges', sum('revision') ? 'warn' : '')}
      ${stat('Missing / late', sum('missing'), 'Past due, not submitted', sum('missing') ? 'alert' : '', '#/pledges?f=missing')}
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-head"><h2>Progress matrix</h2><span class="grow"></span>
        <select class="select" id="edFilter" style="width:auto"><option value="">All educators</option>${eds.map(e => `<option value="${e.uid}" ${e.uid === edFilter ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
      </div>
      ${matrix(ps)}
    </div>
    <div class="cols">
      <div><div class="card"><div class="card-head"><h2>Completion by week</h2></div><div class="card-body">
        <div class="weekbars">${byWeek.map((w, i) => `<a class="wb" href="#/week/${i + 1}" style="text-decoration:none"><b>${w.total ? `${w.pct}%` : '–'}</b><div class="col ${i + 1 === wk ? 'now' : ''}"><i style="height:${w.pct}%"></i></div><small>Wk ${i + 1}</small></a>`).join('')}</div>
      </div></div></div>
      <div><div class="card"><div class="card-head"><h2>Educators</h2><span class="grow"></span><a class="btn sm ghost" href="#/people?tab=staff">Manage</a></div>
        ${eds.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Educator</th><th>Pledges</th><th>To review</th></tr></thead><tbody>
          ${eds.map(e => { const mine = all.filter(p => p.educatorUid === e.uid); const q = reviewQueue().filter(s => mine.some(p => p.uid === s.pledgeUid)).length;
            return `<tr class="click" data-go="#/home?ed=${e.uid}"><td><div class="person"><div class="avatar sm navy">${initials(e.name)}</div><div><b>${esc(e.name)}</b><small>${ROLE_NAME[e.role]}</small></div></div></td><td>${mine.length}</td><td>${q ? `<span class="pill submitted">${q}</span>` : '<span class="muted">0</span>'}</td></tr>`; }).join('')}
        </tbody></table></div>` : '<div class="empty">No educators yet.</div>'}
      </div></div>
    </div>`);
  $('#edFilter').onchange = e => { location.hash = e.target.value ? `#/home?ed=${e.target.value}` : '#/home'; };
}

/* ───────────── pledges list + one pledge ───────────── */

function vPledges(_, qs) {
  setTitle(role() === 'vpm' ? 'Pledges' : 'My pledges');
  const f = qs.get('f') || 'all';
  let list = pledges();
  if (f === 'missing') list = list.filter(p => pledgeStats(p).missing);
  if (f === 'review') list = list.filter(p => pledgeStats(p).review);
  view(`<div class="card"><div class="card-head">
      <div class="tabs">${[['all', 'All'], ['review', 'Has work to review'], ['missing', 'Missing work']].map(([k, l]) => `<button class="${k === f ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
    </div>${pledgeTable(list)}</div>
    ${f === 'missing' ? missingList(list) : ''}`);
  $$('[data-f]').forEach(b => b.onclick = () => { location.hash = b.dataset.f === 'all' ? '#/pledges' : `#/pledges?f=${b.dataset.f}`; });
}
function missingList(list) {
  const rows = list.flatMap(p => S.deliverables.filter(d => statusOf(d, p.uid).key === 'missing').map(d => ({ p, d }))).sort((a, b) => a.d.dueAt.localeCompare(b.d.dueAt));
  return `<div class="card" style="margin-top:20px"><div class="card-head"><h2>Missing deliverables</h2></div>
    ${rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Pledge</th><th>Deliverable</th><th>Week</th><th>Was due</th></tr></thead><tbody>
      ${rows.map(({ p, d }) => `<tr class="click" data-go="#/pledge/${p.uid}"><td>${esc(p.name)}</td><td>${esc(d.name)}</td><td>Week ${d.week}</td><td class="nowrap">${fmtDue(d.dueAt)}</td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">Nothing missing.</div>'}</div>`;
}

function vPledge(uid) {
  const p = byUid(uid);
  if (!p) { location.hash = '#/pledges'; return; }
  setTitle(p.name);
  const x = pledgeStats(p);
  view(`
    <div class="card" style="margin-bottom:20px"><div class="card-body row wrap" style="gap:18px">
      <div class="avatar" style="width:54px;height:54px;font-size:1rem">${initials(p.name)}</div>
      <div class="grow"><h2 class="serif" style="font-size:1.8rem;color:var(--brand);line-height:1.1">${esc(p.name)}</h2>
        <p class="muted small">${[p.email, `Educator: ${byUid(p.educatorUid)?.name || 'not assigned'}`].filter(Boolean).map(esc).join(' · ')}</p></div>
      <div class="row" style="gap:8px">${pill({ key: 'approved', label: `${x.approved} approved` })}${x.review ? pill({ key: 'submitted', label: `${x.review} to review` }) : ''}${x.revision ? pill({ key: 'revision', label: `${x.revision} revision` }) : ''}${x.missing ? pill({ key: 'missing', label: `${x.missing} missing` }) : ''}</div>
    </div></div>
    <div class="card" style="margin-bottom:20px"><div class="card-head"><h2>Scorecard</h2></div>${scorecard(p.uid)}</div>
    <div class="card">${[1, 2, 3, 4, 5, 6, 7, 8].filter(n => weekDelivs(n).length).map(n => `
      <div class="cms-week"><div class="cms-week-head"><b>Week ${n}</b><small>Hole ${n} · ${esc(S.program.weeks[n - 1]?.title || '')}</small></div>
      ${weekDelivs(n).map(d => { const st = statusOf(d, p.uid);
        return `<${st.s ? `a href="#/review/${st.s.id}"` : 'div'} class="cms-row" style="color:inherit;text-decoration:none"><div class="body"><b>${esc(d.name)}</b><small>${st.s ? `Submitted ${ago(st.s.submittedAt)}` : dueInfo(d, true).text}</small></div>${pill(st)}</${st.s ? 'a' : 'div'}>`; }).join('')}
      </div>`).join('') || '<div class="empty">No deliverables yet.</div>'}</div>`);
}

/* ───────────── review queue + review screen ───────────── */

const REVIEW_TABS = [['todo', 'To review', s => s.status === 'submitted'], ['revision', 'Needs revision', s => s.status === 'needs_revision'], ['approved', 'Approved', s => s.status === 'approved'], ['all', 'All', () => true]];
let reviewTab = 'todo';
const reviewList = tab => {
  const test = (REVIEW_TABS.find(t => t[0] === tab) || REVIEW_TABS[0])[2];
  const list = S.submissions.filter(s => deliv(s.deliverableId) && byUid(s.pledgeUid) && test(s));
  return tab === 'todo' ? list.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)) : list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
};

function vReviewList(_, qs) {
  setTitle('Review queue');
  reviewTab = qs.get('tab') || 'todo';
  const list = reviewList(reviewTab);
  view(`<div class="card"><div class="card-head">
      <div class="tabs">${REVIEW_TABS.map(([k, l]) => `<button class="${k === reviewTab ? 'on' : ''}" data-tab="${k}">${l}<span>${reviewList(k).length}</span></button>`).join('')}</div>
      <span class="grow"></span>${reviewTab === 'todo' && list.length ? `<a class="btn primary" href="#/review/${list[0].id}">Start reviewing</a>` : ''}
    </div>${queueList(list, reviewTab === 'todo' ? '<b>All caught up</b>New submissions will show up here.' : 'Nothing here.')}</div>
    ${reviewTab === 'todo' && list.length ? '<p class="small muted" style="margin-top:12px">Tip: press <kbd>A</kbd> to approve, <kbd>R</kbd> to request a revision, and <kbd>J</kbd> / <kbd>K</kbd> to move between submissions. While typing feedback, <kbd>⌘ Enter</kbd> approves and <kbd>⇧ ⌘ Enter</kbd> requests a revision.</p>' : ''}`);
  $$('[data-tab]').forEach(b => b.onclick = () => { location.hash = b.dataset.tab === 'todo' ? '#/review' : `#/review?tab=${b.dataset.tab}`; });
}

async function vReview(id) {
  const s = S.subs[id];
  if (!s || !deliv(s.deliverableId)) { toast('That submission is no longer available.'); location.hash = '#/review'; return; }
  const d = deliv(s.deliverableId), p = byUid(s.pledgeUid);
  const st = statusOf(d, s.pledgeUid);
  setTitle(`Review · ${p?.name || ''}`);
  /* Navigate within the tab the reviewer came from, oldest first for "To review" */
  let list = reviewList(reviewTab);
  if (!list.some(x => x.id === id)) list = [s, ...list];
  const idx = list.findIndex(x => x.id === id);
  const prev = list[idx - 1], next = list[idx + 1];
  const tabs = [...(s.files || []).map((f, i) => ({ key: `f${i}`, label: f.name, f })), ...(s.link ? [{ key: 'link', label: 'Link' }] : [])];
  const reviewed = s.status !== 'submitted';

  view(`<div class="review">
    <div class="viewer">
      <div class="viewer-tabs" id="vTabs">${tabs.map((t, i) => `<button data-vt="${i}" class="${i === 0 ? 'on' : ''}">${esc(t.label)}</button>`).join('')}<span class="grow"></span>
        ${s.files?.length ? `<button id="vOpen" title="Open in a new tab">${I.ext}</button>` : ''}</div>
      <div class="viewer-frame" id="vFrame"></div>
    </div>
    <aside class="rpanel">
      <div class="rpanel-head">
        <div class="rpanel-nav"><a href="#/review${reviewTab === 'todo' ? '' : `?tab=${reviewTab}`}" class="btn sm ghost">${I.left}Queue</a><span class="grow"></span>
          <span>${idx + 1} of ${list.length}</span>
          <a class="icon-btn" ${prev ? `href="#/review/${prev.id}"` : 'aria-disabled="true" style="opacity:.3;pointer-events:none"'} title="Previous (K)">${I.left}</a>
          <a class="icon-btn" ${next ? `href="#/review/${next.id}"` : 'aria-disabled="true" style="opacity:.3;pointer-events:none"'} title="Next (J)">${I.right}</a></div>
        <p class="eyebrow">${weekLabel(d.week)}</p><h2>${esc(d.name)}</h2>
        <div class="who"><div class="avatar sm">${initials(p?.name)}</div><div class="grow"><b>${esc(p?.name || '')}</b><div class="small muted">Submitted ${ago(s.submittedAt)}${d.dueAt ? ` · due ${fmtDue(d.dueAt)}` : ''}</div></div>${pill(st)}</div>
      </div>
      <div class="rpanel-body">
        ${d.instructions ? `<section><details class="instr"><summary>Show instructions</summary><div class="prose">${linkify(d.instructions)}</div></details></section>` : ''}
        ${s.note ? `<section><h4>Note from ${esc(first(p?.name))}</h4><div class="prose">${linkify(s.note)}</div></section>` : ''}
        ${s.link ? `<section><h4>Link</h4><a class="link-row" href="${esc(s.link)}" target="_blank" rel="noopener">${I.link}<span>${esc(s.link)}</span><small>Open</small></a></section>` : ''}
        <section><h4>Activity</h4>${timeline(s)}</section>
      </div>
      <div class="rpanel-foot">
        <textarea class="textarea" id="rComment" placeholder="Feedback for ${esc(first(p?.name))}${reviewed ? '' : ' (optional when approving)'}"></textarea>
        <div class="acts">
          <button class="btn ok" id="rApprove" ${s.status === 'approved' ? 'disabled' : ''}>Approve <kbd>A</kbd></button>
          <button class="btn fix" id="rRevise">Request revision <kbd>R</kbd></button>
        </div>
        <div class="sub"><button class="linkish" id="rComment2">Comment only</button><span>${next ? `Next: ${esc(byUid(next.pledgeUid)?.name || '')} <kbd>J</kbd>` : 'Last one'}</span></div>
      </div>
    </aside></div>`);

  /* File viewer: PDFs and images inline, Office files as a download */
  const frame = $('#vFrame');
  let current = 0;
  const show = async i => {
    current = i;
    $$('#vTabs [data-vt]').forEach(b => b.classList.toggle('on', +b.dataset.vt === i));
    const t = tabs[i];
    if (!t) { frame.innerHTML = `<div class="viewer-msg"><b>No file attached</b>${s.note ? 'See the note on the right.' : ''}</div>`; return; }
    if (t.key === 'link') { frame.innerHTML = `<div class="viewer-msg"><b>Submitted a link</b>${esc(s.link)}<br><a class="btn gold" href="${esc(s.link)}" target="_blank" rel="noopener">${I.ext}Open link</a></div>`; return; }
    frame.innerHTML = '<div class="viewer-msg">Loading…</div>';
    try {
      const url = await fileBlobUrl(t.f.path);
      if (current !== i) return;
      if (/pdf/.test(t.f.type)) frame.innerHTML = `<iframe src="${url}#view=FitH" title="${esc(t.f.name)}"></iframe>`;
      else if (/^image\//.test(t.f.type)) frame.innerHTML = `<img src="${url}" alt="${esc(t.f.name)}">`;
      else frame.innerHTML = `<div class="viewer-msg"><b>${esc(t.f.name)}</b>Office files can't be previewed here.<br><a class="btn gold" href="${url}" download="${esc(t.f.name)}">${I.dl}Download</a></div>`;
    } catch (e) { frame.innerHTML = `<div class="viewer-msg"><b>Couldn't open this file</b>${esc(e.message)}</div>`; }
  };
  $('#vTabs').onclick = e => { const b = e.target.closest('[data-vt]'); if (b) show(+b.dataset.vt); };
  $('#vOpen')?.addEventListener('click', () => tabs[current]?.f && openFile(tabs[current].f.path));
  show(0);

  /* Approve / revise / comment, then move straight to the next submission */
  const act = async action => {
    const comment = $('#rComment').value.trim();
    if (action !== 'approve' && !comment) { $('#rComment').focus(); toast(action === 'revise' ? 'Tell the pledge what to change.' : 'Write a comment first.', true); return; }
    $$('.rpanel-foot .btn').forEach(b => b.disabled = true);
    try {
      const r = await api('POST', `review/${id}`, { action, comment });
      S.submissions[S.submissions.findIndex(x => x.id === id)] = r.submission; indexSubs(); renderShell();
      if (action === 'comment') { toast('Comment added.'); return vReview(id); }
      toast(action === 'approve' ? `Approved ${first(p?.name)}'s ${d.name}.` : `Revision requested from ${first(p?.name)}.`);
      /* Next: the following item in this list, or the oldest one still waiting */
      const after = reviewTab === 'todo' ? reviewList('todo').find(x => x.id !== id && (!next || x.submittedAt >= s.submittedAt)) || reviewList('todo')[0] : next;
      if (after) location.hash = `#/review/${after.id}`;
      else { location.hash = '#/review'; setTimeout(() => toast('All caught up. Nothing else to review.'), 300); }
    } catch (e) { toast(e.message, true); $$('.rpanel-foot .btn').forEach(b => b.disabled = false); }
  };
  $('#rApprove').onclick = () => act('approve');
  $('#rRevise').onclick = () => act('revise');
  $('#rComment2').onclick = () => act('comment');
  document.onkeydown = e => {
    if (e.target.matches('textarea, input, select')) {
      if (e.key === 'Escape') e.target.blur();
      /* In the comment box: ⌘/Ctrl+Enter approves, ⇧⌘/Ctrl+Enter requests a revision */
      if (e.target.id === 'rComment' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); act(e.shiftKey ? 'revise' : 'approve'); }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'a' && s.status !== 'approved') { e.preventDefault(); act('approve'); }
    if (k === 'r') { e.preventDefault(); if ($('#rComment').value.trim()) act('revise'); else { $('#rComment').focus(); toast('Write what to change, then press Request revision.'); } }
    if (k === 'j' && next) location.hash = `#/review/${next.id}`;
    if (k === 'k' && prev) location.hash = `#/review/${prev.id}`;
  };
}

/* ───────────── modal ───────────── */

function modal(title, body, okLabel = 'Save', { danger = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-mclose aria-label="Close">${I.x}</button></div>
    <div class="modal-body">${body}<p class="error" data-err style="margin-top:12px"></p></div>
    <div class="modal-foot">${okLabel ? `<button class="btn" data-mclose>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button>` : '<button class="btn" data-mclose>Close</button>'}</div></div>`;
  document.body.appendChild(wrap);
  const m = { el: wrap, onOk: null, close: () => { wrap.remove(); document.removeEventListener('keydown', onKey, true); } };
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); m.close(); } };
  document.addEventListener('keydown', onKey, true);
  wrap.addEventListener('click', async e => {
    if (e.target === wrap || e.target.closest('[data-mclose]')) return m.close();
    const ok = e.target.closest('[data-ok]');
    if (ok) {
      ok.disabled = true;
      try { if (m.onOk) await m.onOk(); m.close(); }
      catch (err) { $('[data-err]', wrap).textContent = err.message; ok.disabled = false; }
    }
  });
  setTimeout(() => $('input, textarea, select', wrap)?.focus(), 30);
  return m;
}
const confirmBox = (title, text, label = 'Delete') => new Promise(res => {
  const m = modal(title, `<p>${text}</p>`, label, { danger: true });
  m.onOk = () => res(true);
  const close = m.close; m.close = () => { close(); res(false); };
});

/* ───────────── VPM: people & access ───────────── */

function vPeople(_, qs) {
  setTitle('People & access');
  const tab = qs.get('tab') || 'pledges';
  const ps = S.people.filter(p => p.role === 'pledge').sort((a, b) => a.name.localeCompare(b.name));
  const staff = S.people.filter(p => p.role !== 'pledge').sort((a, b) => a.name.localeCompare(b.name));
  const eds = educators();
  const edOptions = sel => `<option value="">Not assigned</option>${eds.map(e => `<option value="${e.uid}" ${e.uid === sel ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}`;
  const roleSel = p => `<select class="select" data-urole="${p.uid}">${['pledge', 'educator', 'vpm'].map(r => `<option value="${r}" ${r === p.role ? 'selected' : ''}>${ROLE_NAME[r]}</option>`).join('')}</select>`;
  const activeBox = p => `<label class="row small" style="gap:6px"><input type="checkbox" data-uactive="${p.uid}" ${p.active !== false ? 'checked' : ''}>Active</label>`;
  const person = p => `<div class="person"><div class="avatar sm ${p.role === 'vpm' ? 'gold' : p.role === 'educator' ? 'navy' : ''}">${initials(p.name)}</div><div><b>${esc(p.name)}</b><small>${esc(p.email || '')}</small></div></div>`;

  const inviteStatus = i => i.usedBy ? `<span class="pill approved">Used by ${esc(i.usedByName || '')}</span>` : i.expiresAt < new Date().toISOString() ? '<span class="pill missing">Expired</span>' : `<span class="pill notstarted">Unused · expires ${fmtDay(i.expiresAt)}</span>`;
  const bodies = {
    pledges: ps.length ? `
      <div class="card-body row wrap" style="border-bottom:1px solid var(--rule-2);gap:8px">
        <span class="small muted">Assign selected to</span><select class="select" id="bulkEd" style="width:auto">${edOptions('')}</select>
        <button class="btn sm primary" id="bulkGo" disabled>Assign</button><span class="small muted" id="bulkCount"></span>
      </div>
      <div class="table-wrap"><table class="t"><thead><tr><th style="width:30px"><input type="checkbox" id="selAll" aria-label="Select all"></th><th>Pledge</th><th>Pledge educator</th><th>Role</th><th></th><th>Joined</th></tr></thead><tbody>
      ${ps.map(p => `<tr><td><input type="checkbox" data-sel="${p.uid}" aria-label="Select ${esc(p.name)}"></td><td>${person(p)}</td><td><select class="select" data-ued="${p.uid}">${edOptions(p.educatorUid)}</select></td><td>${roleSel(p)}</td><td>${activeBox(p)}</td><td class="small muted nowrap">${p.createdAt ? fmtDay(p.createdAt) : ''}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty"><b>No pledges yet</b>Create invite codes for your pledge class in the Invite codes tab.</div>',
    staff: `<div class="table-wrap"><table class="t"><thead><tr><th>Person</th><th>Role</th><th>Pledges assigned</th><th></th></tr></thead><tbody>
      ${staff.map(p => `<tr><td>${person(p)}</td><td>${roleSel(p)}</td><td>${ps.filter(x => x.educatorUid === p.uid).length}</td><td>${activeBox(p)}</td></tr>`).join('')}
      </tbody></table></div>`,
    invites: `
      <div class="card-body" style="border-bottom:1px solid var(--rule-2)">
        <div class="grid2">
          <label class="f"><span>Role</span><select class="select" id="invRole"><option value="pledge">Pledge</option><option value="educator">Pledge Educator</option><option value="vpm">VPM</option></select></label>
          <label class="f" id="invEdWrap"><span>Pledge educator (optional)</span><select class="select" id="invEd">${edOptions('')}</select></label>
          <label class="f full"><span>Names (optional)</span><textarea class="textarea" id="invNames" rows="4" placeholder="One name per line makes one code per person. Leave blank for a single code."></textarea>
            <small>Codes work once and expire after 30 days. People create their own password when they sign up.</small></label>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="invGo">${I.plus}Create codes</button><span class="grow"></span><button class="btn sm" id="invCopyAll">Copy unused codes</button></div>
      </div>
      ${S.invites.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Code</th><th>For</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
        ${S.invites.map(i => `<tr><td><span class="code">${esc(i.id)}</span></td><td>${esc(i.name || '—')}${i.educatorUid ? `<div class="small muted">Educator: ${esc(byUid(i.educatorUid)?.name || '')}</div>` : ''}</td><td>${ROLE_NAME[i.role]}</td><td>${inviteStatus(i)}</td>
          <td class="nowrap" style="text-align:right">${i.usedBy ? '' : `<button class="btn sm" data-copy="${esc(i.id)}">Copy invite</button> <button class="icon-btn" data-revoke="${esc(i.id)}" title="Revoke">${I.trash}</button>`}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">No invite codes yet.</div>'}`,
  };
  view(`<div class="card"><div class="card-head"><div class="tabs">
      ${[['pledges', 'Pledges', ps.length], ['staff', 'Educators & VPMs', staff.length], ['invites', 'Invite codes', S.invites.filter(i => !i.usedBy).length]].map(([k, l, n]) => `<button class="${k === tab ? 'on' : ''}" data-ptab="${k}">${l}<span>${n}</span></button>`).join('')}
    </div></div>${bodies[tab]}</div>`);

  $$('[data-ptab]').forEach(b => b.onclick = () => { location.hash = `#/people?tab=${b.dataset.ptab}`; });
  const patch = async (uid, body, msg) => {
    try { const r = await api('PATCH', `users/${uid}`, body); Object.assign(byUid(uid), r.user); toast(msg); renderShell(); }
    catch (e) { toast(e.message, true); route(); }
  };
  $$('[data-ued]').forEach(s => s.onchange = () => patch(s.dataset.ued, { educatorUid: s.value }, 'Educator updated.'));
  $$('[data-urole]').forEach(s => s.onchange = () => patch(s.dataset.urole, { role: s.value }, 'Role updated.').then(() => route()));
  $$('[data-uactive]').forEach(c => c.onchange = () => patch(c.dataset.uactive, { active: c.checked }, c.checked ? 'Access turned on.' : 'Access turned off.'));

  if (tab === 'pledges' && ps.length) {
    const sel = () => $$('[data-sel]:checked').map(c => c.dataset.sel);
    const sync = () => { const n = sel().length; $('#bulkGo').disabled = !n; $('#bulkCount').textContent = n ? `${n} selected` : ''; };
    $$('[data-sel]').forEach(c => c.onchange = sync);
    $('#selAll').onchange = e => { $$('[data-sel]').forEach(c => c.checked = e.target.checked); sync(); };
    $('#bulkGo').onclick = async () => {
      const ed = $('#bulkEd').value, ids = sel();
      try { for (const uid of ids) { const r = await api('PATCH', `users/${uid}`, { educatorUid: ed }); Object.assign(byUid(uid), r.user); } toast(`Assigned ${plural(ids.length, 'pledge')}.`); route(); }
      catch (e) { toast(e.message, true); route(); }
    };
  }
  if (tab === 'invites') {
    const inviteText = code => `You're invited to the Beta Pi pledge portal. Create your account at ${location.origin}/portal.html with invite code ${code} (it works once).`;
    $('#invRole').onchange = e => { $('#invEdWrap').style.visibility = e.target.value === 'pledge' ? '' : 'hidden'; };
    $('#invGo').onclick = async () => {
      const names = $('#invNames').value.split('\n').map(s => s.trim()).filter(Boolean);
      try {
        const r = await api('POST', 'invites', { role: $('#invRole').value, educatorUid: $('#invEd').value, names });
        S.invites = [...r.invites, ...S.invites];
        toast(`Created ${plural(r.invites.length, 'code')}.`); route();
      } catch (e) { toast(e.message, true); }
    };
    $('#invCopyAll').onclick = () => {
      const open = S.invites.filter(i => !i.usedBy && i.expiresAt > new Date().toISOString());
      navigator.clipboard.writeText(open.map(i => `${i.name || ROLE_NAME[i.role]}: ${i.id}`).join('\n')).then(() => toast(`Copied ${plural(open.length, 'code')}.`));
    };
    $$('[data-copy]').forEach(b => b.onclick = () => navigator.clipboard.writeText(inviteText(b.dataset.copy)).then(() => toast('Invite message copied.')));
    $$('[data-revoke]').forEach(b => b.onclick = async () => {
      if (!await confirmBox('Revoke code?', `Code <b>${esc(b.dataset.revoke)}</b> will stop working.`, 'Revoke')) return;
      try { await api('DELETE', `invites/${b.dataset.revoke}`); S.invites = S.invites.filter(i => i.id !== b.dataset.revoke); toast('Code revoked.'); route(); }
      catch (e) { toast(e.message, true); }
    });
  }
}

/* ───────────── VPM: program CMS ───────────── */

function vCmsProgram() {
  setTitle('Weeks & class');
  const P = JSON.parse(JSON.stringify(S.program));
  view(`
    <div class="card" style="margin-bottom:20px"><div class="card-head"><h2>Pledge class</h2></div><div class="card-body grid2">
      <label class="f"><span>Class name</span><input class="input" id="pClass" value="${esc(P.className)}" placeholder="Fall 2026 Pledge Class"></label>
      <label class="f"><span>Week 1 starts</span><input class="input" type="date" id="pStart" value="${esc(P.startDate)}"><small>Each week runs 7 days from here. The portal highlights the current week.</small></label>
    </div></div>
    <div class="card"><div class="card-head"><h2>The eight weeks</h2><span class="grow"></span><span class="small muted">Week numbers always show; the hole caption is the golf touch.</span></div>
      ${P.weeks.map((w, i) => `<div class="week-editor" data-w="${i}">
        <div><div class="thumb" style="background-image:url('${photo(w.image || PHOTOS[i % PHOTOS.length], 400)}')"><span>Week ${i + 1}</span></div>
          <div class="photo-pick">${PHOTOS.map(id => `<button type="button" data-photo="${id}" class="${(w.image || PHOTOS[i % PHOTOS.length]) === id ? 'on' : ''}" style="background-image:url('${photo(id, 160)}')" aria-label="Use this photo"></button>`).join('')}</div></div>
        <div class="grid2">
          <label class="f"><span>Title</span><input class="input" data-k="title" value="${esc(w.title)}" placeholder="Orientation"></label>
          <label class="f"><span>Hole caption</span><input class="input" data-k="hole" value="${esc(w.hole)}" placeholder="The first tee"></label>
          <label class="f full"><span>Summary</span><textarea class="textarea" data-k="summary" rows="2" placeholder="What this week is about">${esc(w.summary)}</textarea></label>
        </div></div>`).join('')}
    </div>
    <div class="row" style="position:sticky;bottom:16px;margin-top:18px;justify-content:flex-end"><button class="btn primary lg" id="pSave">Save program</button></div>`);
  $('#view').onclick = e => {
    const b = e.target.closest('[data-photo]');
    if (!b) return;
    const ed = b.closest('[data-w]'), i = +ed.dataset.w;
    P.weeks[i].image = b.dataset.photo;
    $$('[data-photo]', ed).forEach(x => x.classList.toggle('on', x === b));
    $('.thumb', ed).style.backgroundImage = `url('${photo(b.dataset.photo, 400)}')`;
  };
  $('#pSave').onclick = async () => {
    P.className = $('#pClass').value; P.startDate = $('#pStart').value;
    $$('[data-w]').forEach(ed => { const i = +ed.dataset.w; $$('[data-k]', ed).forEach(inp => { P.weeks[i][inp.dataset.k] = inp.value; }); });
    try { const r = await api('PUT', 'program', P); S.program = r.program; renderShell(); toast('Program saved.'); }
    catch (e) { toast(e.message, true); }
  };
}

/* Generic list CMS: deliverables, resources, announcements */
async function saveItem(collection, item, id) {
  const r = await api(id ? 'PUT' : 'POST', `items/${collection}${id ? `/${id}` : ''}`, item);
  const key = { deliverables: 'deliverables', resources: 'resources', announcements: 'announcements', portalEvents: 'events' }[collection];
  const i = S[key].findIndex(x => x.id === r.item.id);
  if (i >= 0) S[key][i] = r.item; else S[key].push(r.item);
  if (collection === 'deliverables') S.deliverables.sort((a, b) => a.week - b.week || (a.order || 0) - (b.order || 0) || String(a.dueAt).localeCompare(String(b.dueAt)));
  if (collection === 'announcements') S.announcements.sort((a, b) => (b.pinned === true) - (a.pinned === true) || String(b.createdAt).localeCompare(String(a.createdAt)));
  return r.item;
}
async function deleteItem(collection, id, label) {
  if (!await confirmBox(`Delete ${label}?`, 'This cannot be undone.')) return false;
  await api('DELETE', `items/${collection}/${id}`);
  const key = { deliverables: 'deliverables', resources: 'resources', announcements: 'announcements', portalEvents: 'events' }[collection];
  S[key] = S[key].filter(x => x.id !== id);
  return true;
}
async function uploadResource(file) {
  const fd = new FormData(); fd.append('file', file);
  toast(`Uploading ${file.name}…`);
  return apiUpload('upload', fd);
}
const weekSelect = (id, val, withGeneral) => `<select class="select" id="${id}">${withGeneral ? `<option value="0" ${!val ? 'selected' : ''}>General (all weeks)</option>` : ''}${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${n === +val ? 'selected' : ''}>Week ${n} · ${esc(S.program.weeks[n - 1]?.title || '')}</option>`).join('')}</select>`;

function vCmsDeliverables() {
  setTitle('Deliverables');
  view(`<div class="page-intro row wrap"><p class="grow">Everything pledges turn in, by week. Pledges see changes right away.</p><button class="btn primary" data-add-d="${currentWeek() || 1}">${I.plus}Add deliverable</button></div>
    <div class="card">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => { const list = weekDelivs(n); return `
      <div class="cms-week"><div class="cms-week-head"><b>Week ${n}</b><small>Hole ${n} · ${esc(S.program.weeks[n - 1]?.title || '')}${rangeText(n) ? ` · ${rangeText(n)}` : ''}</small><span class="grow"></span><button class="btn sm ghost" data-add-d="${n}">${I.plus}Add</button></div>
      ${list.map(d => { const c = classProgress([d]); return `<div class="cms-row"><div class="body"><b>${esc(d.name)}</b><small>${d.dueAt ? `Due ${fmtDue(d.dueAt)}` : 'No due date'} · ${c.done}/${pledges().length} approved${d.resources?.length ? ` · ${plural(d.resources.length, 'attachment')}` : ''}</small></div>
        <button class="icon-btn" data-edit-d="${d.id}" title="Edit">${I.edit}</button><button class="icon-btn" data-del-d="${d.id}" title="Delete">${I.trash}</button></div>`; }).join('')}
      </div>`; }).join('')}</div>`);
  $('#view').onclick = async e => {
    const a = e.target.closest('[data-add-d]'); if (a) return deliverableModal(null, +a.dataset.addD);
    const del = e.target.closest('[data-del-d]');
    if (del) { const d = deliv(del.dataset.delD); try { if (await deleteItem('deliverables', d.id, `“${d.name}”`)) { toast('Deliverable deleted.'); route(); } } catch (x) { toast(x.message, true); } }
  };
}

function deliverableModal(id, week) {
  const d = id ? { ...deliv(id) } : { week: week || 1, name: '', instructions: '', dueAt: '', resources: [] };
  if (!id && S.program.startDate) { const r = weekRange(d.week); if (r) { const due = new Date(r[1]); due.setHours(23, 59, 0, 0); d.dueAt = due.toISOString(); } }
  let res = [...(d.resources || [])];
  const m = modal(id ? 'Edit deliverable' : 'Add deliverable', `
    <div class="grid2">
      <label class="f full"><span>Name</span><input class="input" id="dName" value="${esc(d.name)}" placeholder="Professional headshot"></label>
      <label class="f"><span>Week</span>${weekSelect('dWeek', d.week)}</label>
      <label class="f"><span>Due</span><input class="input" type="datetime-local" id="dDue" value="${toLocalInput(d.dueAt)}"></label>
      <label class="f full"><span>Instructions</span><textarea class="textarea" id="dInstr" rows="6" placeholder="What to submit, format, and anything they should know.">${esc(d.instructions)}</textarea></label>
      <div class="full"><span class="f-label">Templates & resources</span><div class="links" id="dRes"></div>
        <div class="row" style="margin-top:8px"><label class="btn sm">${I.upload}Upload file<input type="file" id="dUp" hidden></label><button class="btn sm" id="dAddLink" type="button">${I.link}Add link</button></div></div>
    </div>`, id ? 'Save' : 'Add deliverable');
  const drawRes = () => {
    $('#dRes', m.el).innerHTML = res.map((r, i) => `<div class="link-row">${r.path ? I.file : I.link}<span>${esc(r.name)}</span><button class="icon-btn" data-rm="${i}" type="button" aria-label="Remove">${I.x}</button></div>`).join('') || '<p class="small muted">None yet.</p>';
  };
  drawRes();
  $('#dRes', m.el).onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { res.splice(+b.dataset.rm, 1); drawRes(); } };
  $('#dUp', m.el).onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const r = await uploadResource(f); res.push({ name: r.name, path: r.path }); drawRes(); toast('Attached.'); } catch (x) { toast(x.message, true); }
  };
  $('#dAddLink', m.el).onclick = () => {
    const url = prompt('Link URL'); if (!url) return;
    const name = prompt('Label for this link', 'Template') || url;
    res.push({ name, url: /^https?:\/\//.test(url) ? url : `https://${url}` }); drawRes();
  };
  m.onOk = async () => {
    const due = $('#dDue', m.el).value;
    await saveItem('deliverables', { name: $('#dName', m.el).value, week: +$('#dWeek', m.el).value, dueAt: due ? new Date(due).toISOString() : '', instructions: $('#dInstr', m.el).value, resources: res, order: d.order || 0 }, id);
    toast(id ? 'Deliverable saved.' : 'Deliverable added.'); route();
  };
}

function vCmsResources() {
  setTitle('Resources');
  const groups = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(w => ({ w, list: S.resources.filter(r => (r.week || 0) === w) }));
  view(`<div class="page-intro row wrap"><p class="grow">Guides, templates, and links. Every signed-in member can open them.</p><button class="btn primary" data-add-r>${I.plus}Add resource</button></div>
    <div class="card">${groups.filter(g => g.list.length || g.w === 0).map(g => `<div class="cms-week"><div class="cms-week-head"><b>${g.w ? `Week ${g.w}` : 'General'}</b></div>
      ${g.list.map(r => `<div class="cms-row"><div class="body"><b>${esc(r.title)}</b><small>${r.path ? `File · ${esc(r.fileName || fileName(r.path))}` : esc(r.url)}${r.description ? ` · ${esc(r.description)}` : ''}</small></div>
        <button class="icon-btn" data-edit-r="${r.id}" title="Edit">${I.edit}</button><button class="icon-btn" data-del-r="${r.id}" title="Delete">${I.trash}</button></div>`).join('') || '<div class="cms-row small muted">Nothing here yet.</div>'}</div>`).join('')}</div>`);
  $('#view').onclick = async e => {
    if (e.target.closest('[data-add-r]')) return resourceModal(null);
    const ed = e.target.closest('[data-edit-r]'); if (ed) return resourceModal(S.resources.find(r => r.id === ed.dataset.editR));
    const del = e.target.closest('[data-del-r]');
    if (del) { const r = S.resources.find(x => x.id === del.dataset.delR); try { if (await deleteItem('resources', r.id, `“${r.title}”`)) { toast('Resource deleted.'); route(); } } catch (x) { toast(x.message, true); } }
  };
}
function resourceModal(r) {
  const x = r ? { ...r } : { title: '', week: 0, description: '', url: '', path: '', fileName: '' };
  const m = modal(r ? 'Edit resource' : 'Add resource', `
    <div class="grid2">
      <label class="f full"><span>Title</span><input class="input" id="rTitle" value="${esc(x.title)}" placeholder="Resume template"></label>
      <label class="f"><span>Week</span>${weekSelect('rWeek', x.week, true)}</label>
      <label class="f"><span>Link</span><input class="input" id="rUrl" value="${esc(x.url)}" placeholder="https:// (or upload a file below)"></label>
      <div class="full"><span class="f-label">File</span><div class="row"><span class="small" id="rFile">${x.path ? esc(x.fileName || fileName(x.path)) : '<span class="muted">No file</span>'}</span><span class="grow"></span><label class="btn sm">${I.upload}Upload<input type="file" id="rUp" hidden></label></div></div>
      <label class="f full"><span>Description</span><textarea class="textarea" id="rDesc" rows="2">${esc(x.description)}</textarea></label>
    </div>`, r ? 'Save' : 'Add resource');
  $('#rUp', m.el).onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const u = await uploadResource(f); x.path = u.path; x.fileName = u.name; $('#rFile', m.el).textContent = u.name; if (!$('#rTitle', m.el).value) $('#rTitle', m.el).value = u.name.replace(/\.[^.]+$/, ''); toast('Uploaded.'); } catch (y) { toast(y.message, true); }
  };
  m.onOk = async () => {
    let url = $('#rUrl', m.el).value.trim(); if (url && !/^https?:\/\//.test(url)) url = `https://${url}`;
    if (!url && !x.path) throw new Error('Add a link or upload a file.');
    await saveItem('resources', { title: $('#rTitle', m.el).value, week: +$('#rWeek', m.el).value, description: $('#rDesc', m.el).value, url, path: x.path, fileName: x.fileName }, r?.id);
    toast('Resource saved.'); route();
  };
}

function vCmsAnnouncements() {
  setTitle('Announcements');
  view(`<div class="page-intro row wrap"><p class="grow">Shown on every pledge and educator home page. Pinned ones stay on top.</p><button class="btn primary" data-add-a>${I.plus}New announcement</button></div>
    <div class="card">${S.announcements.length ? `<ul class="feed">${S.announcements.map(a => `<li><div class="txt">${a.pinned ? '<div class="pin">Pinned</div>' : ''}<b>${esc(a.title)}</b><p>${linkify(a.body)}</p><div class="when">${esc(a.author || '')} · ${ago(a.createdAt)}</div></div>
      <div class="row" style="align-items:flex-start"><button class="icon-btn" data-edit-a="${a.id}" title="Edit">${I.edit}</button><button class="icon-btn" data-del-a="${a.id}" title="Delete">${I.trash}</button></div></li>`).join('')}</ul>` : '<div class="empty">No announcements yet.</div>'}</div>`);
  $('#view').onclick = async e => {
    if (e.target.closest('[data-add-a]')) return announcementModal(null);
    const ed = e.target.closest('[data-edit-a]'); if (ed) return announcementModal(S.announcements.find(a => a.id === ed.dataset.editA));
    const del = e.target.closest('[data-del-a]');
    if (del) { try { if (await deleteItem('announcements', del.dataset.delA, 'this announcement')) { toast('Deleted.'); route(); } } catch (x) { toast(x.message, true); } }
  };
}
function announcementModal(a) {
  const m = modal(a ? 'Edit announcement' : 'New announcement', `<div class="stack">
    <label class="f"><span>Title</span><input class="input" id="aTitle" value="${esc(a?.title)}"></label>
    <label class="f"><span>Message</span><textarea class="textarea" id="aBody" rows="6">${esc(a?.body)}</textarea></label>
    <label class="row small"><input type="checkbox" id="aPin" ${a?.pinned ? 'checked' : ''}> Pin to the top</label></div>`, a ? 'Save' : 'Post');
  m.onOk = async () => { await saveItem('announcements', { title: $('#aTitle', m.el).value, body: $('#aBody', m.el).value, pinned: $('#aPin', m.el).checked }, a?.id); toast(a ? 'Saved.' : 'Posted.'); route(); };
}

function eventModal(e, date) {
  const x = e ? { ...e } : { title: '', date: date || isoDay(new Date()), time: '', location: '', kind: 'meeting', details: '', week: 0 };
  const m = modal(e ? 'Edit event' : 'Add event', `<div class="grid2">
    <label class="f full"><span>Title</span><input class="input" id="eTitle" value="${esc(x.title)}" placeholder="Pledge meeting"></label>
    <label class="f"><span>Date</span><input class="input" type="date" id="eDate" value="${esc(x.date)}"></label>
    <label class="f"><span>Time</span><input class="input" id="eTime" value="${esc(x.time)}" placeholder="7:00 PM"></label>
    <label class="f"><span>Kind</span><select class="select" id="eKind">${[['meeting', 'Meeting'], ['event', 'Event'], ['deadline', 'Deadline']].map(([k, l]) => `<option value="${k}" ${k === x.kind ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f"><span>Location</span><input class="input" id="eLoc" value="${esc(x.location)}"></label>
    <label class="f full"><span>Details</span><textarea class="textarea" id="eDetails" rows="3">${esc(x.details)}</textarea></label>
    </div>${e ? `<button class="btn sm danger" id="eDel" style="margin-top:14px">${I.trash}Delete event</button>` : ''}`, e ? 'Save' : 'Add event');
  $('#eDel', m.el)?.addEventListener('click', async () => { m.close(); try { if (await deleteItem('portalEvents', e.id, `“${e.title}”`)) { toast('Event deleted.'); route(); } } catch (y) { toast(y.message, true); } });
  m.onOk = async () => {
    const dateV = $('#eDate', m.el).value;
    const wk = [1, 2, 3, 4, 5, 6, 7, 8].find(n => { const r = weekRange(n); return r && dateV >= isoDay(r[0]) && dateV <= isoDay(r[1]); }) || 0;
    await saveItem('portalEvents', { title: $('#eTitle', m.el).value, date: dateV, time: $('#eTime', m.el).value, kind: $('#eKind', m.el).value, location: $('#eLoc', m.el).value, details: $('#eDetails', m.el).value, week: wk }, e?.id);
    toast('Event saved.'); route();
  };
}
