/* Voyage — bucket list (companies and the job hunt live in hunt.js) */

/* ---------------- Bucket list ---------------- */
const IDEAS = {
  Travel: [['Watch a sunrise from the east coast', 'Within 5 years'], ['See snow in the Himalayas', 'Next year'], ['Road trip along the Konkan coast', 'This year'], ['Visit a country outside India', 'Within 5 years']],
  Experiences: [['Go to a live concert of a favourite artist', 'Next year'], ['Watch an IPL match in the stadium', 'This year'], ['Camp somewhere with no city lights', 'This year'], ['Try paragliding', 'Within 5 years']],
  Skills: [['Learn to swim confidently', 'This year'], ['Learn an instrument well enough to play a song', 'Next year'], ['Hold a conversation in a new language', 'Within 5 years'], ['Learn to cook five dishes really well', 'This year']],
  Career: [['Get into a top MBA college', 'This year'], ['Land a first job I am proud of', 'Within 5 years'], ['Build something other people actually use', 'Within 5 years'], ['Give a talk to 100+ people', 'Within 5 years']],
  Health: [['Run a 10K', 'Next year'], ['Complete a Himalayan trek', 'Within 5 years'], ['Keep one daily habit for 100 days', 'This year'], ['Go a month without sugar', 'Next year']],
  Food: [['Cook a full meal for my family', 'This year'], ['Eat street food in five different cities', 'Within 5 years'], ['Bake bread from scratch', 'This year'], ['Have one proper fine-dining dinner', 'Next year']],
  'Giving back': [['Teach someone a skill for free', 'This year'], ['Donate blood regularly', 'This year'], ['Plant ten trees', 'This year'], ['Mentor a junior', 'Within 5 years']],
  Things: [['Build a personal library of 50 books', 'Within 5 years'], ['Set up a desk I love working at', 'This year'], ['Buy a really good pair of running shoes', 'This year'], ['Own a camera and learn to use it', 'Next year']]
};

VIEWS.bucket = function () {
  const b = bucketStats(), st = ui.bucket;
  const cats = ['All', ...BUCKET_CATS.filter(c => D.bucket.some(x => x.category === c))];
  if (!cats.includes(st.cat)) st.cat = 'All';
  const header = `<header class="page-head"><div><p class="eyebrow">Someday, on purpose</p><h1 class="display">Bucket list</h1></div>
      <div class="head-actions"><button class="btn" data-act="bucketIdeas">${ico('sparkle', 18)}Ideas</button><button class="btn primary" data-act="addBucket">${ico('plus', 18)}Add</button></div></header>`;
  if (!D.bucket.length) {
    return `<div class="page">${header}<section class="card">${empty('star', 'Start your list', 'Add what you want to do, or browse ideas and tap the ones that feel like you.', `<button class="btn primary" data-act="bucketIdeas">${ico('sparkle', 18)}Browse ideas</button>`)}</section></div>`;
  }
  return `<div class="page">${header}
    <section class="card bucket-head">${ring({ pct: b.pct, size: 96, stroke: 9, label: `${b.done}<small style="font-size:12px;color:var(--muted);font-weight:500;margin-top:3px">of ${b.total}</small>`, cls: 'sm' })}
      <div style="flex:1"><h2 style="font-size:22px;font-weight:650;letter-spacing:-.03em">${b.done ? `${b.done} done, ${b.total - b.done} to go` : `${b.total} things to do`}</h2><p class="muted" style="margin:4px 0 14px">${b.total - b.done ? 'Pick one for this month and make it real.' : 'Everything on your list is done. Add something new.'}</p>
      <button class="btn" data-act="bucketPick" ${b.total - b.done ? '' : 'disabled'}>${ico('shuffle', 18)}Surprise me</button></div></section>
    <div class="toolbar"><div class="seg">${['To do', 'Done', 'All'].map(v => `<button class="seg-btn ${st.view === v ? 'active' : ''}" data-act="bucketView" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="chips">${cats.map(c => `<button class="chip ${st.cat === c ? 'active' : ''}" data-act="bucketCat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
    <div id="bucket-list">${bucketList()}</div></div>`;
};
function bucketRow(b) {
  const done = b.status === 'Done';
  return `<div class="row ${done ? 'done' : ''}" data-id="${b.id}" style="cursor:pointer" data-act="editBucket" tabindex="0">
    <button class="check ${done ? 'on' : ''}" data-act="toggleBucket" data-id="${b.id}" aria-label="${done ? 'Mark as not done' : 'Mark as done'}">${ico('check', 14)}</button>
    <span class="row-main"><span class="row-title">${esc(b.title)}</span><span class="row-sub">${[b.category, b.cost, b.friend ? 'With a friend' : '', done && b.doneDate ? 'Done ' + fmt(b.doneDate) : (!done && b.status !== 'Dream' ? b.status : '')].filter(Boolean).map(esc).join(' · ')}</span>${b.why && !done ? `<span class="row-sub faint" style="margin-top:2px">${esc(b.why)}</span>` : ''}${done && b.memory ? `<span class="row-sub" style="margin-top:2px">${esc(b.memory)}</span>` : ''}</span></div>`;
}
function bucketList() {
  const st = ui.bucket;
  const rows = D.bucket.filter(b => (st.cat === 'All' || b.category === st.cat) && (st.view === 'All' || (st.view === 'Done') === (b.status === 'Done')));
  if (!rows.length) return `<section class="card">${empty('star', st.view === 'Done' ? 'Nothing done yet' : 'Nothing here', st.view === 'Done' ? 'Finished items show up here as memories.' : 'Try another category.')}</section>`;
  if (st.view === 'Done') {
    return `<section class="card list">${rows.slice().sort((a, b) => String(b.doneDate).localeCompare(String(a.doneDate))).map(bucketRow).join('')}</section>`;
  }
  return BUCKET_WHEN.map(w => {
    const list = rows.filter(b => (b.when || 'Someday') === w); if (!list.length) return '';
    return `<p class="when-title">${w}</p><section class="card list">${list.map(bucketRow).join('')}</section>`;
  }).join('') + (rows.some(b => !BUCKET_WHEN.includes(b.when || 'Someday')) ? `<p class="when-title">Other</p><section class="card list">${rows.filter(b => !BUCKET_WHEN.includes(b.when || 'Someday')).map(bucketRow).join('')}</section>` : '');
}
ACT.bucketView = el => { ui.bucket.view = el.dataset.v; renderView(true); };
ACT.bucketCat = el => { ui.bucket.cat = el.dataset.v; renderView(true); };
ACT.toggleBucket = (el, e) => {
  e.stopPropagation();
  const b = D.bucket.find(x => String(x.id) === el.dataset.id); if (!b) return;
  const done = b.status !== 'Done';
  updateRow('bucket', b, { status: done ? 'Done' : 'Planned', doneDate: done ? todayISO() : '' });
  if (done) { burst(e.clientX, e.clientY); toast('Done. Add a memory if you like.'); }
  el.closest('.row').classList.toggle('done', done); el.classList.toggle('on', done);
  setTimeout(() => renderView(true), done ? 650 : 250);
};
function bucketFields() {
  return [
    { name: 'title', label: 'What do you want to do?', required: true, placeholder: 'e.g. See the northern lights' },
    { name: 'category', label: 'Category', type: 'select', half: true, options: BUCKET_CATS },
    { name: 'when', label: 'When', type: 'select', half: true, options: BUCKET_WHEN },
    { name: 'status', label: 'Status', type: 'select', half: true, options: BUCKET_STATUS },
    { name: 'cost', label: 'Rough cost', half: true, placeholder: '₹ or "free"' },
    { name: 'why', label: 'Why it matters', placeholder: 'One line, for future you' },
    { name: 'friend', label: 'Do it with a friend', type: 'switch' },
    { name: 'memory', label: 'Memory (after you do it)', type: 'textarea', rows: 2 }
  ];
}
ACT.addBucket = () => openForm({
  title: 'New bucket list item', fields: bucketFields(), submitLabel: 'Add to list',
  values: { category: 'Experiences', when: 'Someday', status: 'Dream' },
  onSubmit(v) { addRow('bucket', Object.assign({}, v, { doneDate: v.status === 'Done' ? todayISO() : '' })); ui.bucket.view = 'To do'; ui.bucket.cat = 'All'; renderView(true); toast('Added'); }
});
ACT.editBucket = el => {
  const b = D.bucket.find(x => String(x.id) === el.dataset.id); if (!b) return;
  openForm({
    title: 'Edit item', fields: bucketFields(), values: b,
    onSubmit(v) { const patch = Object.assign({}, v, { doneDate: v.status === 'Done' ? (b.doneDate || todayISO()) : '' }); updateRow('bucket', b, patch); renderView(true); toast('Saved'); },
    onDelete() { confirmBox({ title: 'Delete this item?', text: `"${b.title}" will be removed from your sheet.`, action: 'Delete', onConfirm() { removeRow('bucket', b); renderView(true); } }); }
  });
};
ACT.bucketPick = () => {
  const open = D.bucket.filter(b => b.status !== 'Done'); if (!open.length) return;
  const pick = open[Math.floor(Math.random() * open.length)];
  ui.bucket.view = 'To do'; ui.bucket.cat = 'All'; renderView(true);
  const el = document.querySelector(`#bucket-list .row[data-id="${pick.id}"]`);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1700); }
  toast(`This month: ${pick.title}`);
};
ACT.bucketIdeas = () => {
  const have = () => new Set(D.bucket.map(b => b.title.toLowerCase()));
  const html = () => `<p class="sheet-note">Tap the plus on anything that feels like you. You can edit details later.</p>${Object.entries(IDEAS).map(([cat, list]) => `<p class="idea-cat">${cat}</p>${list.map(([t]) => { const added = have().has(t.toLowerCase()); return `<div class="idea"><span>${esc(t)}</span><button class="icon-btn" data-idea="${esc(t)}" data-cat="${esc(cat)}" ${added ? 'disabled' : ''} aria-label="Add ${esc(t)}" style="${added ? 'color:var(--ok)' : 'background:var(--accent-soft);color:var(--accent)'}">${ico(added ? 'check' : 'plus', 18)}</button></div>`; }).join('')}`).join('')}`;
  const s = openSheet({ title: 'Ideas', html: html(), wide: true, onClose: () => { if (ui.route === 'bucket') renderView(true); } });
  const body = $('.sheet-body', s.el), scroller = $('.sheet', s.el);
  body.addEventListener('click', e => {
    const btn = e.target.closest('[data-idea]'); if (!btn || btn.disabled) return;
    const title = btn.dataset.idea, cat = btn.dataset.cat;
    const when = IDEAS[cat].find(x => x[0] === title)[1];
    addRow('bucket', { title, category: cat, when, status: 'Dream', cost: '', why: '', friend: false, doneDate: '', memory: '' });
    const y = scroller.scrollTop; body.innerHTML = html(); scroller.scrollTop = y;
  });
};
