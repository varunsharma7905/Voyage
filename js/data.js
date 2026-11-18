/* Voyage — data layer. Talks to Supabase (sign-in + database) with plain fetch, no library.
   It answers the same actions the app has always used: load, save, remove, settings,
   plus addSubject / renameSubject / removeSubject. */

const SB = {
  session: null,          // { access_token, refresh_token, expires_at, user: { id, email } }
  refreshing: null,
  byName: new Map(),      // lower-case subject name -> id
  byId: new Map()         // id -> subject name
};
const sbUrl = () => { const u = String(CONFIG.SUPABASE_URL).trim(); try { return new URL(u).origin; } catch (e) { return u.replace(/\/+$/, ''); } };

class SbError extends Error {
  constructor(kind, message, status) { super(message); this.kind = kind; this.status = status || 0; }
}
function sbHeaders(token, extra) {
  return Object.assign({
    apikey: CONFIG.SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + (token || CONFIG.SUPABASE_ANON_KEY),
    'Content-Type': 'application/json'
  }, extra || {});
}

/* ---------- sign-in ---------- */
function sbStore(j) {
  const now = Math.floor(Date.now() / 1000);
  SB.session = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_at || now + (j.expires_in || 3600),
    user: { id: j.user.id, email: j.user.email }
  };
  ls.set('voyage.session', SB.session);
}
async function sbSignIn(email, password) {
  try {
    const res = await fetch(sbUrl() + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: sbHeaders(null), body: JSON.stringify({ email, password })
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.access_token && j.user) { sbStore(j); return { ok: true }; }
    const wrong = res.status === 400 || res.status === 401 || res.status === 422;
    return { ok: false, error: wrong ? 'auth' : 'server', message: wrong ? "That email or password isn't right." : (j.msg || j.message || 'Sign-in failed. Try again.') };
  } catch (e) {
    return { ok: false, error: 'network', message: "Can't reach Supabase. Check your connection." };
  }
}
function sbRefresh() {
  if (!SB.session) return Promise.resolve(false);
  if (SB.refreshing) return SB.refreshing;       // one refresh at a time; refresh tokens are single-use
  SB.refreshing = (async () => {
    try {
      const res = await fetch(sbUrl() + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', headers: sbHeaders(null), body: JSON.stringify({ refresh_token: SB.session.refresh_token })
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.access_token && j.user) { sbStore(j); return true; }
      if (res.status >= 400 && res.status < 500) { SB.session = null; ls.del('voyage.session'); } // rejected: really signed out
      return false;
    } catch (e) {
      return false;                              // offline: keep the session and try again later
    } finally {
      SB.refreshing = null;
    }
  })();
  return SB.refreshing;
}
async function sbToken() {
  if (!SB.session) return null;
  if (SB.session.expires_at - 60 < Date.now() / 1000) await sbRefresh();
  return SB.session ? SB.session.access_token : null;
}
function sbSignOut() {
  const token = SB.session && SB.session.access_token;
  SB.session = null; SB.byName.clear(); SB.byId.clear();
  ls.del('voyage.session');
  if (token) fetch(sbUrl() + '/auth/v1/logout', { method: 'POST', headers: sbHeaders(token) }).catch(() => { /* best effort */ });
}

/* ---------- REST ---------- */
function sbMessage(j, status) {
  if (j && j.code === '23505') return 'That already exists.';
  if (j && j.code === '42501') return "You don't have permission to do that.";
  return (j && (j.message || j.msg)) || `Database error (${status}).`;
}
async function sbRest(method, path, body, extra) {
  for (let attempt = 0; ; attempt++) {
    const token = await sbToken();
    if (!token) throw new SbError('auth', 'Please sign in again.', 401);
    let res;
    try {
      res = await fetch(sbUrl() + '/rest/v1/' + path, { method, headers: sbHeaders(token, extra), body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) {
      throw new SbError('network', "Can't reach your database right now.", 0);
    }
    if (res.status === 401) {
      if (attempt === 0 && await sbRefresh()) continue;
      if (SB.session && attempt === 0) throw new SbError('network', "Can't reach your database right now.", 401); // refresh failed while offline
      throw new SbError('auth', 'Please sign in again.', 401);
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new SbError(res.status === 409 ? 'conflict' : 'server', sbMessage(j, res.status), res.status);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
}
async function sbAll(path) {                      // reads every row, 1000 at a time
  const out = [], size = 1000;
  for (let from = 0; ; from += size) {
    const rows = await sbRest('GET', path, undefined, { Range: `${from}-${from + size - 1}`, 'Range-Unit': 'items' });
    out.push(...(rows || []));
    if (!rows || rows.length < size) break;
  }
  return out;
}

/* ---------- field maps: [app name, column, kind] ---------- */
// kinds: date = may be empty (null), date0 / num0 = column can't be null (left out when empty), num = may be empty, bool
const SB_MAP = {
  vocab: { table: 'vocab', f: [['word', 'word'], ['meaning', 'meaning'], ['synonyms', 'synonyms'], ['ex1', 'example1'], ['ex2', 'example2'], ['status', 'status'], ['date', 'added_on', 'date0'], ['box', 'box', 'num0'], ['next', 'next_review', 'date']] },
  mocks: { table: 'mocks', f: [['name', 'name'], ['date', 'taken_on', 'date0'], ['score', 'score', 'num0'], ['outOf', 'out_of', 'num0'], ['quant', 'quant', 'num'], ['lr', 'lr', 'num'], ['verbal', 'verbal', 'num'], ['ar', 'ar', 'num'], ['minutes', 'minutes', 'num'], ['notes', 'notes']] },
  jobs: { table: 'companies', f: [['company', 'company'], ['title', 'title'], ['field', 'field'], ['location', 'location'], ['link', 'link'], ['description', 'description'], ['status', 'status'], ['added', 'added_on', 'date0']] },
  bucket: { table: 'bucket_items', f: [['title', 'title'], ['category', 'category'], ['when', 'horizon'], ['status', 'status'], ['cost', 'cost'], ['why', 'why'], ['friend', 'with_friend', 'bool'], ['doneDate', 'done_on', 'date'], ['memory', 'memory']] }
};
function sbToDb(map, row) {
  const out = {};
  for (const [k, col, kind] of map.f) {
    if (!(k in row)) continue;
    let v = row[k];
    if (kind === 'date') v = v ? String(v) : null;
    else if (kind === 'date0') { if (!v) continue; v = String(v); }
    else if (kind === 'num0') { if (v === '' || v == null) continue; v = Number(v); }
    else if (kind === 'num') v = (v === '' || v == null) ? null : Number(v);
    else if (kind === 'bool') v = !!v;
    else v = v == null ? '' : String(v);
    out[col] = v;
  }
  return out;
}
function sbFromDb(map, r) {
  const o = { id: r.id };
  for (const [k, col, kind] of map.f) {
    let v = r[col];
    if (kind === 'date' || kind === 'date0') v = v ? String(v).slice(0, 10) : '';
    else if (kind === 'num' || kind === 'num0') v = (v === null || v === undefined) ? '' : Number(v);
    else if (kind === 'bool') v = !!v;
    else v = v == null ? '' : String(v);
    o[k] = v;
  }
  return o;
}

/* ---------- subjects ---------- */
function sbRememberSubject(s) { SB.byName.set(String(s.name).toLowerCase(), s.id); SB.byId.set(s.id, s.name); }
function sbForgetSubject(id) {
  const name = SB.byId.get(id);
  if (name !== undefined) SB.byName.delete(String(name).toLowerCase());
  SB.byId.delete(id);
}
async function sbSubjectId(name) {                // finds a subject by name, creating it if it is new
  const n = String(name || '').replace(/\s+/g, ' ').trim() || 'Other';
  const hit = SB.byName.get(n.toLowerCase());
  if (hit) return hit;
  const out = await sbRest('POST', 'subjects', { name: n }, { Prefer: 'return=representation' });
  sbRememberSubject(out[0]);
  return out[0].id;
}
function sbChapterFromDb(r) {
  return {
    id: r.id, book: r.book || '', subject: SB.byId.get(r.subject_id) || 'Other', chapter: r.name,
    done: !!r.done, date: r.done_on ? String(r.done_on).slice(0, 10) : '', priority: r.priority || ''
  };
}

/* ---------- actions ---------- */
function sbNameFromEmail(email) {
  const w = String(email || '').split('@')[0].split(/[._\-+0-9]+/)[0] || 'there';
  return w.charAt(0).toUpperCase() + w.slice(1);
}
async function sbLoad() {
  const paths = {
    subjects: 'subjects?select=id,name&order=id.asc',
    chapters: 'chapters?select=*&order=id.asc',
    vocab: 'vocab?select=*&order=id.asc',
    mocks: 'mocks?select=*&order=id.asc',
    jobs: 'companies?select=*&order=id.asc',
    bucket: 'bucket_items?select=*&order=id.asc',
    settings: 'settings?select=key,value'
  };
  const keys = Object.keys(paths);
  const results = await Promise.allSettled(keys.map(k => sbAll(paths[k])));
  const got = {}, errors = {};
  keys.forEach((k, i) => {
    if (results[i].status === 'fulfilled') got[k] = results[i].value;
    else { got[k] = []; errors[k] = results[i].reason; }
  });
  // Without subjects, chapters or settings the app would show (and then save) the wrong thing, so stop here.
  for (const k of ['subjects', 'chapters', 'settings']) {
    if (errors[k]) { const e = errors[k]; return { ok: false, error: e.kind || 'server', message: e.message || 'Could not load your data.' }; }
  }
  SB.byName.clear(); SB.byId.clear();
  got.subjects.forEach(sbRememberSubject);
  const settings = {};
  got.settings.forEach(r => { settings[r.key] = r.value; });
  const user = SB.session.user;
  const data = {
    subjects: got.subjects.map(s => ({ id: s.id, name: s.name })),
    cet: got.chapters.map(sbChapterFromDb)
  };
  for (const s of Object.keys(SB_MAP)) data[s] = got[s].map(r => sbFromDb(SB_MAP[s], r));
  const soft = {};
  Object.keys(errors).forEach(k => { soft[k] = errors[k].message; });
  return { ok: true, profile: { id: user.id, name: settings.display_name || sbNameFromEmail(user.email) }, settings, data, errors: soft };
}

async function sbSaveChapter(id, row) {
  const body = {};
  if ('chapter' in row) body.name = String(row.chapter).trim();
  if ('book' in row) body.book = String(row.book || '');
  if ('done' in row) body.done = !!row.done;
  if ('date' in row) body.done_on = row.date ? String(row.date) : null;
  if ('priority' in row) body.priority = PRIORITIES.includes(row.priority) ? row.priority : null;
  if ('subject' in row) body.subject_id = await sbSubjectId(row.subject);
  if (id) {
    if (Object.keys(body).length) await sbRest('PATCH', `chapters?id=eq.${Number(id)}`, body, { Prefer: 'return=minimal' });
    return { ok: true, id };
  }
  if (!('subject' in row)) body.subject_id = await sbSubjectId('Other');
  const out = await sbRest('POST', 'chapters', body, { Prefer: 'return=representation' });
  return { ok: true, id: out[0].id };
}

async function sbApi(action, p) {
  p = p || {};
  try {
    switch (action) {
      case 'load': return await sbLoad();
      case 'save': {
        if (p.section === 'cet') return await sbSaveChapter(p.id, p.row || {});
        const map = SB_MAP[p.section];
        if (!map) return { ok: false, error: 'bad_section', message: 'Unknown list.' };
        const body = sbToDb(map, p.row || {});
        if (p.id) {
          if (Object.keys(body).length) await sbRest('PATCH', `${map.table}?id=eq.${Number(p.id)}`, body, { Prefer: 'return=minimal' });
          return { ok: true, id: p.id };
        }
        const out = await sbRest('POST', map.table, body, { Prefer: 'return=representation' });
        return { ok: true, id: out[0].id };
      }
      case 'remove': {
        const table = p.section === 'cet' ? 'chapters' : (SB_MAP[p.section] || {}).table;
        if (!table) return { ok: false, error: 'bad_section', message: 'Unknown list.' };
        await sbRest('DELETE', `${table}?id=eq.${Number(p.id)}`);
        return { ok: true };
      }
      case 'settings': {
        const uid = SB.session.user.id;
        const rows = Object.keys(p.values || {}).map(key => ({ user_id: uid, key, value: p.values[key] == null ? '' : String(p.values[key]) }));
        if (rows.length) await sbRest('POST', 'settings?on_conflict=user_id,key', rows, { Prefer: 'resolution=merge-duplicates,return=minimal' });
        return { ok: true };
      }
      case 'addSubject': {
        const out = await sbRest('POST', 'subjects', { name: String(p.name).replace(/\s+/g, ' ').trim() }, { Prefer: 'return=representation' });
        sbRememberSubject(out[0]);
        return { ok: true, id: out[0].id };
      }
      case 'renameSubject': {
        const to = String(p.to).replace(/\s+/g, ' ').trim();
        await sbRest('PATCH', `subjects?id=eq.${Number(p.id)}`, { name: to }, { Prefer: 'return=minimal' });
        sbForgetSubject(Number(p.id)); sbRememberSubject({ id: Number(p.id), name: to });
        return { ok: true };
      }
      case 'removeSubject': {                     // its chapters are removed with it by the database
        await sbRest('DELETE', `subjects?id=eq.${Number(p.id)}`);
        sbForgetSubject(Number(p.id));
        return { ok: true };
      }
      default: return { ok: false, error: 'bad_action', message: 'Unknown action.' };
    }
  } catch (e) {
    if (e instanceof SbError) return { ok: false, error: e.kind, message: e.message };
    console.error(e);
    return { ok: false, error: 'server', message: 'Something went wrong. Try again.' };
  }
}
