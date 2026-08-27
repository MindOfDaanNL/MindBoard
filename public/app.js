/* ============================================================================
   MindBoard SPA — vanilla JS, hash-router, PWA-vriendelijk
   ============================================================================ */

// API-basis: standaard relatief ('/api'). Overschrijfbaar via window.MB_API_BASE
// (bijv. in capacitor/www voor een Android-app die naar een externe server wijst).
const API = (window.MB_API_BASE || '/api').replace(/\/$/, '');

const state = {
  token: localStorage.getItem('mb_token') || null,
  user: JSON.parse(localStorage.getItem('mb_user') || 'null'),
  current: { route: '#/dashboard', data: null },
  overview: null,
  theme: localStorage.getItem('mb_theme') || 'light'
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- SVG icons ---------------- */
const ICONS = {
  dashboard: '<circle cx="12" cy="12" r="3"/><path d="M3 12c0 0 3.5-7 9-7s9 7 9 7-3.5 7-9 7-9-7-9-7z"/>',
  org: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  project: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  arrowBack: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  clipboard: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>',
  tag: '<path d="M20.6 13.4L12 22l-9-9V4a1 1 0 0 1 1-1h9l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>'
};
function icon(name, size = 18) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------------- API helper ---------------- */
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...opts, headers, credentials: 'include' });
  if (res.status === 401 && state.token && path !== '/auth/login') {
    await refreshToken();
    return api(path, opts);
  }
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const err = new Error(data?.error || `Fout ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function refreshToken() {
  const res = await fetch(API + '/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    // Sessie echt verlopen → token opschonen en naar de login-pagina
    state.token = null;
    state.user = null;
    state.overview = null;
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    showAuth();
    throw new Error('Sessie verlopen, log opnieuw in');
  }
  const data = await res.json();
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('mb_token', data.token);
  localStorage.setItem('mb_user', JSON.stringify(data.user));
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('mb_token', token);
  localStorage.setItem('mb_user', JSON.stringify(user));
}

function logout(silent = false) {
  state.token = null;
  state.user = null;
  state.overview = null;
  localStorage.removeItem('mb_token');
  localStorage.removeItem('mb_user');
  fetch(API + '/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  if (!silent) showAuth();
}

/* ---------------- Toasts ---------------- */
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------------- Avatar/initials ---------------- */
function initials(user) {
  const full = user?.fullName || user?.full_name || user?.username || '?';
  return full.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function avatarHTML(user, size = 30) {
  const color = user?.avatarColor || user?.avatar_color || '#4f46e5';
  return `<span class="avatar" style="background:${esc(color)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px">${esc(initials(user))}</span>`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'zojuist';
  if (s < 3600) return `${Math.floor(s / 60)} min geleden`;
  if (s < 86400) return `${Math.floor(s / 3600)} u geleden`;
  if (s < 604800) return `${Math.floor(s / 86400)} d geleden`;
  return fmtDate(iso);
}

function priorityChip(p) {
  const labels = { low: 'Laag', medium: 'Middel', high: 'Hoog', urgent: 'Urgent' };
  return `<span class="priority-chip priority-${esc(p || 'medium')}">${labels[p] || 'Middel'}</span>`;
}

/* ---------------- Modal helper ---------------- */
function openModal(html) {
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">${html}</div>
    </div>`;
  $('#modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}

function closeModal() {
  $('#modal-root').innerHTML = '';
}

/* ---------------- Auth view ---------------- */
function showAuth() {
  $('#view-auth').classList.remove('hidden');
  $('#view-app').classList.add('hidden');
  renderAuthTab('login');
}

function renderAuthTab(tab) {
  $$('.auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  $('#form-login').classList.toggle('hidden', tab !== 'login');
  $('#form-register').classList.toggle('hidden', tab !== 'register');
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('mb_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('#btn-theme');
  if (btn) btn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', 20);
}

/* ---------------- App shell ---------------- */
function showApp() {
  $('#view-auth').classList.add('hidden');
  $('#view-app').classList.remove('hidden');
  $('#sidebar').classList.remove('hidden');
  renderTopbar();
}

function renderTopbar() {
  const u = state.user;
  if (!u) return;
  $('#btn-user').textContent = initials(u);
  $('#btn-user').style.background = u.avatarColor || '#4f46e5';
  $('#dropdown-user').innerHTML = `
    <div class="dropdown-user-avatar" style="background:${esc(u.avatarColor || '#4f46e5')}">${esc(initials(u))}</div>
    <div class="dropdown-user-info">
      <div class="name">${esc(u.fullName || u.username)}</div>
      <div class="email">${esc(u.email)}</div>
    </div>`;
  $('#btn-logout').onclick = () => logout();
  if (u.role === 'admin') {
    $('.admin-only').classList.remove('hidden');
  } else {
    $('.admin-only').classList.add('hidden');
  }
  loadNotifications();
}

function toggleSidebar() {
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  if (mobile) {
    $('#sidebar').classList.toggle('open');
  } else {
    $('#sidebar').classList.toggle('collapsed');
  }
}

function renderSidebar() {
  const orgs = state.overview?.orgs || [];
  $('#sidebar-orgs').innerHTML = `
    <div class="sidebar-org-title">Organisaties</div>
    ${orgs.length ? orgs.map((o) => `
      <button data-nav="#/org/${o.id}" class="nav-item sidebar-org-item ${location.hash === `#/org/${o.id}` ? 'active' : ''}">
        <span class="dot">${esc(initials({ fullName: o.name, username: o.name }))}</span> <span>${esc(o.name)}</span>
      </button>`).join('') : `<div class="nav-item" style="color:var(--ink3);font-size:13px">Nog geen organisaties</div>`}`;
}

async function loadNotifications() {
  try {
    const d = await api('/notifications');
    const badge = $('#notif-badge');
    badge.classList.toggle('hidden', d.unread === 0);
    badge.textContent = d.unread;
    renderNotifications(d.notifications);
  } catch (e) { /* negeer */ }
}

function renderNotifications(items) {
  const notifIcon = (type) => {
    const map = { assignment: 'user', comment: 'comment', info: 'bell' };
    return icon(map[type] || 'bell', 16);
  };
  $('#notif-list').innerHTML = items.length
    ? items.map((n) => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-link="${esc(n.link || '')}" ${n.link ? 'style="cursor:pointer"' : ''}>
        <span class="notif-ic">${notifIcon(n.type)}</span>
        <span class="notif-body">
          <span class="n-title">${esc(n.title)}</span>
          ${n.body ? `<span class="n-body">${esc(n.body)}</span>` : ''}
          <span class="n-time">${timeAgo(n.created_at)}</span>
        </span>
      </div>`).join('')
    : `<div class="notif-empty"><div class="big">📭</div>Geen notificaties</div>`;

  $$('#notif-list .notif-item').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = el.dataset.id;
      await api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
      const link = el.getAttribute('data-link');
      if (link) { location.hash = link; $('#notif-panel').classList.add('hidden'); }
      loadNotifications();
    });
  });
}

/* ---------------- Router ---------------- */
const routes = {
  '#/dashboard': renderDashboard,
  '#/orgs': renderOrgs,
  '#/org': renderOrg,
  '#/projects': renderProjects,
  '#/project': renderProject,
  '#/board': renderBoard,
  '#/task': renderTask,
  '#/settings': renderSettings,
  '#/admin': renderAdmin,
  '#/accept': renderAccept
};

async function router() {
  const hash = location.hash || '#/dashboard';
  if (!state.token) return showAuth();

  showApp();
  let main = $('#main');
  main.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    await loadOverview();
  } catch (e) {
    if (e.status === 401) return showAuth();
    main.innerHTML = `<div class="empty-state"><div class="big">⚠️</div>Kan geen data laden: ${esc(e.message)}<br><br><button class="btn-primary" onclick="location.reload()">Opnieuw proberen</button></div>`;
    return;
  }
  renderSidebar();

  const [path = 'dashboard', id, extra] = hash.replace(/^#\/?/, '').split('/');
  const key = `#/${path}${extra ? '/' + extra : ''}`;
  const render = routes[key] || routes[`#/${path}`] || renderDashboard;

  $$('.nav-item[data-nav]').forEach((n) => n.classList.toggle('active', n.dataset.nav === `#/${path}` || (path === 'org' && n.dataset.nav === `#/orgs`)));
  $('#sidebar').classList.remove('open');

  try {
    await render(main, { path, id, extra });
  } catch (e) {
    main.innerHTML = `<div class="empty-state"><div class="big">⚠️</div>${esc(e.message)}</div>`;
  }
}

async function loadOverview() {
  if (state.overview) return state.overview;
  state.overview = await api('/users/me/overview');
  state.user = state.overview.user;
  localStorage.setItem('mb_user', JSON.stringify(state.user));
  renderTopbar();
  return state.overview;
}

function invalidateOverview() {
  state.overview = null;
}

/* ============================================================================
   Views
   ============================================================================ */

async function renderDashboard(main) {
  const d = state.overview;
  const tasks = d.myTasks || [];
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()).length;
  const done = d.projects.reduce((s, p) => s + (p.done_count || 0), 0);
  const total = d.projects.reduce((s, p) => s + (p.task_count || 0), 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">👋 Hallo, ${esc(state.user.fullName || state.user.username)}!
        <span class="sub">${new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>
      <div class="page-actions">
        <button class="btn-primary" id="btn-dash-project">${icon('plus', 16)} Nieuw project</button>
        <button class="btn-ghost" id="btn-dash-org">${icon('org', 16)} Organisatie</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-icon stat-icon-blue">${icon('project', 20)}</span>
        <div class="stat-value">${d.projects.length}</div>
        <div class="stat-label">Projecten</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon stat-icon-green">${icon('check', 20)}</span>
        <div class="stat-value">${done}<span class="stat-total">/${total}</span></div>
        <div class="stat-label">Taken afgerond</div>
        <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
      </div>
      <div class="stat-card">
        <span class="stat-icon stat-icon-purple">${icon('user', 20)}</span>
        <div class="stat-value">${tasks.length}</div>
        <div class="stat-label">Jouw taken</div>
      </div>
      <div class="stat-card ${overdue > 0 ? 'stat-card-warn' : ''}">
        <span class="stat-icon ${overdue > 0 ? 'stat-icon-red' : 'stat-icon-amber'}">${icon('alert', 20)}</span>
        <div class="stat-value">${overdue}</div>
        <div class="stat-label">Verlopen</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon stat-icon-amber">${icon('bell', 20)}</span>
        <div class="stat-value">${d.unreadNotifications}</div>
        <div class="stat-label">Ongelezen</div>
      </div>
    </div>

    <div class="grid-2-1">
      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">${icon('clipboard', 16)} Jouw taken</span> <span class="card-count">${tasks.length} open</span></div>
          <div class="card-body" style="padding:0">
            ${tasks.length ? tasks.map((t) => `
              <div class="task-list-item" data-task="${t.id}">
                ${avatarHTML({ fullName: state.user.fullName, username: state.user.username, avatarColor: state.user.avatarColor }, 30)}
                <div style="flex:1">
                  <div class="t-title">${esc(t.title)}</div>
                  <div class="t-meta"><span class="dot-sep">${esc(t.project_name)}</span> · ${esc(t.column_name)} ${t.due_date ? `· <span class="${new Date(t.due_date) < new Date() ? 'k-due overdue' : 'k-due'}">${icon('clock', 12)} ${fmtDate(t.due_date)}</span>` : ''}</div>
                </div>
                ${priorityChip(t.priority)}
              </div>`).join('') : `<div class="empty-state"><div class="big">🎉</div>Geen open taken toegewezen</div>`}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">${icon('activity', 16)} Recente activiteit</span></div>
          <div class="activity-list">
            ${(d.recentActivity || []).map((a) => `
              <div class="activity-item">
                ${avatarHTML({ fullName: a.full_name, username: a.username, avatarColor: a.avatar_color }, 28)}
                <div class="a-text"><strong>${esc(a.full_name || a.username)}</strong> ${activityText(a)}</div>
                <div class="a-time">${timeAgo(a.created_at)}</div>
              </div>`).join('') || '<div class="empty-state">Nog geen activiteit</div>'}
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-header"><span class="card-title">${icon('org', 16)} Organisaties</span></div>
          <div class="card-body" style="padding:0">
            ${d.orgs.map((o) => `
              <div class="task-list-item" data-nav="#/org/${o.id}">
                <span class="org-tile">${esc(initials({ fullName: o.name, username: o.name }))}</span>
                <div style="flex:1">
                  <div class="t-title">${esc(o.name)}</div>
                  <div class="t-meta">${o.member_count} leden</div>
                </div>
                <span class="role-pill" style="position:static">${esc(o.role)}</span>
              </div>`).join('') || '<div class="empty-state"><div class="big">🏢</div>Maak een organisatie aan</div>'}
          </div>
        </div>
      </div>
    </div>`;

  $$('#main [data-task]').forEach((el) => el.addEventListener('click', () => { location.hash = `#/task/${el.dataset.task}`; }));
  $('#btn-dash-project').addEventListener('click', () => showProjectModal());
  $('#btn-dash-org').addEventListener('click', () => showOrgModal());
}

function activityText(a) {
  const map = {
    'task.created': `maakte taak <em>"${esc(a.entity_name)}"</em>`,
    'task.moved': `verplaatste <em>"${esc(a.entity_name)}"</em>`,
    'task.deleted': `verwijderde taak <em>"${esc(a.entity_name)}"</em>`,
    'task.commented': `reageerde op <em>"${esc(a.entity_name)}"</em>`,
    'task.assigned': `wees <em>"${esc(a.entity_name)}"</em> toe`
  };
  return map[a.action] || `${esc(a.action)} · ${esc(a.entity_name || '')}`;
}

/* ---------------- Organisaties ---------------- */
async function renderOrgs(main) {
  const { orgs } = await api('/orgs');
  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('org', 22)} Organisaties <span class="sub">${orgs.length}</span></div>
      <div class="page-actions"><button class="btn-primary" id="btn-new-org2">${icon('plus', 16)} Nieuwe organisatie</button></div>
    </div>
    <div class="org-grid">
      ${orgs.map((o) => `
        <div class="org-card" data-nav="#/org/${o.id}">
          <span class="role-pill">${esc(o.role)}</span>
          <div class="org-icon org-tile-big">${esc(initials({ fullName: o.name, username: o.name }))}</div>
          <h3>${esc(o.name)}</h3>
          <p>${esc(o.description || 'Geen beschrijving')}</p>
          <div class="meta">
            <span>${icon('user', 13)} ${o.member_count} leden</span>
            <span>${icon('project', 13)} ${o.project_count} projecten</span>
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="big">🏢</div>Nog geen organisaties<br><br><button class="btn-primary" id="btn-new-org3">Eerste organisatie maken</button></div>'}
    </div>`;
  $('#btn-new-org2')?.addEventListener('click', () => showOrgModal());
  $('#btn-new-org3')?.addEventListener('click', () => showOrgModal());
}

function showOrgModal() {
  openModal(`
    <div class="modal-header"><h2>Nieuwe organisatie</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>Naam *</label>
      <input id="org-name" placeholder="Bijv. ACME B.V." />
      <label>Beschrijving</label>
      <textarea id="org-desc" rows="3" placeholder="Waar houdt deze organisatie zich mee bezig?"></textarea>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="org-create">Aanmaken</button>
      </div>
    </div>`);
  $('#org-create').addEventListener('click', async () => {
    try {
      const { org } = await api('/orgs', { method: 'POST', body: JSON.stringify({ name: $('#org-name').value, description: $('#org-desc').value }) });
      toast(`Organisatie "${org.name}" aangemaakt`);
      closeModal();
      invalidateOverview();
      location.hash = `#/org/${org.id}`;
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ---------------- Org detail ---------------- */
async function renderOrg(main, { id }) {
  const orgId = Number(id);
  const data = await api(`/orgs/${orgId}`);
  const { org, members, projects } = data;
  const isAdmin = ['owner', 'admin'].includes(data.myRole);
  const isOwner = data.myRole === 'owner';

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('org', 22)} ${esc(org.name)} <span class="sub">${esc(org.slug)}</span></div>
      <div class="page-actions">
        ${isAdmin ? `<button class="btn-primary" id="btn-proj-${orgId}">${icon('plus', 16)} Nieuw project</button>
        <button class="btn-ghost" id="btn-invite">${icon('mail', 16)} Uitnodigen</button>
        <button class="btn-ghost" id="btn-edit-org">${icon('edit', 16)} Bewerken</button>` : ''}
        ${isOwner ? `<button class="btn-danger" id="btn-del-org">${icon('trash', 16)} Verwijderen</button>` : ''}
      </div>
    </div>
    ${org.description ? `<p style="color:var(--ink2);margin-bottom:20px">${esc(org.description)}</p>` : ''}

    <div class="grid-2-1">
      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">${icon('project', 16)} Projecten</span> <span class="card-count">${projects.length}</span></div>
          <div class="card-body" style="padding:0">
            ${projects.length ? projects.map((p) => `
              <div class="task-list-item" data-nav="#/project/${p.id}">
                <span class="org-tile" style="font-size:15px">${esc(p.icon || '📋')}</span>
                <div style="flex:1">
                  <div class="t-title">${esc(p.name)}</div>
                  <div class="t-meta">${p.board_count} borden · ${p.task_count} taken</div>
                </div>
                <span class="dot" style="width:10px;height:10px;border-radius:50%;background:${esc(p.color)};display:inline-block;flex-shrink:0"></span>
              </div>`).join('') : '<div class="empty-state"><div class="big">📂</div>Nog geen projecten</div>'}
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-header"><span class="card-title">${icon('user', 16)} Leden</span> <span class="card-count">${members.length}</span></div>
          <div class="member-list">
            ${members.map((m) => `
              <div class="member-row" data-uid="${m.id}">
                ${avatarHTML(m, 30)}
                <div class="m-info">
                  <div class="m-name">${esc(m.fullName || m.username)} ${m.id === org.owner_id ? '👑' : ''}</div>
                  <div class="m-email">${esc(m.email)}</div>
                </div>
                ${isAdmin && m.role !== 'owner' ? `
                  <select class="role-select" data-uid="${m.id}">
                    ${['admin', 'member', 'viewer'].map((r) => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                  ${isAdmin ? `<button class="btn-ghost btn-sm" data-remove="${m.id}">✕</button>` : ''}`
                  : `<span class="role-pill" style="position:static">${esc(m.role)}</span>`}
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  $('#btn-proj-' + orgId)?.addEventListener('click', () => showProjectModal(orgId));
  $('#btn-invite')?.addEventListener('click', () => showInviteModal(orgId));
  $('#btn-edit-org')?.addEventListener('click', () => showEditOrgModal(org, orgId));
  $('#btn-del-org')?.addEventListener('click', async () => {
    if (!confirm(`Organisatie "${org.name}" echt verwijderen? Alle projecten gaan verloren.`)) return;
    await api(`/orgs/${orgId}`, { method: 'DELETE' });
    toast('Organisatie verwijderd');
    invalidateOverview();
    location.hash = '#/orgs';
  });
  $$('.role-select').forEach((sel) => sel.addEventListener('change', async () => {
    await api(`/orgs/${orgId}/members/${sel.dataset.uid}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
    toast('Rol bijgewerkt');
  }));
  $$('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Lid verwijderen?')) return;
    await api(`/orgs/${orgId}/members/${b.dataset.remove}`, { method: 'DELETE' });
    toast('Lid verwijderd');
    renderOrg(main, { id });
  }));
}

function showEditOrgModal(org, orgId) {
  openModal(`
    <div class="modal-header"><h2>Organisatie bewerken</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>Naam</label>
      <input id="eorg-name" value="${esc(org.name)}" />
      <label>Beschrijving</label>
      <textarea id="eorg-desc" rows="3">${esc(org.description || '')}</textarea>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="eorg-save">Opslaan</button>
      </div>
    </div>`);
  $('#eorg-save').addEventListener('click', async () => {
    await api(`/orgs/${orgId}`, { method: 'PATCH', body: JSON.stringify({ name: $('#eorg-name').value, description: $('#eorg-desc').value }) });
    toast('Opgeslagen');
    closeModal();
    invalidateOverview();
    router();
  });
}

function showInviteModal(orgId) {
  openModal(`
    <div class="modal-header"><h2>Lid uitnodigen</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>E-mailadres</label>
      <input id="inv-email" type="email" placeholder="collega@bedrijf.nl" />
      <label>Rol</label>
      <select id="inv-role">
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="viewer">viewer</option>
      </select>
      <p style="font-size:12px;color:var(--ink2);margin-top:8px">De genodigde krijgt een uitnodigingslink die hij/zij kan accepteren na inloggen.</p>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="inv-send">Uitnodigen</button>
      </div>
    </div>`);
  $('#inv-send').addEventListener('click', async () => {
    try {
      const email = $('#inv-email').value;
      if (!email) return toast('E-mail verplicht', 'error');
      const { invitation } = await api(`/orgs/${orgId}/invitations`, { method: 'POST', body: JSON.stringify({ email, role: $('#inv-role').value }) });
      const link = `${location.origin}#/accept/${invitation.token}`;
      toast('Uitnodiging aangemaakt');
      closeModal();
      openModal(`
        <div class="modal-header"><h2>Uitnodiging</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
          <p style="margin-bottom:12px">Stuur deze link naar <strong>${esc(email)}</strong>:</p>
          <input value="${esc(link)}" readonly onclick="this.select()" />
          <p style="font-size:12px;color:var(--ink2);margin-top:10px">Link is 7 dagen geldig. Deel deze via e-mail of chat.</p>
          <div class="modal-actions">
            <button class="btn-primary" onclick="navigator.clipboard.writeText('${esc(link)}');toast('Link gekopieerd')">📋 Kopiëren</button>
          </div>
        </div>`);
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ---------------- Projecten ---------------- */
async function renderProjects(main) {
  const { projects } = await api('/projects');
  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('project', 22)} Projecten <span class="sub">${projects.length}</span></div>
      <div class="page-actions"><button class="btn-primary" id="btn-proj-all">${icon('plus', 16)} Nieuw project</button></div>
    </div>
    <div class="project-grid">
      ${projects.map((p) => `
        <div class="project-card" data-nav="#/project/${p.id}" style="--pcolor:${esc(p.color || '#4f46e5')}">
          <div class="project-icon" style="background:color-mix(in srgb, ${esc(p.color || '#4f46e5')} 18%, transparent)">${esc(p.icon || '📋')}</div>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description || '')}</p>
          <div class="meta">
            <span>${icon('org', 13)} ${esc(p.org_name)}</span>
            <span>${icon('clipboard', 13)} ${p.task_count} taken</span>
          </div>
        </div>`).join('') || '<div class="empty-state"><div class="big">📂</div>Nog geen projecten</div>'}
    </div>`;
  $('#btn-proj-all')?.addEventListener('click', () => showProjectModal());
}

function showProjectModal(orgId) {
  const orgs = state.overview?.orgs || [];
  const hasOrgs = orgs.length > 0;
  openModal(`
    <div class="modal-header"><h2>Nieuw project</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      ${hasOrgs ? `
      <label>Organisatie *</label>
      <select id="proj-org">
        ${orgs.map((o) => `<option value="${o.id}" ${o.id === orgId ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}
      </select>
      <label>Naam *</label>
      <input id="proj-name" placeholder="Bijv. Website relaunch" />
      <label>Beschrijving</label>
      <textarea id="proj-desc" rows="3"></textarea>
      <label>Kleur</label>
      <input id="proj-color" type="color" value="#4f46e5" style="width:80px;height:36px;padding:2px" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="proj-create">Aanmaken</button>
      </div>`
      : `
      <div class="empty-state">
        <div class="big">🏢</div>
        <p>Je bent nog geen lid van een organisatie.<br>Maak eerst een organisatie aan.</p>
        <br>
        <button class="btn-primary" id="proj-org-create">＋ Organisatie aanmaken</button>
        <button class="btn-ghost" onclick="closeModal()">Sluiten</button>
      </div>`}
    </div>`);
  $('#proj-org-create')?.addEventListener('click', () => { closeModal(); showOrgModal(); });
  $('#proj-create')?.addEventListener('click', async () => {
    try {
      const orgIdSel = Number($('#proj-org').value);
      const name = $('#proj-name').value;
      if (!orgIdSel || !name) return toast('Organisatie en naam verplicht', 'error');
      const { project } = await api(`/projects?orgId=${orgIdSel}`, {
        method: 'POST',
        body: JSON.stringify({ name, description: $('#proj-desc').value, color: $('#proj-color').value })
      });
      toast(`Project "${project.name}" aangemaakt`);
      closeModal();
      invalidateOverview();
      location.hash = `#/project/${project.id}`;
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ---------------- Project detail ---------------- */
async function renderProject(main, { id }) {
  const projectId = Number(id);
  const data = await api(`/projects/${projectId}`);
  const { project, boards, members } = data;
  const isAdmin = data.myRole === 'admin' || data.myRole === 'owner' || data.myRole === 'member';
  const activity = await api(`/activity?orgId=${project.org_id}`).catch(() => ({ activity: [] }));
  const projActivity = (activity.activity || []).filter((a) => a.entity_name || a.action.startsWith('task'));

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('project', 22)} ${esc(project.name)} <span class="sub">${icon('org', 13)} ${esc(project.org_name)}</span></div>
      <div class="page-actions">
        <button class="btn-ghost" data-export="${projectId}">${icon('download', 16)} Export CSV</button>
        ${isAdmin ? `<button class="btn-primary" id="btn-board-new">${icon('plus', 16)} Nieuw bord</button>
        <button class="btn-ghost" id="btn-proj-edit">${icon('edit', 16)} Bewerken</button>
        <button class="btn-danger" id="btn-proj-del">${icon('trash', 16)} Verwijderen</button>` : ''}
      </div>
    </div>
    ${project.description ? `<p style="color:var(--ink2);margin-bottom:20px">${esc(project.description)}</p>` : ''}

    <div class="board-tabs" id="project-boards">
      ${boards.map((b) => `
        <button class="board-tab" data-nav="#/board/${b.id}">${icon('layers', 14)} ${esc(b.name)}</button>`).join('')}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${icon('user', 16)} Projectleden</span>
          ${isAdmin ? `<button class="btn-ghost btn-sm" id="btn-member-add">${icon('plus', 14)} Lid toevoegen</button>` : ''}
        </div>
        <div class="member-list">
          ${members.map((m) => `
            <div class="member-row">
              ${avatarHTML(m, 30)}
              <div class="m-info">
                <div class="m-name">${esc(m.fullName || m.username)}</div>
                <div class="m-email">${esc(m.email)}</div>
              </div>
              ${isAdmin ? `
                <select class="role-select" data-projrole="${m.id}">
                  ${['admin', 'member', 'viewer'].map((r) => `<option value="${r}" ${(m.project_role || 'member') === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
                <button class="btn-ghost btn-sm" data-projremove="${m.id}">${icon('trash', 13)}</button>`
                : `<span class="role-pill" style="position:static">${esc(m.project_role || 'member')}</span>`}
            </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('activity', 16)} Activiteit</span></div>
        <div class="activity-list" style="max-height:400px;overflow-y:auto">
          ${projActivity.slice(0, 30).map((a) => `
            <div class="activity-item">
              ${avatarHTML({ fullName: a.full_name, username: a.username, avatarColor: a.avatar_color }, 26)}
              <div class="a-text"><strong>${esc(a.full_name || a.username)}</strong> ${activityText(a)}</div>
              <div class="a-time">${timeAgo(a.created_at)}</div>
            </div>`).join('') || '<div class="empty-state">Nog geen activiteit</div>'}
        </div>
      </div>
    </div>`;

  $('[data-export]')?.addEventListener('click', () => {
    const exportId = $('[data-export]').dataset.export;
    window.open(`${API}/projects/${exportId}/export`, '_blank');
  });
  $('#btn-board-new')?.addEventListener('click', () => showBoardModal(projectId));
  $('#btn-proj-edit')?.addEventListener('click', () => showEditProjectModal(project, projectId));
  $('#btn-proj-del')?.addEventListener('click', async () => {
    if (!confirm(`Project "${project.name}" echt verwijderen?`)) return;
    await api(`/projects/${projectId}`, { method: 'DELETE' });
    toast('Project verwijderd');
    invalidateOverview();
    location.hash = `#/org/${project.org_id}`;
  });
  $('#btn-member-add')?.addEventListener('click', () => showMemberModal(projectId, members));
  $$('[data-projrole]').forEach((sel) => sel.addEventListener('change', async () => {
    try {
      await api(`/projects/${projectId}/members/${sel.dataset.projrole}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
      toast('Rol bijgewerkt');
    } catch (e) { toast(e.message, 'error'); }
  }));
  $$('[data-projremove]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Lid verwijderen uit dit project?')) return;
    await api(`/projects/${projectId}/members/${b.dataset.projremove}`, { method: 'DELETE' });
    toast('Lid verwijderd');
    router();
  }));
}

function showMemberModal(projectId, members) {
  openModal(`
    <div class="modal-header"><h2>Lid toevoegen</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--ink2);margin-bottom:4px">Kies een organisatielid om aan dit project toe te voegen.</p>
      <label>Lid</label>
      <select id="pm-user">
        ${members.filter((m) => !m.project_role).map((m) => `<option value="${m.id}">${esc(m.fullName || m.username)}</option>`).join('') || '<option value="">(geen leden beschikbaar)</option>'}
      </select>
      <label>Rol</label>
      <select id="pm-role">
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="viewer">viewer</option>
      </select>
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="pm-save">Toevoegen</button>
      </div>
    </div>`);
  $('#pm-save').addEventListener('click', async () => {
    try {
      const userId = Number($('#pm-user').value);
      if (!userId) return toast('Geen lid geselecteerd', 'error');
      await api(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId, role: $('#pm-role').value }) });
      toast('Lid toegevoegd');
      closeModal();
      router();
    } catch (e) { toast(e.message, 'error'); }
  });
}

function showBoardModal(projectId) {
  openModal(`
    <div class="modal-header"><h2>Nieuw bord</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>Naam</label>
      <input id="board-name" placeholder="Bijv. Sprint 5" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="board-create">Aanmaken</button>
      </div>
    </div>`);
  $('#board-create').addEventListener('click', async () => {
    try {
      const { board } = await api(`/projects/${projectId}/boards`, { method: 'POST', body: JSON.stringify({ name: $('#board-name').value }) });
      toast('Bord aangemaakt');
      closeModal();
      location.hash = `#/board/${board.id}`;
    } catch (e) { toast(e.message, 'error'); }
  });
}

function showEditProjectModal(project, projectId) {
  openModal(`
    <div class="modal-header"><h2>Project bewerken</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>Naam</label>
      <input id="ep-name" value="${esc(project.name)}" />
      <label>Beschrijving</label>
      <textarea id="ep-desc" rows="3">${esc(project.description || '')}</textarea>
      <label>Kleur</label>
      <input id="ep-color" type="color" value="${esc(project.color)}" style="width:80px;height:36px;padding:2px" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="ep-save">Opslaan</button>
      </div>
    </div>`);
  $('#ep-save').addEventListener('click', async () => {
    await api(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify({ name: $('#ep-name').value, description: $('#ep-desc').value, color: $('#ep-color').value }) });
    toast('Opgeslagen');
    closeModal();
    router();
  });
}

/* ---------------- Kanban board ---------------- */
async function renderBoard(main, { id }) {
  const boardId = Number(id);
  const data = await api(`/boards/${boardId}`);
  const { board, columns, tasks, members, myRole } = data;
  const canEdit = ['owner', 'admin', 'member'].includes(myRole) || state.user.role === 'admin';
  const canManage = myRole === 'admin' || myRole === 'owner' || state.user.role === 'admin';
  state.current.board = data;

  const tasksByCol = {};
  columns.forEach((c) => { tasksByCol[c.id] = tasks.filter((t) => t.column_id === c.id); });

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('layers', 22)} ${esc(board.name)} <span class="sub">${icon('project', 13)} ${esc(board.project_name)}</span></div>
      <div class="page-actions">
        ${canEdit ? `<button class="btn-primary" id="btn-task-new">${icon('plus', 16)} Nieuwe taak</button>` : ''}
        ${canManage ? `<button class="btn-ghost" id="btn-col-new">${icon('plus', 16)} Kolom</button>
        <button class="btn-ghost" id="btn-board-del">${icon('trash', 16)} Bord</button>` : ''}
      </div>
    </div>
    <div class="board-filters">
      <div class="filter-search">${icon('search', 15)}<input id="filter-q" type="search" placeholder="Filter taken…" autocomplete="off" /></div>
      <select id="filter-prio">
        <option value="">Prioriteit: alle</option>
        <option value="urgent">Urgent</option>
        <option value="high">Hoog</option>
        <option value="medium">Middel</option>
        <option value="low">Laag</option>
      </select>
      <select id="filter-assignee">
        <option value="">Toegewezen aan: iedereen</option>
        ${members.map((m) => `<option value="${m.id}">${esc(m.fullName || m.username)}</option>`).join('')}
      </select>
    </div>
    <div class="kanban" id="kanban">${columns.map((c) => `
      <div class="kanban-column" data-col="${c.id}" data-position="${c.position}" style="--col:${esc(c.color)}">
        <div class="kanban-column-header">
          <span class="col-dot" style="background:${esc(c.color)}"></span>
          ${esc(c.name)}
          <span class="count" data-count="${c.id}">${tasksByCol[c.id].length}</span>
          ${c.wip_limit ? `<span class="wip ${tasksByCol[c.id].length > c.wip_limit ? 'over' : ''}">WIP ${tasksByCol[c.id].length}/${c.wip_limit}</span>` : ''}
          ${canManage ? `<span class="col-actions">
            <button class="col-action" data-coledit="${c.id}" title="Bewerken">${icon('edit', 14)}</button>
            <button class="col-action" data-coldel="${c.id}" title="Verwijderen">${icon('trash', 14)}</button>
          </span>` : ''}
        </div>
        <div class="kanban-column-body" data-drop="${c.id}">
          ${tasksByCol[c.id].map((t) => taskCardHTML(t)).join('')}
        </div>
      </div>`).join('')}</div>`;

  // events
  $('#btn-task-new')?.addEventListener('click', () => showTaskModal(board, columns, members, null));
  $('#btn-col-new')?.addEventListener('click', () => showColumnModal(boardId));
  $('#btn-board-del')?.addEventListener('click', async () => {
    if (!confirm(`Bord "${board.name}" verwijderen? Alle taken gaan verloren.`)) return;
    await api(`/boards/${boardId}`, { method: 'DELETE' });
    toast('Bord verwijderd');
    location.hash = `#/project/${board.project_id}`;
  });
  $$('[data-coledit]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const col = columns.find((c) => c.id === Number(b.dataset.coledit));
    showColumnModal(boardId, col);
  }));
  $$('[data-coldel]').forEach((b) => b.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Kolom verwijderen? Taken in deze kolom gaan verloren.')) return;
    await api(`/columns/${b.dataset.coldel}`, { method: 'DELETE' });
    toast('Kolom verwijderd');
    renderBoard(main, { id });
  }));

  // task click + drag & drop
  $$('.kanban-card').forEach((card) => {
    card.addEventListener('click', () => { location.hash = `#/task/${card.dataset.id}`; });
    card.setAttribute('draggable', canEdit ? 'true' : 'false');
    card.addEventListener('dragstart', (e) => {
      if (e.dataTransfer) e.dataTransfer.setData('text/plain', card.dataset.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  if (canEdit) {
    $$('[data-drop]').forEach((drop) => {
      drop.addEventListener('dragover', (e) => {
        e.preventDefault();
        drop.closest('.kanban-column').classList.add('dragover');
      });
      drop.addEventListener('dragleave', () => drop.closest('.kanban-column').classList.remove('dragover'));
      drop.addEventListener('drop', async (e) => {
        e.preventDefault();
        drop.closest('.kanban-column').classList.remove('dragover');
        const taskId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
        if (!taskId) return;
        const columnId = Number(drop.dataset.drop);
        await moveTask(taskId, columnId);
      });
    });
  }

  // bordfilters
  const applyFilters = () => {
    const q = ($('#filter-q').value || '').toLowerCase();
    const prio = $('#filter-prio').value;
    const assignee = $('#filter-assignee').value;
    $$('.kanban-card').forEach((card) => {
      const t = tasks.find((x) => x.id === Number(card.dataset.id));
      let show = true;
      if (prio && t.priority !== prio) show = false;
      if (assignee && (t.assignee_id || '') !== assignee) show = false;
      if (q) {
        const hay = `${t.title} ${t.description || ''} ${(t.tags || []).map((x) => x.name).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) show = false;
      }
      card.style.display = show ? '' : 'none';
    });
  };
  $('#filter-q')?.addEventListener('input', applyFilters);
  $('#filter-prio')?.addEventListener('change', applyFilters);
  $('#filter-assignee')?.addEventListener('change', applyFilters);
}

function taskCardHTML(t) {
  const overdue = t.due_date && new Date(t.due_date) < new Date();
  return `
    <div class="kanban-card" data-id="${t.id}" draggable="true" style="border-left-color:${esc(t.column_color || 'transparent')}">
      <div class="k-title">${esc(t.title)}</div>
      ${t.description ? `<div class="k-desc">${esc(t.description)}</div>` : ''}
      <div class="k-meta">
        ${priorityChip(t.priority)}
        ${t.tags?.length ? `<span class="k-tags">${t.tags.map((tg) => `<span class="tag-chip">${esc(tg.name)}</span>`).join('')}</span>` : ''}
        ${t.due_date ? `<span class="k-due ${overdue ? 'overdue' : ''}">${icon('clock', 12)} ${fmtDate(t.due_date)}</span>` : ''}
        ${t.assignee_id ? `<span class="k-assignee">${avatarHTML({ fullName: t.assignee_name, username: t.assignee_username, avatarColor: t.assignee_color }, 24)}</span>` : ''}
      </div>
    </div>`;
}

async function moveTask(taskId, columnId) {
  try {
    await api(`/tasks/${taskId}/move`, { method: 'POST', body: JSON.stringify({ columnId }) });
    toast('Taak verplaatst');
    router();
  } catch (e) { toast(e.message, 'error'); }
}

function showColumnModal(boardId, column) {
  openModal(`
    <div class="modal-header"><h2>${column ? 'Kolom bewerken' : 'Nieuwe kolom'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>Naam *</label>
      <input id="col-name" value="${column ? esc(column.name) : ''}" placeholder="Bijv. In review" />
      <label>Kleur</label>
      <input id="col-color" type="color" value="${column ? esc(column.color) : '#e2e8f0'}" style="width:80px;height:36px;padding:2px" />
      <label>WIP-limiet (optioneel)</label>
      <input id="col-wip" type="number" min="0" placeholder="Bijv. 5" value="${column?.wip_limit ?? ''}" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        <button class="btn-primary" id="col-save">Opslaan</button>
      </div>
    </div>`);
  $('#col-save').addEventListener('click', async () => {
    try {
      if (column) {
        await api(`/columns/${column.id}`, { method: 'PATCH', body: JSON.stringify({ name: $('#col-name').value, color: $('#col-color').value, wipLimit: $('#col-wip').value }) });
      } else {
        await api(`/boards/${boardId}/columns`, { method: 'POST', body: JSON.stringify({ name: $('#col-name').value, color: $('#col-color').value }) });
      }
      toast('Opgeslagen');
      closeModal();
      router();
    } catch (e) { toast(e.message, 'error'); }
  });
}

function showTaskModal(board, columns, members, task) {
  const taskId = task?.id;
  openModal(`
    <div class="modal-header"><h2>${task ? 'Taak bewerken' : 'Nieuwe taak'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <label>Titel *</label>
      <input id="t-title" value="${task ? esc(task.title) : ''}" maxlength="255" placeholder="Wat moet er gebeuren?" />
      <label>Beschrijving</label>
      <textarea id="t-desc" rows="4">${task ? esc(task.description || '') : ''}</textarea>
      <div class="row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label>Prioriteit</label>
          <select id="t-prio">
            ${['low', 'medium', 'high', 'urgent'].map((p) => `<option value="${p}" ${(task?.priority || 'medium') === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div><label>Deadline</label><input id="t-due" type="date" value="${task?.due_date || ''}" /></div>
      </div>
      <div class="row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label>Kolom</label>
          <select id="t-col">
            ${columns.map((c) => `<option value="${c.id}" ${task?.column_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
        <div><label>Toegewezen aan</label>
          <select id="t-assignee">
            <option value="">— niemand —</option>
            ${members.map((m) => `<option value="${m.id}" ${task?.assignee_id === m.id ? 'selected' : ''}>${esc(m.fullName || m.username)}</option>`).join('')}
          </select>
        </div>
      </div>
      <label>Tags (komma gescheiden, max 5)</label>
      <input id="t-tags" value="${(task?.tags || []).map((t) => t.name).join(', ')}" placeholder="bug, ui, backend" />
      <div class="modal-actions">
        <button class="btn-ghost" onclick="closeModal()">Annuleer</button>
        ${task ? `<button class="btn-danger" id="t-delete">${icon('trash', 16)} Verwijderen</button>` : ''}
        <button class="btn-primary" id="t-save">${task ? `${icon('check', 16)} Opslaan` : `${icon('plus', 16)} Aanmaken`}</button>
      </div>
    </div>`);

  $('#t-save').addEventListener('click', async () => {
    try {
      const body = {
        title: $('#t-title').value,
        description: $('#t-desc').value,
        priority: $('#t-prio').value,
        dueDate: $('#t-due').value || null,
        assigneeId: $('#t-assignee').value ? Number($('#t-assignee').value) : null,
        tags: $('#t-tags').value.split(',').map((s) => s.trim()).filter(Boolean)
      };
      if (!body.title) return toast('Titel is verplicht', 'error');
      if (task) {
        await api(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast('Taak opgeslagen');
      } else {
        await api(`/boards/${board.id}/tasks`, { method: 'POST', body: JSON.stringify({ ...body, columnId: Number($('#t-col').value) }) });
        toast('Taak aangemaakt');
      }
      closeModal();
      router();
    } catch (e) { toast(e.message, 'error'); }
  });

  $('#t-delete')?.addEventListener('click', async () => {
    if (!confirm('Taak echt verwijderen?')) return;
    await api(`/tasks/${taskId}`, { method: 'DELETE' });
    toast('Taak verwijderd');
    closeModal();
    router();
  });
}

/* ---------------- Task detail ---------------- */
async function renderTask(main, { id }) {
  const taskId = Number(id);
  const data = await api(`/tasks/${taskId}`);
  const { task, checklists, checklistItems, comments, board, columns, members, myRole } = data;
  const canEdit = ['owner', 'admin', 'member'].includes(myRole) || state.user.role === 'admin';
  const itemsByCl = {};
  (checklistItems || []).forEach((i) => { (itemsByCl[i.checklist_id] = itemsByCl[i.checklist_id] || []).push(i); });
  const allDone = (cl) => (itemsByCl[cl.id] || []).length > 0 && (itemsByCl[cl.id] || []).every((i) => i.is_done);

  main.innerHTML = `
    <div class="page-header">
      <div class="page-title">${icon('clipboard', 22)} Taak #${task.id} <span class="sub">📂 ${esc(board.projectName)} · ${esc(board.name)}</span></div>
      <div class="page-actions">
        <button class="btn-ghost" data-nav="#/board/${board.id}">${icon('arrowBack', 16)} Terug naar bord</button>
        ${canEdit ? `<button class="btn-primary" id="task-edit">${icon('edit', 16)} Bewerken</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-body task-detail">
        <div class="td-title">${esc(task.title)}</div>
        <div class="td-row td-row-tags">${priorityChip(task.priority)}
          ${task.tags?.map((t) => `<span class="tag-chip">${esc(t.name)}</span>`).join('') || ''}
        </div>
        <div class="td-fields">
          <span class="td-field"><span class="td-label">Kolom</span><span class="column-badge" style="--col:${esc(task.column_color || '#e2e8f0')}">${esc(task.column_name)}</span></span>
          <span class="td-field"><span class="td-label">Deadline</span><span>${task.due_date ? fmtDate(task.due_date) : '—'}</span></span>
          <span class="td-field"><span class="td-label">Toegewezen</span><span>${task.assignee_id ? avatarHTML({ fullName: task.assignee_name, username: task.assignee_username, avatarColor: task.assignee_color }, 24) + ' ' + esc(task.assignee_name || task.assignee_username) : '—'}</span></span>
        </div>
        ${task.description ? `<div style="margin:14px 0 4px"><span class="td-label">Beschrijving</span></div><div class="td-desc">${esc(task.description)}</div>` : ''}
        <div style="margin-top:16px;font-size:12px;color:var(--ink3)">
          Aangemaakt door #${task.created_by} op ${fmtDate(task.created_at)}${task.updated_at ? ` · gewijzigd ${timeAgo(task.updated_at)}` : ''}
        </div>
      </div>
    </div>

    ${(checklists || []).length ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('check', 16)} Checklists</span> <span class="card-count">${checklists.filter(allDone).length}/${checklists.length} klaar</span></div>
      <div class="card-body">
        ${checklists.map((cl) => {
          const its = itemsByCl[cl.id] || [];
          const done = its.filter((i) => i.is_done).length;
          return `
          <div class="checklist-block" data-cl="${cl.id}">
            <div class="checklist-title">
              <strong>${esc(cl.title)}</strong>
              <span style="font-size:12px;color:var(--ink2)">${done}/${its.length}</span>
              ${canEdit ? `<button class="btn-ghost btn-sm" data-cldel="${cl.id}" style="margin-left:auto">${icon('trash', 13)}</button>` : ''}
            </div>
            <div class="checklist-items">
              ${its.map((i) => `
                <label class="checklist-item ${i.is_done ? 'done' : ''}">
                  ${canEdit
                    ? `<input type="checkbox" data-item="${i.id}" ${i.is_done ? 'checked' : ''} />`
                    : `<span class="checkbox-static">${i.is_done ? '☑' : '☐'}</span>`}
                  <span class="ci-title">${esc(i.title)}</span>
                  ${canEdit ? `<button class="btn-ghost btn-sm" data-itemdel="${i.id}" style="margin-left:auto;padding:2px 6px">${icon('trash', 13)}</button>` : ''}
                </label>`).join('')}
            </div>
            ${canEdit ? `
            <div class="checklist-add">
              <input data-cladd="${cl.id}" placeholder="Nieuw item…" />
              <button class="btn-primary btn-sm" data-claddbtn="${cl.id}">${icon('plus', 14)}</button>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    ${canEdit ? `
    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('list', 16)} Checklist toevoegen</span></div>
      <div class="card-body">
        <div class="checklist-add">
          <input id="cl-new-name" placeholder="Bijv. Stappenplan" />
          <button class="btn-primary" id="cl-new-btn">${icon('plus', 16)} Toevoegen</button>
        </div>
      </div>
    </div>` : ''}

    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title">${icon('comment', 16)} Reacties</span> <span class="card-count">${comments.length}</span></div>
      <div class="card-body">
        <div class="comment-list" id="comment-list">
          ${comments.map((c) => `
            <div class="comment" data-cid="${c.id}">
              ${avatarHTML({ fullName: c.full_name, username: c.username, avatarColor: c.avatar_color }, 28)}
              <div class="c-body">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span class="c-author">${esc(c.full_name || c.username)}</span>
                  <span style="display:flex;gap:8px;align-items:center">
                    <span class="c-time">${timeAgo(c.created_at)}</span>
                    ${(c.user_id === state.user.id || myRole === 'admin') ? `<button class="c-delete" data-del="${c.id}" title="Verwijderen">${icon('trash', 13)}</button>` : ''}
                  </span>
                </div>
                <div class="c-text">${esc(c.body)}</div>
              </div>
            </div>`).join('') || '<div style="color:var(--ink3);font-size:14px">Nog geen reacties</div>'}
        </div>
        <div style="margin-top:16px">
          <label>Reactie toevoegen</label>
          <textarea id="comment-body" rows="2" placeholder="Typ een reactie…"></textarea>
          <div style="margin-top:8px;display:flex;justify-content:flex-end">
            <button class="btn-primary" id="comment-send">Verstuur</button>
          </div>
        </div>
      </div>
    </div>`;

  $('#task-edit')?.addEventListener('click', async () => {
    const boardData = await api(`/boards/${board.id}`);
    showTaskModal(boardData.board, boardData.columns, boardData.members, { ...task, tags: task.tags });
  });
  $('#comment-send').addEventListener('click', async () => {
    const body = $('#comment-body').value.trim();
    if (!body) return toast('Reactie mag niet leeg zijn', 'error');
    await api(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
    $('#comment-body').value = '';
    toast('Reactie geplaatst');
    renderTask(main, { id });
  });
  $$('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Reactie verwijderen?')) return;
    await api(`/comments/${b.dataset.del}`, { method: 'DELETE' });
    toast('Reactie verwijderd');
    renderTask(main, { id });
  }));

  // Checklist-handlers
  $('#cl-new-btn')?.addEventListener('click', async () => {
    const title = $('#cl-new-name').value.trim();
    if (!title) return toast('Naam is verplicht', 'error');
    await api(`/tasks/${taskId}/checklists`, { method: 'POST', body: JSON.stringify({ title }) });
    toast('Checklist aangemaakt');
    renderTask(main, { id });
  });
  $$('[data-claddbtn]').forEach((b) => b.addEventListener('click', async () => {
    const clId = Number(b.dataset.claddbtn);
    const input = $(`[data-cladd="${clId}"]`);
    const title = input.value.trim();
    if (!title) return toast('Titel is verplicht', 'error');
    await api(`/tasks/${taskId}/checklists/${clId}/items`, { method: 'POST', body: JSON.stringify({ title }) });
    input.value = '';
    renderTask(main, { id });
  }));
  $$('[data-item]').forEach((c) => c.addEventListener('change', async () => {
    await api(`/tasks/${taskId}/items/${c.dataset.item}`, { method: 'PATCH', body: JSON.stringify({ isDone: c.checked }) });
    renderTask(main, { id });
  }));
  $$('[data-itemdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Item verwijderen?')) return;
    await api(`/tasks/${taskId}/items/${b.dataset.itemdel}`, { method: 'DELETE' });
    renderTask(main, { id });
  }));
  $$('[data-cldel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Checklist verwijderen?')) return;
    await api(`/tasks/${taskId}/checklists/${b.dataset.cldel}`, { method: 'DELETE' });
    renderTask(main, { id });
  }));
}

/* ---------------- Settings ---------------- */
async function renderSettings(main) {
  const u = state.user;
  main.innerHTML = `
    <div class="page-header"><div class="page-title">${icon('settings', 22)} Instellingen</div></div>
    <div class="card" style="max-width:520px">
      <div class="card-header"><span class="card-title">${icon('user', 16)} Profiel</span></div>
      <div class="card-body">
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px">
          ${avatarHTML(u, 52)}
          <div>
            <div style="font-weight:700;font-size:16px">${esc(u.fullName || u.username)}</div>
            <div style="color:var(--ink2);font-size:13px">${esc(u.email)}</div>
          </div>
        </div>
        <label>Volledige naam</label>
        <input id="s-name" value="${esc(u.fullName || '')}" />
        <label>Avatar-kleur</label>
        <input id="s-color" type="color" value="${esc(u.avatarColor || '#4f46e5')}" style="width:80px;height:36px;padding:2px" />
        <label>Wachtwoord wijzigen</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <input id="s-cur" type="password" placeholder="Huidig wachtwoord" autocomplete="current-password" />
          <input id="s-new" type="password" placeholder="Nieuw wachtwoord (min 8)" autocomplete="new-password" />
        </div>
        <div class="modal-actions">
          <button class="btn-primary" id="s-save">${icon('check', 16)} Opslaan</button>
        </div>
      </div>
    </div>`;
  $('#s-save').addEventListener('click', async () => {
    try {
      const body = { fullName: $('#s-name').value, avatarColor: $('#s-color').value };
      if ($('#s-new').value) {
        if (!$('#s-cur').value) return toast('Vul huidig wachtwoord in', 'error');
        body.currentPassword = $('#s-cur').value;
        body.password = $('#s-new').value;
      }
      const { user } = await api('/users/me', { method: 'PATCH', body: JSON.stringify(body) });
      setSession(state.token, user);
      localStorage.setItem('mb_user', JSON.stringify(user));
      invalidateOverview();
      renderTopbar();
      toast('Profiel opgeslagen');
      router();
    } catch (e) { toast(e.message, 'error'); }
  });
}

/* ---------------- Admin ---------------- */
async function renderAdmin(main) {
  if (state.user.role !== 'admin') {
    main.innerHTML = '<div class="empty-state"><div class="big">🔒</div>Geen toegang</div>';
    return;
  }
  const [stats, users, orgs] = await Promise.all([api('/admin/stats'), api('/admin/users'), api('/admin/orgs')]);
  main.innerHTML = `
    <div class="page-header"><div class="page-title">${icon('shield', 22)} Beheerpaneel</div></div>
    <div class="stat-grid">
      <div class="stat-card"><span class="stat-icon stat-icon-purple">${icon('user', 20)}</span><div class="stat-value">${stats.totals.users}</div><div class="stat-label">Gebruikers</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-blue">${icon('org', 20)}</span><div class="stat-value">${stats.totals.orgs}</div><div class="stat-label">Organisaties</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-green">${icon('project', 20)}</span><div class="stat-value">${stats.totals.projects}</div><div class="stat-label">Projecten</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-amber">${icon('clipboard', 20)}</span><div class="stat-value">${stats.totals.tasks}</div><div class="stat-label">Taken</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-blue">${icon('comment', 20)}</span><div class="stat-value">${stats.totals.comments}</div><div class="stat-label">Reacties</div></div>
      <div class="stat-card"><span class="stat-icon stat-icon-green">${icon('activity', 20)}</span><div class="stat-value">${stats.newUsers7d}</div><div class="stat-label">Nieuwe gebruikers (7d)</div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title">${icon('user', 16)} Gebruikers</span></div>
      <div class="card-body" style="padding:0;overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>Gebruiker</th><th>E-mail</th><th>Rol</th><th>Status</th><th>Org.</th><th>Taken</th><th>Aangemaakt</th><th></th></tr></thead>
          <tbody>
            ${users.users.map((u) => `
              <tr data-uid="${u.id}">
                <td>${avatarHTML(u, 26)} ${esc(u.full_name || u.username)}</td>
                <td style="color:var(--ink2)">${esc(u.email)}</td>
                <td>
                  <select class="role-select" data-role="${u.id}">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>user</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
                  </select>
                </td>
                <td><span class="status-pill status-${esc(u.status)}">${esc(u.status)}</span></td>
                <td>${u.org_count}</td>
                <td>${u.task_count}</td>
                <td style="color:var(--ink2)">${fmtDate(u.created_at)}</td>
                <td>
                  ${u.id !== state.user.id ? `<button class="btn-ghost btn-sm" data-status="${u.id}">${u.status === 'active' ? 'Uitschakelen' : 'Activeren'}</button>` : '<span style="color:var(--ink3)">jij</span>'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">${icon('org', 16)} Top organisaties</span></div>
      <div class="card-body" style="padding:0">
        <table class="admin-table">
          <thead><tr><th>Organisatie</th><th>Leden</th><th>Projecten</th><th>Taken</th></tr></thead>
          <tbody>
            ${stats.topOrgs.map((o) => `
              <tr><td style="font-weight:600">${esc(o.name)}</td><td>${o.members}</td><td>${o.projects}</td><td>${o.tasks}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  $$('[data-role]').forEach((sel) => sel.addEventListener('change', async () => {
    await api(`/users/${sel.dataset.role}`, { method: 'PATCH', body: JSON.stringify({ role: sel.value }) });
    toast('Rol bijgewerkt');
  }));
  $$('[data-status]').forEach((b) => b.addEventListener('click', async () => {
    const uid = b.dataset.status;
    const target = users.users.find((u) => u.id === Number(uid));
    const newStatus = target.status === 'active' ? 'disabled' : 'active';
    await api(`/users/${uid}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    toast(`Gebruiker ${newStatus === 'disabled' ? 'uitgeschakeld' : 'geactiveerd'}`);
    renderAdmin(main);
  }));
}

/* ---------------- Invitation accept ---------------- */
async function renderAccept(main, { id }) {
  const token = id;
  main.innerHTML = `<div class="empty-state"><div class="big">✉️</div>Uitnodiging accepteren…</div>`;
  try {
    const r = await api(`/invitations/${token}/accept`, { method: 'POST' });
    toast(`Welkom bij ${r.orgName}!`);
    invalidateOverview();
    await loadOverview();
    location.hash = `#/org/${r.orgId}`;
  } catch (e) {
    main.innerHTML = `<div class="empty-state"><div class="big">⚠️</div>${esc(e.message)}<br><br><a href="#/dashboard" class="btn-primary" style="text-decoration:none;display:inline-block">Naar dashboard</a></div>`;
  }
}

/* ---------------- Events & init ---------------- */
function init() {
  // auth tabs
  $$('.auth-tab').forEach((b) => b.addEventListener('click', () => renderAuthTab(b.dataset.tab)));
  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#li-error').textContent = '';
    try {
      const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#li-email').value, password: $('#li-password').value }) });
      setSession(d.token, d.user);
      showApp();
      router();
    } catch (err) { $('#li-error').textContent = err.message; }
  });
  $('#form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#rg-error').textContent = '';
    try {
      const d = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: $('#rg-email').value,
          username: $('#rg-username').value,
          fullName: $('#rg-fullname').value || undefined,
          password: $('#rg-password').value
        })
      });
      setSession(d.token, d.user);
      showApp();
      router();
    } catch (err) { $('#rg-error').textContent = err.message; }
  });

  // sidebar / topbar (event-delegatie: werkt ook voor later ingeladen items)
  setTheme(state.theme);
  $('#btn-sidebar').addEventListener('click', () => toggleSidebar());
  $('#btn-theme').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  // Globale navigatie-delegatie: dekt sidebar, main-content en de user-dropdown
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      location.hash = nav.dataset.nav;
      $('#user-dropdown').classList.add('hidden');
      $('#notif-panel').classList.add('hidden');
    }
  });
  $('#btn-user').addEventListener('click', (e) => { e.stopPropagation(); $('#user-dropdown').classList.toggle('hidden'); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) $('#user-dropdown').classList.add('hidden');
    if (!e.target.closest('.topbar-right')) $('#notif-panel').classList.add('hidden');
  });
  $('#btn-notifications').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#notif-panel').classList.toggle('hidden');
    loadNotifications();
  });
  $('#btn-read-all').addEventListener('click', async () => {
    await api('/notifications/read-all', { method: 'POST' });
    loadNotifications();
  });
  $('#btn-new-org').addEventListener('click', () => showOrgModal());

  // search
  let searchTimer;
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value.trim();
    if (q.length < 2) { $('#search-results').classList.add('hidden'); return; }
    searchTimer = setTimeout(async () => {
      try {
        const d = await api(`/search?q=${encodeURIComponent(q)}`);
        renderSearchResults(d, q);
      } catch (err) { /* negeer */ }
    }, 250);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) $('#search-results').classList.add('hidden');
  });

  window.addEventListener('hashchange', router);

  if (state.token) {
    showApp();
    router();
  } else {
    showAuth();
  }
}

function renderSearchResults(d, q) {
  const box = $('#search-results');
  const taskItems = d.tasks.map((t) => `
    <button class="search-item" data-nav="#/task/${t.id}">
      <span class="s-ic">${icon('clipboard', 16)}</span>
      <span><span>${esc(t.title)}</span><div class="sub">${esc(t.project_name)} · ${esc(t.column_name)}</div></span>
    </button>`).join('');
  const projItems = d.projects.map((p) => `
    <button class="search-item" data-nav="#/project/${p.id}">
      <span class="s-ic">${icon('project', 16)}</span>
      <span><span>${esc(p.name)}</span><div class="sub">${esc(p.org_name)}</div></span>
    </button>`).join('');

  box.innerHTML = `
    ${taskItems ? `<div class="search-group-title">Taken</div>${taskItems}` : ''}
    ${projItems ? `<div class="search-group-title">Projecten</div>${projItems}` : ''}
    ${!taskItems && !projItems ? `<div class="search-item" style="color:var(--ink3)">Geen resultaten voor "${esc(q)}"</div>` : ''}`;
  box.classList.remove('hidden');
  $$('#search-results [data-nav]').forEach((b) => b.addEventListener('click', () => {
    location.hash = b.dataset.nav;
    box.classList.add('hidden');
    $('#search-input').value = '';
  }));
}

// expose for inline onclick handlers in modals
window.closeModal = closeModal;
window.toast = toast;

document.addEventListener('DOMContentLoaded', init);