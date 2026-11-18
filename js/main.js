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
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('div.row[data-act]')) { e.preventDefault(); ACT[e.target.dataset.act](e.target, e); }
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
    if (res.errors && Object.keys(res.errors).length) toast('Some lists could not be loaded. Pull to refresh in a moment.', 'error');
    if ($('#view') && !fc.el) renderView(true);
    return { ok: true };
  }
  if (res && res.error === 'auth') { signOut(res.message); return { ok: false, handled: true }; }
  const message = (res && res.message) || "Can't reach your database right now.";
  setSync('error');
  return { ok: false, message };
}

/* ---------- sign in / out ---------- */
function showLogin(message = '') {
  $('#app').innerHTML = `<div class="login"><form class="login-card" id="login-form">${BRAND_MARK}<h1>Voyage</h1><p>Sign in to open your space.</p>
    <input type="email" id="email" name="email" placeholder="Email" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Email" required>
    <input type="password" id="pass" name="password" placeholder="Password" autocomplete="current-password" aria-label="Password" required>
    <div class="login-err" id="login-err" role="alert">${esc(message)}</div><button class="btn primary" type="submit">Sign in</button></form></div>`;
  const email = $('#email'), pass = $('#pass');
  email.value = ls.get('voyage.email', '') || '';
  (email.value ? pass : email).focus();
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button', e.target); btn.disabled = true; btn.textContent = 'Signing in…';
    const res = await sbSignIn(email.value.trim(), pass.value);
    if (res.ok) {
      ls.set('voyage.email', email.value.trim());
      btn.textContent = 'Opening…';
      const out = await loadAll();
      if (out.ok) return start();
      if (out.handled) return;
      sbSignOut(); btn.disabled = false; btn.textContent = 'Sign in';
      $('#login-err').textContent = out.message;
      return;
    }
    btn.disabled = false; btn.textContent = 'Sign in';
    $('#login-err').textContent = res.message || 'Something went wrong. Try again.';
    pass.select();
  });
}
function signOut(message) {
  sbSignOut();
  ls.del('voyage.cache');
  Object.keys(D).forEach(k => { D[k] = []; });
  settings = {};
  if (fc && fc.el) { fc.el.remove(); fc.el = null; document.body.style.overflow = ''; }
  showLogin(typeof message === 'string' ? message : '');
}
function showRetry(message) {
  $('#app').innerHTML = `<div class="login"><div class="login-card"><h1 style="font-size:26px">Can't open your space</h1><p>${esc(message)}</p><button class="btn primary" id="retry">Try again</button><p style="margin:18px 0 0"><button class="link" id="out">Sign out</button></p></div></div>`;
  $('#retry').addEventListener('click', () => boot());
  $('#out').addEventListener('click', () => signOut());
}

/* ---------- boot ---------- */
function start() {
  renderShell();
  if (!location.hash) location.hash = '#/home';
  route();
}
let booted = false;
async function boot() {
  applyTheme(ls.get('voyage.theme', 'Auto'));
  if (!booted) { window.addEventListener('hashchange', route); booted = true; }
  if (DEMO) {
    const res = await api('load'); applyData(res);
    return start();
  }
  ls.del('voyage.auth');                          // left over from the Google Sheets version
  SB.session = ls.get('voyage.session');
  if (!SB.session || !SB.session.user) return showLogin();
  const cached = ls.get('voyage.cache');
  if (cached && cached.profile && cached.profile.id === SB.session.user.id && cached.data && cached.data.subjects) {
    applyData(cached); start(); loadAll();        // show what we had last time instantly, refresh behind it
    return;
  }
  $('#app').innerHTML = '<div class="login"><div class="login-card"><p style="margin:0">Opening your space…</p></div></div>';
  const out = await loadAll();
  if (out.ok) return start();
  if (!out.handled) showRetry(out.message);
}
boot();
