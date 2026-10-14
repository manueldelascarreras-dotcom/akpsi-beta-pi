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
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
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

const S = { me: null, program: { weeks: [] }, deliverables: [], resources: [], events: [], announcements: [], people: [], submissions: [], invites: [], notes: [], subs: {} };
/* A VPM can preview the portal as any educator or pledge (read-only) */
let viewAs = null;   // { uid, role, name } while previewing
const role = () => viewAs?.role || S.me?.role;
const meUid = () => viewAs?.uid || S.me?.uid;
const meName = () => viewAs?.name || S.me?.name;
/* Preview access: this code opens the portal with a sample class, no account needed.
   Remove it (set to '') once real pledges are using the portal. */
const PREVIEW_CODE = 'TEEOFF26';
let DEMO = false;        // true while browsing the preview (nothing is saved)
const DEMO_WEEKS = [
  ['Orientation', 'The first tee', 'Meet your class, your educators, and what the next eight weeks look like.'],
  ['History & Ritual', 'Learning the course', 'The story of Alpha Kappa Psi and the Beta Pi chapter.'],
  ['Brotherhood', 'Playing as a group', 'Get to know the brothers. One-on-ones and the class project kick off.'],
  ['Professional Development', 'Reading the green', 'Resume, LinkedIn, and your elevator pitch.'],
  ['Service', 'Course care', 'Philanthropy week: suicide prevention awareness.'],
  ['Leadership', 'Calling the shot', 'Lead a class meeting and plan the class event.'],
  ['Chapter Operations', 'The back nine', 'How the chapter runs: committees, budget, and bylaws.'],
  ['Initiation', 'The final green', 'Final review and initiation week.'],
].map(([title, hole, summary]) => ({ title, hole, summary, image: '' }));

function startDemo(as) {
  DEMO = true;
  S.me = { uid: 'demo-vpm', name: 'Preview VPM', role: 'vpm', email: '', active: true };
  S.program = { className: 'Sample pledge class', startDate: '', weeks: DEMO_WEEKS };
  S.invites = [];
  Object.assign(S, buildDemoClass());
  $('#boot').hidden = true; $('#auth').hidden = true; $('#app').hidden = false;
  setViewAs(as === 'vpm' ? '' : `demo:${as}`);
}
function exitDemo() { DEMO = false; location.hash = ''; location.reload(); }

let viewKey = '';        // '' | a person's uid | 'demo:vpm' | 'demo:educator' | 'demo:pledge'
let demoBackup = null;   // the real data, kept aside while the sample class is showing

function setViewAs(key) {
  const demo = key.startsWith('demo:');
  if (DEMO) { /* already on sample data */ }
  else if (demo && !demoBackup) {
    demoBackup = { people: S.people, deliverables: S.deliverables, submissions: S.submissions, program: S.program, announcements: S.announcements, events: S.events, resources: S.resources, notes: S.notes };
    Object.assign(S, buildDemoClass());
  }
  else if (!demo && demoBackup) { Object.assign(S, demoBackup); demoBackup = null; }
  indexSubs();
  viewKey = key;
  const who = demo ? { vpm: null, educator: byUid('demo-edu'), pledge: byUid('demo-p1') }[key.slice(5)] : byUid(key);
  viewAs = who ? { uid: who.uid, role: who.role, name: who.name } : null;
  renderShell();
  location.hash = '#/home'; route();
}

/* A believable pledge class built in the browser for previews. Never sent to the server. */
function buildDemoClass() {
  const start = new Date(); start.setDate(start.getDate() - 17); start.setHours(0, 0, 0, 0);
  const at = (week, day, h = 23, m = 59) => { const d = new Date(start); d.setDate(d.getDate() + 7 * (week - 1) + day); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const plus = (iso, hours) => new Date(Date.parse(iso) + hours * 3600e3).toISOString();
  const edu = { uid: 'demo-edu', name: 'Jordan Reyes', role: 'educator', educatorUid: '', email: 'jordan@example.edu', active: true };
  const names = ['Sofia Alvarez', 'Marcus Chen', 'Olivia Grant', 'Daniel Okafor', 'Priya Patel', 'Ethan Brooks'];
  const pledges = names.map((name, i) => ({ uid: `demo-p${i + 1}`, name, role: 'pledge', educatorUid: 'demo-edu', email: `${name.split(' ')[0].toLowerCase()}@example.edu`, active: true, createdAt: start.toISOString() }));
  const items = [
    [1, 'Introduction bio', 4], [1, 'Professional headshot', 6], [2, 'Chapter history quiz', 5], [2, 'Creed reflection', 6],
    [3, 'Brother one-on-ones (5)', 4], [3, 'Class project proposal', 6], [4, 'Resume review', 5], [4, 'LinkedIn profile', 6],
  ];
  const deliverables = items.map(([week, name, day], i) => ({ id: `demo-d${i + 1}`, week, name, dueAt: at(week, day), order: i, resources: [],
    instructions: `Sample instructions for ${name.toLowerCase()}. Upload a PDF or image, or paste a link.`,
    ...(name === 'Resume review' ? { resources: [{ name: 'Resume template', path: 'demo:Resume template' }] } : {}) }));
  /* Each pledge gets a different pattern: strong, steady, late, missing, revisions */
  const patterns = [
    ['A95', 'A91', 'A88', 'A94', 'S', 'S'], ['A84', 'L', 'R', 'A79', 'S'], ['A90', 'A87', 'M', 'M', 'A92'],
    ['L72', 'M', 'A80', 'M'], ['A97', 'A93', 'A96', 'A90', 'A95', 'R'], ['M', 'M', 'S', 'M'],
  ];
  const submissions = [];
  pledges.forEach((p, pi) => patterns[pi].forEach((code, di) => {
    const d = deliverables[di];
    if (!d || code === 'M') return;
    const lateSub = code.startsWith('L') || code === 'L';
    const submittedAt = lateSub ? plus(d.dueAt, 30 + pi * 6) : plus(d.dueAt, -20 - di);
    const grade = /\d/.test(code) ? Number(code.slice(1)) : null;
    const status = code === 'S' || code === 'L' ? 'submitted' : code === 'R' ? 'needs_revision' : 'approved';
    const history = [{ at: submittedAt, by: p.uid, byName: p.name, action: 'submitted', comment: '' }];
    if (status === 'approved') history.push({ at: plus(submittedAt, 20), by: edu.uid, byName: edu.name, action: 'approved', comment: grade >= 90 ? 'Excellent work.' : 'Good, a few small fixes next time.', ...(grade != null ? { grade } : {}) });
    if (status === 'needs_revision') history.push({ at: plus(submittedAt, 18), by: edu.uid, byName: edu.name, action: 'requested revision', comment: 'Please add more detail and resubmit.' });
    submissions.push({ id: `${d.id}__${p.uid}`, deliverableId: d.id, pledgeUid: p.uid, week: d.week, files: [], note: 'Sample submission (demo data).', link: 'https://example.com',
      status, late: Date.parse(submittedAt) > Date.parse(d.dueAt), submittedAt, firstSubmittedAt: submittedAt, history,
      ...(grade != null ? { grade, gradedByName: edu.name } : {}), ...(status !== 'submitted' ? { reviewedByName: edu.name } : {}) });
  }));
  const weeks = (S.program.weeks?.length ? S.program.weeks : DEMO_WEEKS).map(w => ({ ...w }));
  return {
    program: { className: 'Sample pledge class', startDate: isoDay(start), weeks, ...P_DEFAULTS, heroImage: '' },
    notes: [
      { id: 'demo-n1', pledgeUid: 'demo-p1', by: S.me.uid, byName: S.me.name, byRole: 'vpm', at: plus(at(3, 0, 10, 0), 0), body: 'Great progress so far, Sofia. Focus on polishing your headshot this week. It makes a big difference. Let me know if you want to review your resume before submitting!' },
      { id: 'demo-n2', pledgeUid: 'demo-p2', by: 'demo-edu', byName: 'Jordan Reyes', byRole: 'educator', at: plus(at(2, 6, 9, 0), 0), body: 'Nice recovery on the history quiz. Let\u2019s get the creed reflection in this week.' },
      { id: 'demo-n3', pledgeUid: 'demo-p1', by: 'demo-edu', byName: 'Jordan Reyes', byRole: 'educator', at: plus(at(2, 5, 18, 0), 0), body: 'Your chapter history quiz score shows real improvement. Keep the momentum going into Week 3!' },
    ],
    people: [{ ...S.me }, edu, ...pledges],
    deliverables, submissions,
    announcements: [{ id: 'demo-a1', title: 'Week 3 kickoff', body: 'One-on-ones start this week. The sign-up sheet is in the group chat.', pinned: true, author: S.me.name, createdAt: plus(at(3, 0, 9, 0), 0) }],
    events: [{ id: 'demo-e1', title: 'Pledge meeting', date: isoDay(new Date(Date.parse(at(3, 1)))), time: '7:00 PM', location: 'Herbert Business School', kind: 'meeting', week: 3 },
      { id: 'demo-e2', title: 'Brotherhood dinner', date: isoDay(new Date(Date.parse(at(3, 4)))), time: '8:00 PM', location: 'Coral Gables', kind: 'event', week: 3 }],
    resources: [
      ['Pledge handbook', 0, 'Everything about the program in one place.'], ['Program calendar', 0, 'All eight weeks at a glance.'],
      ['Welcome packet', 1, 'Read before the first meeting.'], ['Beta Pi history packet', 2, 'Study guide for the history quiz.'], ['The AKPsi creed', 2, ''],
      ['One-on-one sign-off sheet', 3, 'Print it and get each brother to sign.'], ['Class project brief', 3, ''],
      ['Resume template', 4, 'Use this format for the resume review.'], ['Elevator pitch guide', 4, '30 seconds: who you are, what you want, why AKPsi.'], ['LinkedIn checklist', 4, ''],
      ['988 Lifeline talking points', 5, ''], ['Running a class meeting', 6, ''], ['Chapter bylaws (summary)', 7, ''], ['Initiation week schedule', 8, ''],
    ].map(([title, week, description], i) => ({ id: `demo-r${i + 1}`, title, week, description, path: `demo:${title}`, fileName: `${title}.pdf` })),
  };
}
const isStaff = () => ['educator', 'vpm'].includes(role());
const byUid = uid => S.people.find(p => p.uid === uid);
const pledges = () => S.people.filter(p => p.role === 'pledge' && p.active !== false && (role() === 'vpm' || (role() === 'pledge' ? p.uid === meUid() : p.educatorUid === meUid()))).sort((a, b) => a.name.localeCompare(b.name));
const educators = () => S.people.filter(p => ['educator', 'vpm'].includes(p.role) && p.active !== false).sort((a, b) => a.name.localeCompare(b.name));
const deliv = id => S.deliverables.find(d => d.id === id);
const indexSubs = () => { S.subs = Object.fromEntries(S.submissions.map(s => [s.id, s])); };
const subFor = (dId, uid) => S.subs[`${dId}__${uid}`];

/* Approved → Needs Revision → Submitted (Late if after the due date). No submission: Late once past due. */
function statusOf(d, uid) {
  const s = subFor(d.id, uid);
  if (s?.status === 'approved') return { key: 'approved', label: s.grade != null ? `Approved · ${s.grade}` : 'Approved', s };
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
  if (DEMO && method !== 'GET') throw new Error('This is the preview with a sample class. Nothing is saved.');
  if (viewAs && method !== 'GET') throw new Error('Preview is read-only. Exit "View as" to make changes.');
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
  if (DEMO) throw new Error('This is the preview with a sample class. Nothing is saved.');
  if (viewAs) throw new Error('Preview is read-only. Exit "View as" to make changes.');
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
  if (path.startsWith('demo:')) { const url = URL.createObjectURL(samplePdf(path.slice(5))); blobCache.set(path, url); return url; }
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

/* ───────────── invite code input ─────────────
 * Ported from 21st.dev "OTP Input" (ddoemonn): one box per character, typing moves forward,
 * paste fills from the start, Backspace walks back, arrows/Home/End move, caret blinks in
 * the active empty box, characters fade in, and the row shakes on an error.
 */
function otpInput(root, { length = 8, group = 4, onComplete } = {}) {
  const ok = c => /^[A-Za-z0-9]$/.test(c);
  const keep = t => [...String(t)].filter(ok).join('').toUpperCase();
  root.innerHTML = Array.from({ length }, (_, i) =>
    `<span class="otp-cell${group && i > 0 && i % group === 0 ? ' gap' : ''}"><input type="text" inputmode="text" maxlength="2" autocomplete="${i ? 'off' : 'one-time-code'}" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-label="Invite code, character ${i + 1} of ${length}"></span>`).join('');
  const cells = $$('input', root);
  const chars = Array(length).fill('');
  const focusAt = i => { const el = cells[Math.max(0, Math.min(length - 1, i))]; el.focus(); el.select(); };
  const paint = () => cells.forEach((el, i) => { el.value = chars[i]; el.parentNode.classList.toggle('filled', !!chars[i]); });
  const commit = () => { paint(); root.classList.remove('error'); if (chars.every(Boolean)) onComplete?.(chars.join('')); };
  const fillFrom = (i, text) => {
    let at = i;
    for (const c of keep(text)) { if (at >= length) break; chars[at] = c; pop(at); at++; }
    commit(); if (at < length) focusAt(at); else cells[length - 1].blur();
  };
  const pop = i => { const c = cells[i].parentNode; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); };
  cells.forEach((el, i) => {
    el.addEventListener('input', () => {
      const raw = keep(el.value.replace(chars[i], '') || el.value);
      if (!raw) { el.value = chars[i]; return; }
      if (raw.length === 1) { chars[i] = raw; pop(i); commit(); if (i < length - 1 && !chars.every(Boolean)) focusAt(i + 1); return; }
      fillFrom(i, raw);
    });
    el.addEventListener('keydown', e => {
      const k = e.key;
      if (k === 'Backspace') { e.preventDefault(); if (chars[i]) chars[i] = ''; else if (i > 0) { chars[i - 1] = ''; focusAt(i - 1); } paint(); }
      else if (k === 'Delete') { e.preventDefault(); chars[i] = ''; paint(); }
      else if (k === 'ArrowLeft') { e.preventDefault(); focusAt(i - 1); }
      else if (k === 'ArrowRight') { e.preventDefault(); focusAt(i + 1); }
      else if (k === 'Home') { e.preventDefault(); focusAt(0); }
      else if (k === 'End') { e.preventDefault(); focusAt(length - 1); }
    });
    el.addEventListener('paste', e => { e.preventDefault(); const t = keep(e.clipboardData.getData('text')); fillFrom(t.length >= length ? 0 : i, t); });
    el.addEventListener('focus', () => {
      const firstEmpty = chars.findIndex(c => !c);
      if (firstEmpty !== -1 && firstEmpty < i) return focusAt(firstEmpty);
      el.select(); el.parentNode.classList.add('active');
    });
    el.addEventListener('blur', () => el.parentNode.classList.remove('active'));
  });
  return { clear: () => { chars.fill(''); paint(); }, error: () => { root.classList.remove('error'); void root.offsetWidth; root.classList.add('error'); } };
}

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
  $$('.modal-wrap').forEach(m => m.remove());
  $('#boot').hidden = true; $('#app').hidden = true; $('#auth').hidden = false;
  const body = $('#authBody');
  const views = {
    signin: `
      <div class="land">
        <img class="land-crest" src="images/crest.png" alt="Alpha Kappa Psi crest">
        <p class="land-greek" aria-hidden="true">ΑΚΨ</p>
        <h1 class="land-title">Beta Pi <em>Pledge Program</em></h1>
        <p class="land-tag">Eight weeks. Eight holes. Enter your code to tee off.</p>
        <div class="otp" id="otp" role="group" aria-label="Access code"></div>
        <p class="otp-msg" id="otpMsg" aria-live="polite">8 characters from your VPM. Paste works too.</p>
        ${PREVIEW_CODE ? `<p class="land-preview">Just looking? Use preview code <button type="button" class="code-chip" id="usePreview">${PREVIEW_CODE}</button></p>` : ''}
        <details class="land-email" ${msg ? 'open' : ''}><summary>Already have an account? <b>Sign in with email</b></summary>
          <form id="aForm" novalidate>
            <label class="f"><span>Email</span><input class="input" type="email" name="email" autocomplete="email" placeholder="you@miami.edu" required></label>
            <label class="f"><span class="row">Password<span class="grow"></span><button type="button" class="linkish" data-auth="reset">Forgot password?</button></span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
            <p class="error" id="aErr" role="alert">${esc(msg)}</p>
            <button class="btn primary" type="submit">Sign in</button>
          </form>
        </details>
      </div>`,
    preview: `
      <div class="land">
        <img class="land-crest sm" src="images/crest.png" alt="">
        <h1 class="land-title">Preview the <em>portal</em></h1>
        <p class="land-tag">You're in with the preview code. Pick whose view to see. It uses a sample pledge class and nothing is saved.</p>
        <div class="role-pick">
          <button type="button" data-preview="pledge"><b>Pledge</b><span>Turn in work, see materials, grades, and feedback</span></button>
          <button type="button" data-preview="educator"><b>Pledge educator</b><span>Review and grade your pledges' work</span></button>
          <button type="button" data-preview="vpm"><b>VPM</b><span>Run the program: classwork, people, progress, grades</span></button>
        </div>
        <p class="auth-alt"><button data-auth="signin">Back</button></p>
      </div>`,
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
  body.innerHTML = (['signin', 'preview'].includes(mode) ? '' : '<p class="greek" aria-hidden="true">ΑΚΨ</p>') + views[mode] + demo;
  $$('[data-demo]', body).forEach(b => b.onclick = async () => {
    b.disabled = true;
    try { if (auth.currentUser) await auth.signOut(); await auth.signInWithEmailAndPassword(b.dataset.demo, 'emulator-only-123'); location.hash = '#/home'; }
    catch (x) { b.disabled = false; $('#aErr') && ($('#aErr').textContent = `${authError(x)} Run node scripts/seed-emulator.js first.`); }
  });
  const form = $('#aForm');
  setTimeout(() => (prefill.code ? form?.querySelector('[name=name]') : mode === 'signin' ? $('#otp input') : form?.querySelector('input'))?.focus(), 30);
  $('#usePreview')?.addEventListener('click', () => showAuth('preview'));
  $$('[data-preview]', body).forEach(b => b.onclick = () => startDemo(b.dataset.preview));
  /* Invite code below sign-in: a full code carries straight into account creation */
  if ($('#otp')) otpInput($('#otp'), {
    length: 8,
    onComplete: code => {
      $('#otp').classList.add('done');
      if (PREVIEW_CODE && code === PREVIEW_CODE) { $('#otpMsg').textContent = 'Preview code accepted.'; return setTimeout(() => showAuth('preview'), 300); }
      $('#otpMsg').textContent = 'Code entered. Setting up your account…';
      setTimeout(() => showAuth('signup', '', { code }), 350);
    },
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
  if (DEMO) return;
  if (!user) { S.me = null; return showAuth('signin'); }
  load();
});

async function load() {
  $$('.modal-wrap').forEach(m => m.remove()); closeDrawer();
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
  pledge: [['home', 'Home', I.home], ['classwork', 'Classwork', I.list], ['feedback', 'Caddie Notes', I.megaphone], ['calendar', 'Calendar', I.cal], ['grades', 'Grades', I.flag], ['people', 'People', I.users]],
  educator: [['home', 'Home', I.home], ['classwork', 'Classwork', I.list], ['review', 'To review', I.inbox, 'queue'], ['pledges', 'My pledges', I.users], ['feedback', 'Caddie Notes', I.megaphone], ['grades', 'Grades & lateness', I.flag], ['calendar', 'Calendar', I.cal], ['people', 'People', I.users]],
  vpm: [['home', 'Home', I.home], ['classwork', 'Classwork', I.list], ['review', 'To review', I.inbox, 'queue'], ['progress', 'Class progress', I.grid], ['feedback', 'Caddie Notes', I.megaphone], ['grades', 'Grades & lateness', I.flag], ['calendar', 'Calendar', I.cal], '—Manage', ['people', 'People & access', I.users], ['cms/program', 'Weeks & class', I.flag]],
};
const ROLE_NAME = { pledge: 'Pledge', educator: 'Pledge Educator', vpm: 'VPM' };
const visibleSub = s => role() === 'vpm' || (role() === 'pledge' ? s.pledgeUid === meUid() : pledges().some(p => p.uid === s.pledgeUid));
const reviewQueue = () => S.submissions.filter(s => s.status === 'submitted' && deliv(s.deliverableId) && visibleSub(s)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

function renderShell() {
  const items = NAV[role()] || [];
  const q = reviewQueue().length;
  $('#sideNav').innerHTML = items.map(it => typeof it === 'string'
    ? `<div class="group">${it.slice(1)}</div>`
    : `<a href="#/${it[0]}" data-nav="${it[0]}">${it[2]}<span>${it[1]}</span>${it[3] === 'queue' && q ? `<span class="count">${q}</span>` : ''}</a>`).join('');
  /* VPMs get a "View as" switcher: real people, or a sample class that lives only in the browser */
  const real = demoBackup ? demoBackup.people : S.people;
  const opt = (v, label) => `<option value="${v}" ${viewKey === v ? 'selected' : ''}>${esc(label)}</option>`;
  const demoCur = viewAs ? viewAs.role : 'vpm';
  const viewAsBox = DEMO ? `<label class="view-as"><span>View as</span><select id="demoAs">${[['pledge', 'Pledge'], ['educator', 'Pledge educator'], ['vpm', 'VPM']].map(([k, l]) => `<option value="${k}" ${demoCur === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`
    : S.me.role === 'vpm' ? `<label class="view-as"><span>View as</span><select id="viewAs">
      ${opt('', 'Myself (VPM)')}
      <optgroup label="Sample class (demo data)">${opt('demo:vpm', 'VPM dashboard')}${opt('demo:educator', 'Pledge educator')}${opt('demo:pledge', 'Pledge')}</optgroup>
      ${real.some(p => p.role === 'educator' && p.active !== false) ? `<optgroup label="Pledge educators">${real.filter(p => p.role === 'educator' && p.active !== false).map(p => opt(p.uid, p.name)).join('')}</optgroup>` : ''}
      ${real.some(p => p.role === 'pledge' && p.active !== false) ? `<optgroup label="Pledges">${real.filter(p => p.role === 'pledge' && p.active !== false).sort((x, y) => x.name.localeCompare(y.name)).map(p => opt(p.uid, p.name)).join('')}</optgroup>` : ''}
    </select></label>` : '';
  /* In the preview, the sidebar shows whoever is being previewed */
  const shownName = DEMO && viewAs ? viewAs.name : S.me.name, shownRole = DEMO ? role() : S.me.role;
  $('#sideUser').innerHTML = `${viewAsBox}<div class="side-me">
    <div class="avatar ${shownRole === 'vpm' ? 'gold' : shownRole === 'educator' ? 'navy' : ''}">${initials(shownName)}</div>
    <div class="who"><b>${esc(shownName)}</b><small>${ROLE_NAME[shownRole]}${DEMO ? ' · preview' : ''}</small></div>
    <button class="icon-btn" data-auth="signout" title="${DEMO ? 'Exit preview' : 'Sign out'}" aria-label="${DEMO ? 'Exit preview' : 'Sign out'}">${I.out}</button></div>`;
  const sel = $('#viewAs');
  if (sel) sel.onchange = () => setViewAs(sel.value);
  const dsel = $('#demoAs');
  if (dsel) dsel.onchange = () => setViewAs(dsel.value === 'vpm' ? '' : `demo:${dsel.value}`);
  $('#previewBar').hidden = true;
  if (DEMO) $('#sideUser').querySelector('[data-auth="signout"]')?.addEventListener('click', e => { e.stopPropagation(); exitDemo(); }, true);
  const wk = currentWeek();
  $('#topWeek').innerHTML = wk === 0
    ? `<span class="lbl">${esc(S.program.className)} ·</span> <b>Starts ${fmtDay(S.program.startDate + 'T00:00')}</b>`
    : `<span class="flag"></span><span class="lbl">${esc(S.program.className)} ·</span> <b>Week ${wk}</b><span class="lbl muted">· Hole ${wk}</span>`;
}

const ROUTES = {
  pledge: { feedback: vFeedback, home: vStream, classwork: vClasswork, calendar: vCalendar, grades: vMyGrades, people: vClassPeople, program: vProgram, week: vWeek, resources: vResources, overview: vPledgeHome },
  educator: { feedback: vFeedback, home: vStream, classwork: vClasswork, review: vReviewList, pledges: vPledges, pledge: vPledge, grades: vGrades, calendar: vCalendar, people: vClassPeople, program: vProgram, week: vWeek, resources: vResources, dashboard: vEducatorHome },
  vpm: { feedback: vFeedback, home: vStream, classwork: vClasswork, review: vReviewList, progress: vVpmHome, pledges: vPledges, pledge: vPledge, grades: vGrades, people: vPeople, calendar: vCalendar, program: vProgram, week: vWeek, resources: vResources,
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
  const navKey = parts[0] === 'week' ? 'classwork' : parts[0] === 'pledge' ? 'pledges' : parts[0] === 'cms' ? path : parts[0];
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

/* ───────────── Classroom pages ─────────────
 * Stream (announcements + what's due), Classwork (Weeks 1–8 as topics, with
 * assignments and materials), Grades, People. Modeled on Google Classroom.
 */

/* A simple one-page PDF so preview materials open like real files */
function samplePdf(title) {
  const lines = [title, '', 'Beta Pi pledge program - sample material', '', 'This is placeholder content for the preview.', 'Your VPM uploads the real file in Classwork.'];
  const text = lines.map((l, i) => `BT /F1 ${i ? 13 : 24} Tf 72 ${720 - i * 26} Td (${l.replace(/[()\\]/g, '')}) Tj ET`).join('\n');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}

const isPdfPath = p => /\.pdf$/i.test(p || '') || String(p || '').startsWith('demo:');
const isImgPath = p => /\.(png|jpe?g|webp|gif)$/i.test(p || '');
const canEdit = () => role() === 'vpm' && !viewAs && !DEMO || (DEMO && role() === 'vpm');

/* ───────────── Home: welcome hero, 8-hole tracker, Caddie Notes ───────────── */

const HERO_DEFAULT = 'images/portal/hero-fairway.jpg';
const P_DEFAULTS = { programName: 'Pledge Education Program', subtitle: 'A stronger you', tagline: 'Keep showing up. Different looks good on you.', quote: 'Discipline today builds the leaders of tomorrow.' };
const prog = k => S.program[k] || P_DEFAULTS[k] || '';
const heroImage = () => S.program.heroImage ? photo(S.program.heroImage, 1800) : HERO_DEFAULT;

/* One entry per hole: done / current / upcoming, plus a % for staff */
function holeStates() {
  const wk = currentWeek();
  const today = isoDay(new Date());
  return [1, 2, 3, 4, 5, 6, 7, 8].map(n => {
    const list = weekDelivs(n);
    let pct, done;
    if (role() === 'pledge') {
      const ok = list.filter(d => statusOf(d, meUid()).key === 'approved').length;
      const r = weekRange(n);
      done = list.length ? ok === list.length : Boolean(r && isoDay(r[1]) < today);
      pct = list.length ? Math.round(ok / list.length * 100) : (done ? 100 : 0);
    } else {
      pct = classProgress(list).pct;
      done = list.length > 0 && pct === 100;
    }
    return { n, title: S.program.weeks[n - 1]?.title || `Week ${n}`, done, current: n === wk, pct, count: list.length };
  });
}

function holeTracker() {
  const holes = holeStates();
  const staff = role() !== 'pledge';
  const completed = holes.filter(h => h.done).length;
  const overall = staff ? classProgress(S.deliverables).pct : Math.round(completed / 8 * 100);
  return `<section class="program-banner">
    <div class="pb-left">
      <p class="eyebrow">${staff ? 'Your class' : 'Your program'}</p>
      <h2>${esc(prog('programName'))}</h2>
      <p class="pb-meta">8 weeks <i></i> 8 holes <i></i> ${esc(prog('subtitle'))}</p>
      <div class="pb-progress"><div class="pb-bar"><span style="width:${overall}%"></span></div>
        <b>${staff ? `${overall}% of class work approved` : `${completed} of 8 completed`}</b></div>
    </div>
    <ol class="holes-track" aria-label="Eight holes">
      ${holes.map(h => `<li class="${h.done ? 'done' : ''} ${h.current ? 'current' : ''}">
        <a href="#/week/${h.n}" title="Week ${h.n}: ${esc(h.title)}${staff ? ` · ${h.pct}% approved` : ''}">
          ${h.current ? '<span class="ht-flag" aria-hidden="true"></span>' : ''}
          <span class="ht-dot">${h.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' : h.n}</span>
          <b>${h.n}</b><span class="ht-name">${esc(h.title)}</span>
          ${staff && h.count ? `<span class="ht-pct">${h.pct}%</span>` : ''}
        </a></li>`).join('')}
    </ol>
  </section>`;
}

/* Feedback a pledge has received: personal notes + comments left while reviewing */
function caddieNotesFor(uid) {
  const fromNotes = (S.notes || []).filter(n => !uid || n.pledgeUid === uid).map(n => ({ at: n.at, by: n.by, name: n.byName, role: n.byRole, body: n.body, pledgeUid: n.pledgeUid, id: n.id, kind: 'note' }));
  const fromReviews = S.submissions.filter(s => (!uid || s.pledgeUid === uid) && visibleSub(s)).flatMap(s => (s.history || [])
    .filter(h => h.by !== s.pledgeUid && h.comment)
    .map(h => ({ at: h.at, by: h.by, name: h.byName, role: byUid(h.by)?.role || 'educator', body: h.comment, pledgeUid: s.pledgeUid, about: deliv(s.deliverableId)?.name, grade: h.grade, deliverableId: s.deliverableId, kind: 'review' })));
  return [...fromNotes, ...fromReviews].sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
const notesSeenKey = () => `bp-notes-seen-${meUid()}`;
const notesSeen = () => { try { return localStorage.getItem(notesSeenKey()) || ''; } catch { return ''; } };
const markNotesSeen = () => { try { localStorage.setItem(notesSeenKey(), new Date().toISOString()); } catch {} };
const roleLine = r => r === 'vpm' ? 'VPM' : r === 'educator' ? 'Pledge Educator' : ROLE_NAME[r] || '';

function noteItem(n, { showPledge = false } = {}) {
  return `<li class="cn-item">
    <div class="avatar ${n.role === 'vpm' ? 'gold' : 'navy'}">${initials(n.name)}</div>
    <div class="grow">
      <b>${esc(n.name)}</b><span class="cn-role">${roleLine(n.role)}${showPledge ? ` → ${esc(byUid(n.pledgeUid)?.name || '')}` : ''}${n.about ? ` · on ${esc(n.about)}` : ''}${n.grade != null ? ` · ${n.grade}/100` : ''}</span>
      <p class="cn-bubble">${linkify(n.body)}</p>
      <span class="cn-when">${ago(n.at)}</span>
    </div></li>`;
}

function caddieCard() {
  const pledge = role() === 'pledge';
  const list = caddieNotesFor(pledge ? meUid() : null);
  const seen = notesSeen();
  const fresh = pledge ? list.filter(n => n.at > seen).length : 0;
  return `<section class="caddie">
    <div class="cn-head"><span class="flag" aria-hidden="true"></span><h3>Caddie Notes</h3>${fresh ? `<span class="cn-new">${fresh} new</span>` : ''}</div>
    ${list.length ? `<ul>${list.slice(0, 3).map(n => noteItem(n, { showPledge: !pledge })).join('')}</ul>`
      : `<p class="cn-empty">${pledge ? 'Notes from your pledge educator and VPMs will show up here.' : 'Notes you and other educators send pledges show up here.'}</p>`}
    <a class="cn-all" href="#/feedback">View all feedback →</a>
  </section>`;
}

function vFeedback() {
  setTitle(role() === 'pledge' ? 'Caddie Notes' : 'Feedback');
  const pledge = role() === 'pledge';
  const list = caddieNotesFor(pledge ? meUid() : null);
  if (pledge) markNotesSeen();
  view(`<div class="page-intro row wrap"><p class="grow">${pledge ? 'Every note and comment from your pledge educator and VPMs, newest first.' : 'Notes and review comments sent to your pledges, newest first.'}</p>
      ${!pledge ? `<button class="btn primary" id="newNote">${I.plus}Send a caddie note</button>` : ''}</div>
    <section class="caddie caddie-page">${list.length ? `<ul>${list.map(n => noteItem(n, { showPledge: !pledge })).join('')}</ul>` : '<p class="cn-empty">No feedback yet.</p>'}</section>`);
  $('#newNote')?.addEventListener('click', () => noteModal(null));
}

/* VPMs and educators send a personal note to a pledge */
function noteModal(pledgeUid) {
  const options = pledges();
  if (!options.length) return toast('No pledges to send a note to yet.', true);
  const m = modal('Send a caddie note', `<div class="stack">
    <label class="f"><span>To</span><select class="select" id="nTo">${options.map(p => `<option value="${p.uid}" ${p.uid === pledgeUid ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="f"><span>Note</span><textarea class="textarea" id="nBody" rows="5" placeholder="Great progress so far. Focus on polishing your headshot this week."></textarea>
      <small>Shows up in their Caddie Notes on the home page.</small></label></div>`, 'Send note');
  m.onOk = async () => {
    const r = await api('POST', 'notes', { pledgeUid: $('#nTo', m.el).value, body: $('#nBody', m.el).value });
    S.notes = [r.note, ...(S.notes || [])];
    toast(`Note sent to ${first(byUid(r.note.pledgeUid)?.name)}.`); route();
  };
}

/* ── Stream ── */
function vStream() {
  const wk = currentWeek() || 1;
  const W = S.program.weeks[wk - 1] || {};
  setTitle('Home');
  const pledge = role() === 'pledge';
  const nowIso = new Date().toISOString();
  const upcoming = S.deliverables.filter(d => d.dueAt && d.dueAt >= nowIso && (!pledge || !['approved', 'submitted', 'late'].includes(statusOf(d, meUid()).key)))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 4);
  const posts = [
    ...S.announcements.map(a => ({ at: a.createdAt, html: `<article class="post${a.pinned ? ' pinned' : ''}">
      <div class="post-head"><div class="avatar sm gold">${initials(a.author)}</div><div class="grow"><b>${esc(a.author || 'VPM')}</b><span>${ago(a.createdAt)}${a.pinned ? ' · Pinned' : ''}</span></div>
      ${canEdit() ? `<button class="icon-btn" data-edit-a="${a.id}" title="Edit">${I.edit}</button>` : ''}</div>
      <h3>${esc(a.title)}</h3><p>${linkify(a.body)}</p></article>`, pin: a.pinned })),
    ...(false ? S.submissions.filter(s => s.pledgeUid === meUid()).flatMap(s => (s.history || []).filter(h => h.by !== meUid() && h.action !== 'commented' || (h.by !== meUid() && h.comment)).map(h => ({ at: h.at, html: `<article class="post post-mini" data-open-d="${s.deliverableId}">
      <div class="post-icon ${h.action === 'approved' ? 'ok' : 'fix'}">${h.action === 'approved' ? '✓' : '↺'}</div>
      <div class="grow"><b>${esc(h.byName)}</b> ${esc(h.action)} <b>${esc(deliv(s.deliverableId)?.name || '')}</b>${h.grade != null ? ` · ${h.grade}/100` : ''}${h.comment ? `<p>${linkify(h.comment)}</p>` : ''}<span>${ago(h.at)}</span></div></article>` }))) : []),
    ...(!pledge ? S.submissions.filter(s => visibleSub(s) && deliv(s.deliverableId)).map(s => ({ at: s.submittedAt, html: `<a class="post post-mini" href="#/review/${s.id}">
      <div class="post-icon">${I.file}</div><div class="grow"><b>${esc(byUid(s.pledgeUid)?.name || '')}</b> turned in <b>${esc(deliv(s.deliverableId).name)}</b>${s.late ? ' <span class="late-text">· late</span>' : ''}<span>${ago(s.submittedAt)}</span></div></a>` })) : []),
  ].sort((a, b) => (b.pin === true) - (a.pin === true) || String(b.at).localeCompare(String(a.at))).slice(0, 14);

  view(`
    <section class="hero-welcome" style="background-image:url('${heroImage()}')">
      <div class="hw-copy"><p class="eyebrow light">${weekLabel(wk)} · ${esc(W.title || '')}</p>
        <h1>Welcome back, ${esc(first(meName()))}.</h1><p>${esc(prog('tagline'))}</p></div>
      ${prog('quote') ? `<blockquote class="hw-quote">${esc(prog('quote'))}</blockquote>` : ''}
    </section>
    ${holeTracker()}
    <div class="stream">
      <aside class="stream-side">
        ${caddieCard()}
        ${pledge ? '' : `<div class="side-card"><h4>Upcoming</h4>
          ${upcoming.length ? upcoming.map(d => `<button class="up-item" data-open-d="${d.id}"><span>Due ${fmt(d.dueAt, { weekday: 'short', month: 'short', day: 'numeric' })}</span>${esc(d.name)}</button>`).join('') : `<p class="muted small">${pledge ? 'Woohoo, nothing due soon.' : 'No upcoming due dates.'}</p>`}
          <a class="side-link" href="#/classwork">View all</a></div>`}
        ${!pledge ? `<div class="side-card"><h4>To review</h4><p class="side-big">${reviewQueue().length}</p><a class="side-link" href="#/review">Open review queue</a></div>` : ''}
      </aside>
      <div class="stream-main">
        ${pledge ? (() => { const order = { revision: 0, missing: 1, notstarted: 2, late: 3, submitted: 4 };
          const open = S.deliverables.map(d => ({ d, st: statusOf(d, meUid()) })).filter(x => x.st.key !== 'approved')
            .sort((a, b) => order[a.st.key] - order[b.st.key] || String(a.d.dueAt || '9').localeCompare(String(b.d.dueAt || '9')));
          return `<section class="card upnext"><div class="card-head"><h2>Up next</h2><span class="grow"></span><a class="btn sm ghost" href="#/classwork">All classwork</a></div>
            ${open.length ? `<ul class="dlist">${open.slice(0, 5).map(x => ditem(x.d)).join('')}</ul>` : '<div class="empty"><b>All caught up</b>Everything assigned so far is approved.</div>'}</section>`; })() : ''}
        ${canEdit() ? `<button class="composer" id="announce"><div class="avatar sm gold">${initials(meName())}</div><span>Announce something to your class</span></button>` : ''}
        ${posts.length ? posts.map(p => p.html).join('') : '<div class="empty">This is where announcements and feedback show up.</div>'}
      </div>
    </div>`);
  $('#announce')?.addEventListener('click', () => announcementModal(null));
  $('#view').onclick = e => { const ed = e.target.closest('[data-edit-a]'); if (ed) announcementModal(S.announcements.find(a => a.id === ed.dataset.editA)); };
}

/* ── Classwork ── */
let cwTopic = '';   // '' = this week's hole, '1'–'8' = a hole, '0' = hole 9 / the clubhouse (general resources)

/* Beta Pi National: a 9-hole, par-36 course on an aerial photo (images/portal/course.jpg).
 * Holes 1–8 are the weeks; hole 9 finishes by the clubhouse and holds the general resources.
 * at = the flag on each green, as % of the photo's width and height. */
const HOLES = [
  { par: 4, yds: 385, hcp: 3, at: [14.9, 9.1], note: 'Opening par 4 along the tree line. Favor the left side; sand guards the right.' },
  { par: 3, yds: 165, hcp: 9, at: [52.1, 12.9], note: 'Short iron to a wide green. The easiest hole on the card.' },
  { par: 5, yds: 520, hcp: 1, at: [82.1, 18.5], note: 'The toughest hole: three shots with water down the right.' },
  { par: 4, yds: 410, hcp: 5, at: [38.4, 30.6], note: 'An island green ringed by water. Commit to the club.' },
  { par: 3, yds: 175, hcp: 8, at: [79.4, 36.4], note: 'Over the lake to a green with bunkers front and right.' },
  { par: 5, yds: 535, hcp: 2, at: [12.7, 41.9], note: 'The longest walk on the course. Lay up short of the creek.' },
  { par: 4, yds: 395, hcp: 4, at: [33.2, 56.9], note: 'Water left, bunkers right. Accuracy over distance.' },
  { par: 4, yds: 370, hcp: 6, at: [62.1, 63.9], note: 'A gentle dogleg around the lake toward the clubhouse.' },
  { par: 4, yds: 350, hcp: 7, at: [70.7, 78.5], note: 'The finishing hole, in full view of the clubhouse.' },
];
const COURSE_PAR = HOLES.reduce((a, h) => a + h.par, 0);
const COURSE_YDS = HOLES.reduce((a, h) => a + h.yds, 0);
const CLUBHOUSE_AT = [92.1, 70.3];

function courseMap(sel) {
  const states = holeStates();
  const pins = HOLES.map((h, i) => {
    const n = i + 1, st = n <= 8 ? states[i] : { done: false, current: false };
    const topic = n === 9 ? '0' : String(n), on = topic === sel;
    return `<button type="button" class="pin ${st.done ? 'done' : ''} ${st.current ? 'current' : ''} ${on ? 'on' : ''} ${h.at[0] > 72 ? 'flip' : ''}"
        style="left:${h.at[0]}%;top:${h.at[1]}%" data-topic="${topic}"
        aria-label="Hole ${n}, par ${h.par}${n <= 8 ? `, Week ${n}: ${esc(st.title)}` : ', general resources'}${st.done ? ', complete' : st.current ? ', this week' : ''}">
      <span class="pin-n">${st.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' : n}</span>
      <span class="pin-t"><b>Hole ${n}</b><i>${n <= 8 ? (st.current ? 'This week' : `Week ${n}`) : 'Resources'}</i></span>
    </button>`;
  }).join('');
  return `<div class="course-photo">
    <img src="images/portal/course.jpg" srcset="images/portal/course-sm.jpg 900w, images/portal/course.jpg 1700w" sizes="(max-width: 860px) 100vw, 1100px"
      width="1700" height="1269" alt="Aerial view of Beta Pi National: nine golf holes among lakes and pines, with the ΑΚΨ clubhouse at the lower right">
    ${pins}
    <button type="button" class="pin club ${sel === '0' ? 'on' : ''}" style="left:${CLUBHOUSE_AT[0]}%;top:${CLUBHOUSE_AT[1]}%" data-topic="0" aria-label="Clubhouse: general resources">
      <span class="pin-t"><b>Clubhouse</b><i>General resources</i></span></button>
  </div>`;
}
/* A zoomed crop of the photo centered on one hole */
function flyover(n) {
  const [x, y] = HOLES[n - 1].at, s = 3.2;
  const pos = v => Math.min(100, Math.max(0, ((v / 100) * s - .5) / (s - 1) * 100)).toFixed(1);
  return `<div class="hc-flyover" style="background-image:url('images/portal/course.jpg');background-size:${s * 100}% auto;background-position:${pos(x)}% ${pos(y + 4)}%" role="img" aria-label="Close-up of hole ${n}"><span class="hc-tag">Hole ${n} flyover</span></div>`;
}

/* A pledge's result on a hole, in golf terms */
function holeResult(n) {
  const list = weekDelivs(n);
  if (!list.length) return { label: '—', tone: '' };
  const st = list.map(d => statusOf(d, meUid()));
  if (st.every(x => x.key === 'approved')) {
    const late = st.some(x => x.s?.late), grades = st.map(x => x.s?.grade).filter(g => g != null);
    const avg = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    if (!late && grades.length === st.length && avg >= 95) return { label: 'Eagle', tone: 'eagle' };
    return late ? { label: 'Par', tone: 'par' } : { label: 'Birdie', tone: 'birdie' };
  }
  if (st.some(x => x.key === 'missing')) return { label: 'Bogey', tone: 'bogey' };
  return { label: 'In play', tone: '' };
}

function vClasswork() {
  setTitle('Classwork');
  const wk = currentWeek() || 1;
  const sel = cwTopic || String(wk);
  const pledgeView = role() === 'pledge';
  const shot = d => {
    let right;
    if (pledgeView) right = pill(statusOf(d, meUid()));
    else { const ps = pledges(); const turned = ps.filter(p => subFor(d.id, p.uid)).length; right = `<span class="cw-count"><b>${turned}</b>/${ps.length} turned in</span>`; }
    return `<div class="cw-item" data-open-d="${d.id}"><span class="cw-icon asg">${I.list}</span>
      <div class="grow"><b>${esc(d.name)}</b><span>${d.dueAt ? `Due ${fmtDue(d.dueAt)}` : 'No due date'}</span></div>${right}
      ${canEdit() ? `<button class="icon-btn" data-edit-d="${d.id}" title="Edit">${I.edit}</button>` : ''}</div>`;
  };
  const note = r => `<button type="button" class="yardage" data-mat="${r.id}">
      <span class="yd-icon">${I.book}</span><span class="grow"><b>${esc(r.title)}</b><span>${r.path ? (isPdfPath(r.path) ? 'PDF' : 'File') : 'Link'}${r.description ? ` · ${esc(r.description)}` : ''}</span></span>
      <span class="yd-open">Open</span>${canEdit() ? `<span class="icon-btn" data-edit-r="${r.id}" title="Edit" role="button">${I.edit}</span>` : ''}</button>`;
  const createBtn = canEdit() ? `<div class="create-wrap"><button class="btn primary sm" id="cwCreate">${I.plus}Create</button>
      <div class="create-menu" id="cwMenu" hidden><button data-make="asg">${I.list}Assignment</button><button data-make="mat">${I.book}Material</button><button data-make="ann">${I.megaphone}Announcement</button></div></div>` : '';

  const n = sel === '0' ? 9 : +sel, H = HOLES[n - 1];
  const W = n <= 8 ? (S.program.weeks[n - 1] || {}) : {};
  const asg = n <= 8 ? weekDelivs(n) : [];
  const mats = S.resources.filter(r => (r.week || 0) === (n <= 8 ? n : 0));
  const holed = pledgeView ? asg.filter(d => statusOf(d, meUid()).key === 'approved').length : 0;
  const cls = !pledgeView && asg.length ? classProgress(asg).pct : null;
  const res = pledgeView && n <= 8 ? holeResult(n) : null;
  const scoreLine = n > 8 ? '' : pledgeView ? (asg.length ? `${holed} of ${asg.length} holed out` : 'No shots to play') : (asg.length ? `${cls}% of the class holed out` : 'No deliverables yet');

  const panel = `<section class="hole-card">
    <div class="hc-top">
      ${flyover(n)}
      <div class="hc-info">
        <p class="eyebrow">Hole ${n}${n <= 8 ? ` · Week ${n}` : ' · The clubhouse'}${n === currentWeek() ? ' · You are here' : ''}${n <= 8 && rangeText(n) ? ` · ${rangeText(n)}` : ''}</p>
        <h2>${n <= 8 ? esc(W.title || `Week ${n}`) : 'General resources'}</h2>
        <p class="hc-sub">${n <= 8 && W.hole ? esc(W.hole) : n > 8 ? 'Handbooks and guides for every week of the program.' : ''}</p>
        <table class="hole-score" aria-label="Scorecard"><tr>
          <th>Hole</th><th>Par</th><th>Yards</th><th>Hcp</th>${n <= 8 ? `<th>${pledgeView ? 'Shots' : 'Class'}</th>` : ''}${res ? '<th>Result</th>' : ''}</tr><tr>
          <td>${n}</td><td>${H.par}</td><td>${H.yds}</td><td>${H.hcp}</td>${n <= 8 ? `<td>${pledgeView ? `${holed}/${asg.length}` : `${cls ?? 0}%`}</td>` : ''}${res ? `<td class="res ${res.tone}">${res.label}</td>` : ''}</tr></table>
        <p class="hc-note"><b>From the tips:</b> ${H.note}</p>
      </div>
    </div>
    ${W.summary ? `<p class="caddie-tip"><span class="flag"></span><b>Caddie's tip</b>${esc(W.summary)}</p>` : ''}
    <div class="hc-body${n > 8 ? ' one' : ''}">
      <div><h3 class="hc-label">${I.book}Course notes<small>Read before you play</small></h3>
        ${mats.length ? `<div class="yardages">${mats.map(note).join('')}</div>` : '<p class="cw-empty">No materials for this hole.</p>'}</div>
      ${n <= 8 ? `<div><h3 class="hc-label">${I.list}Your shots<small>${scoreLine}</small></h3>
        ${asg.length ? asg.map(shot).join('') : '<p class="cw-empty">Nothing assigned for this hole yet.</p>'}</div>` : ''}
    </div>
    <footer class="hc-foot">
      ${n > 1 ? `<button class="btn sm" data-topic="${n - 1}">${I.left}Hole ${n - 1}</button>` : '<span></span>'}
      <span class="grow"></span>${createBtn}${n <= 8 ? `<a class="btn sm" href="#/week/${n}">Week details</a>` : ''}
      ${n < 9 ? `<button class="btn sm primary" data-topic="${n < 8 ? n + 1 : 0}">Hole ${n + 1}${I.right}</button>` : ''}
    </footer>
  </section>`;

  view(`
    <div class="course-intro"><div><p class="eyebrow">Beta Pi National · Par ${COURSE_PAR} · ${COURSE_YDS.toLocaleString()} yards</p>
      <p>One hole per week, and hole 9 finishes at the clubhouse with the general resources. Pick a hole to see its course notes and the shots you need to play.</p></div></div>
    ${courseMap(sel)}
    ${panel}`);

  const pick = t => { cwTopic = t; vClasswork(); $('.hole-card')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }); };
  $$('[data-topic]').forEach(b => {
    b.onclick = () => pick(b.dataset.topic);
    b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(b.dataset.topic); } };
  });
  const menu = $('#cwMenu');
  $('#cwCreate')?.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
  document.addEventListener('click', () => menu && (menu.hidden = true), { once: true });
  $('#view').onclick = e => {
    const mk = e.target.closest('[data-make]');
    if (mk) { menu.hidden = true; const w = n <= 8 ? n : 0;
      if (mk.dataset.make === 'asg') return deliverableModal(null, w || wk);
      if (mk.dataset.make === 'mat') return resourceModal(null, w);
      return announcementModal(null); }
    const er = e.target.closest('[data-edit-r]'); if (er) { e.stopPropagation(); return resourceModal(S.resources.find(r => r.id === er.dataset.editR)); }
    const m = e.target.closest('[data-mat]'); if (m) return materialDrawer(S.resources.find(r => r.id === m.dataset.mat));
  };
}

/* A material opens in a side panel: PDFs and images right on the page, links as a button */
async function materialDrawer(r) {
  if (!r) return;
  openDrawer(`
    <div class="drawer-head"><div class="grow"><p class="eyebrow">${r.week ? weekLabel(r.week) : 'General resources'} · Material</p><h2>${esc(r.title)}</h2>
      ${r.description ? `<div class="meta"><span>${esc(r.description)}</span></div>` : ''}</div>
      ${canEdit() ? `<button class="btn sm" id="matEdit">${I.edit}Edit</button>` : ''}
      <button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
    <div class="drawer-body mat-body">${r.path ? '<div class="mat-frame" id="matFrame"><p class="muted">Loading…</p></div>' : `
      <a class="link-row" href="${esc(r.url)}" target="_blank" rel="noopener">${I.link}<span>${esc(r.url)}</span><small>Open</small></a>`}</div>
    ${r.path ? `<div class="drawer-foot"><span class="grow small muted">${esc(r.fileName || fileName(r.path))}</span><button class="btn sm" data-file="${esc(r.path)}">${I.ext}Open in new tab</button></div>` : ''}`);
  $('#matEdit')?.addEventListener('click', () => { closeDrawer(); resourceModal(r); });
  if (r.path) {
    try {
      const url = await fileBlobUrl(r.path);
      $('#matFrame').innerHTML = isImgPath(r.path) ? `<img src="${url}" alt="${esc(r.title)}">` : isPdfPath(r.path) ? `<iframe src="${url}#view=FitH" title="${esc(r.title)}"></iframe>`
        : `<div class="empty"><b>${esc(r.fileName || 'File')}</b>This file type opens outside the browser.<br><a class="btn sm" href="${url}" download="${esc(r.fileName || 'file')}">${I.dl}Download</a></div>`;
    } catch (e) { $('#matFrame').innerHTML = `<div class="empty"><b>Couldn't open this file</b>${esc(e.message)}</div>`; }
  }
}

/* ── Grades (pledge's own) ── */
function vMyGrades() {
  setTitle('Grades');
  const rows = S.deliverables.map(d => ({ d, st: statusOf(d, meUid()) }));
  const graded = rows.filter(r => r.st.s?.grade != null).map(r => r.st.s.grade);
  const avg = graded.length ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length * 10) / 10 : null;
  view(`
    <div class="stats">
      ${stat('Average grade', avg ?? '—', graded.length ? `${plural(graded.length, 'graded assignment')}` : 'Nothing graded yet')}
      ${stat('Approved', `${rows.filter(r => r.st.key === 'approved').length}/${rows.length}`)}
      ${stat('Turned in late', rows.filter(r => r.st.s?.late).length, '', rows.some(r => r.st.s?.late) ? 'warn' : '')}
      ${stat('Missing', rows.filter(r => r.st.key === 'missing').length, 'Past due, not turned in', rows.some(r => r.st.key === 'missing') ? 'alert' : '')}
    </div>
    <div class="card"><div class="card-head"><h2>Your work</h2></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Assignment</th><th>Week</th><th>Due</th><th>Turned in</th><th>Status</th><th>Grade</th></tr></thead><tbody>
      ${rows.map(({ d, st }) => `<tr class="click" data-open-d="${d.id}"><td><b>${esc(d.name)}</b></td><td>Week ${d.week}</td><td class="nowrap">${d.dueAt ? fmtDue(d.dueAt) : '—'}</td>
        <td class="nowrap">${st.s ? `${fmtDue(st.s.submittedAt)}${st.s.late ? ' <span class="late-text">· late</span>' : ''}` : '<span class="muted">—</span>'}</td><td>${pill(st)}</td>
        <td>${st.s?.grade != null ? `<b class="gb-grade${st.s.late ? ' late' : ''}">${st.s.grade}</b>` : '<span class="muted">—</span>'}</td></tr>`).join('')}
      </tbody></table></div></div>`);
}

/* ── People (class list) ── */
function vClassPeople() {
  setTitle('People');
  const staff = S.people.filter(p => p.role !== 'pledge' && p.active !== false).sort((a, b) => (a.role === 'vpm') - (b.role === 'vpm') || a.name.localeCompare(b.name));
  const ps = S.people.filter(p => p.role === 'pledge' && p.active !== false).sort((a, b) => a.name.localeCompare(b.name));
  const row = p => `<li class="person-row"><div class="avatar ${p.role === 'vpm' ? 'gold' : p.role === 'educator' ? 'navy' : ''}">${initials(p.name)}</div><b>${esc(p.name)}</b>${p.role !== 'pledge' ? `<span class="muted small">${ROLE_NAME[p.role]}</span>` : ''}</li>`;
  view(`
    <section class="people-sec"><div class="card-head"><h2>Pledge educators & VPMs</h2></div><ul>${staff.map(row).join('') || '<li class="muted">No one yet.</li>'}</ul></section>
    <section class="people-sec"><div class="card-head"><h2>Pledge class</h2><span class="grow"></span><span class="muted small">${plural(ps.length, 'pledge')}</span></div><ul>${ps.map(row).join('') || '<li class="muted">No pledges yet.</li>'}</ul></section>`);
}

/* ───────────── shared view pieces ───────────── */

function ditem(d, uid = meUid()) {
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
    <li class="${cls[h.action] || ''}"><div class="t-head"><b>${esc(h.by === meUid() ? 'You' : h.byName)}</b> ${esc(h.action)}${h.grade != null ? ` · <b class="grade">${h.grade}/100</b>` : ''}<span class="when">${ago(h.at)}</span></div>
    ${h.comment ? `<div class="t-body">${linkify(h.comment)}</div>` : ''}</li>`).join('')}</ul>`;
}

const resourceRow = r => r.path
  ? `<button class="link-row" data-file="${esc(r.path)}">${I.file}<span>${esc(r.name || r.title || r.fileName || fileName(r.path))}</span><small>Open</small></button>`
  : `<a class="link-row" href="${esc(r.url)}" target="_blank" rel="noopener">${I.link}<span>${esc(r.name || r.title)}</span><small>${esc((() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return 'Link'; } })())}</small></a>`;

const stat = (k, v, s = '', cls = '', href = '') => `<${href ? `a href="${href}"` : 'div'} class="stat ${cls}"><div class="k">${k}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</${href ? 'a' : 'div'}>`;

/* ───────────── pledge: home ───────────── */

function vPledgeHome() {
  setTitle(`Welcome, ${first(meName())}`);
  const wk = currentWeek();
  const n = wk || 1;
  const W = S.program.weeks[n - 1] || {};
  const thisWeek = weekDelivs(n);
  const approved = thisWeek.filter(d => statusOf(d, meUid()).key === 'approved').length;
  const order = { revision: 0, missing: 1, notstarted: 2, late: 3, submitted: 4 };
  const open = S.deliverables.map(d => ({ d, st: statusOf(d, meUid()) })).filter(x => x.st.key !== 'approved')
    .sort((a, b) => order[a.st.key] - order[b.st.key] || String(a.d.dueAt || '9').localeCompare(String(b.d.dueAt || '9')));
  const action = open.filter(x => ['revision', 'missing', 'notstarted'].includes(x.st.key));
  const next = action[0]?.d;
  const feedback = S.submissions.filter(s => s.pledgeUid === meUid()).flatMap(s => (s.history || []).filter(h => h.by !== meUid() && (h.comment || h.action !== 'commented')).map(h => ({ ...h, s })))
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
      ${next ? `<button class="btn primary" data-open-d="${next.id}">${statusOf(next, meUid()).key === 'revision' ? 'Fix and resubmit' : 'Submit'} ${esc(next.name)}</button>` : ''}
    </div></section>
    <div class="cols">
      <div>
        <div class="card"><div class="card-head"><h2>Up next</h2><span class="grow"></span><a class="btn sm ghost" href="#/program">Full program</a></div>
          ${open.length ? `<ul class="dlist">${open.slice(0, 7).map(x => ditem(x.d)).join('')}</ul>` : `<div class="empty"><b>All caught up</b>Everything assigned so far is approved.</div>`}
        </div>
        <div class="card"><div class="card-head"><h2>Scorecard</h2><span class="grow"></span><span class="small muted">Approved per week</span></div>${scorecard(meUid())}</div>
      </div>
      <div>
        <div class="card"><div class="card-head"><h2>Feedback</h2></div>
          ${feedback.length ? `<ul class="feed">${feedback.map(h => `<li data-open-d="${h.s.deliverableId}" style="cursor:pointer">
            <div class="avatar sm navy">${initials(h.byName)}</div>
            <div class="txt"><b>${esc(h.byName)}</b> <span class="muted">${esc(h.action)} · ${esc(deliv(h.s.deliverableId)?.name || '')}</span>${h.grade != null ? ` <b class="grade">· ${h.grade}/100</b>` : ''}
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
        ? { done: list.filter(d => statusOf(d, meUid()).key === 'approved').length, total: list.length }
        : classProgress(list);
      const pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0;
      return `<a class="hole-card" href="#/week/${n}">
        <div class="ph" style="background-image:url('${weekPhoto(n, 700)}')" role="img" aria-label="Golf course, hole ${n}"></div>
        <div class="info">
          <p class="hole-meta">Week ${n} · Hole ${n}${n === wk ? '<span class="now"><span class="flag"></span>This week</span>' : ''}</p>
          <h3>${esc(W.title || `Week ${n}`)}</h3>
          <p class="sub">${esc([W.hole, rangeText(n)].filter(Boolean).join(' · ')) || '&nbsp;'}</p>
          <div class="row"><div class="bar grow"><i style="width:${pct}%"></i></div><span>${role() === 'pledge' ? `${prog.done} of ${prog.total} approved` : `${pct}% approved`}</span></div>
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
  const st = statusOf(d, meUid()), s = st.s;
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
      ${st.key === 'approved' ? `<section><div class="banner approved"><div><b>Approved${s.reviewedByName ? ` by ${esc(s.reviewedByName)}` : ''}${s.grade != null ? ` · Grade ${s.grade}/100` : ''}</b>Nice work. Nothing else to do here.</div></div></section>` : ''}
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
  if (statusOf(deliv(row.dataset.openD), meUid()).key === 'approved') return toast('That one is already approved.');
  deliverableDrawer(row.dataset.openD, [...e.dataTransfer.files]);
});

/* ───────────── calendar ─────────────
 * Weekly / Monthly widget: big month name, arrows, day letters, bold numbers.
 */

let calAnchor = null;   // any date inside the week or month being shown
let calSel = null;      // the day picked in the Monthly view (YYYY-MM-DD)
let calMode = (() => { try { return localStorage.getItem('bp-cal-mode') || 'week'; } catch { return 'week'; } })();
const pad2 = n => String(n).padStart(2, '0');
const weekStart = d => { const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()); s.setDate(s.getDate() - s.getDay()); return s; };
/* Month grid cells: nulls before the 1st and after the last day so weeks line up */
function monthCells(first) {
  const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let k = 1; k <= n; k++) cells.push(new Date(first.getFullYear(), first.getMonth(), k));
  while (cells.length % 7) cells.push(null);
  return cells;
}
const segToggle = (mode, attr) => `<div class="seg" role="tablist">${[['week', 'Weekly'], ['month', 'Monthly']].map(([k, l]) => `<button type="button" role="tab" aria-selected="${mode === k}" class="${mode === k ? 'on' : ''}" ${attr}="${k}">${l}</button>`).join('')}</div>`;

function vCalendar() {
  setTitle('Calendar');
  if (!calAnchor) calAnchor = new Date();
  const today = isoDay(new Date());
  const items = {};
  const timeShort = t => t ? t.replace(':00', '').replace(' ', '').toLowerCase() : '';
  S.events.forEach(e => (items[e.date] = items[e.date] || []).push(`<button class="cal-ev ${e.kind}" data-ev="${e.id}" title="${esc(e.title)}${e.time ? ' · ' + esc(e.time) : ''}"><b>${esc(timeShort(e.time))}</b>${esc(e.title)}</button>`));
  S.deliverables.filter(d => d.dueAt).forEach(d => {
    const k = isoDay(new Date(d.dueAt));
    const done = role() === 'pledge' && statusOf(d, meUid()).key === 'approved';
    (items[k] = items[k] || []).push(`<button class="cal-ev due${done ? ' done' : ''}" data-open-d="${d.id}" title="Due: ${esc(d.name)}"><b>due</b>${esc(d.name)}</button>`);
  });
  const agenda = {};
  S.events.forEach(e => (agenda[e.date] = agenda[e.date] || []).push({ kind: e.kind, time: e.time || '', title: e.title, sub: e.location || '', attr: `data-ev="${e.id}"` }));
  S.deliverables.filter(d => d.dueAt).forEach(d => { const k = isoDay(new Date(d.dueAt));
    (agenda[k] = agenda[k] || []).push({ kind: 'due', time: fmt(d.dueAt, { hour: 'numeric', minute: '2-digit' }), title: d.name, sub: `Due · Week ${d.week}`, attr: `data-open-d="${d.id}"`, done: role() === 'pledge' && statusOf(d, meUid()).key === 'approved' }); });
  Object.values(agenda).forEach(list => list.sort((a, b) => (a.kind === 'due') - (b.kind === 'due') || a.time.localeCompare(b.time)));
  if (!calSel) calSel = today;
  const edit = role() === 'vpm';
  const week = calMode === 'week';
  const ws = weekStart(calAnchor);
  const days = week ? Array.from({ length: 7 }, (_, i) => new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i))
    : monthCells(new Date(calAnchor.getFullYear(), calAnchor.getMonth(), 1));
  /* Title: the month (or both months when a week spans two) */
  const headDate = week ? days[3] : calAnchor;
  const span = week && days[0].getMonth() !== days[6].getMonth() ? `${fmt(days[0], { month: 'short' })} – ${fmt(days[6], { month: 'short' })}` : '';
  const upcoming = [...S.events.filter(e => e.date >= today).map(e => ({ at: e.date, t: e.title, sub: [e.time, e.location].filter(Boolean).join(' · '), kind: e.kind })),
    ...S.deliverables.filter(d => d.dueAt && d.dueAt >= new Date().toISOString()).map(d => ({ at: isoDay(new Date(d.dueAt)), t: `Due: ${d.name}`, sub: fmtDue(d.dueAt), kind: 'due', id: d.id }))]
    .sort((a, b) => a.at.localeCompare(b.at)).slice(0, 8);

  view(`
    <div class="cal-layout">
      <div><section class="calw">
        <div class="calw-top">${segToggle(calMode, 'data-cmode')}<span class="grow"></span>
          ${edit ? `<button class="btn primary sm" id="calNew">${I.plus}New event</button>` : ''}</div>
        ${!week ? (() => { const sel = new Date(calSel + 'T00:00'); const list = agenda[calSel] || [];
          return `<div class="calm">
          <div class="calm-cal">
            <div class="calm-head"><button class="round-btn" id="calPrev" aria-label="Previous month">${I.left}</button>
              <b>${fmt(calAnchor, { month: 'long', year: 'numeric' })}</b>
              <button class="round-btn" id="calNext" aria-label="Next month">${I.right}</button></div>
            <div class="calm-grid">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(l => `<span class="calm-dow">${l}</span>`).join('')}
              ${days.map(d => { if (!d) return '<span></span>'; const k = isoDay(d); const n = (agenda[k] || []).length;
                return `<button type="button" class="calm-day ${k === today ? 'today' : ''} ${k === calSel ? 'on' : ''} ${k < today ? 'past' : ''}" data-sel="${k}" aria-pressed="${k === calSel}" aria-label="${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}${n ? `, ${plural(n, 'item')}` : ''}">${d.getDate()}${n ? '<i></i>' : ''}</button>`; }).join('')}</div>
            <button class="linkish calm-today" id="calToday">Today</button>
          </div>
          <div class="calm-agenda">
            <p class="calm-agenda-head">${fmt(sel, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            ${list.length ? list.map(x => `<button type="button" class="slot ${x.kind}${x.done ? ' done' : ''}" ${x.attr}><b>${esc(x.time || 'All day')}</b><span>${esc(x.title)}</span>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</button>`).join('')
              : `<p class="calm-empty">Nothing on this day.</p>`}
          </div>
          <div class="calm-foot"><span>${list.length ? `<b>${fmt(sel, { weekday: 'long', month: 'long', day: 'numeric' })}</b> · ${plural(list.length, 'item')}` : `Nothing scheduled for <b>${fmt(sel, { weekday: 'long', month: 'long', day: 'numeric' })}</b>.`}</span>
            ${edit ? `<button class="btn sm" id="calAddDay">${I.plus}Add event</button>` : ''}</div>
        </div>`; })() : ''}
        <div class="calw-head" ${week ? '' : 'hidden'}>
          <h2>${span || fmt(headDate, { month: 'long' })}<span>${headDate.getFullYear()}</span></h2>
          <div class="calw-nav">
            ${week ? `<button class="btn sm ghost" id="calToday">Today</button>
            <button class="round-btn" id="calPrev" aria-label="Previous week">${I.left}</button>
            <button class="round-btn" id="calNext" aria-label="Next week">${I.right}</button>` : ''}
          </div>
        </div>
        <div class="cal is-week" ${week ? '' : 'hidden'}>
          ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => `<div class="cal-dow" title="${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}">${l}</div>`).join('')}
          ${days.map(d => { if (!d) return '<div class="cal-blank"></div>'; const k = isoDay(d);
            return `<div class="cal-day ${k === today ? 'today' : ''} ${k < today ? 'past' : ''} ${edit ? 'editable' : ''}" data-day="${k}"${edit ? ` title="Add an event on ${fmt(d, { month: 'short', day: 'numeric' })}"` : ''}>
              <span class="cal-num">${d.getDate()}</span>${(items[k] || []).join('')}</div>`; }).join('')}
        </div>
        <div class="calw-foot" ${week ? '' : 'hidden'}>
          <div class="cal-legend"><span><i style="background:var(--navy)"></i>Meeting</span><span><i style="background:var(--brand-ink)"></i>Event</span><span><i style="background:var(--gold)"></i>Due date</span></div>
          ${edit ? '<span class="small muted">Click a day to add an event</span>' : ''}
        </div>
      </section></div>
      <div><div class="card"><div class="card-head"><h2>Coming up</h2></div>
        ${upcoming.length ? `<ul class="feed">${upcoming.map(u => `<li ${u.id ? `data-open-d="${u.id}" style="cursor:pointer"` : ''}><div class="txt"><b>${esc(u.t)}</b><p>${fmt(u.at + 'T00:00', { weekday: 'short', month: 'short', day: 'numeric' })}${u.sub && u.kind !== 'due' ? ` · ${esc(u.sub)}` : ''}</p></div></li>`).join('')}</ul>` : '<div class="empty">Nothing scheduled.</div>'}
      </div></div>
    </div>`);
  const move = dir => { const a = new Date(calAnchor); if (week) a.setDate(a.getDate() + 7 * dir); else { a.setDate(1); a.setMonth(a.getMonth() + dir); calSel = isoDay(a); } calAnchor = a; vCalendar(); };
  $('#calPrev').onclick = () => move(-1);
  $('#calNext').onclick = () => move(1);
  $('#calToday').onclick = () => { calAnchor = new Date(); calSel = today; vCalendar(); };
  $$('[data-sel]').forEach(b => b.onclick = () => { calSel = b.dataset.sel; vCalendar(); });
  $('#calAddDay')?.addEventListener('click', () => eventModal(null, calSel));
  $('.calm-agenda')?.addEventListener('click', e => {
    const ev = e.target.closest('[data-ev]');
    if (ev) { const x = S.events.find(v => v.id === ev.dataset.ev); edit ? eventModal(x) : showEvent(x); }
  });
  $('#calNew')?.addEventListener('click', () => eventModal(null, today));
  $$('[data-cmode]').forEach(b => b.onclick = () => { calMode = b.dataset.cmode; try { localStorage.setItem('bp-cal-mode', calMode); } catch {} vCalendar(); });
  $('.cal').onclick = e => {
    const ev = e.target.closest('[data-ev]');
    if (ev) { const x = S.events.find(v => v.id === ev.dataset.ev); return edit ? eventModal(x) : showEvent(x); }
    if (e.target.closest('[data-open-d]')) return;
    const day = e.target.closest('[data-day]');
    if (day && edit) eventModal(null, day.dataset.day);
  };
}

/* ───────────── date picker ─────────────
 * Replaces the browser's date / date-time box. Same Weekly / Monthly look as the calendar.
 * dateField(id, value, { time }) returns the markup; mountDatePickers(root) wires it up.
 * The value lives in a hidden <input id> as YYYY-MM-DD (or YYYY-MM-DDTHH:mm with time).
 */
const TIME_PICKS = [['9:00 AM', 9, 0], ['12:00 PM', 12, 0], ['5:00 PM', 17, 0], ['7:00 PM', 19, 0], ['9:00 PM', 21, 0], ['11:59 PM', 23, 59]];

function dateField(id, value, { time = false } = {}) {
  return `<div class="dp" data-time="${time ? '1' : ''}">
    <input type="hidden" id="${id}" value="${esc(value || '')}">
    <button type="button" class="input dp-field" aria-haspopup="dialog">${I.cal}<span class="dp-text"></span></button>
    <div class="dp-pop" role="dialog" aria-label="Choose a date" hidden></div></div>`;
}
function mountDatePickers(root) { $$('.dp', root).forEach(initDatePicker); }

function initDatePicker(box) {
  const input = $('input', box), btn = $('.dp-field', box), pop = $('.dp-pop', box);
  const time = !!box.dataset.time;
  const parse = v => { if (!v) return null; const [d, t] = v.split('T'); const [y, m, dd] = d.split('-').map(Number); const [hh, mi] = (t || '23:59').split(':').map(Number); return { y, m: m - 1, d: dd, hh, mi }; };
  let sel = parse(input.value);
  let anchor = sel ? new Date(sel.y, sel.m, sel.d) : new Date();
  let mode = 'month';
  const asDate = () => new Date(sel.y, sel.m, sel.d, sel.hh, sel.mi);
  const label = () => !sel ? 'Pick a date' : time
    ? `${fmt(asDate(), { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmt(asDate(), { hour: 'numeric', minute: '2-digit' })}`
    : fmt(asDate(), { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  const write = () => {
    input.value = sel ? `${sel.y}-${pad2(sel.m + 1)}-${pad2(sel.d)}${time ? `T${pad2(sel.hh)}:${pad2(sel.mi)}` : ''}` : '';
    $('.dp-text', btn).textContent = label();
    btn.classList.toggle('is-empty', !sel);
  };
  const draw = () => {
    const today = isoDay(new Date());
    const week = mode === 'week';
    const ws = weekStart(anchor);
    const days = week ? Array.from({ length: 7 }, (_, i) => new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i)) : monthCells(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const head = week ? days[3] : anchor;
    const picked = sel ? `${sel.y}-${pad2(sel.m + 1)}-${pad2(sel.d)}` : '';
    const h12 = sel ? ((sel.hh % 12) || 12) : 11, pm = sel ? sel.hh >= 12 : true, mins = sel ? sel.mi : 59;
    pop.innerHTML = `
      <div class="dp-top">${segToggle(mode, 'data-pmode')}</div>
      <div class="dp-head"><h3>${fmt(head, { month: 'long' })}<span>${head.getFullYear()}</span></h3>
        <div><button type="button" class="round-btn" data-step="-1" aria-label="Previous">${I.left}</button><button type="button" class="round-btn" data-step="1" aria-label="Next">${I.right}</button></div></div>
      <div class="dp-grid">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(l => `<span class="dp-dow">${l}</span>`).join('')}
        ${days.map(d => { if (!d) return '<span></span>'; const k = isoDay(d);
          return `<button type="button" class="dp-day ${k === today ? 'today' : ''} ${k === picked ? 'on' : ''}" data-pick="${k}" aria-pressed="${k === picked}">${d.getDate()}</button>`; }).join('')}</div>
      ${time ? `<div class="dp-time">
        <div class="dp-chips">${TIME_PICKS.map(([l, h, m]) => `<button type="button" class="chip-btn ${sel && sel.hh === h && sel.mi === m ? 'on' : ''}" data-t="${h}:${m}">${l}</button>`).join('')}</div>
        <div class="dp-clock"><span>Time</span>
          <select data-hh aria-label="Hour">${Array.from({ length: 12 }, (_, i) => i + 1).map(h => `<option ${h === h12 ? 'selected' : ''}>${h}</option>`).join('')}</select>
          <b>:</b>
          <select data-mi aria-label="Minute">${[0, 15, 30, 45, 59].concat(mins % 15 && mins !== 59 ? [mins] : []).sort((a, b) => a - b).map(m => `<option value="${m}" ${m === mins ? 'selected' : ''}>${pad2(m)}</option>`).join('')}</select>
          <div class="seg seg-sm">${['AM', 'PM'].map(x => `<button type="button" class="${(x === 'PM') === pm ? 'on' : ''}" data-ap="${x}">${x}</button>`).join('')}</div>
        </div></div>` : ''}
      <div class="dp-foot"><button type="button" class="linkish" data-today>Today</button><button type="button" class="linkish" data-clear>Clear</button><span class="grow"></span><button type="button" class="btn sm primary" data-done>Done</button></div>`;
  };
  const ensureSel = () => { if (!sel) { const t = new Date(); sel = { y: t.getFullYear(), m: t.getMonth(), d: t.getDate(), hh: 23, mi: 59 }; } };
  const open = () => { draw(); pop.hidden = false; box.classList.add('open'); };
  const close = () => { pop.hidden = true; box.classList.remove('open'); };
  btn.onclick = () => (pop.hidden ? open() : close());
  pop.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.pmode) { mode = t.dataset.pmode; return draw(); }
    if (t.dataset.step) { const a = new Date(anchor); if (mode === 'week') a.setDate(a.getDate() + 7 * t.dataset.step); else { a.setDate(1); a.setMonth(a.getMonth() + +t.dataset.step); } anchor = a; return draw(); }
    if (t.dataset.pick) { const [y, m, d] = t.dataset.pick.split('-').map(Number); sel = { y, m: m - 1, d, hh: sel?.hh ?? 23, mi: sel?.mi ?? 59 }; anchor = new Date(y, m - 1, d); write(); draw(); if (!time) close(); return; }
    if (t.dataset.t) { ensureSel(); const [h, m] = t.dataset.t.split(':').map(Number); sel.hh = h; sel.mi = m; write(); return draw(); }
    if (t.dataset.ap) { ensureSel(); const pmNow = t.dataset.ap === 'PM'; if (pmNow && sel.hh < 12) sel.hh += 12; if (!pmNow && sel.hh >= 12) sel.hh -= 12; write(); return draw(); }
    if ('today' in t.dataset) { const n = new Date(); sel = { y: n.getFullYear(), m: n.getMonth(), d: n.getDate(), hh: sel?.hh ?? 23, mi: sel?.mi ?? 59 }; anchor = n; write(); return draw(); }
    if ('clear' in t.dataset) { sel = null; write(); return draw(); }
    if ('done' in t.dataset) close();
  });
  pop.addEventListener('change', e => {
    ensureSel();
    if (e.target.matches('[data-hh]')) { const h = +e.target.value % 12; sel.hh = (sel.hh >= 12 ? 12 : 0) + h; }
    if (e.target.matches('[data-mi]')) sel.mi = +e.target.value;
    write(); draw();
  });
  document.addEventListener('mousedown', e => { if (!pop.hidden && !box.contains(e.target)) close(); });
  write();
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
  setTitle(`Welcome, ${first(meName())}`);
  const ps = pledges(), q = reviewQueue();
  const all = ps.map(pledgeStats);
  const sum = k => all.reduce((n, x) => n + x[k], 0);
  view(`
    <div class="stats">
      ${stat('To review', q.length, q.length ? `Oldest ${ago(q[0].submittedAt)}` : 'All caught up', '', '#/review')}
      ${stat('Needs revision', sum('revision'), 'Waiting on pledges', sum('revision') ? 'warn' : '')}
      ${stat('Missing / late', sum('missing'), 'Past due, not submitted', sum('missing') ? 'alert' : '', '#/grades?f=missing')}
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
      ${stat('Missing / late', sum('missing'), 'Past due, not submitted', sum('missing') ? 'alert' : '', '#/grades?f=missing')}
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

document.addEventListener('click', e => { const b = e.target.closest('[data-note-to]'); if (b) noteModal(b.dataset.noteTo); });
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
      <div class="row" style="gap:8px">${pill({ key: 'approved', label: `${x.approved} approved` })}${x.review ? pill({ key: 'submitted', label: `${x.review} to review` }) : ''}${x.revision ? pill({ key: 'revision', label: `${x.revision} revision` }) : ''}${x.missing ? pill({ key: 'missing', label: `${x.missing} missing` }) : ''}<button class="btn sm primary" data-note-to="${p.uid}">${I.megaphone}Send a caddie note</button></div>
    </div></div>
    <div class="card" style="margin-bottom:20px"><div class="card-head"><h2>Scorecard</h2></div>${scorecard(p.uid)}</div>
    <div class="card">${[1, 2, 3, 4, 5, 6, 7, 8].filter(n => weekDelivs(n).length).map(n => `
      <div class="cms-week"><div class="cms-week-head"><b>Week ${n}</b><small>Hole ${n} · ${esc(S.program.weeks[n - 1]?.title || '')}</small></div>
      ${weekDelivs(n).map(d => { const st = statusOf(d, p.uid);
        return `<${st.s ? `a href="#/review/${st.s.id}"` : 'div'} class="cms-row" style="color:inherit;text-decoration:none"><div class="body"><b>${esc(d.name)}</b><small>${st.s ? `Submitted ${ago(st.s.submittedAt)}` : dueInfo(d, true).text}</small></div>${pill(st)}</${st.s ? 'a' : 'div'}>`; }).join('')}
      </div>`).join('') || '<div class="empty">No deliverables yet.</div>'}</div>`);
}

/* ───────────── grades & lateness (educator: own pledges · VPM: everyone) ───────────── */

function gradeStats(p) {
  const rows = S.deliverables.map(d => ({ d, st: statusOf(d, p.uid) }));
  const graded = rows.filter(r => r.st.s?.grade != null).map(r => r.st.s.grade);
  const submitted = rows.filter(r => r.st.s && r.d.dueAt);
  const late = rows.filter(r => r.st.s?.late).length;
  return {
    avg: graded.length ? Math.round(graded.reduce((a, b) => a + b, 0) / graded.length * 10) / 10 : null,
    graded: graded.length,
    approved: rows.filter(r => r.st.key === 'approved').length,
    onTime: submitted.length ? Math.round(submitted.filter(r => !r.st.s.late).length / submitted.length * 100) : null,
    late, missing: rows.filter(r => r.st.key === 'missing').length,
  };
}
const daysBetween = (a, b) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / DAY * 10) / 10);
const lateText = days => days < 1 ? `${Math.max(1, Math.round(days * 24))}h` : `${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'}`;

function vGrades(_, qs) {
  setTitle('Grades & lateness');
  const f = qs.get('f') || 'all';
  const ps = pledges();
  const ds = S.deliverables;
  /* Every past-due deliverable that is missing or came in late */
  const issues = ps.flatMap(p => ds.filter(d => d.dueAt).map(d => ({ p, d, st: statusOf(d, p.uid) })))
    .filter(x => x.st.key === 'missing' || x.st.s?.late)
    .filter(x => f === 'all' || (f === 'missing' ? x.st.key === 'missing' : x.st.s?.late))
    .sort((a, b) => b.d.dueAt.localeCompare(a.d.dueAt) || a.p.name.localeCompare(b.p.name));
  const counts = { all: 0, missing: 0, late: 0 };
  ps.forEach(p => ds.filter(d => d.dueAt).forEach(d => { const st = statusOf(d, p.uid); if (st.key === 'missing') { counts.missing++; counts.all++; } else if (st.s?.late) { counts.late++; counts.all++; } }));
  const cell = (p, d) => { const st = statusOf(d, p.uid);
    if (st.s?.grade != null) return `<td class="gb-cell"><a href="#/review/${st.s.id}" class="gb-grade${st.s.late ? ' late' : ''}" title="${esc(d.name)}${st.s.late ? ' (late)' : ''}">${st.s.grade}</a></td>`;
    if (st.s) return `<td class="gb-cell"><a href="#/review/${st.s.id}" class="gb-mark ${st.cell || st.key}" title="${esc(d.name)}: ${st.label}${st.s.late ? ' (late)' : ''}">${st.key === 'approved' ? '✓' : st.key === 'revision' ? 'R' : '•'}</a></td>`;
    return `<td class="gb-cell"><span class="gb-mark ${st.key}" title="${esc(d.name)}: ${st.missing ? 'missing' : 'not due yet'}">${st.missing ? 'M' : ''}</span></td>`; };

  view(`
    <div class="page-intro"><p>Who turned in what, when, and how it was graded${role() === 'educator' ? ' for your pledges' : ' across the whole class'}. Grades are out of 100.</p></div>

    <div class="card" style="margin-bottom:48px"><div class="card-head"><h2>By pledge</h2></div>
      ${ps.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Pledge</th>${role() === 'vpm' ? '<th>Educator</th>' : ''}<th>Average grade</th><th>Approved</th><th>On time</th><th>Late</th><th>Missing</th></tr></thead><tbody>
        ${ps.map(p => { const g = gradeStats(p); return `<tr class="click" data-go="#/pledge/${p.uid}">
          <td><div class="person"><div class="avatar sm">${initials(p.name)}</div><b>${esc(p.name)}</b></div></td>
          ${role() === 'vpm' ? `<td>${esc(byUid(p.educatorUid)?.name || '—')}</td>` : ''}
          <td><b class="gb-avg">${g.avg ?? '—'}</b>${g.graded ? ` <span class="small muted">(${g.graded} graded)</span>` : ''}</td>
          <td>${g.approved}/${ds.length}</td>
          <td>${g.onTime == null ? '<span class="muted">—</span>' : `${g.onTime}%`}</td>
          <td>${g.late ? `<span class="pill late">${g.late}</span>` : '<span class="muted">0</span>'}</td>
          <td>${g.missing ? `<span class="pill missing">${g.missing}</span>` : '<span class="muted">0</span>'}</td></tr>`; }).join('')}
      </tbody></table></div>` : '<div class="empty">No pledges yet.</div>'}
    </div>

    <div class="card" style="margin-bottom:48px"><div class="card-head"><h2>Late or missing</h2><span class="grow"></span>
      <div class="tabs">${[['all', 'All'], ['missing', 'Never turned in'], ['late', 'Turned in late']].map(([k, l]) => `<button class="${k === f ? 'on' : ''}" data-gf="${k}">${l}<span>${counts[k]}</span></button>`).join('')}</div></div>
      ${issues.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Pledge</th><th>Deliverable</th><th>Was due</th><th>Turned in</th><th>How late</th><th>Status</th></tr></thead><tbody>
        ${issues.map(({ p, d, st }) => `<tr class="click" data-go="${st.s ? `#/review/${st.s.id}` : `#/pledge/${p.uid}`}">
          <td><b>${esc(p.name)}</b></td><td>${esc(d.name)} <span class="small muted">· Week ${d.week}</span></td>
          <td class="nowrap">${fmtDue(d.dueAt)}</td>
          <td class="nowrap">${st.s ? fmtDue(st.s.firstSubmittedAt || st.s.submittedAt) : '<span class="late-text">Not turned in</span>'}</td>
          <td class="nowrap late-text">${st.s ? `${lateText(daysBetween(d.dueAt, st.s.firstSubmittedAt || st.s.submittedAt))} late` : `${lateText(daysBetween(d.dueAt, new Date().toISOString()))} overdue`}</td>
          <td>${pill(st)}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">Nothing late or missing. Everyone is on time.</div>'}
    </div>

    <div class="card"><div class="card-head"><h2>Gradebook</h2><span class="grow"></span><button class="btn sm" id="gbExport">${I.dl}Export CSV</button></div>
      ${ps.length && ds.length ? `<div class="table-wrap"><table class="t gradebook"><thead><tr><th>Pledge</th>${ds.map(d => `<th title="${esc(d.name)}"><span>W${d.week}</span>${esc(d.name.length > 16 ? d.name.slice(0, 15) + '…' : d.name)}</th>`).join('')}<th>Avg</th></tr></thead><tbody>
        ${ps.map(p => `<tr><td><b>${esc(p.name)}</b></td>${ds.map(d => cell(p, d)).join('')}<td><b class="gb-avg">${gradeStats(p).avg ?? '—'}</b></td></tr>`).join('')}
      </tbody></table></div>
      <div class="legend" style="margin-top:14px"><span><b class="gb-grade">92</b> Grade</span><span><b class="gb-grade late">85</b> Graded, turned in late</span><span><b class="gb-mark approved">✓</b> Approved, no grade</span><span><b class="gb-mark submitted">•</b> Waiting for review</span><span><b class="gb-mark revision">R</b> Needs revision</span><span><b class="gb-mark missing">M</b> Missing</span></div>`
      : '<div class="empty">Grades will show here once deliverables are reviewed.</div>'}
    </div>`);
  $$('[data-gf]').forEach(b => b.onclick = () => { location.hash = b.dataset.gf === 'all' ? '#/grades' : `#/grades?f=${b.dataset.gf}`; });
  $('#gbExport')?.addEventListener('click', () => {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Pledge', 'Educator', ...ds.map(d => `W${d.week} ${d.name}`), 'Average grade', 'Approved', 'On time %', 'Late', 'Missing'];
    const rows = ps.map(p => { const g = gradeStats(p);
      return [p.name, byUid(p.educatorUid)?.name || '', ...ds.map(d => { const st = statusOf(d, p.uid); return st.s?.grade ?? (st.missing ? 'Missing' : st.s ? st.label : ''); }), g.avg ?? '', `${g.approved}/${ds.length}`, g.onTime ?? '', g.late, g.missing]; });
    const csv = [head, ...rows].map(r => r.map(q).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `Beta Pi gradebook ${isoDay(new Date())}.csv`; a.click();
  });
}

/* ───────────── review queue + review screen ───────────── */

const REVIEW_TABS = [['todo', 'To review', s => s.status === 'submitted'], ['revision', 'Needs revision', s => s.status === 'needs_revision'], ['approved', 'Approved', s => s.status === 'approved'], ['all', 'All', () => true]];
let reviewTab = 'todo';
const reviewList = tab => {
  const test = (REVIEW_TABS.find(t => t[0] === tab) || REVIEW_TABS[0])[2];
  const list = S.submissions.filter(s => deliv(s.deliverableId) && byUid(s.pledgeUid) && visibleSub(s) && test(s));
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
        <div class="grade-row"><label for="rGrade">Grade</label><input class="input" id="rGrade" type="number" inputmode="decimal" min="0" max="100" step="0.5" placeholder="–" value="${s.grade ?? ''}"><span>/ 100</span>
          <span class="grow"></span><span class="small muted">${s.grade != null ? `Graded by ${esc(s.gradedByName || '')}` : 'Optional'}</span></div>
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
    const gradeRaw = $('#rGrade').value.trim();
    const grade = gradeRaw === '' ? null : Number(gradeRaw);
    if (grade !== null && (!Number.isFinite(grade) || grade < 0 || grade > 100)) { $('#rGrade').focus(); toast('Grades go from 0 to 100.', true); return; }
    if (action === 'comment' && !comment && grade !== null && grade !== s.grade) { /* grade-only update */ }
    else if (action !== 'approve' && !comment) { $('#rComment').focus(); toast(action === 'revise' ? 'Tell the pledge what to change.' : 'Write a comment first.', true); return; }
    $$('.rpanel-foot .btn').forEach(b => b.disabled = true);
    try {
      const r = await api('POST', `review/${id}`, { action, comment, grade });
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
    const inviteText = code => `You're invited to the Beta Pi pledge portal. Create your account at ${location.origin}/ with invite code ${code} (it works once).`;
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
      <div class="f"><span>Week 1 starts</span>${dateField('pStart', P.startDate)}<small class="f-help">Each week runs 7 days from here. The portal highlights the current week.</small></div>
    </div></div>
    <div class="card" style="margin-bottom:20px"><div class="card-head"><h2>Home banner</h2><span class="grow"></span><span class="small muted">What everyone sees at the top of the home page.</span></div>
      <div class="card-body grid2">
        <label class="f"><span>Program name</span><input class="input" id="pName" value="${esc(prog('programName'))}"></label>
        <label class="f"><span>Subtitle</span><input class="input" id="pSub" value="${esc(prog('subtitle'))}" placeholder="A stronger you"><small>Shows as "8 weeks · 8 holes · …"</small></label>
        <label class="f full"><span>Welcome line</span><input class="input" id="pTag" value="${esc(prog('tagline'))}"></label>
        <label class="f full"><span>Quote</span><input class="input" id="pQuote" value="${esc(prog('quote'))}"><small>Leave empty to hide it.</small></label>
        <div class="f full"><span>Hero photo</span><div class="photo-pick hero-pick">
          <button type="button" data-hero="" class="${!P.heroImage ? 'on' : ''}" style="background-image:url('${HERO_DEFAULT}')" aria-label="Fairway at golden hour"></button>
          ${PHOTOS.map(id => `<button type="button" data-hero="${id}" class="${P.heroImage === id ? 'on' : ''}" style="background-image:url('${photo(id, 160)}')" aria-label="Use this photo"></button>`).join('')}</div></div>
      </div></div>
    <div class="card"><div class="card-head"><h2>The eight weeks</h2><span class="grow"></span><span class="small muted">Each week's title is the label under its hole on the home page.</span></div>
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
  mountDatePickers($('#view'));
  $('#view').onclick = e => {
    const h = e.target.closest('[data-hero]');
    if (h) { P.heroImage = h.dataset.hero; $$('[data-hero]').forEach(x => x.classList.toggle('on', x === h)); return; }
    const b = e.target.closest('[data-photo]');
    if (!b) return;
    const ed = b.closest('[data-w]'), i = +ed.dataset.w;
    P.weeks[i].image = b.dataset.photo;
    $$('[data-photo]', ed).forEach(x => x.classList.toggle('on', x === b));
    $('.thumb', ed).style.backgroundImage = `url('${photo(b.dataset.photo, 400)}')`;
  };
  $('#pSave').onclick = async () => {
    P.className = $('#pClass').value; P.startDate = $('#pStart').value;
    P.programName = $('#pName').value; P.subtitle = $('#pSub').value; P.tagline = $('#pTag').value; P.quote = $('#pQuote').value;
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
      <div class="f"><span>Due</span>${dateField('dDue', toLocalInput(d.dueAt), { time: true })}</div>
      <label class="f full"><span>Instructions</span><textarea class="textarea" id="dInstr" rows="6" placeholder="What to submit, format, and anything they should know.">${esc(d.instructions)}</textarea></label>
      <div class="full"><span class="f-label">Templates & resources</span><div class="links" id="dRes"></div>
        <div class="row" style="margin-top:8px"><label class="btn sm">${I.upload}Upload file<input type="file" id="dUp" hidden></label><button class="btn sm" id="dAddLink" type="button">${I.link}Add link</button></div></div>
    </div>`, id ? 'Save' : 'Add deliverable');
  mountDatePickers(m.el);
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
function resourceModal(r, week = 0) {
  const x = r ? { ...r } : { title: '', week, description: '', url: '', path: '', fileName: '' };
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
    <div class="f"><span>Date</span>${dateField('eDate', x.date)}</div>
    <label class="f"><span>Time</span><input class="input" id="eTime" value="${esc(x.time)}" placeholder="7:00 PM"></label>
    <label class="f"><span>Kind</span><select class="select" id="eKind">${[['meeting', 'Meeting'], ['event', 'Event'], ['deadline', 'Deadline']].map(([k, l]) => `<option value="${k}" ${k === x.kind ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f"><span>Location</span><input class="input" id="eLoc" value="${esc(x.location)}"></label>
    <label class="f full"><span>Details</span><textarea class="textarea" id="eDetails" rows="3">${esc(x.details)}</textarea></label>
    </div>${e ? `<button class="btn sm danger" id="eDel" style="margin-top:14px">${I.trash}Delete event</button>` : ''}`, e ? 'Save' : 'Add event');
  mountDatePickers(m.el);
  $('#eDel', m.el)?.addEventListener('click', async () => { m.close(); try { if (await deleteItem('portalEvents', e.id, `“${e.title}”`)) { toast('Event deleted.'); route(); } } catch (y) { toast(y.message, true); } });
  m.onOk = async () => {
    const dateV = $('#eDate', m.el).value;
    const wk = [1, 2, 3, 4, 5, 6, 7, 8].find(n => { const r = weekRange(n); return r && dateV >= isoDay(r[0]) && dateV <= isoDay(r[1]); }) || 0;
    await saveItem('portalEvents', { title: $('#eTitle', m.el).value, date: dateV, time: $('#eTime', m.el).value, kind: $('#eKind', m.el).value, location: $('#eLoc', m.el).value, details: $('#eDetails', m.el).value, week: wk }, e?.id);
    toast('Event saved.'); route();
  };
}
