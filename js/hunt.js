/* Voyage — job hunt: pipeline (Companies), Apply kit, People & cold emails, job-hunt settings, weekly goals.
   Nothing here sends or submits anything for you. It opens the right page or a filled-in Gmail draft,
   and you press send / apply yourself. */

/* ---------------- helpers ---------------- */
const applyOn = () => settings.apply_enabled !== 'false';           // each person has their own switch
const GOAL_DEFAULT = { jobs: 10, apps: 5, emails: 10, connects: 10 };
const goalOf = k => { const raw = settings['goal_' + k]; const n = Number(raw); return raw !== undefined && raw !== '' && isFinite(n) && n > 0 ? n : GOAL_DEFAULT[k]; };
const DAILY_EMAIL_CAP = 15;
const sameId = (a, b) => a !== '' && a != null && String(a) === String(b);
const jobById = id => D.jobs.find(j => sameId(id, j.id));
const companyOf = c => { const j = jobById(c.companyId); return j ? j.company : ''; };
const firstName = n => String(n || '').trim().split(/\s+/)[0] || 'there';
const hasPlaceholder = t => /\[[^\]\n]{2,}\]/.test(String(t || ''));
const enc = encodeURIComponent;
const gmailUrl = (to, su, body) => `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to || '')}&su=${enc(su || '')}&body=${enc(body || '')}`;
const openTab = url => { const w = window.open(url, '_blank', 'noopener'); return !!w; };
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;opacity:0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* blocked */ }
  ta.remove(); return ok;
}

/* ---------------- templates (starting points: edit them before you send) ---------------- */
const pitch = () => (settings.me_pitch || '').trim() || 'a student based in Pune';
const myName = () => profile.name || 'Your name';
const rolesPref = () => (settings.pref_roles || '').trim();

function coverStarter(j, asEmail) {
  const role = j.title ? `the ${j.title} role` : 'an entry-level role';
  return `${asEmail ? 'Dear Hiring Team,\n\n' : ''}I'd like to apply for ${role} at ${j.company}. I'm ${myName()}, ${pitch()}.\n\n[One or two lines on why this role and ${j.company} fit you.]\n\n${asEmail ? 'My resume is attached. ' : ''}Thank you for your time.\n\n${myName()}`;
}
function applySubject(j) { return `Application: ${j.title || 'Entry-level role'} | ${myName()}`; }

function emailKind(c) { return c.stage === 'To contact' ? 'first' : c.stage === 'Sent' ? 'fu1' : c.stage === 'Follow-up 1' ? 'fu2' : null; }
function emailDraft(c, kind) {
  const co = companyOf(c), first = firstName(c.name), me = myName();
  const at = co || 'your company', roles = rolesPref();
  const base = `Finance fresher interested in ${at}`;
  if (kind === 'fu1') {
    return { subject: 'Following up: ' + base,
      body: `Hi ${first},\n\nFollowing up on my earlier note${c.sentOn ? ' from ' + fmt(c.sentOn) : ''}. I'm still very interested in ${at} and would be glad to share my resume or answer any questions.\n\nThank you for your time,\n${me}` };
  }
  if (kind === 'fu2') {
    return { subject: 'Last note: ' + base,
      body: `Hi ${first},\n\nOne last note from me. If ${at} isn't hiring freshers right now, I'd really appreciate it if you could point me to someone who might be, or keep my profile for future openings.\n\nThank you,\n${me}` };
  }
  return { subject: base,
    body: `Hi ${first},\n\nI'm ${me}, ${pitch()}.\n\nI'm looking for an entry-level role${roles ? ' in ' + roles : ' in finance'} in Pune, and ${at} stood out because [one line on why ${at}].\n\nDo you have any openings for a fresher, or could we speak for 10 minutes? I'm happy to send my resume.\n\nThank you,\n${me}` };
}
function connectNote(c) {
  const co = companyOf(c);
  return `Hi ${firstName(c.name)}, I'm ${myName()}, ${pitch()}. I'd love to connect and learn about finance roles${co ? ' at ' + co : ''}.`.slice(0, 300);
}

/* ---------------- weekly numbers (also used by Home) ---------------- */
function huntWeek() {
  const since = addDays(todayISO(), -6);
  return {
    jobs: D.jobs.filter(j => j.added && j.added >= since).length,
    apps: D.jobs.filter(j => j.appliedOn && j.appliedOn >= since).length,
    emails: D.contacts.filter(c => c.sentOn && c.sentOn >= since).length,
    connects: D.contacts.filter(c => c.connectedOn && c.connectedOn >= since).length
  };
}
function followUpsDue() {
  const t = todayISO();
  const jobs = D.jobs.filter(j => j.followUp && j.followUp <= t && (j.status === 'Applied' || j.status === 'Referral asked'));
  const people = D.contacts.filter(c => c.nextFollowUp && c.nextFollowUp <= t && (c.stage === 'Sent' || c.stage === 'Follow-up 1'));
  return { jobs, people, total: jobs.length + people.length };
}
function huntHomeCard() {
  const w = huntWeek(), due = followUpsDue();
  const rows = [['Jobs found', 'jobs'], ['Applications', 'apps'], ['People emailed', 'emails'], ['Connection requests', 'connects']];
  const items = [
    ...due.jobs.slice(0, 3).map(j => `<button class="fu-row" data-act="huntGo" data-tab="jobs"><span><b>${esc(j.company)}</b><small>Follow up on your application</small></span><em>${esc(fmt(j.followUp))}</em></button>`),
    ...due.people.slice(0, 3).map(c => `<button class="fu-row" data-act="huntGo" data-tab="people"><span><b>${esc(c.name)}</b><small>${esc(companyOf(c) || 'Cold email')} · follow-up email</small></span><em>${esc(fmt(c.nextFollowUp))}</em></button>`)
  ].slice(0, 4);
  return `<section class="card tile hunt-card"><div class="hunt-head"><div><h2>Job hunt this week</h2><p class="muted small">${due.total ? `${due.total} follow-up${due.total === 1 ? '' : 's'} due` : 'Last 7 days'}</p></div><button class="link" data-act="huntGo" data-tab="jobs">Open</button></div>
    <div class="goal-list">${rows.map(([label, k]) => { const g = goalOf(k), n = w[k]; return `<div class="goal"><p><span>${label}</span><span>${n} / ${g}</span></p><div class="pbar"><i style="width:${Math.min(100, n / g * 100)}%"></i></div></div>`; }).join('')}</div>
    ${items.length ? `<div class="fu-list">${items.join('')}</div>` : ''}</section>`;
}
ACT.huntGo = el => { ui.jobs.tab = el.dataset.tab === 'people' ? 'people' : 'jobs'; location.hash = '#/jobs'; if (ui.route === 'jobs') renderView(true); };

/* ---------------- Companies page (Jobs | People) ---------------- */
VIEWS.jobs = function () {
  const st = ui.jobs, people = st.tab === 'people';
  const due = followUpsDue();
  const header = `<header class="page-head"><div><p class="eyebrow">Opportunities</p><h1 class="display">Companies</h1></div>
      <div class="head-actions"><button class="icon-btn" data-act="huntSettings" aria-label="Job hunt settings">${ico('sliders', 22)}</button><button class="btn primary" data-act="${people ? 'addPerson' : 'addJob'}">${ico('plus', 18)}${people ? 'Add<span class="hide-sm">&nbsp;person</span>' : 'Add<span class="hide-sm">&nbsp;company</span>'}</button></div></header>
    <div class="toolbar"><div class="seg"><button class="seg-btn ${people ? '' : 'active'}" data-act="huntTab" data-v="jobs">Jobs<em>${D.jobs.length}</em></button><button class="seg-btn ${people ? 'active' : ''}" data-act="huntTab" data-v="people">People<em>${D.contacts.length}</em></button></div></div>`;
  const dueCard = due.total ? `<section class="card due-card"><b>${due.total} follow-up${due.total === 1 ? '' : 's'} due</b><span class="muted small">${[...due.jobs.map(j => j.company), ...due.people.map(c => c.name)].slice(0, 4).map(esc).join(', ')}${due.total > 4 ? '…' : ''}</span></section>` : '';
  return `<div class="page">${header}${dueCard}${people ? peopleBody() : jobsBody()}</div>`;
};
ACT.huntTab = el => { ui.jobs.tab = el.dataset.v; renderView(true); };

function jobsBody() {
  const st = ui.jobs;
  if (!D.jobs.length) return `<section class="card">${empty('briefcase', 'No companies saved', 'Save a company you want to work at, with the role, link and how you will apply.', `<button class="btn primary" data-act="addJob">${ico('plus', 18)}Add company</button>`)}</section>`;
  const counts = s => s === 'All' ? D.jobs.length : D.jobs.filter(j => (j.status || 'Saved') === s).length;
  return `<div class="toolbar">
      <label class="search">${ico('search', 18)}<input type="search" placeholder="Search company, role, place or category" value="${esc(st.q)}" data-inp="jobsQ" aria-label="Search companies"></label>
      <div class="seg">${['All', ...JOB_STATUS].map(s => `<button class="seg-btn ${st.status === s ? 'active' : ''}" data-act="jobsStatus" data-v="${s}">${s}<em>${counts(s)}</em></button>`).join('')}</div></div>
    <div id="jobs-list">${jobsList()}</div>`;
}
function jobsList() {
  const st = ui.jobs, q = st.q.trim().toLowerCase(), t = todayISO();
  const due = j => (j.followUp && j.followUp <= t && (j.status === 'Applied' || j.status === 'Referral asked')) ? 0 : 1;
  const rows = D.jobs.filter(j => (st.status === 'All' || (j.status || 'Saved') === st.status) && (!q || `${j.company} ${j.title} ${j.location} ${j.field} ${j.category}`.toLowerCase().includes(q)))
    .slice().sort((a, b) => due(a) - due(b) || (Number(b.fit) || -1) - (Number(a.fit) || -1) || String(b.added).localeCompare(String(a.added)) || 0);
  if (!rows.length) return `<section class="card">${empty('search', 'Nothing matches', 'Try another search or status.')}</section>`;
  return `<div class="grid g2">${rows.map(jobCard).join('')}</div>`;
}
function jobCard(j) {
  const s = j.status || 'Saved', t = todayISO();
  const dl = j.deadline ? diffDays(t, j.deadline) : null;
  const canApply = applyOn() && (s === 'Saved' || s === 'Tailored' || s === 'Referral asked');
  const late = j.followUp && j.followUp <= t && (s === 'Applied' || s === 'Referral asked');
  return `<article class="card job click" data-act="editJob" data-id="${esc(j.id)}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3>${esc(j.company)}</h3><p class="role">${esc(j.title || 'Role not noted')}</p></div><span class="pill ${s === 'Offer' ? 'ok' : ['Interview', 'Applied', 'Referral asked', 'Tailored'].includes(s) ? 'accent' : ''}">${esc(s)}</span></div>
      <div class="tags">${j.fit !== '' && j.fit != null ? `<span class="tag accent">Fit ${esc(j.fit)}</span>` : ''}${j.category ? `<span class="tag">${esc(j.category)}</span>` : ''}${j.location ? `<span class="tag">${ico('pin', 12)}&nbsp;${esc(j.location)}</span>` : ''}${j.commute ? `<span class="tag">${esc(j.commute)}</span>` : ''}${j.resume ? `<span class="tag">Resume: ${esc(j.resume)}</span>` : ''}${dl !== null && dl >= 0 && dl <= 7 && s !== 'Applied' && s !== 'Closed' ? `<span class="tag warn">${dl === 0 ? 'Closes today' : 'Closes in ' + dl + 'd'}</span>` : ''}${late ? '<span class="tag warn">Follow up now</span>' : (j.followUp && s === 'Applied' ? `<span class="tag">Follow up ${esc(fmt(j.followUp))}</span>` : '')}</div>
      ${j.description ? `<p class="muted small" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(j.description)}</p>` : ''}
      <div class="job-foot"><span class="faint small">${j.appliedOn ? 'Applied ' + fmt(j.appliedOn) : j.added ? 'Added ' + fmt(j.added) : ''}</span>
        <span class="job-actions">${j.link ? `<a class="link" href="${esc(j.link)}" target="_blank" rel="noopener" data-act="stop" style="display:inline-flex;gap:6px;align-items:center">Open ${ico('link', 14)}</a>` : ''}${canApply ? `<button class="btn primary sm" data-act="applyKit" data-id="${esc(j.id)}">Apply</button>` : ''}</span></div></article>`;
}
ACT.stop = (el, e) => e.stopPropagation();
ACT.jobsStatus = el => { ui.jobs.status = el.dataset.v; renderView(true); };
INP.jobsQ = el => { ui.jobs.q = el.value; $('#jobs-list').innerHTML = jobsList(); };

function jobFields(editing) {
  return [
    { name: 'company', label: 'Company', required: true, placeholder: 'e.g. Acme Technologies' },
    { name: 'title', label: 'Role / title', placeholder: 'e.g. Finance Operations Analyst' },
    { name: 'category', label: 'Category', type: 'select', half: true, options: ['', ...JOB_CATEGORY] },
    { name: 'status', label: 'Status', type: 'select', half: true, options: JOB_STATUS },
    { name: 'location', label: 'Location', half: true, placeholder: 'Baner, Pune' },
    { name: 'commute', label: 'Commute', half: true, placeholder: 'e.g. 15 min' },
    { name: 'fit', label: 'Fit (0 to 100)', type: 'number', half: true, placeholder: 'How well it fits you' },
    { name: 'field', label: 'Field', half: true, placeholder: 'Finance, Audit…' },
    { name: 'source', label: 'Found on', type: 'select', half: true, options: ['', ...JOB_SOURCE] },
    { name: 'deadline', label: 'Closes on', type: 'date', half: true },
    { name: 'link', label: 'Job link', type: 'url', placeholder: 'https://' },
    { name: 'applyEmail', label: 'Apply by email (if the job takes emails)', type: 'email', placeholder: 'careers@company.com' },
    { name: 'resume', label: 'Resume version', type: 'combo', options: RESUME_VERSIONS, placeholder: 'Which resume you used' },
    { name: 'appliedOn', label: 'Applied on', type: 'date', half: true },
    { name: 'followUp', label: 'Follow up on', type: 'date', half: true },
    { name: 'coverNote', label: 'Cover note', type: 'textarea', rows: 4, placeholder: 'Opens in the Apply kit. Leave empty to start from a template.' },
    { name: 'description', label: 'Job description / notes', type: 'textarea', rows: 4, placeholder: 'Skills asked, who to contact, anything worth remembering' }
  ];
}
function cleanJob(v) {
  const out = Object.assign({}, v);
  if (out.fit !== '' && out.fit != null) out.fit = Math.max(0, Math.min(100, Math.round(Number(out.fit))));
  if (out.status === 'Applied' && !out.appliedOn) { out.appliedOn = todayISO(); if (!out.followUp) out.followUp = addDays(todayISO(), 5); }
  return out;
}
ACT.addJob = () => openForm({
  title: 'Add a company', fields: jobFields(false), submitLabel: 'Save company', values: { status: 'Saved' },
  onSubmit(v) { addRow('jobs', Object.assign({}, cleanJob(v), { added: todayISO() })); ui.jobs.tab = 'jobs'; ui.jobs.q = ''; ui.jobs.status = 'All'; renderView(true); toast('Company saved'); }
});
ACT.editJob = el => {
  const j = jobById(el.dataset.id); if (!j) return;
  openForm({
    title: j.company, fields: jobFields(true), values: j,
    onSubmit(v) { updateRow('jobs', j, cleanJob(v)); renderView(true); toast('Saved'); },
    onDelete() {
      confirmBox({ title: `Delete ${j.company}?`, text: 'People you saved for this company stay, without the company link.', action: 'Delete', onConfirm() {
        D.contacts.forEach(c => { if (sameId(c.companyId, j.id)) c.companyId = ''; });
        removeRow('jobs', j); renderView(true);
      } });
    }
  });
};

/* ---------------- Apply kit ---------------- */
function markApplied(j) {
  updateRow('jobs', j, { status: 'Applied', appliedOn: todayISO(), followUp: addDays(todayISO(), 5) });
}
ACT.applyKit = (el, e) => {
  if (e) e.stopPropagation();
  const j = jobById(el.dataset.id); if (!j || !applyOn()) return;
  const byEmail = !!j.applyEmail;
  const sheet = openSheet({
    title: 'Apply to ' + j.company, wide: true, onClose: () => { if (ui.route === 'jobs') renderView(true); },
    html: `<div class="kit">
      <p class="sheet-note" style="margin:-6px 0 4px">${esc(j.title || 'Role not noted')}${j.resume ? ' · Resume: ' + esc(j.resume) : ''}</p>
      <div class="kit-step"><span class="kit-n">1</span><div><b>Your resume</b><p class="muted small">${j.resume ? `Use your <b>${esc(j.resume)}</b> version.` : 'Pick a resume version on this company (tap the card).'} ${byEmail ? 'Attach it to the Gmail draft before you send.' : 'Upload it on the application page.'}</p></div></div>
      <div class="kit-step"><span class="kit-n">2</span><div style="flex:1;min-width:0"><b>${byEmail ? 'Email' : 'Cover note'}</b>
        <p class="muted small">Starter text. Replace anything in [brackets] and make it yours.</p>
        <textarea class="kit-area" data-note rows="9" aria-label="Cover note">${esc(j.coverNote || coverStarter(j, byEmail))}</textarea></div></div>
      <div class="kit-step"><span class="kit-n">3</span><div><b>${byEmail ? 'Open the Gmail draft' : 'Open the job page'}</b><p class="muted small">${byEmail ? `To: ${esc(j.applyEmail)}. The subject and note are filled in.` : (j.link ? 'Your cover note is copied to the clipboard when it opens.' : 'Add a job link on this company first.')}</p></div></div>
      <div class="kit-actions"><button class="btn" data-copy>Copy note</button><button class="btn primary" data-open ${byEmail || j.link ? '' : 'disabled'}>${byEmail ? 'Open in Gmail' : 'Open job page'} ${ico('link', 16)}</button></div>
      <div class="kit-step"><span class="kit-n">4</span><div><b>When you have applied</b><p class="muted small">Moves this to Applied today and reminds you to follow up in 5 days.</p></div></div>
      <div class="kit-actions"><button class="btn" data-applied>I've applied</button></div></div>`
  });
  const area = $('[data-note]', sheet.el);
  const note = () => area.value.trim();
  const saveNote = () => { if (note() !== (j.coverNote || '')) updateRow('jobs', j, { coverNote: note() }); };
  const blocked = () => { if (hasPlaceholder(note())) { toast('Fill in the [bracketed] part first', 'error'); area.focus(); return true; } return false; };
  area.addEventListener('change', saveNote);
  $('[data-copy]', sheet.el).addEventListener('click', async () => { saveNote(); toast((await copyText(note())) ? 'Copied' : "Couldn't copy. Select the text and copy it.", ''); });
  $('[data-open]', sheet.el).addEventListener('click', async () => {
    if (blocked()) return;
    saveNote();
    if (byEmail) { openTab(gmailUrl(j.applyEmail, applySubject(j), note())); toast('Gmail draft opened. Attach your resume and send.'); }
    else if (j.link) { const ok = await copyText(note()); openTab(j.link); toast(ok ? 'Cover note copied. Job page opened.' : 'Job page opened.'); }
  });
  $('[data-applied]', sheet.el).addEventListener('click', () => { saveNote(); markApplied(j); sheet.close(); toast('Marked as applied. Follow up on ' + fmt(addDays(todayISO(), 5))); });
};

/* ---------------- People page ---------------- */
function peopleBody() {
  const st = ui.jobs;
  if (!D.contacts.length) return `<section class="card">${empty('heart', 'No people yet', 'Save HR contacts, finance heads and alumni here, then email them from your own Gmail in a few taps.', `<button class="btn primary" data-act="addPerson">${ico('plus', 18)}Add person</button>`)}</section>`;
  const counts = s => s === 'All' ? D.contacts.length : D.contacts.filter(c => c.stage === s).length;
  const today = D.contacts.filter(c => c.sentOn === todayISO()).length;
  return `<div class="toolbar">
      <label class="search">${ico('search', 18)}<input type="search" placeholder="Search name, role or company" value="${esc(st.pq)}" data-inp="peopleQ" aria-label="Search people"></label>
      <div class="seg">${['All', ...CONTACT_STAGE].map(s => `<button class="seg-btn ${st.stage === s ? 'active' : ''}" data-act="peopleStage" data-v="${s}">${s}<em>${counts(s)}</em></button>`).join('')}</div></div>
    <p class="muted small cap-note ${today >= DAILY_EMAIL_CAP ? 'over' : ''}">${today} of ${DAILY_EMAIL_CAP} emails sent today. A small daily number from your own Gmail keeps you out of spam.</p>
    <div id="people-list">${peopleList()}</div>`;
}
function peopleList() {
  const st = ui.jobs, q = st.pq.trim().toLowerCase(), t = todayISO();
  const due = c => (c.nextFollowUp && c.nextFollowUp <= t && (c.stage === 'Sent' || c.stage === 'Follow-up 1')) ? 0 : 1;
  const rows = D.contacts.filter(c => (st.stage === 'All' || c.stage === st.stage) && (!q || `${c.name} ${c.role} ${companyOf(c)}`.toLowerCase().includes(q)))
    .slice().sort((a, b) => due(a) - due(b) || CONTACT_STAGE.indexOf(a.stage) - CONTACT_STAGE.indexOf(b.stage));
  if (!rows.length) return `<section class="card">${empty('search', 'Nothing matches', 'Try another search or stage.')}</section>`;
  return `<div class="grid g2">${rows.map(personCard).join('')}</div>`;
}
function personCard(c) {
  const t = todayISO(), kind = emailKind(c), co = companyOf(c);
  const late = c.nextFollowUp && c.nextFollowUp <= t && (c.stage === 'Sent' || c.stage === 'Follow-up 1');
  const label = kind === 'first' ? 'Write email' : kind ? 'Follow up' : '';
  return `<article class="card job click" data-act="editPerson" data-id="${esc(c.id)}">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h3>${esc(c.name)}</h3><p class="role">${esc([c.role, co].filter(Boolean).join(' · ') || 'Role not noted')}</p></div><span class="pill ${c.stage === 'Replied' ? 'ok' : c.stage === 'To contact' || c.stage === 'Closed' ? '' : 'accent'}">${esc(c.stage)}</span></div>
      <div class="tags">${c.email ? `<span class="tag">${esc(c.email)}</span>` : '<span class="tag">No email yet</span>'}${c.emailStatus === 'Guessed' ? '<span class="tag warn">Guessed address</span>' : c.emailStatus === 'Verified' ? '<span class="tag accent">Verified</span>' : ''}${c.connectedOn ? `<span class="tag">Connection sent ${esc(fmt(c.connectedOn))}</span>` : ''}${late ? '<span class="tag warn">Follow-up due</span>' : (c.nextFollowUp && kind && kind !== 'first' ? `<span class="tag">Follow up ${esc(fmt(c.nextFollowUp))}</span>` : '')}</div>
      ${c.notes ? `<p class="muted small" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(c.notes)}</p>` : ''}
      <div class="job-foot"><span class="faint small">${c.sentOn ? 'Last emailed ' + fmt(c.sentOn) : ''}</span>
        <span class="job-actions"><button class="btn sm" data-act="connectNote" data-id="${esc(c.id)}">LinkedIn note</button>${kind ? `<button class="btn primary sm" data-act="composeEmail" data-id="${esc(c.id)}">${label}</button>` : c.stage === 'Follow-up 2' ? `<button class="btn sm" data-act="personReplied" data-id="${esc(c.id)}">Mark replied</button>` : ''}</span></div></article>`;
}
INP.peopleQ = el => { ui.jobs.pq = el.value; $('#people-list').innerHTML = peopleList(); };
ACT.peopleStage = el => { ui.jobs.stage = el.dataset.v; renderView(true); };
const personById = id => D.contacts.find(c => sameId(id, c.id));
ACT.personReplied = (el, e) => { if (e) e.stopPropagation(); const c = personById(el.dataset.id); if (!c) return; updateRow('contacts', c, { stage: 'Replied', nextFollowUp: '' }); renderView(true); toast('Marked as replied'); };

function personFields() {
  return [
    { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Priya Sharma' },
    { name: 'role', label: 'Role', half: true, placeholder: 'HR, Finance Head, Alumni…' },
    { name: 'company', label: 'Company', type: 'select', half: true, options: ['', ...D.jobs.map(j => j.company)] },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com' },
    { name: 'emailStatus', label: 'Is the email confirmed?', type: 'select', half: true, options: ['', 'Verified', 'Guessed'] },
    { name: 'stage', label: 'Stage', type: 'select', half: true, options: CONTACT_STAGE },
    { name: 'linkedin', label: 'LinkedIn profile', type: 'url', placeholder: 'https://linkedin.com/in/…' },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'How you found them, what to mention' }
  ];
}
function personPatch(v, current) {
  const out = Object.assign({}, v); delete out.company;
  const cur = current ? jobById(current.companyId) : null;
  const j = v.company ? (cur && cur.company === v.company ? cur : D.jobs.find(x => x.company === v.company)) : null;
  out.companyId = j ? j.id : '';
  return out;
}
ACT.addPerson = () => openForm({
  title: 'Add a person', fields: personFields(), submitLabel: 'Save person', values: { stage: 'To contact' },
  onSubmit(v) { addRow('contacts', Object.assign(personPatch(v), { sentCount: 0, sentOn: '', nextFollowUp: '', connectedOn: '' })); ui.jobs.tab = 'people'; ui.jobs.pq = ''; ui.jobs.stage = 'All'; renderView(true); toast('Saved'); }
});
ACT.editPerson = el => {
  const c = personById(el.dataset.id); if (!c) return;
  openForm({
    title: c.name, fields: personFields(), values: Object.assign({}, c, { company: companyOf(c) }),
    onSubmit(v) { updateRow('contacts', c, personPatch(v, c)); renderView(true); toast('Saved'); },
    onDelete() { confirmBox({ title: `Delete ${c.name}?`, text: 'This removes the person and their email history.', action: 'Delete', onConfirm() { removeRow('contacts', c); renderView(true); } }); }
  });
};

/* ---------------- cold email ---------------- */
ACT.composeEmail = (el, e) => {
  if (e) e.stopPropagation();
  const c = personById(el.dataset.id); if (!c) return;
  const kind = emailKind(c); if (!kind) return;
  const d = emailDraft(c, kind);
  const nextDays = kind === 'first' ? 5 : kind === 'fu1' ? 7 : 0;      // day 5, then day 12 counting from the first email
  const title = kind === 'first' ? 'First email' : kind === 'fu1' ? 'Follow-up (day 5)' : 'Last follow-up (day 12)';
  const sheet = openSheet({
    title: `${title} to ${firstName(c.name)}`, wide: true,
    onClose: () => { if (ui.route === 'jobs') renderView(true); },
    html: `<div class="kit">
      <label class="field"><span>To</span><input type="email" data-to value="${esc(c.email)}" placeholder="name@company.com" autocomplete="off"></label>
      <label class="field"><span>Subject</span><input type="text" data-su value="${esc(d.subject)}" autocomplete="off"></label>
      <label class="field"><span>Email</span><textarea class="kit-area" data-body rows="12">${esc(d.body)}</textarea></label>
      <p class="muted small" data-warn>${c.emailStatus === 'Guessed' ? 'This address is a guess. Check it before you send.' : c.email ? '' : 'Add the email address to open the Gmail draft.'}</p>
      <div class="kit-actions"><button class="btn" data-copy>Copy</button><button class="btn primary" data-gmail>Open in Gmail ${ico('link', 16)}</button></div>
      <div class="kit-step"><span class="kit-n">✓</span><div><b>After you send it</b><p class="muted small">${nextDays ? `Marks it sent and reminds you in ${nextDays} days.` : 'Marks it sent. This is the last follow-up.'}</p></div></div>
      <div class="kit-actions"><button class="btn" data-sent>I've sent it</button></div></div>`
  });
  const q = s => $(s, sheet.el);
  const readTo = () => q('[data-to]').value.trim();
  const guard = () => { if (hasPlaceholder(q('[data-body]').value)) { toast('Fill in the [bracketed] part first', 'error'); q('[data-body]').focus(); return false; } return true; };
  const saveTo = () => { const to = readTo(); if (to !== c.email) updateRow('contacts', c, { email: to }); };
  q('[data-copy]').addEventListener('click', async () => toast((await copyText(q('[data-body]').value)) ? 'Copied' : "Couldn't copy. Select the text and copy it."));
  q('[data-gmail]').addEventListener('click', () => {
    if (!guard()) return;
    if (!readTo()) { toast('Add the email address first', 'error'); q('[data-to]').focus(); return; }
    saveTo(); openTab(gmailUrl(readTo(), q('[data-su]').value, q('[data-body]').value));
    toast('Gmail draft opened. Attach your resume and send.');
  });
  q('[data-sent]').addEventListener('click', () => {
    if (!guard()) return;
    saveTo();
    const t = todayISO();
    updateRow('contacts', c, {
      stage: kind === 'first' ? 'Sent' : kind === 'fu1' ? 'Follow-up 1' : 'Follow-up 2',
      sentCount: (Number(c.sentCount) || 0) + 1, sentOn: t, nextFollowUp: nextDays ? addDays(t, nextDays) : ''
    });
    sheet.close(); toast(nextDays ? `Marked sent. Follow up on ${fmt(addDays(t, nextDays))}.` : 'Marked sent.');
  });
};
ACT.connectNote = (el, e) => {
  if (e) e.stopPropagation();
  const c = personById(el.dataset.id); if (!c) return;
  const co = companyOf(c);
  const url = c.linkedin || `https://www.linkedin.com/search/results/people/?keywords=${enc((c.name + ' ' + co).trim())}`;
  const sheet = openSheet({
    title: 'LinkedIn note for ' + firstName(c.name), wide: true,
    onClose: () => { if (ui.route === 'jobs') renderView(true); },
    html: `<div class="kit"><p class="sheet-note" style="margin:-6px 0 4px">LinkedIn allows 300 characters on a connection note. Copy it, open their profile, then paste it into Connect → Add a note.</p>
      <textarea class="kit-area" data-note rows="5" maxlength="300" aria-label="Connection note">${esc(connectNote(c))}</textarea>
      <p class="faint small" data-count style="text-align:right"></p>
      <div class="kit-actions"><button class="btn" data-copy>Copy note</button><button class="btn primary" data-open>${c.linkedin ? 'Open profile' : 'Search on LinkedIn'} ${ico('link', 16)}</button></div>
      <div class="kit-actions"><button class="btn" data-sent>${c.connectedOn ? 'Sent again today' : "I've sent the request"}</button></div></div>`
  });
  const area = $('[data-note]', sheet.el), count = $('[data-count]', sheet.el);
  const upd = () => { count.textContent = `${area.value.length} / 300`; };
  area.addEventListener('input', upd); upd();
  $('[data-copy]', sheet.el).addEventListener('click', async () => toast((await copyText(area.value)) ? 'Copied' : "Couldn't copy. Select the text and copy it."));
  $('[data-open]', sheet.el).addEventListener('click', async () => { await copyText(area.value); openTab(url); toast('Note copied. LinkedIn opened.'); });
  $('[data-sent]', sheet.el).addEventListener('click', () => { updateRow('contacts', c, { connectedOn: todayISO() }); sheet.close(); toast('Marked as sent'); });
};

/* ---------------- job hunt settings (per person) ---------------- */
ACT.huntSettings = () => openForm({
  title: 'Job hunt settings',
  note: 'These are yours alone. Nobody else who uses Voyage sees them.',
  submitLabel: 'Save',
  fields: [
    { name: 'apply_enabled', label: 'Show the Apply button', type: 'switch' },
    { name: 'pref_roles', label: 'Roles you want', placeholder: 'e.g. finance operations, FP&A, audit' },
    { name: 'pref_location', label: 'Where you want to work', placeholder: 'e.g. Baner / Sus Road, Pune' },
    { name: 'me_pitch', label: 'About you, in one line (used in emails and notes)', type: 'textarea', rows: 3, placeholder: 'a third-year BMS student at …, currently working at …' },
    { name: 'goal_jobs', label: 'Weekly goal: jobs found', type: 'number', half: true },
    { name: 'goal_apps', label: 'Weekly goal: applications', type: 'number', half: true },
    { name: 'goal_emails', label: 'Weekly goal: people emailed', type: 'number', half: true },
    { name: 'goal_connects', label: 'Weekly goal: connection requests', type: 'number', half: true }
  ],
  values: {
    apply_enabled: applyOn(), pref_roles: settings.pref_roles, pref_location: settings.pref_location, me_pitch: settings.me_pitch,
    goal_jobs: goalOf('jobs'), goal_apps: goalOf('apps'), goal_emails: goalOf('emails'), goal_connects: goalOf('connects')
  },
  onSubmit(v) {
    saveSettings({
      apply_enabled: v.apply_enabled ? 'true' : 'false', pref_roles: v.pref_roles, pref_location: v.pref_location, me_pitch: v.me_pitch,
      goal_jobs: v.goal_jobs, goal_apps: v.goal_apps, goal_emails: v.goal_emails, goal_connects: v.goal_connects
    });
    renderView(true); toast('Saved');
  }
});
