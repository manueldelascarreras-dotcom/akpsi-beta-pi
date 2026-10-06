/* Shared helpers, nav, footer, and reveal-on-scroll for every page. */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
/* Site data: on the live site it comes from Firestore (edited in the CMS); locally from data/*.json. */
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const CONTENT_URL = 'https://firestore.googleapis.com/v1/projects/umiami-akpsi/databases/(default)/documents/content/';
const fromFile = f => fetch(`data/${f}.json`).then(r => r.json());
const dataCache = {};
const getJSON = f => dataCache[f] || (dataCache[f] = LOCAL ? fromFile(f)
  : fetch(CONTENT_URL + f).then(r => r.ok ? r.json() : Promise.reject()).then(d => JSON.parse(d.fields.json.stringValue)).catch(() => fromFile(f)));
const initials = n => n.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
const grad = n => 'g' + ([...n].reduce((a, c) => a + c.charCodeAt(0), 0) % 4);

const LINKEDIN_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';

/* Member card shared by the home e-board preview and the members page. */
function memberCard(m) {
  const parts = m.name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : '';
  const photo = m.photo
    ? `<img src="${esc(m.photo)}" alt="" loading="lazy">`
    : `<div class="${grad(m.name)}" aria-hidden="true">${esc(initials(m.name))}</div>`;
  const meta = [
    m.major && `<span>${esc(m.major)}</span>`,
    m.minor && `<span>Minor in ${esc(m.minor)}</span>`,
    m.class && `<span class="muted">${esc(m.class)} Class${m.year ? ` · '${String(m.year).slice(-2)}` : ''}</span>`,
  ].filter(Boolean).join('');
  const inner = `
    <div class="member-photo">${photo}</div>
    <div class="member-name">${esc(parts.join(' '))}<br>${esc(last)}</div>
    ${m.role ? `<div class="member-role">${esc(m.role)}</div>` : ''}
    <div class="member-meta">${meta}</div>`;
  return m.linkedin
    ? `<a class="member-card" href="${esc(m.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(m.name)} on LinkedIn">${inner}
         <div class="member-overlay"><span>${LINKEDIN_SVG}View LinkedIn</span></div></a>`
    : `<div class="member-card">${inner}</div>`;
}

/* ── Nav ── */
const nav = $('main-nav'), burger = $('nav-hamburger'), menu = $('mobile-menu');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 20), { passive: true });
nav.classList.toggle('scrolled', scrollY > 20);
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  menu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { if (menu.classList.contains('open')) burger.click(); }));

/* ── Reveal on scroll ── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12 });
const observe = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
observe();

/* ── Site config (footer links, socials, apply links) ── */
const siteReady = getJSON('site').then(s => {
  const ig = `https://instagram.com/${s.instagram}`, tt = `https://www.tiktok.com/@${s.tiktok}`;
  document.querySelectorAll('[data-link="instagram"]').forEach(a => a.href = ig);
  document.querySelectorAll('[data-link="tiktok"]').forEach(a => a.href = tt);
  document.querySelectorAll('[data-link="linkedin"]').forEach(a => a.href = s.linkedin);
  document.querySelectorAll('[data-link="apply"]').forEach(a => a.href = s.applyForm);
  document.querySelectorAll('[data-link="email"]').forEach(a => { a.href = 'mailto:' + s.email; a.textContent = s.email; });
  document.querySelectorAll('[data-text="instagram"]').forEach(el => el.textContent = '@' + s.instagram);
  document.querySelectorAll('[data-text="tiktok"]').forEach(el => el.textContent = '@' + s.tiktok);
  return s;
});

/* ── Theme switch (Professional / Miami Vice) ── */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('akpsi-theme', t); } catch {}
  document.querySelectorAll('.theme-switch button').forEach(b => b.setAttribute('aria-pressed', b.dataset.theme === t));
}
document.querySelectorAll('.theme-switch').forEach(sw => {
  sw.innerHTML = '<button type="button" data-theme="pro">Professional</button><button type="button" data-theme="vice">Miami Vice</button>';
  sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTheme(b.dataset.theme); });
});
setTheme(document.documentElement.dataset.theme || 'pro');

document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
