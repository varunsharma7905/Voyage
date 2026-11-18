/* Voyage — study tracker (with priorities and subjects) + mocks */

/* ---------------- Study ---------------- */
VIEWS.study = function () {
  const s = cetStats(), st = ui.study;
  const head = `<header class="page-head"><div><p class="eyebrow">CET preparation</p><h1 class="display">Study</h1></div>${s.total ? `<div class="head-stat"><span data-stat="pct">${Math.round(s.pct)}%</span><small>complete</small></div>` : ''}</header>`;
  if (!s.subjects.length) {
    return `<div class="page">${head}<section class="card">${empty('book', 'Add your first subject', 'Subjects hold your chapters, like Quant or Verbal.', `<button class="btn primary" data-act="manageSubjects">${ico('plus', 18)}Add a subject</button>`)}</section></div>`;
  }
  if (st.subject !== 'All' && !s.subjects.some(x => x.name === st.subject)) st.subject = 'All';
  const inPrio = st.view === 'priority';
  const prioCount = D.cet.filter(r => !r.done && prioOf(r)).length;
  return `<div class="page">${head}
    <section class="card summary">
      <div class="summary-top"><b><span data-stat="done">${s.done}</span> done</b><span class="muted"><span data-stat="remaining">${s.remaining}</span> remaining of ${s.total}</span></div>
      <div class="pbar"><i data-bar="__all" style="width:${s.pct}%"></i></div>
      <div class="sub-bars">${s.subjects.map(x => `<div><p>${esc(x.name)}<span data-stat="subj:${esc(x.name)}">${x.done}/${x.total}</span></p><div class="pbar"><i data-bar="${esc(x.name)}" style="width:${x.pct}%"></i></div></div>`).join('')}</div>
    </section>

    <div class="toolbar">
      <div class="seg" role="tablist"><button class="seg-btn ${inPrio ? '' : 'active'}" data-act="studyView" data-v="subjects">By subject</button><button class="seg-btn ${inPrio ? 'active' : ''}" data-act="studyView" data-v="priority">Priority<em>${prioCount}</em></button></div>
      <span class="spacer"></span>
      <button class="btn" data-act="manageSubjects">${ico('sliders', 18)}Subjects</button>
      <button class="btn primary" data-act="addChapter">${ico('plus', 18)}Add chapter</button>
    </div>
    <div class="toolbar">
      <div class="seg" role="tablist">${['All', ...s.subjects.map(x => x.name)].map(n => `<button class="seg-btn ${st.subject === n ? 'active' : ''}" data-act="studySubject" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <label class="search">${ico('search', 18)}<input type="search" placeholder="Search chapters" value="${esc(st.q)}" data-inp="studyQ" aria-label="Search chapters"></label>
      ${inPrio ? '' : `<label class="toggle"><span>Hide done</span><span class="switch-row" style="padding:0;display:inline-flex"><input type="checkbox" data-inp="studyHide" ${st.hideDone ? 'checked' : ''}><i class="switch" style="transform:scale(.8);margin:-3px"></i></span></label>`}
    </div>
    <div id="study-list">${studyList()}</div>
  </div>`;
};

function chapterRow(r, mode) {
  const p = prioOf(r);
  const pill = mode === 'prio'
    ? `<button class="pill prio-pill ${p ? 'p-' + p.toLowerCase() : ''}" data-act="cyclePriority" data-id="${r.id}" aria-label="Priority: ${p || 'not set'}. Tap to change">${p || 'Set'}</button>`
    : (p && !r.done ? `<span class="pill prio-pill p-${p.toLowerCase()}">${p}</span>` : '');
  return `<div class="row ${r.done ? 'done' : ''}" data-act="toggleChapter" data-id="${r.id}" role="button" tabindex="0" aria-pressed="${r.done ? 'true' : 'false'}">
    <span class="check">${ico('check', 14)}</span>
    <span class="row-main"><span class="row-title">${esc(r.chapter)}</span>${mode === 'prio' ? `<span class="row-sub">${esc(subjectOf(r))}</span>` : ''}</span>
    ${pill}<span class="row-meta">${r.done && r.date ? fmt(r.date) : ''}</span>
    <button class="icon-btn row-edit" data-act="editChapter" data-id="${r.id}" aria-label="Edit ${esc(r.chapter)}">${ico('more', 18)}</button></div>`;
}
function studyFilter(r) {
  const st = ui.study, q = st.q.trim().toLowerCase();
  return (st.subject === 'All' || subjectOf(r) === st.subject) && (!q || `${r.chapter} ${r.book} ${r.subject}`.toLowerCase().includes(q));
}
function studyList() { return ui.study.view === 'priority' ? priorityList() : subjectList(); }
function subjectList() {
  const st = ui.study, q = st.q.trim();
  const rows = D.cet.filter(r => studyFilter(r) && (!st.hideDone || !r.done));
  if (!rows.length) {
    const none = st.subject !== 'All' && !D.cet.some(r => subjectOf(r) === st.subject);
    if (none && !q) return empty('book', `No chapters in ${st.subject} yet`, 'Add the first one and it will show up here.', `<button class="btn primary" data-act="addChapter">${ico('plus', 18)}Add chapter</button>`);
    if (!q && !D.cet.length) return empty('book', 'No chapters yet', 'Add a chapter to a subject to start tracking.', `<button class="btn primary" data-act="addChapter">${ico('plus', 18)}Add chapter</button>`);
    return empty('check', q ? 'No chapters match' : 'All done here', q ? 'Try a different word.' : 'Nothing left in this view. Great work.');
  }
  const groups = new Map();
  rows.forEach(r => { const k = subjectOf(r) + '||' + (r.book || ''); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  return [...groups.entries()].map(([k, list]) => {
    const [subj, book] = k.split('||');
    const all = D.cet.filter(r => subjectOf(r) === subj && (r.book || '') === book);
    const d = all.filter(r => r.done).length;
    return `<section class="group"><div class="group-head"><h3>${esc(subj)}${book ? `<span> · ${esc(book)}</span>` : ''}</h3><span class="muted" data-stat="grp:${esc(k)}">${d}/${all.length}</span></div><div class="card list">${list.map(r => chapterRow(r)).join('')}</div></section>`;
  }).join('');
}
function priorityList() {
  const rows = D.cet.filter(r => !r.done && studyFilter(r));
  if (!rows.length) return empty('check', 'Nothing left to prioritise', ui.study.q ? 'Try a different word.' : 'Every chapter here is done.');
  const groups = [...PRIORITIES, ''].map(p => ({ p, list: rows.filter(r => prioOf(r) === p) })).filter(g => g.list.length);
  const none = !rows.some(r => prioOf(r));
  return (none ? `<p class="muted small" style="margin:0 6px 18px">Tap <b>Set</b> on a chapter to rank it. High priority chapters come first here and on Home.</p>` : '') +
    groups.map(g => `<section class="group"><div class="group-head"><h3>${g.p ? g.p + ' priority' : 'Not ranked yet'}<span> · ${g.list.length}</span></h3></div><div class="card list">${g.list.map(r => chapterRow(r, 'prio')).join('')}</div></section>`).join('');
}
function refreshStudyStats() {
  const s = cetStats();
  const map = { pct: Math.round(s.pct) + '%', done: s.done, remaining: s.remaining };
  s.subjects.forEach(x => { map['subj:' + x.name] = `${x.done}/${x.total}`; map['bar:' + x.name] = x.pct; });
  map['bar:__all'] = s.pct;
  $$('[data-stat]').forEach(e => {
    const k = e.dataset.stat;
    if (k.startsWith('grp:')) {
      const [subj, book] = k.slice(4).split('||');
      const all = D.cet.filter(r => subjectOf(r) === subj && (r.book || '') === book);
      e.textContent = `${all.filter(r => r.done).length}/${all.length}`;
    } else if (k in map) e.textContent = map[k];
  });
  $$('[data-bar]').forEach(e => { const k = 'bar:' + e.dataset.bar; if (k in map) e.style.width = map[k] + '%'; });
}
ACT.toggleChapter = (el, e) => {
  const r = D.cet.find(x => String(x.id) === el.dataset.id);
  if (!r) return;
  const done = !r.done;
  updateRow('cet', r, { done, date: done ? todayISO() : '' });
  el.classList.toggle('done', done);
  el.setAttribute('aria-pressed', done ? 'true' : 'false');
  const meta = $('.row-meta', el); if (meta) meta.textContent = done ? fmt(todayISO()) : '';
  if (ui.route === 'study') {
    refreshStudyStats();
    if (done && (ui.study.view === 'priority' || ui.study.hideDone)) {
      el.classList.add('leaving');
      setTimeout(() => { if (ui.route === 'study') renderView(true); }, 380);
    }
  } else setTimeout(() => renderView(true), 420);
  if (done && e && e.clientX) {
    const all = D.cet.filter(x => subjectOf(x) === subjectOf(r));
    if (all.length && all.every(x => x.done)) { burst(e.clientX, e.clientY); toast(`${subjectOf(r)} complete`); }
  }
};
ACT.studySubject = el => { ui.study.subject = el.dataset.v; renderView(true); };
ACT.studyView = el => { ui.study.view = el.dataset.v; ls.set('voyage.studyView', el.dataset.v); renderView(true); };
INP.studyQ = el => { ui.study.q = el.value; $('#study-list').innerHTML = studyList(); };
INP.studyHide = el => { ui.study.hideDone = el.checked; $('#study-list').innerHTML = studyList(); };

ACT.cyclePriority = el => {
  const r = D.cet.find(x => String(x.id) === el.dataset.id); if (!r) return;
  const order = ['', ...PRIORITIES];
  updateRow('cet', r, { priority: order[(order.indexOf(prioOf(r)) + 1) % order.length] });
  renderView(true);
};

/* ---- add / edit a chapter ---- */
function chapterFields() {
  return [
    { name: 'chapter', label: 'Chapter', required: true, placeholder: 'e.g. Probability' },
    { name: 'subject', label: 'Subject', type: 'combo', options: allSubjects(), required: true, placeholder: 'Pick one, or type a new subject' },
    { name: 'book', label: 'Book', half: true, placeholder: 'e.g. CET Prep Guide' },
    { name: 'priority', label: 'Priority', type: 'select', half: true, options: ['None', ...PRIORITIES] }
  ];
}
function ensureSubject(name) { if (!D.subjects.some(x => x.name === name)) addSubject(name); }
ACT.addChapter = () => {
  const st = ui.study;
  const subject = st.subject !== 'All' ? st.subject : (allSubjects()[0] || '');
  const last = D.cet.filter(r => subjectOf(r) === subject).pop() || D.cet[D.cet.length - 1];
  openForm({
    title: 'Add a chapter', fields: chapterFields(), submitLabel: 'Add chapter',
    values: { subject, book: last ? last.book : '', priority: 'None' },
    onSubmit(v) {
      const subj = canonSubject(v.subject);
      ensureSubject(subj);
      addRow('cet', { book: v.book, subject: subj, chapter: v.chapter, done: false, date: '', priority: v.priority === 'None' ? '' : v.priority });
      if (st.subject !== 'All') st.subject = subj;
      renderView(true); toast(`Added to ${subj}`);
    }
  });
};
ACT.editChapter = el => {
  const r = D.cet.find(x => String(x.id) === el.dataset.id); if (!r) return;
  openForm({
    title: 'Edit chapter', fields: chapterFields(),
    values: { chapter: r.chapter, subject: subjectOf(r), book: r.book, priority: prioOf(r) || 'None' },
    onSubmit(v) {
      const subj = canonSubject(v.subject);
      ensureSubject(subj);
      updateRow('cet', r, { chapter: v.chapter, subject: subj, book: v.book, priority: v.priority === 'None' ? '' : v.priority });
      renderView(true); toast('Saved');
    },
    onDelete() {
      confirmBox({ title: `Delete "${r.chapter}"?`, text: 'It will be removed from your list.', action: 'Delete', onConfirm() { removeRow('cet', r); renderView(true); } });
    }
  });
};

/* ---- subjects ---- */
let subjDraw = null;
function subjectsHTML() {
  const s = cetStats();
  return `<p class="sheet-note">Chapters live inside subjects. Add the ones you study, rename them, or remove ones you don't need.</p>
    <div class="subj-add"><input id="subj-new" type="text" placeholder="New subject, e.g. DILR" maxlength="40" autocomplete="off" aria-label="New subject name"><button class="btn primary" data-act="subjAdd">Add</button></div>
    <div class="subj-list">${s.subjects.map(x => `<div class="subj-row"><div class="row-main"><span class="row-title" style="font-weight:600">${esc(x.name)}</span><span class="row-sub">${x.total} ${x.total === 1 ? 'chapter' : 'chapters'}${x.total ? ` · ${x.done} done` : ''}</span></div><button class="link" data-act="subjRename" data-name="${esc(x.name)}">Rename</button><button class="link danger-link" data-act="subjRemove" data-name="${esc(x.name)}">Remove</button></div>`).join('') || '<p class="muted">No subjects yet.</p>'}</div>`;
}
ACT.manageSubjects = () => {
  const sheet = openSheet({ title: 'Subjects', html: '<div id="subj-body"></div>', onClose: () => { subjDraw = null; if (ui.route === 'study' || ui.route === 'home') renderView(true); } });
  const body = $('#subj-body', sheet.el);
  subjDraw = () => { body.innerHTML = subjectsHTML(); };
  subjDraw();
  body.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'subj-new') { e.preventDefault(); ACT.subjAdd(); } });
};
ACT.subjAdd = () => {
  const input = $('#subj-new'); if (!input) return;
  const name = cleanName(input.value);
  if (!name) { input.focus(); return; }
  if (allSubjects().some(x => x.toLowerCase() === name.toLowerCase())) { toast('That subject already exists', 'error'); input.select(); return; }
  addSubject(name);
  if (subjDraw) subjDraw();
  const again = $('#subj-new'); if (again) again.focus();
  toast(`"${name}" added`);
};
ACT.subjRename = el => {
  const from = el.dataset.name;
  openForm({
    title: 'Rename subject', fields: [{ name: 'name', label: 'Name', required: true }], values: { name: from }, submitLabel: 'Rename',
    onSubmit(v) {
      const to = cleanName(v.name);
      if (to === from) return;
      if (allSubjects().some(x => x !== from && x.toLowerCase() === to.toLowerCase())) { toast('Another subject already has that name', 'error'); return false; }
      renameSubject(from, to);
      if (subjDraw) subjDraw();
    }
  });
};
ACT.subjRemove = el => {
  const name = el.dataset.name;
  const rows = D.cet.filter(r => subjectOf(r) === name), done = rows.filter(r => r.done).length;
  const text = rows.length
    ? `This permanently removes ${rows.length} ${rows.length === 1 ? 'chapter' : 'chapters'}${done ? ` (${done} already done)` : ''} and your progress on them. It can't be undone.`
    : 'It has no chapters, so nothing else changes.';
  confirmBox({ title: `Remove ${name}?`, text, action: 'Remove subject', onConfirm() { removeSubject(name); if (subjDraw) subjDraw(); toast(`${name} removed`); } });
};

/* ---------------- Mocks ---------------- */
function smoothPath(p) {
  if (p.length < 2) return '';
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}
function mockChart(m) {
  if (!m.rows.length) return '';
  const W = 640, H = 230, P = { l: 38, r: 18, t: 18, b: 30 };
  const vals = m.rows.map(m.pct);
  let lo = Math.floor((Math.min(...vals) - 8) / 10) * 10, hi = Math.ceil((Math.max(...vals) + 8) / 10) * 10;
  lo = Math.max(0, lo); hi = Math.min(100, Math.max(hi, lo + 20));
  const X = i => P.l + (m.rows.length === 1 ? (W - P.l - P.r) / 2 : i * (W - P.l - P.r) / (m.rows.length - 1));
  const Y = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const pts = m.rows.map((r, i) => ({ x: X(i), y: Y(vals[i]), r, v: vals[i] }));
  const ticks = [lo, lo + (hi - lo) / 2, hi];
  const line = smoothPath(pts);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mock scores over time">
    <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(t => `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${Y(t)}" y2="${Y(t)}"/><text x="${P.l - 8}" y="${Y(t) + 4}" text-anchor="end">${Math.round(t)}%</text>`).join('')}
    ${pts.length > 1 ? `<path class="area" d="${line} L${pts[pts.length - 1].x},${H - P.b} L${pts[0].x},${H - P.b} Z"/><path class="line" pathLength="1" d="${line}"/>` : ''}
    ${pts.map(p => `<circle class="pt" cx="${p.x}" cy="${p.y}" r="5"><title>${esc(p.r.name)} · ${p.r.score}/${p.r.outOf} (${Math.round(p.v)}%)</title></circle>`).join('')}
    ${pts.map((p, i) => (pts.length <= 8 || i % Math.ceil(pts.length / 8) === 0) ? `<text x="${p.x}" y="${H - 8}" text-anchor="middle">${fmt(p.r.date)}</text>` : '').join('')}
  </svg>`;
}
const SECTION_TAGS = [['quant', 'Quant'], ['lr', 'LR'], ['verbal', 'Verbal'], ['ar', 'AR']];
VIEWS.mocks = function () {
  const m = mockStats();
  const stat = (label, val, sub) => `<div class="card kpi"><p class="kpi-label">${label}</p><p class="kpi-value">${val}</p><p class="kpi-sub">${sub}</p></div>`;
  const list = m.rows.slice().reverse();
  const trend = m.rows.length > 1 ? Math.round(m.pct(m.rows[m.rows.length - 1]) - m.pct(m.rows[m.rows.length - 2])) : null;
  return `<div class="page">
    <header class="page-head"><div><p class="eyebrow">Practice tests</p><h1 class="display">Mocks</h1></div>
      <div class="head-actions"><button class="btn primary" data-act="addMock">${ico('plus', 18)}Log a mock</button></div></header>
    ${m.taken ? `<section class="grid g4">
      ${stat('Taken', `<span data-count="${m.taken}">0</span>`, m.last ? 'Last on ' + fmt(m.last.date) : '')}
      ${stat('Latest', `<span data-count="${Math.round(m.pct(m.last))}">0</span>%`, trend == null ? `${m.last.score}/${m.last.outOf}` : `${trend >= 0 ? '+' : ''}${trend} pts vs previous`)}
      ${stat('Best', `<span data-count="${Math.round(m.pct(m.best))}">0</span>%`, `${m.best.score}/${m.best.outOf} · ${esc(m.best.name)}`)}
      ${stat('Average', `<span data-count="${Math.round(m.avg)}">0</span>%`, 'across all mocks')}
    </section>
    <section class="card"><p class="kpi-label" style="margin-bottom:12px">Score trend</p>${mockChart(m)}</section>
    <section><h2 class="section-title">History</h2><div class="card list">${list.map(r => `<button class="row mock-row" data-act="editMock" data-id="${r.id}">
      <span class="row-main"><span class="row-title" style="font-weight:600">${esc(r.name)}</span><span class="row-sub">${fmt(r.date, { day: 'numeric', month: 'short', year: 'numeric' })}${r.minutes ? ` · ${r.minutes} min` : ''}</span>
      <span class="tags">${SECTION_TAGS.filter(([k]) => r[k] !== '' && r[k] != null).map(([k, l]) => `<span class="tag">${l} ${r[k]}</span>`).join('')}</span>${r.notes ? `<span class="row-sub" style="margin-top:8px">${esc(r.notes)}</span>` : ''}</span>
      <span class="mock-score">${r.score}<small>of ${r.outOf}</small></span></button>`).join('')}</div></section>`
      : `<section class="card">${empty('trend', 'No mocks yet', 'Log your first mock to see scores and a trend line here.', `<button class="btn primary" data-act="addMock">${ico('plus', 18)}Log a mock</button>`)}</section>`}
  </div>`;
};
function mockFields() {
  return [
    { name: 'name', label: 'Mock name', placeholder: 'e.g. Mock 4', required: true },
    { name: 'date', label: 'Date', type: 'date', half: true, default: todayISO(), required: true },
    { name: 'minutes', label: 'Time taken (min)', type: 'number', half: true },
    { name: 'score', label: 'Score', type: 'number', half: true, required: true },
    { name: 'outOf', label: 'Out of', type: 'number', half: true, default: 200, required: true },
    { name: 'quant', label: 'Quant', type: 'number', half: true },
    { name: 'lr', label: 'LR', type: 'number', half: true },
    { name: 'verbal', label: 'Verbal', type: 'number', half: true },
    { name: 'ar', label: 'AR', type: 'number', half: true },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2, placeholder: 'What went well, what to fix' }
  ];
}
ACT.addMock = () => {
  const n = D.mocks.length + 1;
  openForm({
    title: 'Log a mock', fields: mockFields(), values: { name: 'Mock ' + n }, submitLabel: 'Add mock',
    onSubmit(v) { addRow('mocks', v); renderView(true); toast('Mock logged'); }
  });
};
ACT.editMock = el => {
  const r = D.mocks.find(x => String(x.id) === el.dataset.id); if (!r) return;
  openForm({
    title: 'Edit mock', fields: mockFields(), values: r,
    onSubmit(v) { updateRow('mocks', r, v); renderView(true); toast('Saved'); },
    onDelete() { confirmBox({ title: 'Delete this mock?', text: `${r.name} will be removed from your sheet.`, action: 'Delete', onConfirm() { removeRow('mocks', r); renderView(true); } }); return false; }
  });
};
