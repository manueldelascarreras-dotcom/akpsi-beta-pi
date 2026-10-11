/* Beta Pi CMS */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(method, url, body) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(url, opts);
  let data = {}; try { data = await res.json(); } catch {}
  if (res.status === 401 && !url.includes('/login') && !url.includes('/session')) { showAuth(false); throw new Error('Please log in again.'); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
/* Live site: content is in Firestore. Local server: data/*.json. */
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const CONTENT_URL = 'https://firestore.googleapis.com/v1/projects/umiami-akpsi/databases/(default)/documents/content/';
const loadData = name => LOCAL
  ? fetch(`data/${name}.json?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json())
  : fetch(CONTENT_URL + name, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(new Error(`Could not load ${name}.`))).then(d => JSON.parse(d.fields.json.stringValue));

let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg; t.classList.toggle('err', err); t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

const I = {
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  ul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
};

const STATUSES = [
  { id: 'New', label: 'New', color: '#3D6FB6' },
  { id: 'Reviewing', label: 'Reviewing', color: '#6B4FBB' },
  { id: 'Interview', label: 'Interview', color: '#B7791F' },
  { id: 'Bid', label: 'Bid extended', color: '#1F8A5B' },
  { id: 'Declined', label: 'Not moving forward', color: '#C53D3D' },
];
const GROUPS = [
  { key: 'eboard', label: 'E-Board' },
  { key: 'pledgeEducators', label: 'Pledge Educators' },
  { key: 'brothers', label: 'Brothers' },
  { key: 'nibs', label: 'NIBs' },
];
const EVENT_TYPES = ['Rush', 'Professional', 'Philanthropy', 'Brotherhood', 'Social', 'Other'];
const DATA_SOURCES = ['site', 'members', 'events', 'gallery'];

const state = {
  site: null, members: null, events: null, gallery: null, apps: [],
  saved: {}, view: 'applications', term: null,
  appF: { q: '', status: '', timing: '', sort: 'newest' },
  memberTab: 'brothers', memberQ: '', eventTab: 'upcoming', eventView: 'calendar', calMonth: null,
  drawerId: null,
};

/* ───────────── path helpers + dirty tracking ───────────── */

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
function setPath(obj, path, val) {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k, i) => {
    if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  });
  o[keys.at(-1)] = val;
}
const snapshot = src => { state.saved[src] = JSON.stringify(state[src]); };
const isDirty = src => state.saved[src] !== undefined && JSON.stringify(state[src]) !== state.saved[src];
const anyDirty = () => DATA_SOURCES.some(isDirty);
const updateSavebar = () => $('#savebar').classList.toggle('show', anyDirty());

async function saveAll() {
  const dirty = DATA_SOURCES.filter(isDirty);
  try {
    for (const src of dirty) { await api('PUT', `/api/admin/data/${src}`, state[src]); snapshot(src); }
    updateSavebar();
    toast('Saved. The website is updated.');
  } catch (e) { toast(e.message, true); }
}
async function saveNow(src, msg) {
  try { await api('PUT', `/api/admin/data/${src}`, state[src]); snapshot(src); updateSavebar(); if (msg) toast(msg); }
  catch (e) { toast(e.message, true); }
}
function discardAll() {
  DATA_SOURCES.forEach(src => { if (isDirty(src)) state[src] = JSON.parse(state.saved[src]); });
  updateSavebar(); render(); toast('Changes discarded.');
}
addEventListener('beforeunload', e => { if (anyDirty()) { e.preventDefault(); e.returnValue = ''; } });

/* ───────────── auth ───────────── */

let setupMode = false;
function showAuth(setup) {
  setupMode = setup;
  $('#app').hidden = true; $('#auth').hidden = false;
  $('#authTitle').textContent = 'Alpha Kappa Psi';
  $('#authText').textContent = setup ? 'Beta Pi CMS. Create the admin password and share it only with the e-board.' : 'Beta Pi CMS. Log in to see pledge submissions and manage the chapter site.';
  $('#authPass2').hidden = !setup; $('#authPass2').required = setup;
  $('#authPass').autocomplete = setup ? 'new-password' : 'current-password';
  $('#authBtn').textContent = setup ? 'Create password' : 'Log in';
  $('#authError').textContent = '';
  $('#authPass').focus();
}
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const p = $('#authPass').value;
  if (setupMode && p !== $('#authPass2').value) return ($('#authError').textContent = "Passwords don't match.");
  try {
    await api('POST', `/api/admin/${setupMode ? 'setup' : 'login'}`, { password: p });
    $('#authPass').value = $('#authPass2').value = '';
    boot();
  } catch (err) { $('#authError').textContent = err.message; }
});
$('#logout').addEventListener('click', async () => {
  if (anyDirty() && !confirm('You have unsaved changes. Log out anyway?')) return;
  await api('POST', '/api/admin/logout'); location.reload();
});
$('#changePass').addEventListener('click', () => {
  const m = modal('Change password', `
    <div class="stack">
      <label class="f"><span>Current password</span><input class="input" type="password" id="pwCur" autocomplete="current-password"></label>
      <label class="f"><span>New password</span><input class="input" type="password" id="pwNew" autocomplete="new-password"><small>At least 8 characters.</small></label>
      <label class="f"><span>Confirm new password</span><input class="input" type="password" id="pwNew2" autocomplete="new-password"></label>
    </div>`, 'Update password');
  m.onOk = async () => {
    if ($('#pwNew').value !== $('#pwNew2').value) throw new Error("New passwords don't match.");
    await api('POST', '/api/admin/password', { current: $('#pwCur').value, next: $('#pwNew').value });
    toast('Password updated.');
  };
});

/* ───────────── Pledge program (read from the pledge portal) ─────────────
 * Submissions: every deliverable received, with times and lateness.
 * Assignments: each deliverable's due date and turn-in counts.
 * Pledges: the roster with progress, grades, late and missing work.
 * Reviewing, grading, and posting assignments happen in the portal itself.
 */
const PORTAL = './';
async function loadPortal(force) {
  if (state.portal && !force) return state.portal;
  state.portal = await api('GET', '/api/admin/portal');
  return state.portal;
}
const pp = {
  pledges: () => state.portal.people.filter(p => p.role === 'pledge' && p.active).sort((a, b) => a.name.localeCompare(b.name)),
  person: uid => state.portal.people.find(p => p.uid === uid),
  deliv: id => state.portal.deliverables.find(d => d.id === id),
  sub: (dId, uid) => state.portal.submissions.find(s => s.deliverableId === dId && s.pledgeUid === uid),
};
/* Same rules as the portal: Approved, Needs revision, Submitted (Late if after the due date); none + past due = Missing */
function pStatus(d, uid) {
  const s = pp.sub(d.id, uid);
  if (s?.status === 'approved') return { key: 'approved', label: 'Approved', tone: 'ok', s };
  if (s?.status === 'needs_revision') return { key: 'revision', label: 'Needs revision', tone: 'warn', s };
  if (s) return { key: 'submitted', label: s.late ? 'Submitted late' : 'Waiting for review', tone: s.late ? 'bad' : 'info', s };
  if (d.dueAt && Date.now() > Date.parse(d.dueAt)) return { key: 'missing', label: 'Missing', tone: 'bad' };
  return { key: 'open', label: 'Not due yet', tone: '' };
}
const fmtTime = iso => iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
function lateBy(dueIso, atIso) {
  const ms = Date.parse(atIso) - Date.parse(dueIso);
  if (!(ms > 0)) return '';
  const h = Math.round(ms / 36e5);
  return h < 24 ? `${Math.max(1, h)}h late` : `${Math.floor(h / 24)}d ${h % 24}h late`;
}
const portalFile = (path, dl) => `/api/admin/portal-file?path=${encodeURIComponent(path)}${dl ? '&download=1' : ''}`;
const portalNote = text => `<div class="note portal-note">${text} <a href="${PORTAL}#/review" target="_blank" rel="noopener">Open the pledge portal ↗</a></div>`;

function portalLoading(title) {
  $('#view').innerHTML = `<div class="page-head"><div><h1>${title}</h1><p>Loading the pledge program…</p></div></div>`;
}
async function withPortal(title, draw) {
  if (!state.portal) {
    portalLoading(title);
    try { await loadPortal(); } catch (e) { $('#view').innerHTML = `<div class="page-head"><div><h1>${title}</h1><p>${esc(e.message)}</p></div></div>`; return; }
  }
  draw();
}

/* ── Submissions ── */
state.subFilter = { q: '', week: '', status: 'all', deliv: '' };
function renderSubmissions() {
  withPortal('Submissions', () => {
    const F = state.subFilter;
    const P = state.portal;
    const ps = pp.pledges();
    /* One row per turned-in deliverable, plus one per missing one */
    const rows = [];
    P.submissions.forEach(s => { const d = pp.deliv(s.deliverableId), p = pp.person(s.pledgeUid); if (d && p) rows.push({ d, p, st: pStatus(d, p.uid), s }); });
    ps.forEach(p => P.deliverables.forEach(d => { const st = pStatus(d, p.uid); if (st.key === 'missing') rows.push({ d, p, st }); }));
    const count = k => rows.filter(r => k === 'all' ? r.s : k === 'late' ? r.s?.late : r.st.key === k).length;
    const shown = rows.filter(r => (F.status === 'all' ? r.s : F.status === 'late' ? r.s?.late : r.st.key === F.status)
      && (!F.week || String(r.d.week) === F.week) && (!F.deliv || r.d.id === F.deliv)
      && (!F.q || `${r.p.name} ${r.d.name}`.toLowerCase().includes(F.q.toLowerCase())))
      .sort((a, b) => String(b.s?.submittedAt || b.d.dueAt).localeCompare(String(a.s?.submittedAt || a.d.dueAt)));
    const tabs = [['all', 'All received'], ['submitted', 'Waiting for review'], ['revision', 'Needs revision'], ['approved', 'Approved'], ['late', 'Turned in late'], ['missing', 'Missing']];
    $('#view').innerHTML = `
      <div class="page-head"><div><h1>Submissions</h1><p>Every deliverable pledges have turned in, with the exact time and whether it was late.</p></div>
        <div class="actions"><button class="btn" id="subRefresh">Refresh</button><button class="btn" id="subExport">${I.dl}Export to Excel</button></div></div>
      ${portalNote('To review, grade, or comment on a submission, use the pledge portal.')}
      <div class="stats">
        <div class="panel stat"><div class="k">Received</div><div class="v">${count('all')}</div><div class="s">from ${ps.length} pledges</div></div>
        <div class="panel stat"><div class="k">Waiting for review</div><div class="v">${count('submitted')}</div><div class="s">educators haven't graded yet</div></div>
        <div class="panel stat"><div class="k">Turned in late</div><div class="v">${count('late')}</div><div class="s">after the due time</div></div>
        <div class="panel stat"><div class="k">Missing</div><div class="v">${count('missing')}</div><div class="s">past due, not turned in</div></div>
      </div>
      <div class="panel">
        <div class="toolbar">
          <div class="search">${I.search}<input class="input" id="subQ" placeholder="Search pledge or assignment" value="${esc(F.q)}"></div>
          <select class="select" id="subWeek" style="width:auto"><option value="">All weeks</option>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${F.week === String(n) ? 'selected' : ''}>Week ${n}${P.program.weeks[n - 1]?.title ? ` · ${esc(P.program.weeks[n - 1].title)}` : ''}</option>`).join('')}</select>
          ${F.deliv ? `<button class="chip on" id="subClearDeliv">${esc(pp.deliv(F.deliv)?.name || '')} ✕</button>` : ''}
          <span class="grow"></span><span class="muted small">${shown.length} shown</span>
        </div>
        <div class="toolbar"><div class="tabs">${tabs.map(([k, l]) => `<button class="${F.status === k ? 'on' : ''}" data-substatus="${k}">${l}<span>${count(k)}</span></button>`).join('')}</div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Pledge</th><th>Assignment</th><th>Due</th><th>Turned in</th><th>Timing</th><th>Status</th><th>Grade</th><th>Reviewed by</th><th>Files</th></tr></thead>
          <tbody>${shown.length ? shown.map(({ d, p, st, s }) => `<tr>
            <td class="nowrap"><b>${esc(p.name)}</b><div class="muted small">${esc(pp.person(p.educatorUid)?.name || 'No educator')}</div></td>
            <td>${esc(d.name)}<div class="muted small">Week ${d.week}</div></td>
            <td class="nowrap">${fmtTime(d.dueAt)}</td>
            <td class="nowrap">${s ? fmtTime(s.submittedAt) : '<span class="muted">Not turned in</span>'}${s && s.firstSubmittedAt && s.firstSubmittedAt !== s.submittedAt ? `<div class="muted small">first ${fmtTime(s.firstSubmittedAt)}</div>` : ''}</td>
            <td class="nowrap">${s ? (s.late ? `<span class="pill bad">${lateBy(d.dueAt, s.submittedAt) || 'Late'}</span>` : '<span class="pill ok">On time</span>') : `<span class="pill bad">${lateBy(d.dueAt, new Date().toISOString()).replace('late', 'overdue')}</span>`}</td>
            <td><span class="pill ${st.tone}">${st.label}</span></td>
            <td>${s?.grade != null ? `<b>${s.grade}</b><span class="muted">/100</span>` : '<span class="muted">—</span>'}</td>
            <td class="small">${esc(s?.reviewedByName || '') || '<span class="muted">—</span>'}</td>
            <td class="files">${s ? [...(s.files || []).map((f, i) => `<a href="${portalFile(f.path)}" target="_blank" rel="noopener" title="${esc(f.name)}">${I.file}${(s.files || []).length > 1 ? `File ${i + 1}` : 'View file'}</a>`), s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${I.ext}Link</a>` : ''].join('') || '<span class="muted small">Note only</span>' : ''}</td>
          </tr>`).join('') : `<tr><td colspan="9"><div class="empty-state"><b>Nothing here</b>${P.deliverables.length ? 'Try another filter.' : 'Post assignments in the pledge portal (Classwork → Create) and submissions will show up here.'}</div></td></tr>`}</tbody>
        </table></div>
      </div>`;
    $('#subQ').oninput = e => { F.q = e.target.value; const pos = e.target.selectionStart; renderSubmissions(); const i = $('#subQ'); i.focus(); i.setSelectionRange(pos, pos); };
    $('#subWeek').onchange = e => { F.week = e.target.value; renderSubmissions(); };
    $('#subClearDeliv')?.addEventListener('click', () => { F.deliv = ''; renderSubmissions(); });
    $$('[data-substatus]').forEach(b => b.onclick = () => { F.status = b.dataset.substatus; renderSubmissions(); });
    $('#subRefresh').onclick = async () => { try { await loadPortal(true); renderSubmissions(); toast('Up to date.'); } catch (e) { toast(e.message, true); } };
    $('#subExport').onclick = () => downloadSheet(`Beta Pi submissions ${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['Pledge', 'Pledge educator', 'Week', 'Assignment', 'Due', 'Turned in', 'Timing', 'Status', 'Grade', 'Reviewed by', 'Files'],
      shown.map(({ d, p, st, s }) => [p.name, pp.person(p.educatorUid)?.name || '', d.week, d.name, fmtTime(d.dueAt), s ? fmtTime(s.submittedAt) : 'Not turned in',
        s ? (s.late ? lateBy(d.dueAt, s.submittedAt) || 'Late' : 'On time') : 'Missing', st.label, s?.grade ?? '', s?.reviewedByName || '', (s?.files || []).map(f => f.name).join(', ')]),
      [22, 20, 7, 30, 22, 22, 14, 18, 8, 18, 30]);
  });
}

/* ── Assignments ── */
function renderAssignments() {
  withPortal('Assignments', () => {
    const P = state.portal, ps = pp.pledges();
    const rows = P.deliverables.map(d => {
      const st = ps.map(p => pStatus(d, p.uid));
      const grades = st.map(x => x.s?.grade).filter(g => g != null);
      return { d, turned: st.filter(x => x.s).length, late: st.filter(x => x.s?.late).length, missing: st.filter(x => x.key === 'missing').length,
        approved: st.filter(x => x.key === 'approved').length, waiting: st.filter(x => x.key === 'submitted').length,
        avg: grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length * 10) / 10 : null };
    });
    $('#view').innerHTML = `
      <div class="page-head"><div><h1>Assignments</h1><p>Every deliverable in the 8-week program, its due time, and who has turned it in.</p></div>
        <div class="actions"><a class="btn primary" href="${PORTAL}#/classwork" target="_blank" rel="noopener">${I.plus}Add or edit in the portal ↗</a></div></div>
      ${portalNote('Assignments and materials are created in the portal under Classwork → Create.')}
      <div class="panel"><div class="table-wrap"><table>
        <thead><tr><th>Week</th><th>Assignment</th><th>Due</th><th>Turned in</th><th>Waiting</th><th>Late</th><th>Missing</th><th>Approved</th><th>Avg grade</th></tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr class="click" data-deliv="${r.d.id}" title="See these submissions">
          <td class="nowrap"><b>Week ${r.d.week}</b><div class="muted small">${esc(P.program.weeks[r.d.week - 1]?.title || '')}</div></td>
          <td><b>${esc(r.d.name)}</b></td><td class="nowrap">${fmtTime(r.d.dueAt)}</td>
          <td><b>${r.turned}</b><span class="muted">/${ps.length}</span></td><td>${r.waiting || '<span class="muted">0</span>'}</td>
          <td>${r.late ? `<span class="pill bad">${r.late}</span>` : '<span class="muted">0</span>'}</td>
          <td>${r.missing ? `<span class="pill bad">${r.missing}</span>` : '<span class="muted">0</span>'}</td>
          <td>${r.approved ? `<span class="pill ok">${r.approved}</span>` : '<span class="muted">0</span>'}</td>
          <td>${r.avg ?? '<span class="muted">—</span>'}</td></tr>`).join('') : `<tr><td colspan="9"><div class="empty-state"><b>No assignments yet</b>Create them in the pledge portal under Classwork.</div></td></tr>`}</tbody>
      </table></div></div>`;
    $$('[data-deliv]').forEach(r => r.onclick = () => { Object.assign(state.subFilter, { deliv: r.dataset.deliv, status: 'all', week: '', q: '' }); state.view = 'submissions'; location.hash = 'submissions'; renderNav(); render(); });
  });
}

/* ── Pledges ── */
function renderPledgeRoster() {
  withPortal('Pledges', () => {
    const P = state.portal, ps = pp.pledges();
    const rows = ps.map(p => {
      const st = P.deliverables.map(d => pStatus(d, p.uid));
      const grades = st.map(x => x.s?.grade).filter(g => g != null);
      const last = st.map(x => x.s?.submittedAt).filter(Boolean).sort().pop();
      return { p, approved: st.filter(x => x.key === 'approved').length, late: st.filter(x => x.s?.late).length, missing: st.filter(x => x.key === 'missing').length,
        avg: grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length * 10) / 10 : null, last };
    });
    const educators = P.people.filter(p => ['educator', 'vpm'].includes(p.role) && p.active);
    $('#view').innerHTML = `
      <div class="page-head"><div><h1>Pledges</h1><p>${ps.length} ${ps.length === 1 ? 'pledge' : 'pledges'} and ${(n => `${n} pledge ${n === 1 ? 'educator' : 'educators'}`)(educators.filter(e => e.role === 'educator').length)} in ${esc(P.program.className)}.</p></div>
        <div class="actions"><a class="btn" href="${PORTAL}#/people" target="_blank" rel="noopener">${I.users}Invite or manage in the portal ↗</a>
          <button class="btn" id="rosterExport">${I.dl}Export to Excel</button></div></div>
      ${portalNote('Invite codes, roles, and educator assignments live in the portal under People & access.')}
      <div class="panel"><div class="table-wrap"><table>
        <thead><tr><th>Pledge</th><th>Pledge educator</th><th>Approved</th><th>Avg grade</th><th>Late</th><th>Missing</th><th>Last turned in</th></tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr>
          <td><b>${esc(r.p.name)}</b><div class="muted small">${esc(r.p.email || '')}</div></td>
          <td>${esc(pp.person(r.p.educatorUid)?.name || '') || '<span class="muted">Not assigned</span>'}</td>
          <td><b>${r.approved}</b><span class="muted">/${P.deliverables.length}</span></td>
          <td>${r.avg ?? '<span class="muted">—</span>'}</td>
          <td>${r.late ? `<span class="pill bad">${r.late}</span>` : '<span class="muted">0</span>'}</td>
          <td>${r.missing ? `<span class="pill bad">${r.missing}</span>` : '<span class="muted">0</span>'}</td>
          <td class="nowrap">${r.last ? fmtTime(r.last) : '<span class="muted">Nothing yet</span>'}</td></tr>`).join('')
          : `<tr><td colspan="7"><div class="empty-state"><b>No pledges yet</b>Create invite codes in the portal under People & access.</div></td></tr>`}</tbody>
      </table></div></div>`;
    $('#rosterExport').onclick = () => downloadSheet(`Beta Pi pledges ${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['Pledge', 'Email', 'Pledge educator', 'Approved', 'Average grade', 'Late', 'Missing', 'Last turned in'],
      rows.map(r => [r.p.name, r.p.email || '', pp.person(r.p.educatorUid)?.name || '', `${r.approved}/${P.deliverables.length}`, r.avg ?? '', r.late, r.missing, r.last ? fmtTime(r.last) : '']),
      [22, 28, 20, 10, 12, 8, 8, 22]);
  });
}

/* ───────────── shell ───────────── */

const VIEWS = [
  { group: 'Pledge program' },
  { id: 'submissions', label: 'Submissions', icon: I.inbox, render: renderSubmissions },
  { id: 'assignments', label: 'Assignments', icon: I.file, render: renderAssignments },
  { id: 'pledges', label: 'Pledges', icon: I.users, render: renderPledgeRoster },
  { group: 'Chapter website' },
  { id: 'applications', label: 'Rush applications', icon: I.inbox, render: renderApplications },
  { id: 'rush', label: 'Rush Settings', icon: I.flag, render: renderRush },
  { id: 'members', label: 'Members', icon: I.users, render: renderMembers },
  { id: 'events', label: 'Events', icon: I.cal, render: renderEvents },
  { id: 'gallery', label: 'Gallery', icon: I.image, render: renderGallery },
  { id: 'content', label: 'Site Content', icon: I.sliders, render: renderContent },
];

async function boot() {
  try {
    const [site, members, events, gallery, apps] = await Promise.all([
      loadData('site'), loadData('members'), loadData('events'), loadData('gallery').catch(() => []), api('GET', '/api/admin/applications'),
    ]);
    Object.assign(state, { site, members, events, gallery, apps });
    DATA_SOURCES.forEach(snapshot);
    state.term = site.apply?.term || terms()[0] || '';
    state.view = VIEWS.some(v => v.id && v.id === location.hash.slice(1)) ? location.hash.slice(1) : 'submissions';
    $('#auth').hidden = true; $('#app').hidden = false;
    renderNav(); render();
  } catch (e) { toast(e.message, true); }
}

function renderNav() {
  const cur = state.apps.filter(a => a.term === state.site.apply?.term && a.status === 'New').length;
  $('#sideNav').innerHTML = VIEWS.map(v => v.group ? `<div class="nav-group">${v.group}</div>` : `
    <button type="button" data-view="${v.id}" class="${v.id === state.view ? 'active' : ''}">
      ${v.icon}${v.label}${v.id === 'applications' && cur ? `<span class="badge" title="New this semester">${cur}</span>` : ''}
    </button>`).join('');
}
$('#sideNav').addEventListener('click', e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  state.view = b.dataset.view; location.hash = state.view;
  if (state.view === 'members') state.selfUpdates = undefined;   // refetch so brothers' latest updates show
  $('#side').classList.remove('open');
  renderNav(); render(); scrollTo(0, 0);
});
$('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
$('#saveBtn').addEventListener('click', saveAll);
$('#discardBtn').addEventListener('click', discardAll);

function render() { VIEWS.find(v => v.id === state.view).render(); }

/* Generic data binding: inputs with data-src + data-path write straight into state */
$('#view').addEventListener('input', bindInput);
$('#view').addEventListener('change', bindInput);
function bindInput(e) {
  const el = e.target;
  if (!el.dataset.path || !el.dataset.src) return;
  let v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.type === 'number') v = el.value === '' ? '' : Number(el.value);
  if (el.dataset.type === 'lines') v = el.value.split('\n').map(s => s.trim()).filter(Boolean);
  setPath(state[el.dataset.src], el.dataset.path, v);
  updateSavebar();
}

/* Generic list actions: add / delete / move rows inside a data list */
$('#view').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const { act, src, path } = b.dataset, i = +b.dataset.i;
  if (path === '') return;                       // root-level lists are handled below
  const list = getPath(state[src], path) || [];
  if (!getPath(state[src], path)) setPath(state[src], path, list);
  if (act === 'add') list.push(JSON.parse(b.dataset.tpl || '{}'));
  if (act === 'del') list.splice(i, 1);
  if (act === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
  if (act === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
  updateSavebar(); render();
});

/* Generic upload: <input type=file data-upload=folder data-src data-path> */
$('#view').addEventListener('change', async e => {
  const el = e.target;
  if (!el.dataset.upload || !el.files.length) return;
  try {
    const files = await uploadFiles(el.files, el.dataset.upload);
    setPath(state[el.dataset.src], el.dataset.path, files[0].path);
    updateSavebar(); render(); toast('Uploaded. Click Save changes to publish.');
  } catch (err) { toast(err.message, true); }
});
async function uploadFiles(fileList, folder) {
  const fd = new FormData();
  [...fileList].forEach(f => fd.append('file', f));
  toast(`Uploading ${fileList.length > 1 ? fileList.length + ' files' : fileList[0].name}…`);
  return (await api('POST', `/api/admin/upload?folder=${folder}`, fd)).files;
}

/* Modal helper. Set m.onOk (may be async; throw to show an error). */
function modal(title, body, okLabel = 'Save', { wide = false, danger = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `
    <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
      <div class="modal-body">${body}<p class="auth-error" data-err></p></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button></div>
    </div>`;
  document.body.appendChild(wrap);
  const m = { el: wrap, onOk: null, close: () => { wrap.remove(); document.removeEventListener('keydown', onKey); } };
  const onKey = e => { if (e.key === 'Escape') m.close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', async e => {
    if (e.target === wrap || e.target.closest('[data-close]')) return m.close();
    if (e.target.closest('[data-ok]')) {
      const btn = e.target.closest('[data-ok]');
      try { btn.disabled = true; if (m.onOk) await m.onOk(); m.close(); }
      catch (err) { $('[data-err]', wrap).textContent = err.message; btn.disabled = false; }
    }
  });
  setTimeout(() => $('input, textarea, select', wrap)?.focus(), 30);
  return m;
}

/* Field + list editor builders */
function field(src, path, label, { type = 'text', ph = '', hint = '', options = [], rows = 3, numType } = {}) {
  const v = getPath(state[src], path);
  const attrs = `data-src="${src}" data-path="${path}"${numType ? ' data-type="number"' : ''}`;
  let input;
  if (type === 'textarea') input = `<textarea class="textarea" rows="${rows}" ${attrs} placeholder="${esc(ph)}">${esc(v)}</textarea>`;
  else if (type === 'lines') input = `<textarea class="textarea" rows="${rows}" data-src="${src}" data-path="${path}" data-type="lines" placeholder="${esc(ph)}">${esc((v || []).join('\n'))}</textarea>`;
  else if (type === 'select') input = `<select class="select" ${attrs}>${options.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  else input = `<input class="input" type="${type}" value="${esc(v)}" ${attrs} placeholder="${esc(ph)}">`;
  return `<label class="f"><span>${esc(label)}</span>${input}${hint ? `<small>${hint}</small>` : ''}</label>`;
}
function uploadField(src, path, label, folder, accept = 'image/*') {
  const v = getPath(state[src], path);
  const isVideo = /\.(mp4|webm|mov)$/i.test(v || '');
  return `<label class="f"><span>${esc(label)}</span>
    <div class="upload-box">
      ${v && !isVideo ? `<img src="${esc(v)}" alt="">` : `<div class="ph">${v ? 'Video' : 'None'}</div>`}
      <div class="actions">
        <label class="btn sm">${I.ul}Upload<input type="file" hidden accept="${accept}" data-upload="${folder}" data-src="${src}" data-path="${path}"></label>
        ${v ? `<button type="button" class="btn sm ghost" data-clear="${src}|${path}">Remove</button>` : ''}
      </div>
    </div></label>`;
}
$('#view').addEventListener('click', e => {
  const b = e.target.closest('[data-clear]'); if (!b) return;
  const [src, path] = b.dataset.clear.split('|');
  setPath(state[src], path, ''); updateSavebar(); render();
});
function listEditor(src, path, cols, fields, tpl, addLabel = 'Add') {
  const list = getPath(state[src], path) || [];
  return `<div class="rows" data-sortable data-src="${src}" data-path="${path}">
    ${list.map((item, i) => `
      <div class="row-edit" data-i="${i}" style="grid-template-columns:${cols} auto">
        ${fields.map(f => f.type === 'upload'
          ? uploadField(src, `${path}.${i}.${f.key}`, f.label, f.folder, f.accept)
          : f.type === 'urlupload'
            ? `<div>${field(src, `${path}.${i}.${f.key}`, f.label, { ph: f.ph })}
                <label class="btn sm" style="margin-top:6px">${I.ul}Upload file<input type="file" hidden accept="${f.accept || 'image/*'}" data-upload="${f.folder}" data-src="${src}" data-path="${path}.${i}.${f.key}"></label></div>`
            : field(src, `${path}.${i}.${f.key}`, f.label, f)).join('')}
        <div class="tools">
          <button type="button" class="icon-btn" title="Remove" data-act="del" data-src="${src}" data-path="${path}" data-i="${i}">${I.trash}</button>
          <button type="button" class="icon-btn drag-handle" title="Drag to reorder (or use arrow keys)" aria-label="Drag to reorder" data-drag>${I.grip}</button>
        </div>
      </div>`).join('')}
    <button type="button" class="btn sm add-row" data-act="add" data-src="${src}" data-path="${path}" data-tpl='${esc(JSON.stringify(tpl))}'>${I.plus}${esc(addLabel)}</button>
  </div>`;
}

/* Drag to reorder rows in any list editor. Uses pointer events so it works
   with a mouse, trackpad, or touch; arrow keys on the handle work too. */
function moveListItem(container, from, to) {
  const { src, path } = container.dataset;
  const list = getPath(state[src], path);
  if (!list || from === to || to < 0 || to >= list.length) return false;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  updateSavebar();
  return true;
}

$('#view').addEventListener('pointerdown', e => {
  const handle = e.target.closest('[data-drag]');
  if (!handle || e.button !== 0) return;
  const container = handle.closest('[data-sortable]');
  const row = handle.closest('.row-edit');
  const from = +row.dataset.i;
  e.preventDefault();
  row.classList.add('dragging');
  container.classList.add('sorting');

  const onMove = ev => {
    /* Place the row before the first other row whose midpoint is below the pointer
       (works even when the pointer is above the first row or below the last) */
    const others = [...container.querySelectorAll(':scope > .row-edit')].filter(r => r !== row);
    const before = others.find(r => { const b = r.getBoundingClientRect(); return ev.clientY < b.top + b.height / 2; });
    if (before) { if (before.previousElementSibling !== row) before.before(row); }
    else if (others.length && others.at(-1).nextElementSibling !== row) others.at(-1).after(row);
  };
  const onUp = ev => {
    if (ev && ev.type === 'pointerup') onMove(ev);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    row.classList.remove('dragging');
    container.classList.remove('sorting');
    const to = [...container.querySelectorAll(':scope > .row-edit')].indexOf(row);
    if (moveListItem(container, from, to)) render();
  };
  /* Listen on window so the drop is caught wherever the pointer is released */
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
});

$('#view').addEventListener('keydown', e => {
  const handle = e.target.closest('[data-drag]');
  if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  e.preventDefault();
  const container = handle.closest('[data-sortable]');
  const from = +handle.closest('.row-edit').dataset.i;
  const to = from + (e.key === 'ArrowUp' ? -1 : 1);
  if (moveListItem(container, from, to)) {
    render();
    container.querySelector(`.row-edit[data-i="${to}"] [data-drag]`)?.focus();
  }
});

/* ───────────── semesters ───────────── */

const SEASON = { winter: 0, spring: 1, summer: 2, fall: 3 };
const termKey = t => { const m = /(winter|spring|summer|fall)\s+(\d{4})/i.exec(t || ''); return m ? +m[2] * 10 + SEASON[m[1].toLowerCase()] : 0; };
const terms = () => [...new Set([...state.apps.map(a => a.term), state.site?.apply?.term].filter(Boolean))].sort((a, b) => termKey(b) - termKey(a));
function upcomingTerms(n = 6) {
  const now = new Date(); let y = now.getFullYear(), fall = now.getMonth() >= 5;
  const out = [];
  for (let i = 0; i < n; i++) { if (fall) { y++; fall = false; out.push(`Spring ${y}`); } else { fall = true; out.push(`Fall ${y}`); } }
  return out;
}

/* ───────────── formatting ───────────── */

const fileUrl = (p, dl) => `/api/admin/file?path=${encodeURIComponent(p)}${dl ? '&download=1' : ''}`;
const fmtDate = (iso, opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) => iso ? new Date(iso).toLocaleString('en-US', opts) : '—';
const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const linkedinUrl = v => !v ? '' : /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
const igUrl = v => v ? `https://instagram.com/${v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '')}` : '';
function relDays(iso) {
  const d = Math.round((new Date(iso) - new Date()) / 864e5);
  if (d === 0) return 'today';
  return d > 0 ? `in ${d} day${d === 1 ? '' : 's'}` : `${-d} day${d === -1 ? '' : 's'} ago`;
}

/* ═════════════ APPLICATIONS ═════════════ */

function termApps() { return state.apps.filter(a => a.term === state.term); }
function filteredApps() {
  const { q, status, timing, sort } = state.appF;
  const needle = q.trim().toLowerCase();
  const list = termApps().filter(a =>
    (!status || a.status === status) &&
    (!timing || (timing === 'late' ? a.late : !a.late)) &&
    (!needle || [a.name, a.email, a.major, a.hometown].join(' ').toLowerCase().includes(needle)));
  const by = {
    newest: (a, b) => b.submittedAt.localeCompare(a.submittedAt),
    oldest: (a, b) => a.submittedAt.localeCompare(b.submittedAt),
    name: (a, b) => a.name.localeCompare(b.name),
    status: (a, b) => STATUSES.findIndex(s => s.id === a.status) - STATUSES.findIndex(s => s.id === b.status),
  }[sort];
  return list.sort(by);
}

function renderApplications() {
  const list = termApps();
  const isCurrent = state.term === state.site.apply?.term;
  const deadline = isCurrent ? state.site.apply?.deadline : list.find(a => a.deadline)?.deadline;
  const onTime = list.filter(a => !a.late).length, late = list.length - onTime;
  const allTerms = terms();
  const open = isCurrent && state.site.apply?.open !== false;

  $('#view').innerHTML = `
    <div class="page-head">
      <div><h1>Applications</h1><p>Rush applications submitted through the website, organized by semester.</p></div>
      <div class="actions">
        <select class="select" id="termSel" style="min-width:170px">${allTerms.map(t => `<option ${t === state.term ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
        <button class="btn" id="exportApps" ${list.length ? '' : 'disabled'}>${I.dl}Export to Excel</button>
        <a class="btn" href="apply.html" target="_blank" rel="noopener">${I.ext}Open form</a>
      </div>
    </div>

    <div class="stats">
      <div class="panel stat"><div class="k">Applied</div><div class="v">${list.length}</div><div class="s">${esc(state.term)}${isCurrent ? ` · ${open ? 'accepting applications' : 'closed'}` : ''}</div></div>
      <div class="panel stat green"><div class="k">On time</div><div class="v">${onTime}</div><div class="s">${list.length ? Math.round(onTime / list.length * 100) : 0}% of applicants</div>
        <div class="meter"><i style="width:${list.length ? onTime / list.length * 100 : 0}%;background:var(--green)"></i><i style="width:${list.length ? late / list.length * 100 : 0}%;background:var(--amber)"></i></div></div>
      <div class="panel stat amber"><div class="k">Late</div><div class="v">${late}</div><div class="s">Submitted after the deadline</div></div>
      <div class="panel stat"><div class="k">Deadline</div><div class="v" style="font-size:1.6rem;margin-top:10px">${deadline ? fmtDate(deadline, { month: 'short', day: 'numeric' }) : 'Not set'}</div>
        <div class="s">${deadline ? `${fmtDate(deadline, { hour: 'numeric', minute: '2-digit' })} · ${new Date(deadline) > new Date() ? 'closes ' : 'passed '}${relDays(deadline)}` : `<a href="#rush" data-goto="rush">Set a deadline</a>`}</div></div>
    </div>

    <div class="status-row">
      <button class="chip ${!state.appF.status ? 'on' : ''}" data-status="">All <b>${list.length}</b></button>
      ${STATUSES.map(s => `<button class="chip ${state.appF.status === s.id ? 'on' : ''}" data-status="${s.id}"><span class="dot" style="background:${s.color}"></span>${s.label} <b>${list.filter(a => a.status === s.id).length}</b></button>`).join('')}
    </div>

    ${list.length ? `<div class="panel chart"><div class="panel-head" style="margin-bottom:6px"><h2>Applications per day</h2></div>${chartSVG(list, deadline)}
      <div class="chart-legend"><span><i style="background:var(--navy)"></i>On time</span><span><i style="background:var(--amber)"></i>Late</span>${deadline ? '<span><i style="background:var(--red);width:2px"></i>Deadline</span>' : ''}</div></div>` : ''}

    <div class="panel">
      <div class="toolbar">
        <div class="search grow">${I.search}<input class="input" id="appQ" placeholder="Search name, email, major, hometown" value="${esc(state.appF.q)}"></div>
        <select class="select" id="appTiming" style="width:auto"><option value="">On time + late</option><option value="ontime" ${state.appF.timing === 'ontime' ? 'selected' : ''}>On time only</option><option value="late" ${state.appF.timing === 'late' ? 'selected' : ''}>Late only</option></select>
        <select class="select" id="appSort" style="width:auto">
          ${[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['name', 'Name A–Z'], ['status', 'By status']].map(([v, l]) => `<option value="${v}" ${state.appF.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Applicant</th><th>Major</th><th>Graduation</th><th>Year</th><th>From</th><th>Submitted</th><th>Timing</th><th>Status</th></tr></thead>
        <tbody id="appRows"></tbody>
      </table></div>
    </div>`;
  renderAppRows();

  $('#termSel').onchange = e => { state.term = e.target.value; state.appF.status = ''; renderApplications(); };
  $('#appQ').oninput = e => { state.appF.q = e.target.value; renderAppRows(); };
  $('#appTiming').onchange = e => { state.appF.timing = e.target.value; renderAppRows(); };
  $('#appSort').onchange = e => { state.appF.sort = e.target.value; renderAppRows(); };
  $('#exportApps').onclick = exportApps;
  $$('[data-status]').forEach(b => b.onclick = () => { state.appF.status = b.dataset.status; renderApplications(); });
  $$('[data-goto]').forEach(a => a.onclick = e => { e.preventDefault(); state.view = a.dataset.goto; location.hash = state.view; renderNav(); render(); });
}

function statusSelect(a, cls = '') {
  return `<select class="select status-select st-${esc(a.status)} ${cls}" data-app-status="${a.id}">${STATUSES.map(s => `<option value="${s.id}" ${s.id === a.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select>`;
}

function renderAppRows() {
  const list = filteredApps();
  const total = termApps().length;
  $('#appRows').innerHTML = list.length ? list.map(a => `
    <tr class="click" data-open="${a.id}">
      <td><div class="who"><img class="thumb" src="${fileUrl(a.headshot)}" alt="" loading="lazy"><div><b>${esc(a.name)}</b><span>${esc(a.email)}</span></div></div></td>
      <td>${esc(a.major)}</td>
      <td class="nowrap">${esc(a.gradTerm)}</td>
      <td>${esc(a.year)}</td>
      <td>${esc(a.hometown)}</td>
      <td class="nowrap">${fmtDate(a.submittedAt)}</td>
      <td>${a.late ? '<span class="pill late">Late</span>' : '<span class="pill ok">On time</span>'}${a.resubmitted ? ' <span class="pill info" title="Applied more than once; showing the latest">Updated</span>' : ''}</td>
      <td>${statusSelect(a)}</td>
    </tr>`).join('')
    : `<tr><td colspan="8"><div class="empty-state">${total
        ? '<b>No applicants match these filters</b>Try clearing the search or status filter.'
        : `<b>No applications for ${esc(state.term)} yet</b>Share the <a href="apply.html" target="_blank">application form</a> and they'll show up here.`}</div></td></tr>`;
}

$('#view').addEventListener('click', e => {
  if (e.target.closest('select, a, button')) return;
  const row = e.target.closest('[data-open]');
  if (row) openDrawer(row.dataset.open);
});
document.addEventListener('change', async e => {
  const sel = e.target.closest('[data-app-status]'); if (!sel) return;
  await updateApp(sel.dataset.appStatus, { status: sel.value });
});
async function updateApp(id, patch) {
  try {
    const updated = await api('PATCH', `/api/admin/applications/${id}`, patch);
    const i = state.apps.findIndex(a => a.id === id); state.apps[i] = updated;
    renderNav();
    if (state.view === 'applications') {
      const scroll = scrollY; renderApplications(); scrollTo(0, scroll);
    }
    if (state.drawerId === id && patch.status) openDrawer(id, true);
    if (patch.status) toast(`Status: ${STATUSES.find(s => s.id === patch.status).label}`);
    return updated;
  } catch (err) { toast(err.message, true); }
}

function chartSVG(list, deadline) {
  const day = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const DAY = 864e5;
  const subs = list.map(a => day(a.submittedAt));
  /* From the first application through today (or the deadline, once it has passed), max 60 days */
  const today = day(new Date()), dlDay = deadline ? day(deadline) : Infinity;
  let start = Math.min(...subs), end = Math.max(...subs, Math.min(today, dlDay));
  if (end - start > 59 * DAY) start = end - 59 * DAY;
  if (end - start < 13 * DAY) end = start + 13 * DAY;          // at least two weeks so bars stay slim
  const n = Math.round((end - start) / DAY) + 1;
  const counts = Array(n).fill(0);
  subs.forEach(s => { const i = Math.round((s - start) / DAY); if (i >= 0 && i < n) counts[i]++; });
  const max = Math.max(...counts, 1), W = Math.max(n * 14, 280), H = 110, bw = W / n;
  const dl = deadline ? Math.round((day(deadline) - start) / DAY) : -1;
  const bars = counts.map((c, i) => {
    const h = c ? Math.max(4, (c / max) * (H - 18)) : 0;
    return `<rect x="${i * bw + bw * .15}" y="${H - h}" width="${bw * .7}" height="${h}" rx="2" fill="${dl >= 0 && i > dl ? 'var(--amber)' : 'var(--navy)'}"><title>${new Date(start + i * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${c}</title></rect>
      ${c ? `<text x="${i * bw + bw / 2}" y="${H - h - 4}" text-anchor="middle" font-size="9" fill="#475569">${c}</text>` : ''}`;
  }).join('');
  const dlLine = dl >= 0 && dl < n ? `<line x1="${(dl + 1) * bw}" x2="${(dl + 1) * bw}" y1="0" y2="${H}" stroke="var(--red)" stroke-dasharray="3 3"/>` : '';
  const lab = (i, anchor) => `<text x="${i * bw + bw / 2}" y="${H + 14}" font-size="10" fill="#8391A5" text-anchor="${anchor}">${new Date(start + i * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>`;
  return `<svg viewBox="0 0 ${W} ${H + 18}" preserveAspectRatio="none" role="img" aria-label="Applications per day">${bars}${dlLine}${lab(0, 'start')}${n > 1 ? lab(n - 1, 'end') : ''}</svg>`;
}

function exportApps() {
  if (!window.XLSX) return toast('Excel tools are still loading. Try again in a second.', true);
  const rows = filteredApps().map(a => ({
    Name: a.name, Email: a.email, Phone: a.phone, Major: a.major, Minor: a.minor, Year: a.year,
    Graduation: a.gradTerm, Hometown: a.hometown, GPA: a.gpa, LinkedIn: linkedinUrl(a.linkedin), Instagram: a.instagram,
    'Heard from': a.heardFrom, 'Why AKPsi': a.why, 'Not on resume': a.about,
    Submitted: fmtDate(a.submittedAt, { dateStyle: 'medium', timeStyle: 'short' }), 'On time': a.late ? 'No' : 'Yes',
    Status: STATUSES.find(s => s.id === a.status)?.label || a.status, Notes: a.notes,
    Resume: location.origin + fileUrl(a.resume), Headshot: location.origin + fileUrl(a.headshot),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: ['Why AKPsi', 'Not on resume', 'Notes'].includes(k) ? 50 : Math.min(30, Math.max(10, k.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, state.term.slice(0, 31));
  XLSX.writeFile(wb, `Beta Pi Applications - ${state.term}.xlsx`);
}

/* Applicant drawer */
function openDrawer(id, keepScroll) {
  const a = state.apps.find(x => x.id === id); if (!a) return;
  state.drawerId = id;
  const list = filteredApps(), idx = list.findIndex(x => x.id === id);
  const prev = list[idx - 1], next = list[idx + 1];
  state.drawerPrev = prev?.id; state.drawerNext = next?.id;
  const body = $('#drawer .drawer-body'), scroll = keepScroll && body ? body.scrollTop : 0;
  $('#drawer').innerHTML = `
    <div class="drawer-head">
      <button class="icon-btn" ${prev ? `data-nav="${prev.id}"` : 'disabled'} title="Previous (←)">${I.left}</button>
      <button class="icon-btn" ${next ? `data-nav="${next.id}"` : 'disabled'} title="Next (→)">${I.right}</button>
      <span class="grow">${idx >= 0 ? `${idx + 1} of ${list.length}` : ''} · ${esc(a.term)}</span>
      <a class="btn sm" href="${fileUrl(a.resume)}" target="_blank" rel="noopener">${I.file}Resume</a>
      <button class="icon-btn" data-close-drawer title="Close (Esc)">${I.x}</button>
    </div>
    <div class="drawer-body">
      <div class="profile">
        <a href="${fileUrl(a.headshot)}" target="_blank" rel="noopener" title="Open full size"><img class="shot" src="${fileUrl(a.headshot)}" alt="${esc(a.name)} headshot"></a>
        <div>
          <h2>${esc(a.name)}</h2>
          <p class="sub">${esc(a.major)}${a.minor ? ` · Minor in ${esc(a.minor)}` : ''}</p>
          <div class="contact">
            <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>
            <a href="tel:${esc(a.phone.replace(/[^\d+]/g, ''))}">${esc(a.phone)}</a>
            ${a.linkedin ? `<a href="${esc(linkedinUrl(a.linkedin))}" target="_blank" rel="noopener">LinkedIn ↗</a>` : ''}
            ${a.instagram ? `<a href="${esc(igUrl(a.instagram))}" target="_blank" rel="noopener">Instagram: ${esc(a.instagram)} ↗</a>` : ''}
          </div>
        </div>
      </div>

      <div class="review">
        <div class="grid g2">
          <label class="f"><span>Status</span>${statusSelect(a)}</label>
          <label class="f"><span>Semester</span><select class="select" id="appTerm">${[...new Set([a.term, ...terms(), ...upcomingTerms(3)])].map(t => `<option ${t === a.term ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        </div>
        <label class="f" style="margin-top:12px"><span>Notes <small id="noteState"></small></span><textarea class="textarea" id="appNotes" rows="3" placeholder="Interview notes, impressions, follow-ups… (only visible here)">${esc(a.notes)}</textarea></label>
      </div>

      <div class="facts">
        <div><span>Year</span><b>${esc(a.year)}</b></div>
        <div><span>Graduation</span><b>${esc(a.gradTerm)}</b></div>
        <div><span>GPA</span><b>${esc(a.gpa) || '—'}</b></div>
        <div><span>From</span><b>${esc(a.hometown)}</b></div>
        <div><span>Heard from</span><b>${esc(a.heardFrom) || '—'}</b></div>
        <div><span>Submitted</span><b>${fmtDate(a.submittedAt)}</b> ${a.late ? '<span class="pill late">Late</span>' : '<span class="pill ok">On time</span>'}</div>
      </div>

      <div class="answer"><h3>Why do you want to rush Alpha Kappa Psi?</h3><p>${esc(a.why)}</p></div>
      ${a.about ? `<div class="answer"><h3>Something not on their resume</h3><p>${esc(a.about)}</p></div>` : ''}

      <div class="answer">
        <div class="panel-head" style="margin-bottom:8px"><h3 style="margin:0">Resume</h3>
          <div class="actions"><a class="btn sm" href="${fileUrl(a.resume, 1)}">${I.dl}Resume</a><a class="btn sm" href="${fileUrl(a.headshot, 1)}">${I.dl}Headshot</a></div></div>
        <iframe class="resume-frame" src="${fileUrl(a.resume)}#view=FitH" title="Resume of ${esc(a.name)}"></iframe>
      </div>

      <button class="btn danger sm" id="delApp">${I.trash}Delete application</button>
      ${a.resubmitted ? `<p class="muted" style="margin-top:10px;font-size:.8rem">First applied ${fmtDate(a.firstSubmittedAt)}; this is their latest submission.</p>` : ''}
    </div>`;
  $('#drawer').classList.add('open'); $('#scrim').classList.add('open');
  $('#drawer .drawer-body').scrollTop = scroll;

  let t;
  $('#appNotes').oninput = e => {
    $('#noteState').textContent = 'Saving…';
    clearTimeout(t);
    t = setTimeout(async () => { await updateApp(id, { notes: e.target.value }); $('#noteState') && ($('#noteState').textContent = 'Saved'); }, 700);
  };
  $('#appTerm').onchange = async e => { await updateApp(id, { term: e.target.value }); toast(`Moved to ${e.target.value}`); closeDrawer(); };
  $('#delApp').onclick = async () => {
    if (!confirm(`Delete ${a.name}'s application, resume, and headshot? This can't be undone.`)) return;
    try {
      await api('DELETE', `/api/admin/applications/${id}`);
      state.apps = state.apps.filter(x => x.id !== id);
      closeDrawer(); renderNav(); if (state.view === 'applications') renderApplications(); toast('Application deleted.');
    } catch (err) { toast(err.message, true); }
  };
}
function closeDrawer() { $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); state.drawerId = null; }
$('#scrim').onclick = closeDrawer;
$('#drawer').addEventListener('click', e => {
  if (e.target.closest('[data-close-drawer]')) closeDrawer();
  const n = e.target.closest('[data-nav]'); if (n) openDrawer(n.dataset.nav);
});
document.addEventListener('keydown', e => {
  if (!state.drawerId || e.target.closest('input, textarea, select')) return;
  if (e.key === 'Escape') closeDrawer();
  const target = e.key === 'ArrowRight' ? state.drawerNext : e.key === 'ArrowLeft' ? state.drawerPrev : null;
  if (target) openDrawer(target);
});

/* ═════════════ EXCEL HELPERS ═════════════ */

async function readSheet(file) {
  if (!window.XLSX) throw new Error('Excel tools are still loading. Try again in a second.');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
  return rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase().replace(/[^a-z]/g, ''), typeof v === 'string' ? v.trim() : v])));
}
const pick = (row, keys) => { for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k]; return ''; };
function downloadSheet(filename, headers, rows, widths) {
  if (!window.XLSX) return toast('Excel tools are still loading. Try again in a second.', true);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = widths.map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

/* ═════════════ MEMBERS ═════════════ */

const M_HEADERS = ['Name', 'Group', 'Role', 'Major', 'Minor', 'Pledge Class', 'Graduation Year', 'LinkedIn', 'Photo'];
function groupOf(text) {
  const parts = String(text || 'Brother').toLowerCase().split(/[,;/&+]|\band\b/).map(s => s.trim()).filter(Boolean);
  const out = new Set(parts.map(p =>
    /board|exec|president|vp|officer/.test(p) ? 'eboard'
      : /educat|\bpe\b/.test(p) ? 'pledgeEducators'
      : /nib|new init|initiate|pledge class|newest/.test(p) ? 'nibs'
      : 'brothers'));
  return [...out];
}
function memberFromRow(r) {
  const yr = String(pick(r, ['graduationyear', 'gradyear', 'year', 'classyear', 'graduation', 'classof', 'expectedgraduation'])).match(/\d{4}/);
  const m = {
    name: String(pick(r, ['name', 'fullname', 'brother', 'member', 'brothername'])),
    role: String(pick(r, ['role', 'position', 'title', 'office', 'eboardposition'])),
    major: String(pick(r, ['major', 'majors'])),
    minor: String(pick(r, ['minor', 'minors'])),
    class: String(pick(r, ['pledgeclass', 'class', 'pledge'])),
    year: yr ? +yr[0] : '',
    linkedin: linkedinUrl(String(pick(r, ['linkedin', 'linkedinurl', 'linkedinprofile', 'linkedinlink']))),
    photo: String(pick(r, ['photo', 'headshot', 'image', 'picture', 'photourl'])),
  };
  Object.keys(m).forEach(k => { if (m[k] === '') delete m[k]; });
  return { member: m, groups: groupOf(pick(r, ['group', 'category', 'type', 'section', 'status', 'membertype'])) };
}

/* Pull the latest members + self-update submissions (brothers may have updated since the CMS loaded) */
async function refreshMembers() {
  try {
    const [members, up] = await Promise.all([loadData('members'), api('GET', '/api/admin/updates')]);
    state.selfUpdates = up;
    if (!isDirty('members')) { state.members = members; snapshot('members'); }
  } catch (e) { toast(e.message, true); }
}

const FIELD_LABEL = { photo: 'Photo', linkedin: 'LinkedIn', major: 'Major', minor: 'Minor', class: 'Pledge class', year: 'Grad year' };

function selfUpdatePanel() {
  const up = state.selfUpdates;
  if (!up) return `<div class="panel panel-pad" style="margin-bottom:16px"><p class="muted">Loading profile updates…</p></div>`;
  const { settings, updates } = up;
  const people = new Map();
  GROUPS.forEach(g => (state.members[g.key] || []).forEach(m => people.set(m.name.trim().toLowerCase(), { ...(people.get(m.name.trim().toLowerCase()) || {}), ...m })));
  const all = [...people.values()], total = all.length || 1;
  const withPhoto = all.filter(m => m.photo).length;
  const withLi = all.filter(m => m.linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/?$/.test(m.linkedin)).length;
  const link = `${location.origin}/update.html`;
  const pending = updates.filter(u => u.status === 'pending').length;
  const shown = state.showAllUpdates ? updates : updates.slice(0, 6);
  return `
    <div class="panel panel-pad" style="margin-bottom:16px">
      <div class="panel-head">
        <div><h2>Profile update link</h2><p>Brothers add their own headshot and LinkedIn. Share the link and code in the group chat.</p></div>
        <div class="actions">
          <label class="switch"><input type="checkbox" id="suEnabled" ${settings.updatesEnabled ? 'checked' : ''}>${settings.updatesEnabled ? 'Accepting updates' : 'Updates paused'}</label>
        </div>
      </div>
      <div class="grid g3" style="align-items:end">
        <label class="f"><span>Link</span><input class="input" readonly value="${esc(link)}" onclick="this.select()"></label>
        <label class="f"><span>Chapter code</span><div class="actions" style="flex-wrap:nowrap"><input class="input" id="suCode" value="${esc(settings.updateCode)}" style="text-transform:uppercase;letter-spacing:.15em;font-weight:600"><button class="btn" id="suCodeSave">Save</button></div></label>
        <div class="actions"><button class="btn primary" id="suCopy">Copy invite message</button><a class="btn" href="update.html" target="_blank" rel="noopener">${I.ext}Open</a></div>
      </div>
      <label class="switch" style="margin-top:14px;font-weight:500"><input type="checkbox" id="suApproval" ${settings.updatesNeedApproval ? 'checked' : ''}>Review updates before they go live</label>

      <div class="grid g2" style="margin-top:18px">
        <div><div class="panel-head" style="margin-bottom:4px"><b style="font-size:.85rem">Photos</b><span class="muted" style="font-size:.85rem">${withPhoto} of ${all.length}</span></div>
          <div class="meter"><i style="width:${withPhoto / total * 100}%;background:var(--green)"></i></div></div>
        <div><div class="panel-head" style="margin-bottom:4px"><b style="font-size:.85rem">LinkedIn</b><span class="muted" style="font-size:.85rem">${withLi} of ${all.length}</span></div>
          <div class="meter"><i style="width:${withLi / total * 100}%;background:var(--accent)"></i></div></div>
      </div>

      ${updates.length ? `
        <div class="panel-head" style="margin:22px 0 8px"><b style="font-size:.85rem">Recent updates${pending ? ` · <span class="pill late">${pending} waiting for review</span>` : ''}</b></div>
        <div class="table-wrap" style="border:1px solid var(--line);border-radius:12px"><table>
          <tbody>${shown.map(u => `
            <tr>
              <td><div class="who">${u.changes.photo ? `<img class="thumb" src="${esc(u.changes.photo)}" alt="">` : `<span class="thumb">${initials(u.name)}</span>`}<div><b>${esc(u.name)}</b><span>${fmtDate(u.submittedAt)}</span></div></div></td>
              <td>${Object.keys(u.changes).map(k => `<span class="pill info" style="margin:2px">${FIELD_LABEL[k] || k}</span>`).join('')}</td>
              <td>${u.status === 'applied' ? '<span class="pill ok">Live</span>' : u.status === 'pending' ? '<span class="pill late">Needs review</span>' : '<span class="pill" style="background:var(--line-2);color:var(--muted)">' + (u.previous ? 'Undone' : 'Rejected') + '</span>'}</td>
              <td style="text-align:right"><div class="actions" style="justify-content:flex-end">
                ${u.status === 'pending' ? `<button class="btn sm primary" data-su="${u.id}" data-su-act="approve">Approve</button><button class="btn sm" data-su="${u.id}" data-su-act="reject">Reject</button>` : ''}
                ${u.status === 'applied' ? `<button class="btn sm" data-su="${u.id}" data-su-act="reject">Undo</button>` : ''}
              </div></td>
            </tr>`).join('')}</tbody></table></div>
        ${updates.length > 6 ? `<button class="btn sm ghost" id="suMore" style="margin-top:8px">${state.showAllUpdates ? 'Show fewer' : `Show all ${updates.length}`}</button>` : ''}`
      : `<p class="muted" style="margin-top:18px;font-size:.85rem">No updates yet. Copy the invite message and send it to the brothers.</p>`}
    </div>`;
}

async function saveUpdateSettings(patch) {
  try { state.selfUpdates.settings = await api('PUT', '/api/admin/update-settings', patch); renderMembers(); toast('Saved.'); }
  catch (e) { toast(e.message, true); renderMembers(); }
}

function wireSelfUpdatePanel() {
  if (!state.selfUpdates) return;
  const s = state.selfUpdates.settings;
  $('#suEnabled').onchange = e => saveUpdateSettings({ updatesEnabled: e.target.checked });
  $('#suApproval').onchange = e => saveUpdateSettings({ updatesNeedApproval: e.target.checked });
  $('#suCodeSave').onclick = () => saveUpdateSettings({ updateCode: $('#suCode').value.trim().toUpperCase() });
  $('#suCopy').onclick = async () => {
    const msg = `Hey brothers! Please add your professional headshot and LinkedIn to the Beta Pi website so your card is complete. It takes a minute:\n${location.origin}/update.html\nChapter code: ${s.updateCode}`;
    try { await navigator.clipboard.writeText(msg); toast('Invite message copied. Paste it in the group chat.'); }
    catch { prompt('Copy this message:', msg); }
  };
  $('#suMore') && ($('#suMore').onclick = () => { state.showAllUpdates = !state.showAllUpdates; renderMembers(); });
  $$('[data-su]').forEach(b => b.onclick = async () => {
    const act = b.dataset.suAct;
    if (act === 'reject' && !confirm(b.textContent.trim() === 'Undo' ? 'Undo this update and restore their previous info?' : 'Reject this update?')) return;
    try {
      await api('POST', `/api/admin/updates/${b.dataset.su}/${act}`);
      const keep = isDirty('members');
      await refreshMembers();
      renderMembers();
      toast(act === 'approve' ? 'Approved. Their card is updated.' : 'Done.' + (keep ? ' Save your other member edits to keep them.' : ''));
    } catch (e) { toast(e.message, true); }
  });
}

function renderMembers() {
  if (state.selfUpdates === undefined) { state.selfUpdates = null; refreshMembers().then(() => state.view === 'members' && renderMembers()); }
  const mem = state.members;
  GROUPS.forEach(g => mem[g.key] = mem[g.key] || []);
  const tab = state.memberTab, q = state.memberQ.trim().toLowerCase();
  const rows = mem[tab].map((m, i) => ({ m, i })).filter(({ m }) => !q || [m.name, m.role, m.major, m.class].join(' ').toLowerCase().includes(q));
  $('#view').innerHTML = `
    <div class="page-head">
      <div><h1>Members</h1><p>Everyone on the Members page. Import an Excel sheet to update them all at once.</p></div>
      <div class="actions">
        <button class="btn" id="mTemplate">${I.dl}Excel template</button>
        <button class="btn" id="mExport">${I.dl}Export</button>
        <label class="btn">${I.ul}Import Excel<input type="file" id="mImport" hidden accept=".xlsx,.xls,.csv"></label>
        <button class="btn primary" id="mAdd">${I.plus}Add member</button>
      </div>
    </div>
    ${selfUpdatePanel()}
    <div class="panel">
      <div class="toolbar">
        <div class="tabs">${GROUPS.map(g => `<button class="${g.key === tab ? 'on' : ''}" data-mtab="${g.key}">${g.label}<span>${mem[g.key].length}</span></button>`).join('')}</div>
        <div class="grow"></div>
        <div class="search">${I.search}<input class="input" id="mQ" placeholder="Search members" value="${esc(state.memberQ)}"></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Member</th><th>${tab === 'eboard' || tab === 'pledgeEducators' ? 'Role' : 'Pledge class'}</th><th>Major</th><th>Minor</th><th>Grad</th><th>LinkedIn</th><th style="width:150px"></th></tr></thead>
        <tbody>${rows.length ? rows.map(({ m, i }) => `
          <tr>
            <td><div class="who">${m.photo ? `<img class="thumb" src="${esc(m.photo)}" alt="">` : `<span class="thumb">${initials(m.name)}</span>`}<div><b>${esc(m.name)}</b></div></div></td>
            <td>${esc(tab === 'eboard' || tab === 'pledgeEducators' ? m.role : m.class) || '<span class="muted">—</span>'}</td>
            <td>${esc(m.major) || '<span class="muted">—</span>'}</td>
            <td>${esc(m.minor) || '<span class="muted">—</span>'}</td>
            <td>${esc(m.year) || '<span class="muted">—</span>'}</td>
            <td>${m.linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/?$/.test(m.linkedin) ? `<a href="${esc(m.linkedin)}" target="_blank" rel="noopener">Profile ↗</a>` : '<span class="muted">—</span>'}</td>
            <td><div class="actions" style="justify-content:flex-end;gap:0">
              <button class="icon-btn" title="Move up" data-act="up" data-src="members" data-path="${tab}" data-i="${i}">${I.up}</button>
              <button class="icon-btn" title="Move down" data-act="down" data-src="members" data-path="${tab}" data-i="${i}">${I.down}</button>
              <button class="icon-btn" title="Edit" data-medit="${i}">${I.edit}</button>
              <button class="icon-btn" title="Remove" data-act="del" data-src="members" data-path="${tab}" data-i="${i}">${I.trash}</button>
            </div></td>
          </tr>`).join('') : `<tr><td colspan="7"><div class="empty-state"><b>No ${GROUPS.find(g => g.key === tab).label} yet</b>Add them one by one or import an Excel sheet.</div></td></tr>`}</tbody>
      </table></div>
    </div>`;

  wireSelfUpdatePanel();
  $$('[data-mtab]').forEach(b => b.onclick = () => { state.memberTab = b.dataset.mtab; renderMembers(); });
  $('#mQ').oninput = e => { state.memberQ = e.target.value; const pos = e.target.selectionStart; renderMembers(); $('#mQ').focus(); $('#mQ').setSelectionRange(pos, pos); };
  $('#mAdd').onclick = () => memberModal(null, tab);
  $$('[data-medit]').forEach(b => b.onclick = () => memberModal(+b.dataset.medit, tab));
  $('#mTemplate').onclick = () => downloadSheet('Beta Pi Members Template.xlsx', M_HEADERS, [
    ['Alex Rivera', 'E-Board', 'President', 'Finance', 'Real Estate', 'Alpha Omega', 2027, 'https://www.linkedin.com/in/alexrivera', ''],
    ['Sofia Martinez', 'Brother', '', 'Marketing', '', 'Beta Alpha', 2028, 'linkedin.com/in/sofiamartinez', ''],
    ['Diego Herrera', 'NIB', '', 'Economics', '', 'Beta Beta', 2029, '', ''],
  ], [24, 18, 26, 22, 18, 16, 16, 40, 30]);
  $('#mExport').onclick = () => {
    const seen = new Map();
    GROUPS.forEach(g => mem[g.key].forEach(m => {
      const k = m.name.toLowerCase();
      if (!seen.has(k)) seen.set(k, { m: { ...m }, groups: [] });
      const e = seen.get(k); e.groups.push(g.label.replace(/s$/, '')); if (m.role) e.m.role = m.role;
    }));
    downloadSheet('Beta Pi Members.xlsx', M_HEADERS, [...seen.values()].map(({ m, groups }) =>
      [m.name, groups.join(', '), m.role || '', m.major || '', m.minor || '', m.class || '', m.year || '', m.linkedin || '', m.photo || '']), [24, 26, 26, 22, 18, 16, 16, 40, 30]);
  };
  $('#mImport').onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    try { importMembers(await readSheet(file), file.name); } catch (err) { toast(err.message, true); }
  };
}

function memberModal(i, group) {
  const m = i === null ? {} : { ...state.members[group][i] };
  const isNew = i === null;
  const md = modal(isNew ? 'Add member' : `Edit ${m.name}`, `
    <div class="grid g2">
      ${isNew ? `<label class="f"><span>Group</span><select class="select" id="mfGroup">${GROUPS.map(g => `<option value="${g.key}" ${g.key === group ? 'selected' : ''}>${g.label}</option>`).join('')}</select></label>` : ''}
      <label class="f"><span>Full name *</span><input class="input" id="mfName" value="${esc(m.name)}"></label>
      <label class="f"><span>Role <small>(E-Board / Pledge Educators)</small></span><input class="input" id="mfRole" value="${esc(m.role)}" placeholder="e.g. VP of Finance"></label>
      <label class="f"><span>Major</span><input class="input" id="mfMajor" value="${esc(m.major)}"></label>
      <label class="f"><span>Minor</span><input class="input" id="mfMinor" value="${esc(m.minor)}"></label>
      <label class="f"><span>Pledge class</span><input class="input" id="mfClass" value="${esc(m.class)}" placeholder="e.g. Beta Alpha"></label>
      <label class="f"><span>Graduation year</span><input class="input" id="mfYear" inputmode="numeric" value="${esc(m.year)}" placeholder="2028"></label>
      <label class="f" style="grid-column:1/-1"><span>LinkedIn URL</span><input class="input" id="mfLinkedin" value="${esc(m.linkedin)}" placeholder="https://www.linkedin.com/in/…"></label>
      <label class="f" style="grid-column:1/-1"><span>Headshot</span>
        <div class="upload-box"><img id="mfPhotoPrev" src="${esc(m.photo || '')}" alt="" ${m.photo ? '' : 'hidden'}><div class="ph" id="mfPhotoPh" ${m.photo ? 'hidden' : ''}>None</div>
          <label class="btn sm">${I.ul}Upload<input type="file" hidden accept="image/*" id="mfPhoto"></label>
          <button type="button" class="btn sm ghost" id="mfPhotoClear">Remove</button></div></label>
    </div>`, isNew ? 'Add member' : 'Save');
  let photo = m.photo || '';
  const setPhoto = p => { photo = p; $('#mfPhotoPrev').src = p; $('#mfPhotoPrev').hidden = !p; $('#mfPhotoPh').hidden = !!p; };
  $('#mfPhoto').onchange = async e => { try { setPhoto((await uploadFiles(e.target.files, 'members'))[0].path); toast('Photo uploaded.'); } catch (err) { toast(err.message, true); } };
  $('#mfPhotoClear').onclick = () => setPhoto('');
  md.onOk = () => {
    const name = $('#mfName').value.trim();
    if (!name) throw new Error('Name is required.');
    const yr = $('#mfYear').value.trim();
    const out = { name, role: $('#mfRole').value.trim(), major: $('#mfMajor').value.trim(), minor: $('#mfMinor').value.trim(),
      class: $('#mfClass').value.trim(), year: yr ? +yr || yr : '', linkedin: linkedinUrl($('#mfLinkedin').value.trim()), photo };
    Object.keys(out).forEach(k => { if (out[k] === '') delete out[k]; });
    const g = isNew ? $('#mfGroup').value : group;
    if (isNew) state.members[g].push(out); else state.members[g][i] = out;
    state.memberTab = g;
    updateSavebar(); renderMembers();
  };
}

function importMembers(rows, filename) {
  const parsed = rows.map(memberFromRow).filter(p => p.member.name);
  const skipped = rows.length - parsed.length;
  if (!parsed.length) return toast("Couldn't find any names. Make sure the sheet has a Name column.", true);
  const counts = Object.fromEntries(GROUPS.map(g => [g.key, parsed.filter(p => p.groups.includes(g.key)).length]));
  const withLinkedin = parsed.filter(p => p.member.linkedin).length;
  const md = modal(`Import ${filename}`, `
    <div class="stack">
      <div class="note">Found <b>${parsed.length}</b> members: ${GROUPS.map(g => `${counts[g.key]} ${g.label}`).join(', ')}. ${withLinkedin} have LinkedIn links.${skipped ? ` ${skipped} rows without a name were skipped.` : ''}</div>
      <div class="radio-row">
        <label class="radio-card"><input type="radio" name="mode" value="replace" checked><div><b>Replace everyone</b><span>The website will show exactly this sheet.</span></div></label>
        <label class="radio-card"><input type="radio" name="mode" value="merge"><div><b>Add &amp; update</b><span>Update people with the same name and add new ones. Keeps everyone else.</span></div></label>
      </div>
      <label class="switch"><input type="checkbox" id="alsoBro" checked>Also list E-Board and Pledge Educators under Brothers</label>
      <div class="preview-table"><table><thead><tr><th>Name</th><th>Group</th><th>Role</th><th>Major</th><th>Class</th><th>Grad</th><th>LinkedIn</th></tr></thead><tbody>
        ${parsed.slice(0, 100).map(({ member: m, groups }) => `<tr><td>${esc(m.name)}</td><td>${groups.map(k => GROUPS.find(g => g.key === k).label).join(', ')}</td><td>${esc(m.role)}</td><td>${esc(m.major)}</td><td>${esc(m.class)}</td><td>${esc(m.year)}</td><td>${m.linkedin ? '✓' : ''}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`, 'Import & publish', { wide: true });
  md.onOk = async () => {
    const mode = $('input[name=mode]:checked', md.el).value, alsoBro = $('#alsoBro').checked;
    const next = mode === 'replace' ? Object.fromEntries(GROUPS.map(g => [g.key, []])) : structuredClone(state.members);
    const put = (key, m) => {
      const list = next[key];
      const i = list.findIndex(x => x.name.toLowerCase() === m.name.toLowerCase());
      const entry = key === 'brothers' || key === 'nibs' ? (({ role, ...rest }) => rest)(m) : m;
      if (i >= 0) list[i] = { ...list[i], ...entry }; else list.push(entry);
    };
    parsed.forEach(({ member, groups }) => {
      groups.forEach(g => put(g, member));
      if (alsoBro && groups.some(g => g === 'eboard' || g === 'pledgeEducators') && !groups.includes('brothers')) put('brothers', member);
    });
    state.members = next;
    await saveNow('members', `Imported ${parsed.length} members. The website is updated.`);
    renderMembers();
  };
}

/* ═════════════ EVENTS ═════════════ */

const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function eventFromRow(r) {
  let date = pick(r, ['date', 'day', 'eventdate']);
  if (date instanceof Date) date = isoDay(date);
  else if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) { const d = new Date(date); date = isNaN(d) ? '' : isoDay(d); }
  let time = pick(r, ['time', 'starttime', 'start', 'hour']);
  if (time instanceof Date) time = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const typeRaw = String(pick(r, ['type', 'category', 'kind']));
  const type = EVENT_TYPES.find(t => t.toLowerCase() === typeRaw.toLowerCase()) || (typeRaw ? 'Other' : 'Other');
  const e = { title: String(pick(r, ['title', 'event', 'name', 'eventname'])), date, time: String(time || ''), location: String(pick(r, ['location', 'place', 'where', 'venue'])), type };
  Object.keys(e).forEach(k => { if (e[k] === '') delete e[k]; });
  return e;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TIME_PRESETS = ['10:00 AM', '12:00 PM', '5:00 PM', '6:00 PM', '6:30 PM', '7:00 PM', '8:00 PM', 'Invite only'];
const monthStart = iso => { const d = iso ? new Date(iso + 'T00:00') : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const typeClass = t => 't-' + String(t || 'Other').toLowerCase();

// Only the days of the month (1 to 28–31), padded with nulls so weeks line up Sunday first
function monthDays(first) {
  const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let k = 1; k <= n; k++) cells.push(new Date(first.getFullYear(), first.getMonth(), k));
  while (cells.length % 7) cells.push(null);
  return cells;
}

function renderEvents() {
  const today = isoDay(new Date());
  const all = state.events.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date || '').localeCompare(b.e.date || ''));
  const view = state.eventView;
  const tab = state.eventTab;
  const rows = all.filter(({ e }) => tab === 'all' || (tab === 'upcoming' ? e.date >= today : e.date < today));
  if (tab === 'past') rows.reverse();
  const count = t => all.filter(({ e }) => t === 'all' || (t === 'upcoming' ? e.date >= today : e.date < today)).length;
  if (!state.calMonth) state.calMonth = monthStart();
  const month = state.calMonth;

  const calendar = () => {
    const byDay = {};
    all.forEach(({ e, i }) => (byDay[e.date] = byDay[e.date] || []).push({ e, i }));
    return `
      <div class="toolbar cal-toolbar">
        <div class="cal-nav">
          <button class="icon-btn" id="calPrev" aria-label="Previous month">${I.left}</button>
          <h2 class="cal-title">${MONTHS[month.getMonth()]} <span>${month.getFullYear()}</span></h2>
          <button class="icon-btn" id="calNext" aria-label="Next month">${I.right}</button>
        </div>
        <button class="btn" id="calToday">Today</button>
        <span class="grow"></span>
        <span class="cal-hint">Click a day to add an event · click an event to edit it</span>
      </div>
      <div class="cal">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-dow">${d}</div>`).join('')}
        ${monthDays(month).map(d => {
          if (!d) return '<div class="cal-blank" aria-hidden="true"></div>';
          const iso = isoDay(d);
          const evs = byDay[iso] || [];
          const cls = ['cal-day', iso === today && 'today', iso < today && 'past'].filter(Boolean).join(' ');
          return `<div class="${cls}" data-day="${iso}" role="button" tabindex="0" aria-label="Add event on ${d.toDateString()}">
            <span class="cal-num">${d.getDate()}</span>
            <span class="cal-add" aria-hidden="true">${I.plus}</span>
            ${evs.map(({ e, i }) => `<button class="cal-ev ${typeClass(e.type)}" data-eedit="${i}" title="${esc(e.title)}${e.time ? ' · ' + esc(e.time) : ''}"><b>${esc(/\d/.test(e.time || '') ? e.time.replace(':00', '').replace(' ', '').toLowerCase() : '')}</b>${esc(e.title)}</button>`).join('')}
          </div>`;
        }).join('')}
      </div>
      <div class="cal-legend">${EVENT_TYPES.map(t => `<span><i class="${typeClass(t)}"></i>${t}</span>`).join('')}</div>`;
  };

  const list = () => `
      <div class="toolbar"><div class="tabs">${[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-etab="${k}">${l}<span>${count(k)}</span></button>`).join('')}</div></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Event</th><th>Time</th><th>Location</th><th>Type</th><th style="width:90px"></th></tr></thead>
        <tbody>${rows.length ? rows.map(({ e, i }) => `
          <tr class="${e.date < today ? 'past' : ''}">
            <td class="nowrap"><b>${e.date ? new Date(e.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</b></td>
            <td>${esc(e.title)}</td><td class="nowrap">${esc(e.time) || '—'}</td><td>${esc(e.location) || '—'}</td>
            <td><span class="pill info">${esc(e.type || 'Other')}</span></td>
            <td><div class="actions" style="justify-content:flex-end;gap:0">
              <button class="icon-btn" title="Edit" data-eedit="${i}">${I.edit}</button>
              <button class="icon-btn" title="Remove" data-act="del" data-src="events" data-path="" data-i="${i}">${I.trash}</button>
            </div></td>
          </tr>`).join('') : `<tr><td colspan="6"><div class="empty-state"><b>No ${tab === 'all' ? '' : tab} events</b>Add one or import a sheet.</div></td></tr>`}</tbody>
      </table></div>`;

  $('#view').innerHTML = `
    <div class="page-head">
      <div><h1>Events</h1><p>Shown on the Events page and week by week on the home page. Philanthropy events also appear on the Philanthropy page.</p></div>
      <div class="actions">
        <div class="tabs">${[['calendar', 'Calendar'], ['list', 'List']].map(([k, l]) => `<button class="${k === view ? 'on' : ''}" data-eview="${k}">${l}</button>`).join('')}</div>
        <button class="btn" id="eTemplate">${I.dl}Excel template</button>
        <label class="btn">${I.ul}Import Excel<input type="file" id="eImport" hidden accept=".xlsx,.xls,.csv"></label>
        <button class="btn primary" id="eAdd">${I.plus}Add event</button>
      </div>
    </div>
    <div class="panel">${view === 'calendar' ? calendar() : list()}</div>`;

  $$('[data-eview]').forEach(b => b.onclick = () => { state.eventView = b.dataset.eview; renderEvents(); });
  $$('[data-etab]').forEach(b => b.onclick = () => { state.eventTab = b.dataset.etab; renderEvents(); });
  $('#eAdd').onclick = () => eventModal(null, view === 'calendar' && month.getMonth() !== new Date().getMonth() ? isoDay(month) : today);
  $$('[data-eedit]').forEach(b => b.onclick = ev => { ev.stopPropagation(); eventModal(+b.dataset.eedit); });
  if (view === 'calendar') {
    $('#calPrev').onclick = () => { state.calMonth = addMonths(month, -1); renderEvents(); };
    $('#calNext').onclick = () => { state.calMonth = addMonths(month, 1); renderEvents(); };
    $('#calToday').onclick = () => { state.calMonth = monthStart(); renderEvents(); };
    $$('[data-day]').forEach(c => {
      c.onclick = () => eventModal(null, c.dataset.day);
      c.onkeydown = ev => { if (ev.target === c && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); eventModal(null, c.dataset.day); } };
    });
  }
  $('#eTemplate').onclick = () => downloadSheet('Beta Pi Events Template.xlsx', ['Title', 'Date', 'Time', 'Location', 'Type'], [
    ['Resume & LinkedIn Workshop', '2026-10-08', '6:30 PM', 'Herbert Business School', 'Professional'],
    ['Philanthropy Fundraiser', '2026-10-24', '10:00 AM', 'Coral Gables', 'Philanthropy'],
  ], [32, 14, 12, 30, 16]);
  $('#eImport').onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    try { importEvents(await readSheet(file), file.name); } catch (err) { toast(err.message, true); }
  };
}

function eventModal(i, presetDate) {
  const e = i === null ? { type: 'Professional', date: presetDate || '' } : { ...state.events[i] };
  const today = isoDay(new Date());
  let picked = e.date || '';
  let shown = monthStart(picked || today);
  const md = modal(i === null ? 'Add event' : 'Edit event', `
    <div class="ev-modal">
      <div class="stack">
        <label class="f"><span>Title *</span><input class="input" id="efTitle" value="${esc(e.title)}" placeholder="e.g. Resume Workshop"></label>
        <div class="f"><span>Time</span>
          <input class="input" id="efTime" value="${esc(e.time)}" placeholder="7:00 PM or Invite only">
          <div class="chips" id="efTimes">${TIME_PRESETS.map(t => `<button type="button" class="chip${t === e.time ? ' on' : ''}" data-time="${t}">${t}</button>`).join('')}</div>
        </div>
        <label class="f"><span>Location</span><input class="input" id="efLoc" value="${esc(e.location)}" placeholder="e.g. Herbert Business School"></label>
        <div class="f"><span>Type</span>
          <div class="chips" id="efTypes">${EVENT_TYPES.map(t => `<button type="button" class="chip type ${typeClass(t)}${t === (e.type || 'Other') ? ' on' : ''}" data-type="${t}"><i></i>${t}</button>`).join('')}</div>
        </div>
      </div>
      <div class="f"><span>Date *</span>
        <div class="picker" id="efPicker"></div>
        <div class="picked" id="efPicked"></div>
      </div>
    </div>`, i === null ? 'Add event' : 'Save', { wide: true });
  let type = e.type || 'Other';

  const busy = {};
  state.events.forEach((x, k) => { if (k !== i && x.date) busy[x.date] = (busy[x.date] || 0) + 1; });
  const drawPicker = () => {
    $('#efPicker', md.el).innerHTML = `
      <div class="picker-head">
        <button type="button" class="icon-btn" data-pm="-1" aria-label="Previous month">${I.left}</button>
        <b>${MONTHS[shown.getMonth()]} ${shown.getFullYear()}</b>
        <button type="button" class="icon-btn" data-pm="1" aria-label="Next month">${I.right}</button>
      </div>
      <div class="picker-grid">
        ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span class="picker-dow">${d}</span>`).join('')}
        ${monthDays(shown).map(d => {
          if (!d) return '<span aria-hidden="true"></span>';
          const iso = isoDay(d);
          const cls = ['pd', iso === today && 'today', iso === picked && 'on', busy[iso] && 'busy'].filter(Boolean).join(' ');
          return `<button type="button" class="${cls}" data-pick="${iso}" aria-pressed="${iso === picked}" title="${busy[iso] ? busy[iso] + ' other event' + (busy[iso] > 1 ? 's' : '') + ' this day' : ''}">${d.getDate()}</button>`;
        }).join('')}
      </div>
      <div class="picker-foot">
        <button type="button" class="chip" data-pick="${today}">Today</button>
        <button type="button" class="chip" data-pick="${isoDay(new Date(Date.now() + 864e5))}">Tomorrow</button>
        <button type="button" class="chip" data-pick="${isoDay(new Date(Date.now() + 7 * 864e5))}">In a week</button>
      </div>`;
    $('#efPicked', md.el).innerHTML = picked
      ? `${I.cal}<b>${new Date(picked + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</b>`
      : '<span class="muted">Pick a day on the calendar</span>';
  };
  drawPicker();

  md.el.addEventListener('click', ev => {
    const pm = ev.target.closest('[data-pm]');
    if (pm) { shown = addMonths(shown, +pm.dataset.pm); return drawPicker(); }
    const p = ev.target.closest('[data-pick]');
    if (p) { picked = p.dataset.pick; shown = monthStart(picked); return drawPicker(); }
    const t = ev.target.closest('[data-time]');
    if (t) { $('#efTime', md.el).value = t.dataset.time; syncTimes(); return; }
    const ty = ev.target.closest('[data-type]');
    if (ty) { type = ty.dataset.type; $$('#efTypes .chip', md.el).forEach(c => c.classList.toggle('on', c === ty)); }
  });
  const syncTimes = () => $$('#efTimes .chip', md.el).forEach(c => c.classList.toggle('on', c.dataset.time === $('#efTime', md.el).value.trim()));
  $('#efTime', md.el).addEventListener('input', syncTimes);

  md.onOk = () => {
    const out = { title: $('#efTitle').value.trim(), date: picked, time: $('#efTime').value.trim(), location: $('#efLoc').value.trim(), type };
    if (!out.title || !out.date) throw new Error('Title and date are required.');
    Object.keys(out).forEach(k => { if (out[k] === '') delete out[k]; });
    if (i === null) state.events.push(out); else state.events[i] = out;
    state.calMonth = monthStart(out.date);
    updateSavebar(); renderEvents();
  };
}

function importEvents(rows, filename) {
  const parsed = rows.map(eventFromRow).filter(e => e.title && e.date);
  const skipped = rows.length - parsed.length;
  if (!parsed.length) return toast("Couldn't find any events. The sheet needs Title and Date columns.", true);
  const md = modal(`Import ${filename}`, `
    <div class="stack">
      <div class="note">Found <b>${parsed.length}</b> events.${skipped ? ` ${skipped} rows without a title or date were skipped.` : ''}</div>
      <div class="radio-row">
        <label class="radio-card"><input type="radio" name="emode" value="merge" checked><div><b>Add &amp; update</b><span>Events with the same title and date are updated; the rest are added.</span></div></label>
        <label class="radio-card"><input type="radio" name="emode" value="replace"><div><b>Replace all events</b><span>The calendar will show exactly this sheet.</span></div></label>
      </div>
      <div class="preview-table"><table><thead><tr><th>Date</th><th>Title</th><th>Time</th><th>Location</th><th>Type</th></tr></thead><tbody>
        ${parsed.map(e => `<tr><td>${esc(e.date)}</td><td>${esc(e.title)}</td><td>${esc(e.time)}</td><td>${esc(e.location)}</td><td>${esc(e.type)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`, 'Import & publish', { wide: true });
  md.onOk = async () => {
    const mode = $('input[name=emode]:checked', md.el).value;
    const next = mode === 'replace' ? [] : [...state.events];
    parsed.forEach(e => {
      const i = next.findIndex(x => x.title.toLowerCase() === e.title.toLowerCase() && x.date === e.date);
      if (i >= 0) next[i] = { ...next[i], ...e }; else next.push(e);
    });
    state.events = next;
    await saveNow('events', `Imported ${parsed.length} events. The website is updated.`);
    renderEvents();
  };
}

/* ═════════════ GALLERY ═════════════ */

function renderGallery() {
  const g = state.gallery;
  $('#view').innerHTML = `
    <div class="page-head">
      <div><h1>Gallery</h1><p>Photos shown in "Life at Beta Pi" on the About page. Add a title and a short description for each.</p></div>
      <div class="actions"><a class="btn" href="about.html#gallery" target="_blank" rel="noopener">${I.ext}View on site</a></div>
    </div>
    <label class="dropzone" id="gDrop">
      <input type="file" id="gFiles" multiple accept="image/jpeg,image/png,image/webp,image/gif">
      ${I.ul}<b>Drop photos here or click to upload</b><span>JPG, PNG, or WEBP. You can select several at once.</span>
    </label>
    ${g.length ? `<div class="gallery-admin">${g.map((p, i) => `
      <div class="g-card">
        <img src="${esc(p.src)}" alt="" loading="lazy">
        <div class="g-body">
          <input class="input" placeholder="Title (e.g. Fall 2026 Retreat)" value="${esc(p.title)}" data-src="gallery" data-path="${i}.title">
          <textarea class="textarea" rows="2" placeholder="What's happening in this photo?" data-src="gallery" data-path="${i}.caption">${esc(p.caption)}</textarea>
        </div>
        <div class="g-tools">
          <span class="g-num">#${i + 1}</span>
          <div class="actions" style="gap:0">
            <button class="icon-btn" title="Move earlier" data-act="up" data-src="gallery" data-path="" data-i="${i}">${I.left}</button>
            <button class="icon-btn" title="Move later" data-act="down" data-src="gallery" data-path="" data-i="${i}">${I.right}</button>
            <button class="icon-btn" title="Delete photo" data-gdel="${i}">${I.trash}</button>
          </div>
        </div>
      </div>`).join('')}</div>` : `<div class="empty-state panel" style="margin-top:16px"><b>No photos yet</b>Upload some to show them on the About page.</div>`}`;

  const drop = $('#gDrop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
  $('#gFiles').onchange = async e => {
    const files = e.target.files; if (!files.length) return;
    try {
      const up = await uploadFiles(files, 'gallery');
      up.forEach(f => state.gallery.push({ src: f.path, title: '', caption: '' }));
      await saveNow('gallery', `Added ${up.length} photo${up.length > 1 ? 's' : ''}. Add titles and descriptions, then save.`);
      renderGallery();
    } catch (err) { toast(err.message, true); }
  };
  $$('[data-gdel]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.gdel, p = state.gallery[i];
    if (!confirm('Delete this photo from the gallery?')) return;
    state.gallery.splice(i, 1);
    await saveNow('gallery', 'Photo deleted.');
    api('DELETE', '/api/admin/upload', { path: p.src }).catch(() => {});
    renderGallery();
  });
}

/* Root-level lists (events, gallery) use an empty data-path */
$('#view').addEventListener('click', e => {
  const b = e.target.closest('[data-act][data-path=""]'); if (!b) return;
  const list = state[b.dataset.src], i = +b.dataset.i, act = b.dataset.act;
  if (act === 'del') { if (b.dataset.src === 'events' && !confirm(`Delete "${list[i].title}"?`)) return; list.splice(i, 1); }
  if (act === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
  if (act === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
  updateSavebar(); render();
}, true);

/* ═════════════ RUSH SETTINGS ═════════════ */

function renderRush() {
  const a = state.site.apply = state.site.apply || {};
  const isOpen = a.open !== false;
  $('#view').innerHTML = `
    <div class="page-head">
      <div><h1>Rush Settings</h1><p>Controls the application form and the rush section on the home page.</p></div>
      <div class="actions"><a class="btn" href="apply.html" target="_blank" rel="noopener">${I.ext}Open application form</a></div>
    </div>
    <div class="stack">
      <div class="panel panel-pad">
        <div class="panel-head"><div><h2>Application</h2><p>New applications are filed under this semester.</p></div>
          <label class="switch"><input type="checkbox" data-src="site" data-path="apply.open" ${isOpen ? 'checked' : ''}>${isOpen ? 'Accepting applications' : 'Applications closed'}</label></div>
        <div class="grid g3">
          <label class="f"><span>Semester</span><input class="input" list="termList" value="${esc(a.term)}" data-src="site" data-path="apply.term" placeholder="Spring 2027">
            <datalist id="termList">${upcomingTerms(6).map(t => `<option>${t}</option>`).join('')}</datalist>
            <small>Changing it starts a new list. Past semesters stay in Applications.</small></label>
          <label class="f"><span>Deadline</span><input class="input" type="datetime-local" value="${esc(a.deadline)}" data-src="site" data-path="apply.deadline"><small>Applications after this are marked late.</small></label>
          ${field('site', 'apply.status', 'Status label', { ph: 'Applications are open', hint: 'Shown on the home page rush card.' })}
        </div>
        <div style="margin-top:14px">${field('site', 'apply.copy', 'Intro text', { type: 'textarea', rows: 2 })}</div>
      </div>
      <div class="panel panel-pad">
        <div class="panel-head"><div><h2>Rush timeline</h2><p>The steps shown on the home page. Leave the description empty for invite-only rounds.</p></div></div>
        ${listEditor('site', 'apply.timeline', '1.2fr .8fr .8fr 1.6fr', [
          { key: 'step', label: 'Step' }, { key: 'when', label: 'When' }, { key: 'where', label: 'Where' }, { key: 'text', label: 'Description' },
        ], { step: '', when: '' }, 'Add step')}
      </div>
    </div>`;
}

/* ═════════════ SITE CONTENT ═════════════ */

function renderContent() {
  const s = state.site;
  s.values = s.values || []; s.stats = s.stats || []; s.philanthropy = s.philanthropy || {}; s.placements = s.placements || { firms: [] }; s.aboutVideo = s.aboutVideo || {};
  $('#view').innerHTML = `
    <div class="page-head"><div><h1>Site Content</h1><p>Text, links, photos, and video across the website.</p></div></div>
    <div class="stack">
      <div class="panel panel-pad"><div class="panel-head"><h2>Contact &amp; social</h2></div>
        <div class="grid g4">
          ${field('site', 'email', 'Email')}
          ${field('site', 'instagram', 'Instagram handle', { ph: 'umakpsi' })}
          ${field('site', 'tiktok', 'TikTok handle', { ph: 'umakpsi' })}
          ${field('site', 'linkedin', 'LinkedIn URL')}
        </div></div>

      <div class="panel panel-pad"><div class="panel-head"><div><h2>About page video</h2><p>Paste a YouTube or Vimeo link, or upload a video file. It plays when someone clicks it.</p></div></div>
        <div class="grid g3">
          <div>${field('site', 'aboutVideo.src', 'Video link or file', { ph: 'https://youtu.be/…' })}
            <label class="btn sm" style="margin-top:8px">${I.ul}Upload video file<input type="file" hidden accept="video/mp4,video/webm,video/quicktime" data-upload="site" data-src="site" data-path="aboutVideo.src"></label></div>
          ${uploadField('site', 'aboutVideo.poster', 'Cover image (optional)', 'site')}
          ${field('site', 'aboutVideo.caption', 'Caption', { ph: 'This is Beta Pi' })}
        </div></div>

      <div class="panel panel-pad values-edit"><div class="panel-head"><div><h2>Core values (BUSIK)</h2><p>Photo and description for each value on the About page. Portrait photos work best.</p></div></div>
        <div class="rows">${s.values.map((v, i) => `
          <div class="row-edit">
            <div class="upload-box">${v.photo ? `<img src="${esc(v.photo)}" alt="">` : `<div class="ph">${esc((v.name || '?')[0])}</div>`}
              <label class="btn sm">${I.ul}Photo<input type="file" hidden accept="image/*" data-upload="values" data-src="site" data-path="values.${i}.photo"></label>
              ${v.photo ? `<button type="button" class="btn sm ghost" data-clear="site|values.${i}.photo">Remove</button>` : ''}</div>
            <div class="stack">${field('site', `values.${i}.name`, 'Value')}${field('site', `values.${i}.text`, 'Description', { type: 'textarea', rows: 2 })}</div>
          </div>`).join('')}</div></div>

      <div class="panel panel-pad"><div class="panel-head"><h2>Stats band</h2></div>
        ${listEditor('site', 'stats', '1fr 2fr', [{ key: 'value', label: 'Number' }, { key: 'label', label: 'Label' }], { value: '', label: '' }, 'Add stat')}</div>

      <div class="panel panel-pad"><div class="panel-head"><h2>Brother spotlight</h2></div>
        <div class="grid g2">${field('site', 'spotlight.name', 'Name')}${field('site', 'spotlight.detail', 'Detail', { ph: 'Senior · Finance · …' })}</div>
        <div style="margin-top:14px">${field('site', 'spotlight.quote', 'Quote', { type: 'textarea', rows: 3 })}</div></div>

      <div class="panel panel-pad"><div class="panel-head"><h2>Philanthropy</h2></div>
        <div class="grid g2">
          ${field('site', 'philanthropy.cause', 'Cause')}
          ${field('site', 'philanthropy.donate', 'Donation link', { ph: 'https://…', hint: 'Shows a Donate button on the Philanthropy page.' })}
        </div>
        <div class="grid g2" style="margin-top:14px">
          ${field('site', 'philanthropy.blurb', 'Short description', { type: 'textarea', rows: 3 })}
          ${field('site', 'philanthropy.why', 'Why it matters', { type: 'textarea', rows: 3 })}
        </div>
        <div style="margin-top:14px">${field('site', 'philanthropy.ticker', 'Scrolling messages (one per line)', { type: 'lines', rows: 4 })}</div>
        <h2 style="margin:22px 0 10px">Initiatives</h2>
        ${listEditor('site', 'philanthropy.initiatives', '.6fr 1fr 2fr', [
          { key: 'icon', label: 'Icon', type: 'select', options: ['walk', 'chat', 'heart'] }, { key: 'title', label: 'Title' }, { key: 'text', label: 'Description' },
        ], { icon: 'heart', title: '', text: '' }, 'Add initiative')}
        <h2 style="margin:22px 0 10px">Support contacts</h2>
        ${listEditor('site', 'philanthropy.support', '1.4fr 1fr 1fr', [{ key: 'label', label: 'Label' }, { key: 'value', label: 'Shown as' }, { key: 'href', label: 'Link', ph: 'tel:3055551234' }], { label: '', value: '', href: '' }, 'Add contact')}
        <h2 style="margin:22px 0 10px">How to support a friend</h2>
        ${listEditor('site', 'philanthropy.supportSteps', '.6fr 1fr 2fr', [
          { key: 'icon', label: 'Icon', type: 'select', options: ['ask', 'ear', 'link', 'repeat', 'heart'] }, { key: 'title', label: 'Title' }, { key: 'text', label: 'Description' },
        ], { icon: 'heart', title: '', text: '' }, 'Add step')}
      </div>

      <div class="panel panel-pad"><div class="panel-head"><div><h2>Our Network</h2><p>Company logos in the scrolling band on the home page.</p></div></div>
        <div style="max-width:420px;margin-bottom:14px">${field('site', 'placements.title', 'Label above the band', { ph: 'Summer 2026 internships' })}</div>
        ${listEditor('site', 'placements.firms', '1fr 2fr .5fr', [
          { key: 'name', label: 'Company' }, { key: 'logo', label: 'Logo (link or upload)', type: 'urlupload', folder: 'site', ph: 'https://…/logo.svg' }, { key: 'height', label: 'Height (px)', type: 'number', numType: true },
        ], { name: '', logo: '', height: 32 }, 'Add company')}
      </div>

      <details class="panel panel-pad"><summary style="cursor:pointer;font-weight:700">Advanced: edit all site content as JSON</summary>
        <p class="muted" style="margin:10px 0">For anything not covered above. Mistakes here can break the site, so the JSON is checked before it's applied.</p>
        <textarea class="textarea json-edit" id="jsonEdit" spellcheck="false">${esc(JSON.stringify(s, null, 2))}</textarea>
        <div class="actions" style="margin-top:10px"><button class="btn" id="jsonApply">Apply JSON</button></div>
      </details>
    </div>`;

  $('#jsonApply').onclick = () => {
    try {
      const parsed = JSON.parse($('#jsonEdit').value);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Site content must be a JSON object.');
      state.site = parsed; updateSavebar(); renderContent(); toast('JSON applied. Click Save changes to publish.');
    } catch (err) { toast(`Invalid JSON: ${err.message}`, true); }
  };
}

/* ───────────── start ───────────── */

(async () => {
  try {
    const s = await api('GET', '/api/admin/session');
    if (s.authed) boot(); else showAuth(s.setup);
  } catch (e) { toast('Could not reach the server.', true); }
})();
