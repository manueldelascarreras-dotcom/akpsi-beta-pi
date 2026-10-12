/* Beta Pi Pledge CMS
 * Read-only view of the pledge program: what pledges turned in, when, and how it was graded.
 * Reviewing, grading, posting assignments, and invite codes happen in the pledge portal itself.
 */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(method, url, body) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(url, opts);
  let data = {}; try { data = await res.json(); } catch {}
  if (res.status === 401 && !url.includes('/login') && !url.includes('/session')) { showAuth(false); throw new Error('Please log in again.'); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg; t.classList.toggle('err', err); t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

const svg = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  home: svg('<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
  users: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  x: svg('<path d="M18 6L6 18M6 6l12 12"/>', 2),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 2),
  dl: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 2),
  ext: svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>'),
  refresh: svg('<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>'),
  chev: svg('<path d="M9 18l6-6-6-6"/>', 2),
};

const state = { view: 'overview', portal: null, subFilter: { q: '', week: '', status: 'all', deliv: '' } };

/* ───────────── auth ───────────── */

let setupMode = false;
function showAuth(setup) {
  setupMode = setup;
  $('#app').hidden = true; $('#auth').hidden = false;
  $('#authText').textContent = setup ? 'Create the CMS password and share it only with the VPM and pledge educators.' : 'Log in to see what pledges turned in, when, and how it was graded.';
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
$('#logout').addEventListener('click', async () => { await api('POST', '/api/admin/logout'); location.reload(); });
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

function modal(title, body, okLabel = 'Save') {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${I.x}</button></div>
      <div class="modal-body">${body}<p class="auth-error" data-err></p></div>
      <div class="modal-foot"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>${esc(okLabel)}</button></div>
    </div>`;
  document.body.appendChild(wrap);
  const m = { el: wrap, onOk: null, close: () => { wrap.remove(); document.removeEventListener('keydown', onKey); } };
  const onKey = e => { if (e.key === 'Escape') m.close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', async e => {
    if (e.target === wrap || e.target.closest('[data-close]')) return m.close();
    const btn = e.target.closest('[data-ok]');
    if (btn) {
      try { btn.disabled = true; if (m.onOk) await m.onOk(); m.close(); }
      catch (err) { $('[data-err]', wrap).textContent = err.message; btn.disabled = false; }
    }
  });
  setTimeout(() => $('input', wrap)?.focus(), 30);
  return m;
}

function downloadSheet(filename, headers, rows, widths) {
  if (!window.XLSX) return toast('Excel tools are still loading. Try again in a second.', true);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = widths.map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

/* ───────────── pledge program data ───────────── */

const PORTAL = './';
async function loadPortal(force) {
  if (state.portal && !force) return state.portal;
  state.portal = await api('GET', '/api/admin/portal');
  renderNav();
  return state.portal;
}
const pp = {
  pledges: () => state.portal.people.filter(p => p.role === 'pledge' && p.active).sort((a, b) => a.name.localeCompare(b.name)),
  person: uid => state.portal.people.find(p => p.uid === uid),
  deliv: id => state.portal.deliverables.find(d => d.id === id),
  sub: (dId, uid) => state.portal.submissions.find(s => s.deliverableId === dId && s.pledgeUid === uid),
  weekTitle: n => state.portal.program.weeks?.[n - 1]?.title || '',
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
/* Week 1 starts on program.startDate; clamp to the 8-week program */
function currentWeek() {
  const start = Date.parse(state.portal.program.startDate || '');
  if (!start) return 0;
  return Math.min(8, Math.max(1, Math.floor((Date.now() - start) / 6048e5) + 1));
}
const fmtTime = iso => iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
function lateBy(dueIso, atIso) {
  const ms = Date.parse(atIso) - Date.parse(dueIso);
  if (!(ms > 0)) return '';
  const h = Math.round(ms / 36e5);
  return h < 24 ? `${Math.max(1, h)}h late` : `${Math.floor(h / 24)}d ${h % 24}h late`;
}
function ago(iso) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}
const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const avg = list => list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length * 10) / 10 : null;
const portalFile = (path, dl) => `/api/admin/portal-file?path=${encodeURIComponent(path)}${dl ? '&download=1' : ''}`;
const pill = (tone, label) => `<span class="pill ${tone}"><i></i>${label}</span>`;
const timing = (d, s) => s ? (s.late ? pill('bad', lateBy(d.dueAt, s.submittedAt) || 'Late') : pill('ok', 'On time'))
  : pill('bad', (lateBy(d.dueAt, new Date().toISOString()) || 'Late').replace('late', 'overdue'));
const files = s => !s ? '' : [...(s.files || []).map((f, i) => `<a href="${portalFile(f.path)}" target="_blank" rel="noopener" title="${esc(f.name)}">${I.file}${(s.files || []).length > 1 ? `File ${i + 1}` : 'Open'}</a>`),
  s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${I.ext}Link</a>` : ''].join('') || '<span class="muted">Note only</span>';

/* Page frame: sticky translucent header + content */
function page(title, sub, actions, body) {
  $('#view').innerHTML = `
    <header class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="actions">${actions || ''}</div></header>
    <div class="page-body">${body}</div>`;
}
async function withPortal(title, draw) {
  if (!state.portal) {
    page(title, 'Loading the pledge program…', '', '<div class="skeleton"></div><div class="skeleton tall"></div>');
    try { await loadPortal(); } catch (e) { page(title, esc(e.message), '', ''); return; }
  }
  draw();
}
const refreshBtn = `<button class="btn" data-refresh>${I.refresh}Refresh</button>`;
$('#view').addEventListener('click', async e => {
  if (e.target.closest('[data-refresh]')) {
    try { await loadPortal(true); render(); toast('Up to date.'); } catch (err) { toast(err.message, true); }
  }
  const p = e.target.closest('[data-pledge]');
  if (p && !e.target.closest('a')) openPledge(p.dataset.pledge);
});
$('#view').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[tabindex="0"]')) e.target.click(); });

/* ───────────── Overview ───────────── */

const stat = (k, v, s, tone, key) => `<${key ? `button type="button" data-stat="${key}"` : 'div'} class="card stat ${tone}"><span class="k">${k}</span><span class="v">${v}</span><span class="s">${s}</span></${key ? 'button' : 'div'}>`;
function goSubmissions(f) { Object.assign(state.subFilter, { q: '', week: '', deliv: '', status: 'all' }, f); go('submissions'); }

function renderOverview() {
  withPortal('Overview', () => {
    const P = state.portal, ps = pp.pledges(), wk = currentWeek();
    const all = ps.flatMap(p => P.deliverables.map(d => ({ d, p, st: pStatus(d, p.uid) })));
    const count = k => all.filter(r => k === 'late' ? r.st.s?.late : r.st.key === k).length;
    const weekPct = n => {
      const r = all.filter(x => x.d.week === n);
      return r.length ? Math.round(r.filter(x => x.st.key === 'approved').length / r.length * 100) : null;
    };
    const attention = ps.map(p => ({ p, missing: all.filter(r => r.p === p && r.st.key === 'missing').length, late: all.filter(r => r.p === p && r.st.s?.late).length }))
      .filter(r => r.missing || r.late).sort((a, b) => b.missing - a.missing || b.late - a.late).slice(0, 6);
    const now = Date.now();
    const dueNext = P.deliverables.filter(d => d.dueAt && Date.parse(d.dueAt) > now).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 5);
    const recent = P.submissions.filter(s => pp.deliv(s.deliverableId) && pp.person(s.pledgeUid))
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))).slice(0, 6);

    page('Overview', `${esc(P.program.className || 'Pledge class')}${wk ? ` · Week ${wk} of 8${pp.weekTitle(wk) ? `, ${esc(pp.weekTitle(wk))}` : ''}` : ''}`,
      `${refreshBtn}<a class="btn primary" href="${PORTAL}#/review" target="_blank" rel="noopener">Review in the portal${I.ext}</a>`, `
      <section class="card weeks">
        <div class="card-head"><h2>8-week program</h2><span class="muted">Class work approved</span></div>
        <ol class="week-track">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => { const pct = weekPct(n); return `
          <li class="${n === wk ? 'now' : ''}${n < wk ? ' past' : ''}">
            <button type="button" data-week="${n}" title="See Week ${n} submissions">
              <span class="wk-n">Week ${n}${n === wk ? '<em>Now</em>' : ''}</span><span class="wk-t">${esc(pp.weekTitle(n) || '—')}</span>
              <span class="wk-bar"><i style="width:${pct ?? 0}%"></i></span>
              <span class="wk-p">${pct == null ? 'No work yet' : `${pct}%`}</span>
            </button></li>`; }).join('')}</ol>
      </section>
      <div class="stats">
        ${stat('Pledges', ps.length, `${P.deliverables.length} assignments posted`, '')}
        ${stat('To review', count('submitted'), 'waiting for an educator', 'info', 'submitted')}
        ${stat('Turned in late', count('late'), 'after the due time', 'warn', 'late')}
        ${stat('Missing', count('missing'), 'past due, not turned in', 'bad', 'missing')}
      </div>
      <div class="grid2">
        <section class="card">
          <div class="card-head"><h2>Needs attention</h2><span class="muted">Missing or late work</span></div>
          ${attention.length ? `<ul class="list">${attention.map(r => `<li class="row" data-pledge="${r.p.uid}" tabindex="0">
            <span class="avatar">${initials(r.p.name)}</span>
            <span class="grow"><b>${esc(r.p.name)}</b><small>${esc(pp.person(r.p.educatorUid)?.name || 'No educator')}</small></span>
            ${r.missing ? pill('bad', `${r.missing} missing`) : ''}${r.late ? pill('warn', `${r.late} late`) : ''}<span class="chev">${I.chev}</span></li>`).join('')}</ul>`
            : '<p class="empty">Everyone is caught up.</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>Due next</h2><span class="muted">Turned in so far</span></div>
          ${dueNext.length ? `<ul class="list">${dueNext.map(d => { const n = ps.filter(p => pp.sub(d.id, p.uid)).length, at = new Date(d.dueAt); return `<li class="row" data-deliv="${d.id}" tabindex="0">
            <span class="date"><small>${at.toLocaleString('en-US', { month: 'short' })}</small><b>${at.getDate()}</b></span>
            <span class="grow"><b>${esc(d.name)}</b><small>Week ${d.week} · due ${fmtTime(d.dueAt)}</small></span>
            <span class="ratio"><b>${n}</b>/${ps.length}</span><span class="chev">${I.chev}</span></li>`; }).join('')}</ul>`
            : '<p class="empty">Nothing due right now.</p>'}
        </section>
      </div>
      <section class="card">
        <div class="card-head"><h2>Latest turn-ins</h2><button class="link" data-goto="submissions">See all</button></div>
        ${recent.length ? `<ul class="list">${recent.map(s => { const d = pp.deliv(s.deliverableId), p = pp.person(s.pledgeUid); return `<li class="row" data-pledge="${p.uid}" tabindex="0">
          <span class="avatar">${initials(p.name)}</span>
          <span class="grow"><b>${esc(p.name)}</b><small>${esc(d.name)} · ${fmtTime(s.submittedAt)}</small></span>
          ${timing(d, s)}<span class="when">${ago(s.submittedAt)}</span></li>`; }).join('')}</ul>`
          : '<p class="empty">No turn-ins yet.</p>'}
      </section>`);
    $$('[data-week]').forEach(b => b.onclick = () => goSubmissions({ week: b.dataset.week }));
    $$('[data-stat]').forEach(b => b.onclick = () => goSubmissions({ status: b.dataset.stat }));
    $$('.row[data-deliv]').forEach(b => b.onclick = () => goSubmissions({ deliv: b.dataset.deliv }));
    $$('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));
  });
}

/* ───────────── Submissions ───────────── */

function renderSubmissions() {
  withPortal('Submissions', () => {
    const F = state.subFilter, P = state.portal, ps = pp.pledges();
    /* One row per turned-in deliverable, plus one per missing one */
    const rows = [];
    P.submissions.forEach(s => { const d = pp.deliv(s.deliverableId), p = pp.person(s.pledgeUid); if (d && p) rows.push({ d, p, st: pStatus(d, p.uid), s }); });
    ps.forEach(p => P.deliverables.forEach(d => { const st = pStatus(d, p.uid); if (st.key === 'missing') rows.push({ d, p, st }); }));
    const match = (r, k) => k === 'all' ? r.s : k === 'late' ? r.s?.late : r.st.key === k;
    const scoped = rows.filter(r => (!F.week || String(r.d.week) === F.week) && (!F.deliv || r.d.id === F.deliv)
      && (!F.q || `${r.p.name} ${r.d.name}`.toLowerCase().includes(F.q.toLowerCase())));
    const count = k => scoped.filter(r => match(r, k)).length;
    const shown = scoped.filter(r => match(r, F.status))
      .sort((a, b) => String(b.s?.submittedAt || b.d.dueAt).localeCompare(String(a.s?.submittedAt || a.d.dueAt)));
    const tabs = [['all', 'Received'], ['submitted', 'To review'], ['revision', 'Revision'], ['approved', 'Approved'], ['late', 'Late'], ['missing', 'Missing']];
    page('Submissions', 'Everything pledges turned in, the exact time, and whether it was late.',
      `${refreshBtn}<button class="btn" id="subExport">${I.dl}Export</button>`, `
      <div class="card">
        <div class="toolbar">
          <div class="segmented" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${F.status === k}" class="${F.status === k ? 'on' : ''}" data-substatus="${k}">${l}<span>${count(k)}</span></button>`).join('')}</div>
          <span class="grow"></span>
          <div class="search">${I.search}<input class="input" id="subQ" placeholder="Search" value="${esc(F.q)}" aria-label="Search pledge or assignment"></div>
          <select class="select" id="subWeek" aria-label="Week"><option value="">All weeks</option>${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}" ${F.week === String(n) ? 'selected' : ''}>Week ${n}${pp.weekTitle(n) ? ` · ${esc(pp.weekTitle(n))}` : ''}</option>`).join('')}</select>
          ${F.deliv ? `<button class="token" id="subClearDeliv" title="Clear">${esc(pp.deliv(F.deliv)?.name || '')}${I.x}</button>` : ''}
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Pledge</th><th>Assignment</th><th>Due</th><th>Turned in</th><th>Status</th><th class="num">Grade</th><th>Files</th></tr></thead>
          <tbody>${shown.length ? shown.map(({ d, p, st, s }) => `<tr class="click" data-pledge="${p.uid}">
            <td class="nowrap"><div class="who"><span class="avatar sm">${initials(p.name)}</span><span><b>${esc(p.name)}</b><small>${esc(pp.person(p.educatorUid)?.name || 'No educator')}</small></span></div></td>
            <td class="assign"><b class="fw5">${esc(d.name)}</b><small>Week ${d.week}</small></td>
            <td class="nowrap">${fmtTime(d.dueAt)}</td>
            <td class="nowrap"><div class="turned">${s ? fmtTime(s.submittedAt) : '<span class="muted">Not turned in</span>'}${timing(d, s)}</div>${s && s.firstSubmittedAt && s.firstSubmittedAt !== s.submittedAt ? `<small>first ${fmtTime(s.firstSubmittedAt)}</small>` : ''}</td>
            <td class="nowrap">${pill(st.tone, st.label)}${s?.reviewedByName ? `<small>by ${esc(s.reviewedByName)}</small>` : ''}</td>
            <td class="num">${s?.grade != null ? `<b>${s.grade}</b>` : '<span class="muted">—</span>'}</td>
            <td class="files">${files(s)}</td>
          </tr>`).join('') : `<tr><td colspan="7"><p class="empty">${P.deliverables.length ? 'Nothing matches these filters.' : 'Post assignments in the pledge portal (Classwork → Create) and submissions will show up here.'}</p></td></tr>`}</tbody>
        </table></div>
        <div class="foot">${shown.length} shown</div>
      </div>`);
    $('#subQ').oninput = e => { F.q = e.target.value; const pos = e.target.selectionStart; renderSubmissions(); const i = $('#subQ'); i.focus(); i.setSelectionRange(pos, pos); };
    $('#subWeek').onchange = e => { F.week = e.target.value; renderSubmissions(); };
    $('#subClearDeliv')?.addEventListener('click', () => { F.deliv = ''; renderSubmissions(); });
    $$('[data-substatus]').forEach(b => b.onclick = () => { F.status = b.dataset.substatus; renderSubmissions(); });
    $('#subExport').onclick = () => downloadSheet(`Beta Pi submissions ${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['Pledge', 'Pledge educator', 'Week', 'Assignment', 'Due', 'Turned in', 'Timing', 'Status', 'Grade', 'Reviewed by', 'Files'],
      shown.map(({ d, p, st, s }) => [p.name, pp.person(p.educatorUid)?.name || '', d.week, d.name, fmtTime(d.dueAt), s ? fmtTime(s.submittedAt) : 'Not turned in',
        s ? (s.late ? lateBy(d.dueAt, s.submittedAt) || 'Late' : 'On time') : 'Missing', st.label, s?.grade ?? '', s?.reviewedByName || '', (s?.files || []).map(f => f.name).join(', ')]),
      [22, 20, 7, 30, 22, 22, 14, 18, 8, 18, 30]);
  });
}

/* ───────────── Assignments ───────────── */

function renderAssignments() {
  withPortal('Assignments', () => {
    const P = state.portal, ps = pp.pledges();
    const rows = P.deliverables.map(d => {
      const st = ps.map(p => pStatus(d, p.uid));
      return { d, turned: st.filter(x => x.s).length, late: st.filter(x => x.s?.late).length, missing: st.filter(x => x.key === 'missing').length,
        approved: st.filter(x => x.key === 'approved').length, waiting: st.filter(x => x.key === 'submitted').length,
        avg: avg(st.map(x => x.s?.grade).filter(g => g != null)) };
    });
    const zero = '<span class="muted">0</span>';
    page('Assignments', 'Every deliverable in the 8-week program and who has turned it in. Click one to see its submissions.',
      `<a class="btn primary" href="${PORTAL}#/classwork" target="_blank" rel="noopener">${I.plus}Add in the portal</a>`, `
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Week</th><th>Assignment</th><th>Due</th><th>Turned in</th><th class="num">To review</th><th class="num">Late</th><th class="num">Missing</th><th class="num">Approved</th><th class="num">Avg grade</th></tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr class="click" data-deliv="${r.d.id}">
          <td class="nowrap"><b>Week ${r.d.week}</b><small>${esc(pp.weekTitle(r.d.week))}</small></td>
          <td><b class="fw5">${esc(r.d.name)}</b></td><td class="nowrap">${fmtTime(r.d.dueAt)}</td>
          <td class="nowrap"><span class="mini-bar"><i style="width:${ps.length ? r.turned / ps.length * 100 : 0}%"></i></span><b>${r.turned}</b><span class="muted">/${ps.length}</span></td>
          <td class="num">${r.waiting || zero}</td>
          <td class="num">${r.late ? `<span class="count warn">${r.late}</span>` : zero}</td>
          <td class="num">${r.missing ? `<span class="count bad">${r.missing}</span>` : zero}</td>
          <td class="num">${r.approved ? `<span class="count ok">${r.approved}</span>` : zero}</td>
          <td class="num">${r.avg ?? '<span class="muted">—</span>'}</td></tr>`).join('') : `<tr><td colspan="9"><p class="empty">No assignments yet. Create them in the pledge portal under Classwork.</p></td></tr>`}</tbody>
      </table></div></div>`);
    $$('tr[data-deliv]').forEach(r => r.onclick = () => goSubmissions({ deliv: r.dataset.deliv }));
  });
}

/* ───────────── Pledges ───────────── */

function pledgeRow(p) {
  const st = state.portal.deliverables.map(d => pStatus(d, p.uid));
  return { p, approved: st.filter(x => x.key === 'approved').length, late: st.filter(x => x.s?.late).length, missing: st.filter(x => x.key === 'missing').length,
    avg: avg(st.map(x => x.s?.grade).filter(g => g != null)), last: st.map(x => x.s?.submittedAt).filter(Boolean).sort().pop() };
}
function renderPledgeRoster() {
  withPortal('Pledges', () => {
    const P = state.portal, ps = pp.pledges(), rows = ps.map(pledgeRow), total = P.deliverables.length;
    const edu = P.people.filter(p => p.role === 'educator' && p.active).length;
    page('Pledges', `${ps.length} ${ps.length === 1 ? 'pledge' : 'pledges'} and ${edu} pledge ${edu === 1 ? 'educator' : 'educators'} in ${esc(P.program.className || 'the class')}. Click a pledge to see all their work.`,
      `<a class="btn" href="${PORTAL}#/people" target="_blank" rel="noopener">${I.users}Invite in the portal</a><button class="btn" id="rosterExport">${I.dl}Export</button>`, `
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>Pledge</th><th>Pledge educator</th><th>Approved</th><th class="num">Avg grade</th><th class="num">Late</th><th class="num">Missing</th><th>Last turned in</th></tr></thead>
        <tbody>${rows.length ? rows.map(r => `<tr class="click" data-pledge="${r.p.uid}">
          <td class="nowrap"><div class="who"><span class="avatar sm">${initials(r.p.name)}</span><span><b>${esc(r.p.name)}</b><small>${esc(r.p.email || '')}</small></span></div></td>
          <td>${esc(pp.person(r.p.educatorUid)?.name || '') || '<span class="muted">Not assigned</span>'}</td>
          <td class="nowrap"><span class="mini-bar"><i style="width:${total ? r.approved / total * 100 : 0}%"></i></span><b>${r.approved}</b><span class="muted">/${total}</span></td>
          <td class="num">${r.avg ?? '<span class="muted">—</span>'}</td>
          <td class="num">${r.late ? `<span class="count warn">${r.late}</span>` : '<span class="muted">0</span>'}</td>
          <td class="num">${r.missing ? `<span class="count bad">${r.missing}</span>` : '<span class="muted">0</span>'}</td>
          <td class="nowrap">${r.last ? fmtTime(r.last) : '<span class="muted">Nothing yet</span>'}</td></tr>`).join('')
          : `<tr><td colspan="7"><p class="empty">No pledges yet. Create invite codes in the portal under People & access.</p></td></tr>`}</tbody>
      </table></div></div>`);
    $('#rosterExport').onclick = () => downloadSheet(`Beta Pi pledges ${new Date().toISOString().slice(0, 10)}.xlsx`,
      ['Pledge', 'Email', 'Pledge educator', 'Approved', 'Average grade', 'Late', 'Missing', 'Last turned in'],
      rows.map(r => [r.p.name, r.p.email || '', pp.person(r.p.educatorUid)?.name || '', `${r.approved}/${total}`, r.avg ?? '', r.late, r.missing, r.last ? fmtTime(r.last) : '']),
      [22, 28, 20, 10, 12, 8, 8, 22]);
  });
}

/* ───────────── Pledge sheet: one pledge, every deliverable ───────────── */

let sheetOpener = null;
function openPledge(uid) {
  const P = state.portal, p = pp.person(uid);
  if (!p) return;
  const r = pledgeRow(p);
  const weeks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ n, list: P.deliverables.filter(d => d.week === n) })).filter(w => w.list.length);
  sheetOpener = document.activeElement;
  $('#sheet').innerHTML = `
    <header class="sheet-head">
      <span class="avatar lg">${initials(p.name)}</span>
      <div class="grow"><h2>${esc(p.name)}</h2><p>${esc(p.email || '')}${pp.person(p.educatorUid) ? ` · Educator: ${esc(pp.person(p.educatorUid).name)}` : ''}</p></div>
      <button class="icon-btn" data-close-sheet aria-label="Close">${I.x}</button>
    </header>
    <div class="sheet-body">
      <div class="facts">
        <div><span>Approved</span><b>${r.approved}/${P.deliverables.length}</b></div>
        <div><span>Avg grade</span><b>${r.avg ?? '—'}</b></div>
        <div><span>Late</span><b class="${r.late ? 'warn' : ''}">${r.late}</b></div>
        <div><span>Missing</span><b class="${r.missing ? 'bad' : ''}">${r.missing}</b></div>
      </div>
      ${weeks.map(w => `<h3>Week ${w.n}${pp.weekTitle(w.n) ? ` · ${esc(pp.weekTitle(w.n))}` : ''}</h3>
        <ul class="group">${w.list.map(d => { const st = pStatus(d, uid), s = st.s; return `<li>
          <div class="grow"><b>${esc(d.name)}</b>
            <small>Due ${fmtTime(d.dueAt)}${s ? ` · turned in ${fmtTime(s.submittedAt)}` : ''}${s?.grade != null ? ` · ${s.grade}/100` : ''}</small>
            ${s ? `<div class="files">${files(s)}</div>` : ''}</div>
          <div class="tags">${pill(st.tone, st.label)}${s || st.key === 'missing' ? timing(d, s) : ''}</div></li>`; }).join('')}</ul>`).join('') || '<p class="empty">No assignments yet.</p>'}
      <a class="btn wide" href="${PORTAL}#/pledge/${encodeURIComponent(uid)}" target="_blank" rel="noopener">Open ${esc(p.name.split(' ')[0])} in the portal${I.ext}</a>
    </div>`;
  $('#scrim').classList.add('open'); $('#sheet').classList.add('open');
  $('#sheet').removeAttribute('inert');
  setTimeout(() => $('[data-close-sheet]').focus(), 50);
}
function closeSheet() {
  $('#scrim').classList.remove('open'); $('#sheet').classList.remove('open');
  $('#sheet').setAttribute('inert', '');
  sheetOpener?.focus?.();
}
$('#scrim').addEventListener('click', closeSheet);
$('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close-sheet]')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('open')) closeSheet(); });

/* ───────────── shell ───────────── */

const VIEWS = [
  { id: 'overview', label: 'Overview', icon: I.home, render: renderOverview },
  { id: 'submissions', label: 'Submissions', icon: I.inbox, render: renderSubmissions },
  { id: 'assignments', label: 'Assignments', icon: I.file, render: renderAssignments },
  { id: 'pledges', label: 'Pledges', icon: I.users, render: renderPledgeRoster },
];

function boot() {
  state.view = VIEWS.some(v => v.id === location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  $('#auth').hidden = true; $('#app').hidden = false;
  renderNav(); render();
}
function renderNav() {
  const waiting = state.portal ? state.portal.submissions.filter(s => s.status !== 'approved' && s.status !== 'needs_revision').length : 0;
  $('#sideNav').innerHTML = VIEWS.map(v => `
    <button type="button" data-view="${v.id}" class="${v.id === state.view ? 'active' : ''}" ${v.id === state.view ? 'aria-current="page"' : ''}>
      ${v.icon}<span>${v.label}</span>${v.id === 'submissions' && waiting ? `<span class="badge" title="Waiting for review">${waiting}</span>` : ''}
    </button>`).join('');
}
function go(view) {
  state.view = view;
  if (location.hash.slice(1) !== view) history.pushState(null, '', `#${view}`);
  $('#side').classList.remove('open');
  closeSheet();
  renderNav(); render(); scrollTo(0, 0);
}
$('#sideNav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) go(b.dataset.view); });
$('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
window.addEventListener('popstate', () => { const v = location.hash.slice(1); if (VIEWS.some(x => x.id === v)) { state.view = v; renderNav(); render(); } });

function render() { VIEWS.find(v => v.id === state.view).render(); }

/* ───────────── start ───────────── */

(async () => {
  try {
    const s = await api('GET', '/api/admin/session');
    if (s.authed) boot(); else showAuth(s.setup);
  } catch (e) { toast('Could not reach the server.', true); }
})();
