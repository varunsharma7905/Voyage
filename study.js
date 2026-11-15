/* Voyage — study tracker + mocks */

/* ---------------- Study ---------------- */
VIEWS.study = function () {
  const s = cetStats(), st = ui.study;
  if (!s.total) {
    return `<div class="page"><header class="page-head"><div><p class="eyebrow">CET preparation</p><h1 class="display">Study</h1></div></header>${empty('book', 'No chapters found', 'Check that the CET tab name in Code.gs matches your sheet, then reload.')}</div>`;
  }
  if (st.subject !== 'All' && !s.subjects.some(x => x.name === st.subject)) st.subject = 'All';
  return `<div class="page">
    <header class="page-head"><div><p class="eyebrow">CET preparation</p><h1 class="display">Study</h1></div>
      <div class="head-stat"><span data-stat="pct">${Math.round(s.pct)}%</span><small>complete</small></div></header>

    <section class="card summary">
      <div class="summary-top"><b><span data-stat="done">${s.done}</span> done</b><span class="muted"><span data-stat="remaining">${s.remaining}</span> remaining of ${s.total}</span></div>
      <div class="pbar"><i data-bar="__all" style="width:${s.pct}%"></i></div>
      <div class="sub-bars">${s.subjects.map(x => `<div><p>${esc(x.name)}<span data-stat="subj:${esc(x.name)}">${x.done}/${x.total}</span></p><div class="pbar"><i data-bar="${esc(x.name)}" style="width:${x.pct}%"></i></div></div>`).join('')}</div>
    </section>

    <div class="toolbar">
      <div class="seg" role="tablist">${['All', ...s.subjects.map(x => x.name)].map(n => `<button class="seg-btn ${st.subject === n ? 'active' : ''}" data-act="studySubject" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <label class="search">${ico('search', 18)}<input type="search" placeholder="Search chapters" value="${esc(st.q)}" data-inp="studyQ" aria-label="Search chapters"></label>
      <label class="toggle"><span>Hide done</span><span class="switch-row" style="padding:0;display:inline-flex"><input type="checkbox" data-inp="studyHide" ${st.hideDone ? 'checked' : ''}><i class="switch" style="transform:scale(.8);margin:-3px"></i></span></label>
    </div>
    <div id="study-list">${studyList()}</div>
  </div>`;
};

function chapterRow(r) {
  return `<button class="row ${r.done ? 'done' : ''}" data-act="toggleChapter" data-id="${r.id}"><span class="check">${ico('check', 14)}</span><span class="row-main"><span class="row-title">${esc(r.chapter)}</span></span><span class="row-meta">${r.done && r.date ? fmt(r.date) : ''}</span></button>`;
}
function studyList() {
  const st = ui.study, q = st.q.trim().toLowerCase();
  const rows = D.cet.filter(r => (st.subject === 'All' || (r.subject || 'Other') === st.subject) && (!st.hideDone || !r.done) && (!q || `${r.chapter} ${r.book} ${r.subject}`.toLowerCase().includes(q)));
  if (!rows.length) return empty('check', q ? 'No chapters match' : 'All done here', q ? 'Try a different word.' : 'Nothing left in this view. Great work.');
  const groups = new Map();
  rows.forEach(r => { const k = (r.subject || 'Other') + '||' + (r.book || ''); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  return [...groups.entries()].map(([k, list]) => {
    const [subj, book] = k.split('||');
    const all = D.cet.filter(r => (r.subject || 'Other') === subj && (r.book || '') === book);
    const d = all.filter(r => r.done).length;
    return `<section class="group"><div class="group-head"><h3>${esc(subj)}${book ? `<span> · ${esc(book)}</span>` : ''}</h3><span class="muted" data-stat="grp:${esc(k)}">${d}/${all.length}</span></div><div class="card list">${list.map(chapterRow).join('')}</div></section>`;
  }).join('');
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
      const all = D.cet.filter(r => (r.subject || 'Other') === subj && (r.book || '') === book);
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
  const meta = $('.row-meta', el); if (meta) meta.textContent = done ? fmt(todayISO()) : '';
  if (ui.route === 'study') {
    refreshStudyStats();
    if (done && ui.study.hideDone) {
      el.classList.add('leaving');
      setTimeout(() => { const l = $('#study-list'); if (l) l.innerHTML = studyList(); }, 380);
    }
  } else setTimeout(() => renderView(true), 420);
  if (done && e && e.clientX) {
    const all = D.cet.filter(x => x.subject === r.subject);
    if (all.length && all.every(x => x.done)) { burst(e.clientX, e.clientY); toast(`${r.subject} complete`); }
  }
};
ACT.studySubject = el => { ui.study.subject = el.dataset.v; renderView(true); };
INP.studyQ = el => { ui.study.q = el.value; $('#study-list').innerHTML = studyList(); };
INP.studyHide = el => { ui.study.hideDone = el.checked; $('#study-list').innerHTML = studyList(); };

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
