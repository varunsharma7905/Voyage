/* Voyage — shell, routing, login, boot */

const NAV = [
  ['home', 'Home', 'home'], ['study', 'Study', 'book'], ['mocks', 'Mocks', 'trend'],
  ['vocab', 'Vocab', 'cards'], ['jobs', 'Companies', 'briefcase'], ['bucket', 'Bucket', 'star']
];

function renderShell() {
  $('#app').innerHTML = `
    <aside class="side">
      <div class="brand">${BRAND_MARK}<span>Voyage</span></div>
      <nav class="nav" aria-label="Main">${NAV.map(([id, label, icon]) => `<button class="nav-btn" data-nav="${id}" data-act="navTo" data-to="${id}" title="${label}">${ico(icon, 21)}<span>${label}</span></button>`).join('')}</nav>
      <div class="side-foot"><button class="me" data-act="openSettings" aria-label="Settings"><div class="avatar">${esc((profile.name || '?')[0].toUpperCase())}</div><div><b>${esc(profile.name)}</b><small><i class="dot" id="sync-dot"></i><span id="sync-text">${DEMO ? 'Demo mode' : 'Synced'}</span></small></div></button></div>
    </aside>
    <main><div id="view"></div></main>
    <nav class="tabbar" aria-label="Main">${NAV.map(([id, label, icon]) => `<button class="tab-btn" data-nav="${id}" data-act="navTo" data-to="${id}">${ico(icon, 24)}<span>${label === 'Companies' ? 'Jobs' : label}</span></button>`).join('')}</nav>`;
}
ACT.navTo = el => { if (location.hash === '#/' + el.dataset.to) renderView(); else location.hash = '#/' + el.dataset.to; };

function renderView(keepScroll) {
  const view = $('#view'); if (!view) return;
  const y = window.scrollY;
  const html = (VIEWS[ui.route] || VIEWS.home)();
  view.className = '';
  view.innerHTML = html;
  $$('#view .page > *').forEach((e, i) => e.style.setProperty('--i', Math.min(i, 10)));
  if (!keepScroll) { void view.offsetWidth; view.classList.add('view-in'); window.scrollTo(0, 0); }
  else window.scrollTo(0, y);
  $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === ui.route));
  animateRings(); animateCounts();
}
function route() {
  const r = (location.hash.match(/^#\/(\w+)/) || [])[1];
  ui.route = VIEWS[r] ? r : 'home';
  renderView(false);
}

/* one click handler for the whole app */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const fn = ACT[t.dataset.act];
  if (fn) fn(t, e);
});
document.addEventListener('input', e => {
  const t = e.target.closest('[data-inp]');
  if (!t) return;
  const fn = INP[t.dataset.inp];
  if (fn) fn(t, e);
});
document.addEventListener('keydown', e => {
  // let keyboard users open rows that are not real buttons
  if ((e.key === 'Enter') && e.target.matches && e.target.matches('div.row[data-act]')) { e.preventDefault(); ACT[e.target.dataset.act](e.target, e); }
});

/* ---------- data loading ---------- */
function applyData(res) {
  if (res.profile) profile = res.profile;
  settings = res.settings || {};
  Object.keys(D).forEach(k => { D[k] = (res.data && res.data[k]) || []; });
}
async function loadAll() {
  const res = await api('load');
  if (res && res.ok) {
    applyData(res); cacheData();
    if (res.errors && Object.keys(res.errors).length) toast('Some tabs could not be read. Run setup in Apps Script to see why.', 'error');
    if ($('#view')) { if (!fc.el) renderView(true); }
    return true;
  }
  if (res && (res.error === 'auth' || res.error === 'inactive')) { signOut(res.message); return false; }
  toast((res && res.message) || "Can't reach your sheet right now.", 'error');
  setSync('error');
  return false;
}

/* ---------- login ---------- */
function showLogin(message = '') {
  $('#app').innerHTML = `<div class="login"><form class="login-card" id="login-form">${BRAND_MARK}<h1>Voyage</h1><p>Enter your passcode to open your space.</p>
    <input type="password" id="pass" placeholder="Passcode" autocomplete="current-password" autocapitalize="off" aria-label="Passcode" required>
    <div class="login-err" id="login-err" role="alert">${esc(message)}</div><button class="btn primary" type="submit">Continue</button></form></div>`;
  const input = $('#pass'); input.focus();
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button', e.target); btn.disabled = true; btn.textContent = 'Opening…';
    auth = { pass: input.value.trim() };
    const res = await api('load');
    if (res && res.ok) {
      ls.set('voyage.auth', auth);
      applyData(res); cacheData(); start();
    } else {
      auth = null; btn.disabled = false; btn.textContent = 'Continue';
      $('#login-err').textContent = (res && res.message) || 'Something went wrong. Try again.';
      input.select();
    }
  });
}
function signOut(message) {
  ls.del('voyage.auth'); ls.del('voyage.cache'); auth = null;
  Object.keys(D).forEach(k => { D[k] = []; });
  showLogin(message || '');
}

/* ---------- boot ---------- */
function start() {
  renderShell();
  if (!location.hash) location.hash = '#/home';
  route();
}
async function boot() {
  applyTheme(ls.get('voyage.theme', 'Auto'));
  window.addEventListener('hashchange', route);
  if (DEMO) {
    auth = { pass: 'demo' };
    const res = await api('load'); applyData(res);
    return start();
  }
  auth = ls.get('voyage.auth');
  if (!auth) return showLogin();
  const cached = ls.get('voyage.cache');
  if (cached) { applyData(cached); start(); loadAll(); }   // show last-known data instantly, refresh behind it
  else {
    $('#app').innerHTML = '<div class="login"><div class="login-card"><p style="margin:0">Opening your space…</p></div></div>';
    if (await loadAll()) start();
  }
}
boot();
