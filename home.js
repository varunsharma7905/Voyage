/* Voyage — home dashboard + settings */

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function countdown(label, date, note) {
  if (!date) return `<div class="card countdown"><p class="eyebrow">${label}</p><p class="big muted">No date yet</p><button class="link" data-act="openSettings">Add the exam date</button></div>`;
  const d = diffDays(todayISO(), date);
  const num = d > 0 ? `<span data-count="${d}">0</span>` : d === 0 ? 'Today' : 'Done';
  const unit = d > 1 ? 'days to go' : d === 1 ? 'day to go' : d === 0 ? 'Good luck.' : 'This exam has passed';
  return `<div class="card countdown click" data-act="openSettings"><p class="eyebrow">${esc(label)}</p><p class="big">${num}</p><p class="muted">${unit}</p><p class="faint small" style="margin-top:6px">${fmt(date, { day: 'numeric', month: 'long', year: 'numeric' })}${note ? ' · ' + note : ''}</p></div>`;
}

VIEWS.home = function () {
  const s = cetStats(), v = vocabStats(), m = mockStats(), b = bucketStats();
  const today = todayISO();
  const finishBy = settings.finish_by || (settings.cet_date ? addDays(settings.cet_date, -30) : '');
  let pace = '';
  if (!s.total) pace = '';
  else if (!s.remaining) pace = 'Syllabus complete. Now it is mocks and revision.';
  else if (finishBy) {
    const d = diffDays(today, finishBy);
    const wk = Math.round(s.remaining / (d / 7) * 10) / 10;
    pace = d <= 0
      ? 'Your finish-by date has passed. Update it in settings.'
      : `About ${wk} ${wk === 1 ? 'chapter' : 'chapters'} a week to finish by ${fmt(finishBy)}.`;
  }
  const next = D.cet.filter(r => !r.done).slice(0, 4);
  const tentative = settings.cet_tentative !== 'false';
  const weekAgo = addDays(today, -6);
  const thisWeek = D.cet.filter(r => r.done && r.date && r.date >= weekAgo).length;
  const kpis = [
    ['Chapters this week', thisWeek, 'in the last 7 days', 'study'],
    ['Mocks taken', m.taken, m.last ? `Latest ${m.last.score}/${m.last.outOf}` : 'Log your first one', 'mocks'],
    ['Best mock', m.best ? Math.round(m.pct(m.best)) : '—', m.best ? `${m.best.score}/${m.best.outOf} · ${esc(m.best.name)}` : 'Nothing yet', 'mocks', '%'],
    ['Words learned', v.mastered + v.learning, `${v.total} saved · ${v.mastered} mastered`, 'vocab'],
    ['Companies saved', D.jobs.length, D.jobs.filter(j => j.status === 'Applied' || j.status === 'Interview').length + ' in progress', 'jobs'],
    ['Bucket list', b.done, `of ${b.total} done`, 'bucket']
  ];

  return `<div class="page">
    <header class="page-head"><div><p class="eyebrow">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1 class="display">${greeting()}, ${esc(profile.name)}.</h1></div>
      <div class="head-actions">${DEMO ? '<span class="demo-pill">Demo data</span>' : ''}<button class="icon-btn" data-act="openSettings" aria-label="Settings">${ico('sliders', 22)}</button></div></header>

    <section class="grid countdown-row">${countdown('MBA CET', settings.cet_date, tentative ? 'tentative' : '')}${countdown('CAT', settings.cat_date, '')}</section>

    <section class="card hero-progress click" data-act="go" data-to="study">
      ${ring({ pct: s.pct, size: 148, stroke: 13, label: `<span><span data-count="${Math.round(s.pct)}">0</span>%</span>`, sub: 'syllabus' })}
      <div class="hero-stats">
        <div><b data-count="${s.done}">0</b><span>chapters done</span></div>
        <div><b data-count="${s.remaining}">0</b><span>remaining</span></div>
        <div><b data-count="${s.subjects.length}">0</b><span>subjects</span></div>
        ${pace ? `<p class="hero-pace">${esc(pace)}</p>` : ''}
      </div>
    </section>

    ${s.subjects.length ? `<section class="grid g4">${s.subjects.map(x => `<div class="card mini click" data-act="studyJump" data-subject="${esc(x.name)}">${ring({ pct: x.pct, size: 64, stroke: 7, label: Math.round(x.pct) + '%', cls: 'sm' })}<div><p class="mini-title">${esc(x.name)}</p><p class="muted small">${x.done} of ${x.total}</p></div></div>`).join('')}</section>` : ''}

    <section class="grid g3 kpis">${kpis.map(k => `<div class="card kpi click" data-act="go" data-to="${k[3]}"><p class="kpi-label">${k[0]}</p><p class="kpi-value">${typeof k[1] === 'number' ? `<span data-count="${k[1]}">0</span>` : k[1]}${k[4] && typeof k[1] === 'number' ? k[4] : (k[1] !== '—' && k[4] ? k[4] : '')}</p><p class="kpi-sub">${k[2]}</p></div>`).join('')}</section>

    <section class="grid g2">
      <div class="card tile"><h2>Up next</h2><p class="muted small">The next chapters on your list</p>
        <div class="up-list">${next.length ? next.map(r => `<button class="row" data-act="toggleChapter" data-id="${r.id}" style="padding-left:0;padding-right:0"><span class="check">${ico('check', 14)}</span><span class="row-main"><span class="row-title">${esc(r.chapter)}</span><span class="row-sub">${esc(r.subject)}</span></span></button>`).join('') : '<p class="muted" style="margin-top:10px">Every chapter is done. Nice.</p>'}</div></div>
      <div class="card tile" style="display:flex;flex-direction:column"><h2>Vocabulary</h2><p class="muted small">${v.due.length ? 'Cards waiting for you today' : 'Nothing due right now'}</p>
        <p class="kpi-value" style="font-size:64px;margin:18px 0 18px"><span data-count="${v.due.length}">0</span></p>
        <div style="margin-top:auto"><button class="btn primary" data-act="startReview" ${v.due.length ? '' : 'disabled'}>Start review</button></div></div>
    </section>
  </div>`;
};

ACT.go = el => { location.hash = '#/' + el.dataset.to; };
ACT.studyJump = el => { ui.study.subject = el.dataset.subject; location.hash = '#/study'; };

ACT.openSettings = () => {
  openForm({
    title: 'Settings',
    note: 'Exam dates drive the countdowns and your weekly pace.',
    submitLabel: 'Save',
    deleteLabel: DEMO ? 'Reset demo' : 'Sign out',
    fields: [
      { name: 'cet_date', label: 'MBA CET date', type: 'date' },
      { name: 'cet_tentative', label: 'Date is tentative', type: 'switch' },
      { name: 'cat_date', label: 'CAT date', type: 'date' },
      { name: 'finish_by', label: 'Finish the syllabus by (optional)', type: 'date' },
      { name: 'theme', label: 'Appearance', type: 'select', options: ['Auto', 'Light', 'Dark'] }
    ],
    values: {
      cet_date: settings.cet_date, cet_tentative: settings.cet_tentative !== 'false', cat_date: settings.cat_date,
      finish_by: settings.finish_by, theme: ls.get('voyage.theme', 'Auto')
    },
    onSubmit(v) {
      ls.set('voyage.theme', v.theme); applyTheme(v.theme);
      saveSettings({ cet_date: v.cet_date, cet_tentative: v.cet_tentative ? 'true' : 'false', cat_date: v.cat_date, finish_by: v.finish_by });
      renderView(true);
      toast('Saved');
    },
    onDelete() {
      if (DEMO) { ls.del('voyage.demo'); location.reload(); return false; }
      signOut(); return true;
    }
  });
};
