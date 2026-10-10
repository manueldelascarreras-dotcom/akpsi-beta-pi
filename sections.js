/* Renders the data-driven page sections. Each block only runs when its
   container is on the page, so any page can include just the sections it needs. */

const ICONS = {
  walk:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M9 21l2-6 3 3v3M7 12l3-4 4 1 3 3M11 15l1-5"/></svg>',
  chat:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  ask:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/></svg>',
  ear:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 3-2 4-3 5.5S14 18 12 19.5 8 20 8 18"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3"/></svg>',
  link:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
};

const has = id => document.getElementById(id);

siteReady.then(s => {
  /* Apply: rush timeline */
  if (has('timeline')) {
    $('applyTerm').textContent = `${s.apply.term} Rush`;
    $('applyStatus').textContent = s.apply.status;
    $('applyCopy').textContent = s.apply.copy;
    $('timeline').innerHTML = s.apply.timeline.map((t, i) => `
      <li><span class="dot">${i + 1}</span>
        <div class="card"><h4>${esc(t.step)}</h4><div class="when">${[t.when, t.where].filter(Boolean).map(esc).join(' · ')}</div>${t.text ? `<p>${esc(t.text)}</p>` : ''}</div>
      </li>`).join('');
  }

  /* Core values: photo if one is set, otherwise the BUSIK letter */
  if (has('valuesGrid')) {
    $('valuesGrid').innerHTML = s.values.map(v => `
      <article class="value-card">
        <div class="value-photo">
          ${v.photo ? `<img src="${esc(v.photo)}" alt="Beta Pi brothers: ${esc(v.name)}" loading="lazy">` : ''}
          <span class="value-letter" aria-hidden="true">${esc(v.name[0])}</span>
        </div>
        <h4><em>${esc(v.name[0])}</em>${esc(v.name.slice(1))}</h4>
        <p>${esc(v.text)}</p>
      </article>`).join('');
  }

  if (has('statsGrid')) {
    $('statsGrid').innerHTML = s.stats.map(st =>
      `<div class="reveal"><div class="stat-value">${esc(st.value)}</div><div class="stat-rule" aria-hidden="true"></div><div class="stat-label">${esc(st.label)}</div></div>`).join('');
  }

  /* Network marquee: the list is rendered twice so the loop is seamless */
  if (has('networkTrack')) {
    $('networkLabel').textContent = s.placements.title;
    const logos = s.placements.firms.map(f => typeof f === 'string' ? { name: f } : f).map(f => `
      <span class="logo-item"${f.height ? ` style="--h:${+f.height}px"` : ''}>${f.logo
        ? `<img src="${esc(f.logo)}" alt="${esc(f.name)}" loading="eager" referrerpolicy="no-referrer">`
        : esc(f.name)}</span>`).join('');
    $('networkTrack').innerHTML = logos + `<div style="display:contents" aria-hidden="true">${logos}</div>`;
  }

  if (has('spotQuote')) {
    $('spotQuote').textContent = s.spotlight.quote;
    $('spotName').textContent = s.spotlight.name;
    $('spotDetail').textContent = s.spotlight.detail;
  }

  /* Philanthropy */
  const ph = s.philanthropy;
  if (has('philCause')) $('philCause').textContent = ph.cause;
  if (has('philBlurb')) $('philBlurb').textContent = ph.blurb;
  if (has('philInitiatives')) {
    $('philInitiatives').innerHTML = ph.initiatives.map(it => `
      <div class="phil-card">
        <div class="icon" aria-hidden="true">${ICONS[it.icon] || ICONS.heart}</div>
        <h4>${esc(it.title)}</h4>
        <p>${esc(it.text)}</p>
      </div>`).join('');
  }
  if (has('helpMore')) {
    $('helpMore').innerHTML = ph.support.map(x => `${esc(x.label)}: <a href="${esc(x.href)}">${esc(x.value)}</a>`).join('<br>');
  }
  if (has('philTicker')) {
    const phrases = ph.ticker.map(t => `<span>${esc(t)}<b>;</b></span>`).join('');
    $('philTicker').innerHTML = phrases + phrases;
  }
  if (has('philWhy')) $('philWhy').textContent = ph.why;
  if (has('supportSteps')) {
    $('supportSteps').innerHTML = ph.supportSteps.map((st, i) => `
      <li class="support-step">
        <div class="icon" aria-hidden="true">${ICONS[st.icon] || ICONS.heart}</div>
        <span class="n">${String(i + 1).padStart(2, '0')}</span>
        <h4>${esc(st.title)}</h4>
        <p>${esc(st.text)}</p>
      </li>`).join('');
  }
  if (has('donateBtn')) {
    if (ph.donate) $('donateBtn').href = ph.donate;
    else $('donateBtn').remove();
  }

  /* About page video */
  if (has('videoFrame')) setupVideo(s.aboutVideo || {});

  observe();
});

/* Click-to-play video. Supports YouTube, Vimeo, or a direct video file (mp4/webm). */
function setupVideo(v) {
  const frame = $('videoFrame'), btn = $('videoPlay');
  if (v.poster) { frame.style.setProperty('--poster', `url("${v.poster}")`); frame.classList.add('has-poster'); }
  if (v.caption) $('videoCaption').textContent = v.caption;

  btn.addEventListener('click', () => {
    const src = (v.src || '').trim();
    if (!src) { frame.classList.add('soon'); return; }
    const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    const vm = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    let player;
    if (yt || vm) {
      player = document.createElement('iframe');
      player.src = yt
        ? `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`
        : `https://player.vimeo.com/video/${vm[1]}?autoplay=1&title=0&byline=0`;
      player.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      player.allowFullscreen = true;
      player.title = v.caption || 'Beta Pi video';
    } else {
      player = document.createElement('video');
      player.src = src;
      player.controls = true;
      player.autoplay = true;
      player.playsInline = true;
      if (v.poster) player.poster = v.poster;
    }
    player.className = 'video-player';
    frame.appendChild(player);
    frame.classList.add('playing');
  });
}

/* Events calendar: Weekly / Monthly widget (Sunday to Saturday) */
if (has('weekList')) getJSON('events').then(events => {
  const DAY = 864e5;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startOfWeek = d => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x; };
  const thisWeek = startOfWeek(today);
  const fmt = (d, o) => d.toLocaleDateString('en-US', o);
  events.forEach(e => { e._d = new Date(e.date + 'T00:00:00'); });
  events.sort((a, b) => a._d - b._d);
  let week = thisWeek;
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let mode = 'week';

  const eventRow = e => `
    <div class="week-event${e._d < today ? ' past' : ''}">
      <div class="when">${fmt(e._d, { weekday: 'short' })} ${e._d.getDate()}</div>
      <div>
        <div class="title">${esc(e.title)}</div>
        <div class="meta">${[e.time, e.location].filter(Boolean).map(esc).join(' · ')}</div>
      </div>
    </div>`;
  const dayCell = (d, list) => {
    const cls = [d.getTime() === today.getTime() && 'today', d < today && 'past', list.some(e => e._d.getTime() === d.getTime()) && 'has'].filter(Boolean).join(' ');
    return `<button type="button" class="day ${cls}" data-day="${d.getTime()}" aria-label="${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}"><div class="dow">${fmt(d, { weekday: 'narrow' })}</div><div class="num">${d.getDate()}</div><span class="dot"></span></button>`;
  };

  const render = () => {
    document.querySelectorAll('#calSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    $('weekStrip').classList.toggle('is-month', mode === 'month');
    const unit = document.querySelector('#events-heading em'); if (unit) unit.textContent = mode === 'month' ? 'month' : 'week';
    if (mode === 'week') {
      const end = new Date(week.getTime() + 6 * DAY);
      const diff = Math.round((week - thisWeek) / (7 * DAY));
      $('weekLabel').textContent = diff === 0 ? 'This' : diff === 1 ? 'Next' : diff === -1 ? 'Last' : 'That';
      $('weekRange').textContent = week.getMonth() === end.getMonth()
        ? `${fmt(week, { month: 'short', day: 'numeric' })} – ${end.getDate()}`
        : `${fmt(week, { month: 'short', day: 'numeric' })} – ${fmt(end, { month: 'short', day: 'numeric' })}`;
      $('weekToday').hidden = diff === 0;
      const mid = new Date(week.getTime() + 3 * DAY);
      $('calMonthName').innerHTML = `${fmt(mid, { month: 'long' })} <span>${mid.getFullYear()}</span>`;
      const inWeek = events.filter(e => e._d >= week && e._d <= end);
      $('weekStrip').innerHTML = Array.from({ length: 7 }, (_, i) => dayCell(new Date(week.getTime() + i * DAY), inWeek)).join('');
      if (inWeek.length) $('weekList').innerHTML = inWeek.map(eventRow).join('');
      else {
        const next = events.find(e => e._d > end);
        $('weekList').innerHTML = `<div class="week-empty">No events this week.${next
          ? `<button type="button" data-jump="${next.date}">Next up: ${esc(next.title)}, ${fmt(next._d, { month: 'short', day: 'numeric' })} →</button>`
          : ''}</div>`;
      }
    } else {
      const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const isNow = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
      $('weekLabel').textContent = isNow ? 'This' : 'That';
      $('weekRange').textContent = fmt(month, { month: 'long', year: 'numeric' });
      $('weekToday').hidden = isNow;
      $('calMonthName').innerHTML = `${fmt(month, { month: 'long' })} <span>${month.getFullYear()}</span>`;
      const inMonth = events.filter(e => e._d >= month && e._d <= last);
      const cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(l => `<span class="day head"><span class="dow">${l}</span></span>`).concat(Array(month.getDay()).fill('<span class="day blank"></span>'));
      for (let k = 1; k <= last.getDate(); k++) cells.push(dayCell(new Date(month.getFullYear(), month.getMonth(), k), inMonth));
      while (cells.length % 7) cells.push('<span class="day blank"></span>');
      $('weekStrip').innerHTML = cells.join('');
      $('weekList').innerHTML = inMonth.length ? inMonth.map(eventRow).join('') : '<div class="week-empty">No events this month.</div>';
    }
  };

  const step = dir => {
    if (mode === 'week') week = new Date(week.getTime() + dir * 7 * DAY);
    else month = new Date(month.getFullYear(), month.getMonth() + dir, 1);
    render();
  };
  $('weekPrev').addEventListener('click', () => step(-1));
  $('weekNext').addEventListener('click', () => step(1));
  $('weekToday').addEventListener('click', () => { week = thisWeek; month = new Date(today.getFullYear(), today.getMonth(), 1); render(); });
  $('calSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    if (mode === 'month') month = new Date(week.getTime() + 3 * DAY), month = new Date(month.getFullYear(), month.getMonth(), 1);
    render();
  });
  /* In the month view, a day opens its week */
  $('weekStrip').addEventListener('click', e => {
    const d = e.target.closest('[data-day]');
    if (d && mode === 'month') { week = startOfWeek(new Date(+d.dataset.day)); mode = 'week'; render(); }
  });
  $('weekList').addEventListener('click', e => {
    const b = e.target.closest('[data-jump]');
    if (b) { week = startOfWeek(new Date(b.dataset.jump + 'T00:00:00')); render(); }
  });
  render();
});

/* Every event, grouped by month (events page) */
if (has('allEvents')) getJSON('events').then(events => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fmt = (d, o) => d.toLocaleDateString('en-US', o);
  events.forEach(e => { e._d = new Date(e.date + 'T00:00:00'); });
  let when = 'upcoming';

  const render = () => {
    const list = events
      .filter(e => when === 'upcoming' ? e._d >= today : e._d < today)
      .sort((a, b) => when === 'upcoming' ? a._d - b._d : b._d - a._d);
    $('allLabel').textContent = when === 'upcoming' ? 'Upcoming' : 'Past';
    if (!list.length) {
      $('allEvents').innerHTML = `<div class="week-empty">${when === 'upcoming' ? 'Nothing on the calendar yet. Check back soon.' : 'No past events yet.'}</div>`;
      return;
    }
    const groups = [];
    list.forEach(e => {
      const key = fmt(e._d, { month: 'long', year: 'numeric' });
      if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, items: [] });
      groups[groups.length - 1].items.push(e);
    });
    $('allEvents').innerHTML = groups.map(g => `
      <div class="month-group">
        <h3 class="month-name">${g.key}</h3>
        ${g.items.map(e => `
          <div class="week-event${when === 'past' ? ' past' : ''}">
            <div class="when">${fmt(e._d, { weekday: 'short' })} ${e._d.getDate()}</div>
            <div>
              <div class="title">${esc(e.title)}</div>
              <div class="meta">${[e.time, e.location].filter(Boolean).map(esc).join(' · ')}</div>
            </div>
            ${e.type ? `<span class="ev-tag">${esc(e.type)}</span>` : ''}
          </div>`).join('')}
      </div>`).join('');
  };

  $('allTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-when]');
    if (!b) return;
    when = b.dataset.when;
    $('allTabs').querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
    render();
  });
  render();
});

/* Upcoming philanthropy events (philanthropy page) */
if (has('philEvents')) getJSON('events').then(events => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const list = events
    .map(e => ({ ...e, _d: new Date(e.date + 'T00:00:00') }))
    .filter(e => e.type === 'Philanthropy' && e._d >= today)
    .sort((a, b) => a._d - b._d);
  $('philEvents').innerHTML = list.length
    ? list.map(e => `
        <div class="week-event">
          <div class="when">${e._d.toLocaleDateString('en-US', { month: 'short' })} ${e._d.getDate()}</div>
          <div>
            <div class="title">${esc(e.title)}</div>
            <div class="meta">${[e.time, e.location].filter(Boolean).map(esc).join(' · ')}</div>
          </div>
        </div>`).join('')
    : `<div class="week-empty">New philanthropy events are coming soon. Follow us on Instagram for updates.</div>`;
});

/* Gallery (about page): photos and captions managed in the CMS */
if (has('galleryGrid')) getJSON('gallery').then(photos => {
  if (!photos.length) return;
  $('gallery').hidden = false;
  $('galleryGrid').innerHTML = photos.map((p, i) => `
    <figure class="gallery-item reveal">
      <button type="button" data-photo="${i}" aria-label="Open ${esc(p.title || 'photo')}"><img src="${esc(p.src)}" alt="${esc(p.title || p.caption || 'Beta Pi photo')}" loading="lazy"></button>
      ${p.title || p.caption ? `<figcaption>${p.title ? `<strong>${esc(p.title)}</strong>` : ''}${p.caption ? `<span>${esc(p.caption)}</span>` : ''}</figcaption>` : ''}
    </figure>`).join('');
  observe();
  const lb = $('lightbox'), img = lb.querySelector('img');
  const close = () => lb.classList.remove('open');
  $('galleryGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-photo]'); if (!b) return;
    const p = photos[+b.dataset.photo];
    img.src = p.src; img.alt = p.title || '';
    lb.querySelector('strong').textContent = p.title || '';
    lb.querySelector('figcaption span').textContent = p.caption || '';
    lb.classList.add('open');
  });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox-close')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}).catch(() => {});

/* E-board preview (home page) */
if (has('eboardPreview')) getJSON('members').then(m => {
  $('eboardPreview').innerHTML = m.eboard.slice(0, 4).map(memberCard).join('');
});
