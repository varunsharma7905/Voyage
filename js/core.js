/* Voyage — core: helpers, state, API, UI kit */

const CONFIG = Object.assign({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }, window.KVS_CONFIG || {});
const DEMO = !(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
function parseISO(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);
const fmt = (s, o = { day: 'numeric', month: 'short' }) => { const d = parseISO(s); return d ? d.toLocaleDateString('en-IN', o) : ''; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- storage (falls back to memory if the browser blocks it) ---------- */
const mem = {};
const ls = {
  get(k, d = null) {
    try { const v = localStorage.getItem(k); if (v !== null) return JSON.parse(v); } catch (e) { /* blocked */ }
    return k in mem ? mem[k] : d;
  },
  set(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } },
  del(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* blocked */ } }
};

/* ---------- icons ---------- */
const ICONS = {
  home: '<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.5 9.8V20h13V9.8"/>',
  book: '<path d="M2.5 5h5.8A3.7 3.7 0 0 1 12 8.7V20a2.7 2.7 0 0 0-2.7-2.7H2.5z"/><path d="M21.5 5h-5.8A3.7 3.7 0 0 0 12 8.7V20a2.7 2.7 0 0 1 2.7-2.7h6.8z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  cards: '<rect x="3" y="7" width="14" height="13" rx="3"/><path d="M7 4h11a3 3 0 0 1 3 3v9"/>',
  briefcase: '<rect x="3" y="7.5" width="18" height="12.5" rx="3"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/><path d="M3 13h18"/>',
  star: '<path d="M12 3.2l2.7 5.5 6 .9-4.4 4.3 1 6L12 17l-5.4 2.9 1-6L3.2 9.6l6-.9z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  link: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  sound: '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  shuffle: '<path d="M3 7h3.5c4 0 5 10 9 10H21M3 17h3.5c1.6 0 2.7-1.6 3.7-3.3M21 7h-5.5c-1.6 0-2.7 1.4-3.6 3"/><path d="M18.5 4.5L21 7l-2.5 2.5M18.5 14.5L21 17l-2.5 2.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  sparkle: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/>',
  more: '<circle cx="5.5" cy="12" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="18.5" cy="12" r="1.1"/>'
};
const ico = (n, s = 20) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const BRAND_MARK = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><circle cx="16" cy="16" r="7.5" fill="none" stroke="var(--bg)" stroke-opacity=".28" stroke-width="3"/><path d="M16 8.5a7.5 7.5 0 1 1-7.1 9.9" fill="none" stroke="var(--bg)" stroke-width="3" stroke-linecap="round"/></svg>`;

/* ---------- state ---------- */
const KEY = { cet: 'chapter', vocab: 'word', mocks: 'name', jobs: 'company', contacts: 'name', bucket: 'title' };
const D = { cet: [], subjects: [], vocab: [], mocks: [], jobs: [], contacts: [], bucket: [] };
let settings = {};
let profile = { id: 'demo', name: 'Varun' };
const ui = {
  route: 'home',
  study: { subject: 'All', q: '', hideDone: false, view: ls.get('voyage.studyView', 'subjects') },
  vocab: { tab: 'review', q: '', filter: 'All' },
  jobs: { tab: 'jobs', q: '', status: 'All', pq: '', stage: 'All' },
  bucket: { cat: 'All', view: 'To do' }
};
const ACT = {}; // click handlers, keyed by data-act
const INP = {}; // input handlers, keyed by data-inp
const VIEWS = {};

const JOB_STATUS = ['Saved', 'Tailored', 'Applied', 'Referral asked', 'Interview', 'Offer', 'Closed'];
const JOB_CATEGORY = ['CA / advisory', 'Wealth / broking', 'Corporate finance (tech)', 'Finance ops / KPO', 'Fintech', 'Bank / NBFC', 'Other'];
const JOB_SOURCE = ['Career page', 'LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Cold email', 'Walk-in', 'Other'];
const RESUME_VERSIONS = ['Master', 'Advisory / wealth', 'Corporate finance'];
const CONTACT_STAGE = ['To contact', 'Sent', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Closed'];
const BUCKET_CATS = ['Travel', 'Experiences', 'Skills', 'Career', 'Health', 'Food', 'Giving back', 'Things'];
const BUCKET_WHEN = ['This year', 'Next year', 'Within 5 years', 'Someday'];
const BUCKET_STATUS = ['Dream', 'Planned', 'In progress', 'Done'];

/* ---------- API ---------- */
async function api(action, payload = {}) {
  return DEMO ? demoApi(action, payload) : sbApi(action, payload);
}

/* demo mode: same contract as the real backend, stored in the browser */
function demoDB() {
  let db = ls.get('voyage.demo');
  if (!db) { db = seedDemo(); ls.set('voyage.demo', db); }
  return db;
}
async function demoApi(action, p) {
  await sleep(80);
  const db = demoDB();
  if (!db.data.contacts) db.data.contacts = [];     // demo data saved before the job-hunt upgrade
  if (action === 'load') return { ok: true, profile: { id: 'demo', name: 'Varun' }, settings: db.settings, data: db.data };
  if (action === 'save') {
    const rows = db.data[p.section];
    let id = p.id;
    if (!id) { id = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1; rows.push(Object.assign({ id }, p.row)); }
    else { const r = rows.find(x => x.id === id); if (r) Object.assign(r, p.row); }
    ls.set('voyage.demo', db);
    return { ok: true, id };
  }
  if (action === 'remove') {
    db.data[p.section] = db.data[p.section].filter(r => r.id !== p.id);
    ls.set('voyage.demo', db);
    return { ok: true, rows: db.data[p.section] };
  }
  if (action === 'settings') { Object.assign(db.settings, p.values); ls.set('voyage.demo', db); return { ok: true, settings: db.settings }; }
  if (action === 'addSubject') {
    const id = db.data.subjects.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    db.data.subjects.push({ id, name: p.name });
    ls.set('voyage.demo', db);
    return { ok: true, id };
  }
  if (action === 'renameSubject') {
    const sub = db.data.subjects.find(x => x.id === p.id);
    if (sub) { db.data.cet.forEach(r => { if (r.subject === sub.name) r.subject = p.to; }); sub.name = p.to; }
    ls.set('voyage.demo', db);
    return { ok: true };
  }
  if (action === 'removeSubject') {
    const sub = db.data.subjects.find(x => x.id === p.id);
    if (sub) { db.data.cet = db.data.cet.filter(r => r.subject !== sub.name); db.data.subjects = db.data.subjects.filter(x => x !== sub); }
    ls.set('voyage.demo', db);
    return { ok: true };
  }
  return { ok: false, error: 'bad_action' };
}
function seedDemo() {
  const t = todayISO();
  const ch = (subject, names) => names.map(n => ({ book: 'Sample Guide', subject, chapter: n, done: false, date: '' }));
  let cet = [
    ...ch('Quant', ['Number System', 'Percentages', 'Profit & Loss', 'Ratio & Proportion', 'Time & Work', 'Time, Speed & Distance', 'Averages & Mixtures', 'Permutation & Combination']),
    ...ch('LR', ['Seating Arrangement', 'Blood Relations', 'Syllogisms', 'Coding-Decoding', 'Data Sufficiency', 'Series']),
    ...ch('Verbal', ['Synonyms & Antonyms', 'One word Substitution', 'Spotting Errors', 'Fill in the Blanks', 'Parajumbles']),
    ...ch('AR', ['Visual Puzzles', 'Pattern Matching', 'Spatial Reasoning'])
  ].map((r, i) => Object.assign({ id: i + 1, priority: '' }, r));
  [0, 1, 2, 8, 9, 14].forEach(i => { cet[i].done = true; cet[i].date = addDays(t, -(i % 5) - 1); });
  const w = (id, word, meaning, synonyms, ex1, ex2, status, box, next) => ({ id, word, meaning, synonyms, ex1, ex2, status, date: addDays(t, -30), box, next });
  const vocab = [
    w(1, 'Voyage', 'A long journey involving travel by sea or in space.', 'Journey', 'The brave explorers embarked on a long voyage across the Pacific.', '', 'Mastered', 5, addDays(t, 20)),
    w(2, 'Cantankerous', 'Bad-tempered, argumentative, and uncooperative.', 'Bad-tempered', 'The cantankerous old man refused to talk to his neighbours.', '', 'New', 0, ''),
    w(3, 'Onus', 'A duty, responsibility, or obligation to do something.', 'Responsibility', 'The onus is on the team leader to finish the project on time.', '', 'New', 0, ''),
    w(4, 'Derision', 'Contemptuous ridicule or mockery.', 'Mockery', 'His proposal was greeted with derision by the committee.', '', 'Learning', 2, t),
    w(5, 'Trite', 'Overused and lacking originality or freshness.', 'Overused', 'His speech was full of trite clichés.', '', 'Learning', 1, t),
    w(6, 'Debacle', 'A sudden and complete failure or disaster.', 'Fiasco', 'The product launch turned into a complete debacle.', '', 'New', 0, ''),
    w(7, 'Impudent', 'Not showing due respect; rude or impertinent.', 'Rude', 'The student got detention for an impudent remark.', '', 'New', 0, '')
  ];
  const mocks = [
    { id: 1, date: addDays(t, -21), name: 'Mock 1', score: 78, outOf: 200, quant: 20, lr: 30, verbal: 18, ar: 10, minutes: 120, notes: 'Ran out of time in LR.' },
    { id: 2, date: addDays(t, -14), name: 'Mock 2', score: 94, outOf: 200, quant: 26, lr: 34, verbal: 20, ar: 14, minutes: 118, notes: '' },
    { id: 3, date: addDays(t, -7), name: 'Mock 3', score: 112, outOf: 200, quant: 30, lr: 40, verbal: 24, ar: 18, minutes: 115, notes: 'Verbal improving.' }
  ];
  const jobs = [
    { id: 1, company: 'Sample Tech Pvt Ltd', title: 'Finance Operations Analyst', field: 'Finance', location: 'Baner, Pune', link: 'https://example.com', description: 'Entry role in the finance operations team.', status: 'Saved', added: addDays(t, -3),
      category: 'Corporate finance (tech)', fit: 82, commute: '15 min', source: 'Career page', applyEmail: '', deadline: addDays(t, 9), resume: 'Corporate finance', coverNote: '', appliedOn: '', followUp: '' },
    { id: 2, company: 'Sample Advisory LLP', title: 'Junior Associate', field: 'Advisory', location: 'Sus Road, Pune', link: '', description: 'Sample firm that takes applications by email.', status: 'Applied', added: addDays(t, -8),
      category: 'CA / advisory', fit: 74, commute: '10 min', source: 'Cold email', applyEmail: 'careers@example.com', deadline: '', resume: 'Advisory / wealth', coverNote: '', appliedOn: addDays(t, -6), followUp: addDays(t, -1) }
  ];
  const contacts = [
    { id: 1, companyId: 2, name: 'Sample HR', role: 'HR Manager', email: 'hr@example.com', emailStatus: 'Guessed', linkedin: '', stage: 'Sent', sentCount: 1, sentOn: addDays(t, -6), nextFollowUp: addDays(t, -1), connectedOn: '', notes: 'Sample contact. Delete me.' }
  ];
  const bucket = [
    { id: 1, title: 'Trek to a Himalayan base camp', category: 'Health', when: 'Within 5 years', status: 'Dream', cost: '₹25,000', why: 'Proof I can do hard things.', friend: true, doneDate: '', memory: '' },
    { id: 2, title: 'Get into a top MBA college', category: 'Career', when: 'This year', status: 'In progress', cost: '', why: 'The reason I am doing all this.', friend: false, doneDate: '', memory: '' }
  ];
  const subjects = ['Quant', 'LR', 'Verbal', 'AR'].map((name, i) => ({ id: i + 1, name }));
  [0, 3, 11].forEach(i => { cet[i].priority = 'High'; }); cet[5].priority = 'Medium'; cet[9].priority = 'Low';
  return { settings: { cet_date: addDays(t, 138), cet_tentative: 'true', cat_date: addDays(t, 11), finish_by: '', display_name: 'Varun' }, data: { cet, subjects, vocab, mocks, jobs, contacts, bucket } };
}

/* ---------- saving: optimistic, one request at a time ---------- */
let chain = Promise.resolve();
let pending = 0;
let syncErr = false;
let tmpN = 0;
const newKey = () => 'n' + Date.now().toString(36) + (++tmpN);   // on-screen id for rows that have not been saved yet
const rowSid = r => (r._sid !== undefined ? r._sid : (typeof r.id === 'string' ? undefined : r.id)); // the database id, once there is one

function setSync(state) {
  const d = $('#sync-dot'), t = $('#sync-text');
  if (d) d.className = 'dot ' + (state === 'saving' ? 'saving' : state === 'error' ? 'error' : '');
  if (t) t.textContent = DEMO ? 'Demo mode' : state === 'saving' ? 'Saving…' : state === 'error' ? 'Not saved' : 'Synced';
}
function enqueue(job) {
  pending++; setSync('saving');
  chain = chain.then(job).catch(e => { console.error(e); syncErr = true; }).then(() => {
    pending--;
    if (!pending) { setSync(syncErr ? 'error' : 'saved'); syncErr = false; }
  });
}
function cacheData() { if (!DEMO) ls.set('voyage.cache', { profile, settings, data: D }); }
function failed(res) {
  syncErr = true;
  if (res && res.error === 'auth') { signOut(res.message); return; }
  toast((res && res.message) || "Couldn't save that. Check your connection.", 'error');
}

/* A person points at a company by its id. If that company has not finished saving, its on-screen id is a
   temporary key, so swap in the real database id at the moment the request is sent. */
function resolveRefs(row) {
  if (!row || !('companyId' in row)) return row;
  const v = row.companyId;
  if (typeof v === 'string' && v !== '' && !isFinite(Number(v))) {
    const j = D.jobs.find(x => x.id === v), sid = j ? rowSid(j) : undefined;
    return Object.assign({}, row, { companyId: sid === undefined ? '' : sid });
  }
  return row;
}

function addRow(section, data) {
  const row = Object.assign({ id: newKey() }, data);   // row.id stays put so clicks on the screen keep working
  D[section].push(row);
  cacheData();
  enqueue(async () => {
    const res = await api('save', { section, row: resolveRefs(data) });
    if (res && res.ok) { row._sid = res.id; cacheData(); } else failed(res);
  });
  return row;
}
function updateRow(section, row, patch) {
  const key = row[KEY[section]];
  Object.assign(row, patch);
  cacheData();
  enqueue(async () => {
    const sid = rowSid(row);
    if (sid === undefined) return failed({ message: "That item didn't finish saving. Add it again." });
    const res = await api('save', { section, id: sid, key, row: resolveRefs(patch) });
    if (!(res && res.ok)) failed(res);
  });
}
function removeRow(section, row) {
  D[section] = D[section].filter(r => r !== row);
  cacheData();
  enqueue(async () => {
    const sid = rowSid(row);
    if (sid === undefined) return;                // never reached the database, nothing to delete
    const res = await api('remove', { section, id: sid, key: row[KEY[section]] });
    if (res && res.ok) cacheData(); else failed(res);
  });
}
function saveSettings(values) {
  Object.assign(settings, values);
  cacheData();
  enqueue(async () => { const res = await api('settings', { values }); if (!(res && res.ok)) failed(res); });
}

/* ---------- derived numbers ---------- */
/* subjects are rows of their own (D.subjects), so a subject can exist before it has any chapters */
const PRIORITIES = ['High', 'Medium', 'Low'];
const prioOf = r => (PRIORITIES.includes(r.priority) ? r.priority : '');
const prioRank = r => { const i = PRIORITIES.indexOf(prioOf(r)); return i < 0 ? PRIORITIES.length : i; };
const byPriority = list => list.map((r, i) => [r, i]).sort((a, b) => prioRank(a[0]) - prioRank(b[0]) || a[1] - b[1]).map(x => x[0]);
const subjectOf = r => r.subject || 'Other';
const allSubjects = () => D.subjects.map(s => s.name);
const cleanName = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const canonSubject = v => {
  const t = cleanName(v);
  return allSubjects().find(x => x.toLowerCase() === t.toLowerCase()) || t;
};
function addSubject(name) {                       // optimistic: shows at once, saved in the background
  const sub = { id: newKey(), name };
  D.subjects.push(sub);
  cacheData();
  enqueue(async () => {
    const res = await api('addSubject', { name });
    if (res && res.ok) { sub.id = res.id; cacheData(); } else failed(res);
  });
  return sub;
}
function renameSubject(from, to) {
  const sub = D.subjects.find(x => x.name === from); if (!sub) return;
  sub.name = to;
  D.cet.forEach(r => { if (r.subject === from) r.subject = to; });
  if (ui.study.subject === from) ui.study.subject = to;
  cacheData();
  enqueue(async () => {
    if (typeof sub.id === 'string') return;       // never saved, nothing to rename
    const res = await api('renameSubject', { id: sub.id, to });
    if (!(res && res.ok)) failed(res);
  });
}
function removeSubject(name) {                    // its chapters go with it
  const sub = D.subjects.find(x => x.name === name); if (!sub) return;
  D.subjects = D.subjects.filter(x => x !== sub);
  D.cet = D.cet.filter(r => subjectOf(r) !== name);
  if (ui.study.subject === name) ui.study.subject = 'All';
  cacheData();
  enqueue(async () => {
    if (typeof sub.id === 'string') return;
    const res = await api('removeSubject', { id: sub.id });
    if (!(res && res.ok)) failed(res);
  });
}
function cetStats() {
  const rows = D.cet, total = rows.length, done = rows.filter(r => r.done).length;
  const map = new Map();
  D.subjects.forEach(s => map.set(s.name, { name: s.name, total: 0, done: 0 }));
  rows.forEach(r => {
    const k = subjectOf(r);
    if (!map.has(k)) map.set(k, { name: k, total: 0, done: 0 });
    const o = map.get(k); o.total++; if (r.done) o.done++;
  });
  const subjects = [...map.values()].map(s => Object.assign(s, { pct: s.total ? s.done / s.total * 100 : 0 }));
  return { total, done, remaining: total - done, pct: total ? done / total * 100 : 0, subjects };
}
function mockStats() {
  const rows = D.mocks.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const pct = r => (r.outOf ? r.score / r.outOf * 100 : 0);
  const best = rows.reduce((b, r) => (!b || pct(r) > pct(b) ? r : b), null);
  const avg = rows.length ? rows.reduce((s, r) => s + pct(r), 0) / rows.length : 0;
  return { rows, taken: rows.length, last: rows[rows.length - 1] || null, best, avg, pct };
}
const BOX_DAYS = [0, 1, 3, 7, 14, 30];
const effBox = c => (c.box === '' || c.box == null ? (c.status === 'Mastered' ? 5 : 0) : Number(c.box));
function isDue(c) {
  const t = todayISO(), b = effBox(c);
  if (c.next) return c.next <= t;
  return b < 5; // no schedule yet: new or learning cards are due, mastered ones are not
}
function statusOf(c) { const b = effBox(c); return b >= 5 ? 'Mastered' : b >= 1 ? 'Learning' : 'New'; }
function vocabStats() {
  const v = D.vocab;
  return { total: v.length, mastered: v.filter(c => statusOf(c) === 'Mastered').length, learning: v.filter(c => statusOf(c) === 'Learning').length, fresh: v.filter(c => statusOf(c) === 'New').length, due: v.filter(isDue) };
}
function bucketStats() {
  const total = D.bucket.length, done = D.bucket.filter(b => b.status === 'Done').length;
  return { total, done, pct: total ? done / total * 100 : 0 };
}

/* ---------- UI kit ---------- */
let toastT;
function toast(msg, kind = '') {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = 'show ' + kind;
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = kind; }, 2800);
}

function ring({ pct, size = 120, stroke = 10, label = '', sub = '', cls = 'lg' }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  const cx = size / 2;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="ring-bg" cx="${cx}" cy="${cx}" r="${r}" stroke-width="${stroke}"/><circle class="ring-fg" cx="${cx}" cy="${cx}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-target="${c * (1 - p / 100)}" style="opacity:${p > 0 ? 1 : 0}" transform="rotate(-90 ${cx} ${cx})"/></svg><div class="ring-label ${cls}">${label}${sub ? `<small>${sub}</small>` : ''}</div></div>`;
}
function animateRings() {
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.ring-fg').forEach(e => { e.style.strokeDashoffset = e.dataset.target; })));
}
function animateCounts() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-count]').forEach(el => {
    const to = Number(el.dataset.count), dec = Number(el.dataset.dec || 0);
    if (reduce || !isFinite(to)) { el.textContent = to.toFixed(dec); return; }
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (to * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
function burst(x, y) {
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('i'); p.className = 'confetti';
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 80;
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--rot:${Math.random() * 360}deg;background:${i % 3 ? 'var(--accent)' : i % 2 ? 'var(--text)' : 'var(--faint)'}`;
    document.body.appendChild(p); setTimeout(() => p.remove(), 900);
  }
}
const empty = (icon, title, text, action = '') => `<div class="empty">${ico(icon, 40)}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;

const overlays = [];
function openSheet({ title, html, wide = false, onClose }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">${ico('x', 20)}</button></div><div class="sheet-body">${html}</div></div>`;
  document.body.appendChild(ov);
  const api = {
    el: ov,
    close() {
      if (ov.classList.contains('closing')) return;
      ov.classList.add('closing');
      const i = overlays.indexOf(api); if (i > -1) overlays.splice(i, 1);
      setTimeout(() => { ov.remove(); if (onClose) onClose(); }, 200);
    }
  };
  overlays.push(api);
  ov.addEventListener('mousedown', e => { if (e.target === ov) api.close(); });
  $('[data-close]', ov).addEventListener('click', api.close);
  return api;
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('.fc-overlay') && overlays.length) overlays[overlays.length - 1].close();
});

function fieldHTML(f, v) {
  const val = v[f.name] != null && v[f.name] !== '' ? v[f.name] : (f.default != null ? f.default : '');
  const cls = 'field' + (f.half ? ' half' : '');
  const ph = esc(f.placeholder || '');
  if (f.type === 'textarea') return `<label class="${cls}"><span>${esc(f.label)}</span><textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${ph}">${esc(val)}</textarea></label>`;
  if (f.type === 'select') return `<label class="${cls}"><span>${esc(f.label)}</span><select name="${f.name}">${f.options.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  if (f.type === 'switch') return `<label class="switch-row"><span>${esc(f.label)}</span><input type="checkbox" name="${f.name}" ${val ? 'checked' : ''}><i class="switch"></i></label>`;
  if (f.type === 'combo') return `<label class="${cls}"><span>${esc(f.label)}</span><input type="text" name="${f.name}" value="${esc(val)}" placeholder="${ph}" list="dl-${f.name}" autocomplete="off" maxlength="40"><datalist id="dl-${f.name}">${(f.options || []).map(o => `<option value="${esc(o)}"></option>`).join('')}</datalist></label>`;
  const extra = f.type === 'number' ? 'inputmode="decimal" step="any"' : f.type === 'url' ? 'inputmode="url" autocapitalize="off" autocorrect="off"' : '';
  return `<label class="${cls}"><span>${esc(f.label)}${f.required ? '' : ''}</span><input type="${f.type || 'text'}" name="${f.name}" value="${esc(val)}" placeholder="${ph}" ${extra} ${f.type === 'text' || !f.type ? 'autocomplete="off"' : ''}></label>`;
}
function openForm({ title, note = '', fields, values = {}, submitLabel = 'Save', onSubmit, onDelete, deleteLabel = 'Delete' }) {
  const sheet = openSheet({
    title,
    html: `${note ? `<p class="sheet-note">${esc(note)}</p>` : ''}<form class="form" novalidate>${fields.map(f => fieldHTML(f, values)).join('')}<div class="form-actions">${onDelete ? `<button type="button" class="danger-text" data-del>${esc(deleteLabel)}</button>` : '<span></span>'}<button class="btn primary" type="submit">${esc(submitLabel)}</button></div></form>`
  });
  const form = $('form', sheet.el);
  const first = $('input:not([type=checkbox]), textarea', form);
  if (first && window.matchMedia('(min-width: 761px)').matches) setTimeout(() => first.focus(), 280);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const vals = {};
    fields.forEach(f => {
      const el = form.elements[f.name]; if (!el) return;
      if (f.type === 'switch') vals[f.name] = el.checked;
      else if (f.type === 'number') vals[f.name] = el.value === '' ? '' : Number(el.value);
      else vals[f.name] = el.value.trim();
    });
    const miss = fields.find(f => f.required && (vals[f.name] === '' || vals[f.name] == null));
    if (miss) {
      const el = form.elements[miss.name]; el.focus();
      const box = el.closest('.field'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      return;
    }
    if ((await onSubmit(vals)) !== false) sheet.close();
  });
  const del = $('[data-del]', form);
  if (del) del.addEventListener('click', () => { sheet.close(); onDelete(); });
  return sheet;
}
function confirmBox({ title, text, action, onConfirm }) {
  const s = openSheet({ title, html: `<p class="sheet-note" style="margin-top:-6px">${esc(text)}</p><div class="form-actions" style="display:flex"><button class="btn" data-no>Cancel</button><button class="btn primary" data-yes style="background:var(--danger)">${esc(action)}</button></div>` });
  $('[data-no]', s.el).addEventListener('click', s.close);
  $('[data-yes]', s.el).addEventListener('click', () => { onConfirm(); s.close(); });
}

/* ---------- theme ---------- */
function applyTheme(t) {
  const r = document.documentElement;
  if (t === 'Light') r.dataset.theme = 'light'; else if (t === 'Dark') r.dataset.theme = 'dark'; else delete r.dataset.theme;
}
