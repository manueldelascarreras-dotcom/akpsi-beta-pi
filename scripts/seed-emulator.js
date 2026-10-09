/*
 * Fills the LOCAL Firebase emulators with a sample pledge class so the portal
 * can be tried end to end. It never touches the live project.
 *
 *   firebase emulators:start          (in one terminal)
 *   node scripts/seed-emulator.js     (in another)
 *   open http://127.0.0.1:5002/portal.html
 *
 * Emulator-only test accounts (all use the password below):
 *   vpm@test.local · educator@test.local · pledge1@test.local · pledge2@test.local · pledge3@test.local
 */
const PASSWORD = 'emulator-only-123';
const PROJECT = 'umiami-akpsi';
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const API = 'http://127.0.0.1:5002/api/portal';

const people = [
  { key: 'vpm', email: 'vpm@test.local', name: 'Valeria Martinez', role: 'vpm' },
  { key: 'edu', email: 'educator@test.local', name: 'Ethan Brooks', role: 'educator' },
  { key: 'p1', email: 'pledge1@test.local', name: 'Sofia Alvarez', role: 'pledge' },
  { key: 'p2', email: 'pledge2@test.local', name: 'Marcus Chen', role: 'pledge' },
  { key: 'p3', email: 'pledge3@test.local', name: 'Olivia Grant', role: 'pledge' },
];

const j = async (url, opts = {}) => {
  const r = await fetch(url, opts);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${opts.method || 'GET'} ${url} → ${r.status} ${JSON.stringify(body)}`);
  return body;
};
const call = (tok, method, path, body) => j(`${API}/${path}`, {
  method, headers: { Authorization: `Bearer ${tok}`, ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
  body: body instanceof FormData ? body : body && JSON.stringify(body),
});

/* A real one-page PDF so the review viewer has something to show */
function pdf(title) {
  const text = `BT /F1 26 Tf 72 700 Td (${title}) Tj 0 -40 Td /F1 14 Tf (Beta Pi pledge submission - sample file) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}

(async () => {
  const exp = new Date(Date.now() + 30 * 864e5).toISOString();
  const tok = {}, uid = {};
  for (const p of people) {
    const code = `SEED${p.key.toUpperCase()}`;
    await j(`${FS}/invites/${code}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { role: { stringValue: p.role }, name: { stringValue: p.name }, educatorUid: { stringValue: '' }, createdAt: { stringValue: new Date().toISOString() }, expiresAt: { stringValue: exp }, usedBy: { nullValue: null } } }) });
    let a;
    try { a = await j(`${AUTH}/accounts:signUp?key=x`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: p.email, password: PASSWORD, returnSecureToken: true }) }); }
    catch { a = await j(`${AUTH}/accounts:signInWithPassword?key=x`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: p.email, password: PASSWORD, returnSecureToken: true }) }); }
    tok[p.key] = a.idToken; uid[p.key] = a.localId;
    await call(a.idToken, 'POST', 'claim', { code, name: p.name }).catch(e => { if (!/already set up/.test(e.message)) throw e; });
    console.log(`account ready: ${p.email} (${p.role})`);
  }

  /* Week 1 started 15 days ago, so the class is in Week 3 */
  const start = new Date(); start.setDate(start.getDate() - 15); start.setHours(0, 0, 0, 0);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await call(tok.vpm, 'PUT', 'program', { className: 'Fall 2026 Pledge Class', startDate: iso(start), weeks: [
    { title: 'Orientation', hole: 'The first tee', summary: 'Meet your class, your educators, and what the next eight weeks look like.' },
    { title: 'History & Ritual', hole: 'Learning the course', summary: 'The story of Alpha Kappa Psi and the Beta Pi chapter.' },
    { title: 'Brotherhood', hole: 'Playing as a group', summary: 'Get to know the brothers. One-on-ones and a class project kick off.' },
    { title: 'Professional Development', hole: 'Reading the green', summary: 'Resume, LinkedIn, and your elevator pitch.' },
    { title: 'Service', hole: 'Course care', summary: 'Philanthropy week: suicide prevention awareness.' },
    { title: 'Leadership', hole: 'Calling the shot', summary: 'Lead a class meeting and plan the class event.' },
    { title: 'Chapter Operations', hole: 'The back nine', summary: 'How the chapter runs: committees, budget, and bylaws.' },
    { title: 'Initiation', hole: 'The final green', summary: 'Final review and initiation week.' },
  ] });

  const due = (week, dayOffset, h = 23, m = 59) => { const d = new Date(start); d.setDate(d.getDate() + 7 * (week - 1) + dayOffset); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const D = {};
  const items = [
    ['bio', 1, 'Introduction bio', 'Write a 150-word bio: hometown, major, why AKPsi. Upload as a PDF.', due(1, 4)],
    ['headshot', 1, 'Professional headshot', 'Upload a professional headshot (JPG or PNG). Plain background, business attire.', due(1, 6)],
    ['history', 2, 'Chapter history quiz', 'Read the Beta Pi history packet and upload your completed quiz.', due(2, 5)],
    ['creed', 2, 'Creed reflection', 'One page on what the creed means to you.', due(2, 6)],
    ['oneonones', 3, 'Brother one-on-ones (5)', 'Meet five brothers. Upload your signed one-on-one sheet.', due(3, 5)],
    ['project', 3, 'Class project proposal', 'Submit your class project proposal as a group (each pledge uploads).', due(3, 6)],
    ['resume', 4, 'Resume review', 'Upload your resume using the chapter template.', due(4, 5)],
    ['linkedin', 4, 'LinkedIn profile', 'Paste your LinkedIn link. Headline, photo, and About section complete.', due(4, 6)],
  ];
  for (const [k, week, name, instructions, dueAt] of items) {
    const r = await call(tok.vpm, 'POST', 'items/deliverables', { name, week, instructions, dueAt, resources: k === 'resume' ? [{ name: 'Chapter resume template', url: 'https://docs.google.com/' }] : [] });
    D[k] = r.item.id;
  }
  await call(tok.vpm, 'POST', 'items/resources', { title: 'Pledge handbook', week: 0, url: 'https://example.com/handbook', description: 'Everything about the program in one place.' });
  await call(tok.vpm, 'POST', 'items/resources', { title: 'Beta Pi history packet', week: 2, url: 'https://example.com/history' });
  await call(tok.vpm, 'POST', 'items/announcements', { title: 'Week 3 kickoff', body: 'One-on-ones start this week. Sign-up sheet is in the group chat.', pinned: true });
  await call(tok.vpm, 'POST', 'items/portalEvents', { title: 'Pledge meeting', date: iso(new Date(start.getTime() + 15 * 864e5 + 864e5)), time: '7:00 PM', location: 'Herbert Business School', kind: 'meeting', week: 3 });
  await call(tok.vpm, 'POST', 'items/portalEvents', { title: 'Brotherhood dinner', date: iso(new Date(start.getTime() + 19 * 864e5)), time: '8:00 PM', location: 'Coral Gables', kind: 'event', week: 3 });

  for (const p of ['p1', 'p2', 'p3']) await call(tok.vpm, 'PATCH', `users/${uid[p]}`, { educatorUid: uid.edu });

  const submit = async (p, d, title) => { const fd = new FormData(); fd.append('file', pdf(title), `${title}.pdf`); fd.append('note', ''); fd.append('link', ''); return call(tok[p], 'POST', `submit/${D[d]}`, fd); };
  const s = {};
  s.p1bio = await submit('p1', 'bio', 'Sofia - Introduction bio');
  s.p1head = await submit('p1', 'headshot', 'Sofia - Headshot');
  s.p1hist = await submit('p1', 'history', 'Sofia - History quiz');
  s.p1creed = await submit('p1', 'creed', 'Sofia - Creed reflection');
  s.p2bio = await submit('p2', 'bio', 'Marcus - Introduction bio');
  s.p2hist = await submit('p2', 'history', 'Marcus - History quiz');
  s.p3bio = await submit('p3', 'bio', 'Olivia - Introduction bio');
  s.p3head = await submit('p3', 'headshot', 'Olivia - Headshot');
  s.p3one = await submit('p3', 'oneonones', 'Olivia - One-on-ones');

  const review = (sub, action, comment = '') => call(tok.edu, 'POST', `review/${sub.submission.id}`, { action, comment });
  await review(s.p1bio, 'approve', 'Great intro.');
  await review(s.p1head, 'approve');
  await review(s.p1hist, 'approve');
  await review(s.p2bio, 'revise', 'Add your hometown and why you chose AKPsi.');
  await review(s.p3bio, 'approve');
  console.log('\nSeeded: program, 8 deliverables, resources, an announcement, 2 events, 9 submissions, 5 reviews.');
  console.log('Open http://127.0.0.1:5002/portal.html');
})().catch(e => { console.error(e.message); process.exit(1); });
