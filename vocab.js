/* Voyage — vocabulary + flashcard review (Leitner boxes) */

VIEWS.vocab = function () {
  const v = vocabStats(), st = ui.vocab;
  return `<div class="page">
    <header class="page-head"><div><p class="eyebrow">Vocabulary</p><h1 class="display">Words</h1></div>
      <div class="head-actions"><button class="btn primary" data-act="addWord">${ico('plus', 18)}Add word</button></div></header>
    <div><div class="seg">${['review', 'library'].map(t => `<button class="seg-btn ${st.tab === t ? 'active' : ''}" data-act="vocabTab" data-v="${t}">${t === 'review' ? 'Review' : 'Library'}<em>${t === 'library' ? v.total : v.due.length}</em></button>`).join('')}</div></div>
    ${st.tab === 'review' ? vocabReview(v) : vocabLibrary()}
  </div>`;
};

function vocabReview(v) {
  if (!v.total) return `<section class="card">${empty('cards', 'No words yet', 'Add a word you just learned and it will show up here for review.', `<button class="btn primary" data-act="addWord">${ico('plus', 18)}Add word</button>`)}</section>`;
  const upcoming = D.vocab.filter(c => !isDue(c) && c.next).map(c => c.next).sort()[0];
  const sessionSize = Math.min(20, v.due.length);
  return `<section class="card review-hero">
      <p class="eyebrow">${v.due.length ? 'Due today' : 'All caught up'}</p>
      <p class="big" data-count="${v.due.length}">0</p>
      <p class="muted">${v.due.length ? (v.due.length > 20 ? 'cards waiting. We will do 20 at a time.' : v.due.length === 1 ? 'card waiting' : 'cards waiting') : (upcoming ? `Next review is on ${fmt(upcoming)}.` : 'Add more words to keep going.')}</p>
      <button class="btn primary big" data-act="startReview" ${v.due.length ? '' : 'disabled'}>${v.due.length ? `Review ${sessionSize}` : 'Nothing due'}</button>
      <div class="stat-row"><div><b>${v.fresh}</b><span>New</span></div><div><b>${v.learning}</b><span>Learning</span></div><div><b>${v.mastered}</b><span>Mastered</span></div></div>
    </section>`;
}

function vocabLibrary() {
  const st = ui.vocab;
  return `<div class="toolbar" style="margin-bottom:0">
      <label class="search">${ico('search', 18)}<input type="search" placeholder="Search words" value="${esc(st.q)}" data-inp="vocabQ" aria-label="Search words"></label>
      <div class="chips">${['All', 'New', 'Learning', 'Mastered'].map(f => `<button class="chip ${st.filter === f ? 'active' : ''}" data-act="vocabFilter" data-v="${f}">${f}</button>`).join('')}</div>
    </div><div id="vocab-list">${vocabList()}</div>`;
}
function vocabList() {
  const st = ui.vocab, q = st.q.trim().toLowerCase();
  const rows = D.vocab.filter(c => (st.filter === 'All' || statusOf(c) === st.filter) && (!q || `${c.word} ${c.meaning} ${c.synonyms}`.toLowerCase().includes(q)))
    .slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.id - a.id));
  if (!rows.length) return `<section class="card">${empty('search', 'No words found', q ? 'Try a different spelling.' : 'Nothing in this group yet.')}</section>`;
  return `<section class="card list" style="padding:6px 0">${rows.map(c => {
    const s = statusOf(c).toLowerCase(), age = c.date ? diffDays(c.date, todayISO()) : null;
    return `<details class="word"><summary><span class="status-dot ${s}"></span><span class="row-main"><span class="word-t">${esc(c.word)}</span><span class="row-sub">${esc(c.meaning)}</span></span><span class="row-meta">${age == null ? '' : age === 0 ? 'today' : age + 'd ago'}</span><span class="chev">${ico('chev', 16)}</span></summary>
      <div class="word-body">${c.synonyms ? `<p><span class="muted">Synonyms</span> &nbsp;${esc(c.synonyms)}</p>` : ''}${c.ex1 ? `<q>${esc(c.ex1)}</q>` : ''}${c.ex2 ? `<q>${esc(c.ex2)}</q>` : ''}
        <p style="display:flex;gap:10px;align-items:center"><span class="pill ${s === 'mastered' ? 'ok' : s === 'learning' ? 'accent' : ''}">${statusOf(c)}</span>${c.next ? `<span class="faint small">Next review ${fmt(c.next)}</span>` : ''}<button class="link" style="margin-left:auto" data-act="editWord" data-id="${c.id}">Edit</button></p></div></details>`;
  }).join('')}</section>`;
}
ACT.vocabTab = el => { ui.vocab.tab = el.dataset.v; renderView(true); };
ACT.vocabFilter = el => { ui.vocab.filter = el.dataset.v; renderView(true); };
INP.vocabQ = el => { ui.vocab.q = el.value; $('#vocab-list').innerHTML = vocabList(); };

function wordFields() {
  return [
    { name: 'word', label: 'Word', required: true, placeholder: 'e.g. Ephemeral' },
    { name: 'meaning', label: 'Meaning', type: 'textarea', rows: 2, required: true },
    { name: 'synonyms', label: 'Synonyms', placeholder: 'Short-lived, fleeting' },
    { name: 'ex1', label: 'Example sentence', type: 'textarea', rows: 2 },
    { name: 'ex2', label: 'Another example (optional)', type: 'textarea', rows: 2 }
  ];
}
ACT.addWord = () => {
  openForm({
    title: 'Add a word', fields: wordFields(), submitLabel: 'Add word',
    onSubmit(v) {
      addRow('vocab', Object.assign({}, v, { status: 'New', date: todayISO(), box: 0, next: '' }));
      ui.vocab.q = ''; ui.vocab.filter = 'All';
      renderView(true); toast(`"${v.word}" added`);
    }
  });
};
ACT.editWord = el => {
  const c = D.vocab.find(x => String(x.id) === el.dataset.id); if (!c) return;
  openForm({
    title: 'Edit word', fields: wordFields(), values: c,
    onSubmit(v) { updateRow('vocab', c, v); renderView(true); toast('Saved'); },
    onDelete() { confirmBox({ title: `Delete "${c.word}"?`, text: 'It will be removed from your sheet.', action: 'Delete', onConfirm() { removeRow('vocab', c); renderView(true); } }); }
  });
};

/* ---------------- flashcards ---------------- */
const fc = { queue: [], i: 0, flipped: false, total: 0, seen: new Set(), counts: { again: 0, good: 0, easy: 0 }, el: null };

ACT.startReview = () => {
  const due = vocabStats().due;
  if (!due.length) return toast('Nothing due right now');
  if (fc.el) return;                                   // already open
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // so Space can't re-trigger the start button
  fc.queue = shuffle(due).slice(0, 20); fc.total = fc.queue.length; fc.i = 0; fc.flipped = false;
  fc.seen = new Set(); fc.counts = { again: 0, good: 0, easy: 0 };
  fc.el = document.createElement('div'); fc.el.className = 'fc-overlay'; fc.el.setAttribute('role', 'dialog'); fc.el.setAttribute('aria-label', 'Vocabulary review');
  document.body.appendChild(fc.el);
  document.body.style.overflow = 'hidden';
  renderCard();
};
function nextInterval(c, g) {
  const b = effBox(c);
  if (g === 'again') return 'today';
  const nb = Math.min(5, b + (g === 'easy' ? 2 : 1));
  const d = BOX_DAYS[nb];
  return d === 1 ? '1 day' : d + ' days';
}
function renderCard() {
  const c = fc.queue[fc.i];
  if (!c) return renderDone();
  const pct = Math.round(fc.seen.size / fc.total * 100);
  fc.el.innerHTML = `
    <div class="fc-top"><button class="icon-btn" data-act="fcClose" aria-label="End review">${ico('x', 22)}</button><div class="fc-progress"><i style="width:${pct}%"></i></div><span class="fc-count">${fc.seen.size}/${fc.total}</span></div>
    <div class="fc-stage"><div class="fc" id="fc-card" data-act="fcFlip" tabindex="0" aria-label="Flashcard, press space to flip">
      <div class="fc-face"><button class="icon-btn speak" data-act="fcSpeak" aria-label="Pronounce">${ico('sound', 22)}</button><small>Word</small><div class="fc-word">${esc(c.word)}</div><small style="margin-top:8px">Tap to see the meaning</small></div>
      <div class="fc-face fc-back"><small>Meaning</small><p class="fc-meaning">${esc(c.meaning)}</p>${c.synonyms ? `<p class="fc-syn">${esc(c.synonyms)}</p>` : ''}${c.ex1 ? `<p class="fc-ex">${esc(c.ex1)}</p>` : ''}</div>
    </div></div>
    <div class="fc-actions" id="fc-actions">${fcActions(c)}</div>
    <p class="kbd">Space to flip · 1 Again · 2 Good · 3 Easy · Esc to leave</p>`;
  fc.flipped = false;
}
function fcActions(c) {
  if (!fc.flipped) return `<button class="btn primary big" data-act="fcFlip">Show answer</button>`;
  return `<button class="grade" data-act="fcGrade" data-g="again">Again<small>${nextInterval(c, 'again')}</small></button><button class="grade good" data-act="fcGrade" data-g="good">Good<small>${nextInterval(c, 'good')}</small></button><button class="grade" data-act="fcGrade" data-g="easy">Easy<small>${nextInterval(c, 'easy')}</small></button>`;
}
ACT.fcFlip = (el, e) => {
  if (e && e.target.closest('[data-act="fcSpeak"]')) return;
  const card = $('#fc-card'); if (!card) return;
  fc.flipped = !fc.flipped;
  card.classList.toggle('flipped', fc.flipped);
  $('#fc-actions').innerHTML = fcActions(fc.queue[fc.i]);
};
ACT.fcSpeak = (el, e) => {
  e.stopPropagation();
  try { const u = new SpeechSynthesisUtterance(fc.queue[fc.i].word); u.lang = 'en-IN'; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (err) { /* not supported */ }
};
ACT.fcGrade = el => gradeCard(el.dataset.g);
function gradeCard(g) {
  const c = fc.queue[fc.i]; if (!c || !fc.flipped) return;
  let box = effBox(c);
  if (g === 'again') box = 1; else box = Math.min(5, box + (g === 'easy' ? 2 : 1));
  const next = g === 'again' ? todayISO() : addDays(todayISO(), BOX_DAYS[box]);
  const status = box >= 5 ? 'Mastered' : 'Learning';
  updateRow('vocab', c, { box, next, status });
  fc.counts[g]++;
  if (g === 'again') fc.queue.push(c); else fc.seen.add(c.id);
  fc.i++;
  renderCard();
}
function renderDone() {
  const n = fc.counts.good + fc.counts.easy + fc.counts.again;
  fc.el.innerHTML = `<div class="fc-top"><button class="icon-btn" data-act="fcClose" aria-label="Close">${ico('x', 22)}</button><div class="fc-progress"><i style="width:100%"></i></div><span class="fc-count">${fc.total}/${fc.total}</span></div>
    <div class="fc-done"><h2>Session complete</h2><p class="muted" style="margin-bottom:28px">${fc.total} words reviewed${fc.counts.again ? ` · ${fc.counts.again} needed another look` : ' · none needed a second look'}.</p><button class="btn primary big" data-act="fcClose">Done</button></div>`;
  burst(innerWidth / 2, innerHeight / 2 - 40);
}
ACT.fcClose = () => {
  if (fc.el) { fc.el.remove(); fc.el = null; }
  document.body.style.overflow = '';
  renderView(true);
};
document.addEventListener('keydown', e => {
  if (!fc.el) return;
  if (e.key === 'Escape') return ACT.fcClose();
  if (e.key === ' ' || e.key === 'Enter') { if (e.target.tagName === 'BUTTON' && fc.el.contains(e.target)) return; e.preventDefault(); if (fc.queue[fc.i]) ACT.fcFlip(null, null); return; }
  if (fc.flipped) { const g = { 1: 'again', 2: 'good', 3: 'easy' }[e.key]; if (g) gradeCard(g); }
});
