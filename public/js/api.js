// =============================================================================
// Frontend API Client — Handles all HTTP requests to the Jira-Lite API
// =============================================================================

const API = (() => {
  const BASE = '/api';
  let token = localStorage.getItem('jira-lite-token');

  function setToken(t) {
    token = t;
    if (t) localStorage.setItem('jira-lite-token', t);
    else localStorage.removeItem('jira-lite-token');
  }

  function getToken() {
    return token;
  }

  function getUser() {
    const raw = localStorage.getItem('jira-lite-user');
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(u) {
    if (u) localStorage.setItem('jira-lite-user', JSON.stringify(u));
    else localStorage.removeItem('jira-lite-user');
  }

  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    setToken,
    getToken,
    getUser,
    setUser,

    // Auth
    login: (username, password) => request('POST', '/auth/login', { username, password }),
    register: (data) => request('POST', '/auth/register', data),

    // Users
    getUsers: () => request('GET', '/users'),
    getUser: (id) => request('GET', `/users/${id}`),

    // Teams
    getTeams: () => request('GET', '/teams'),
    getTeam: (id) => request('GET', `/teams/${id}`),
    createTeam: (data) => request('POST', '/teams', data),
    updateTeam: (id, data) => request('PUT', `/teams/${id}`, data),
    addMember: (teamId, userId) => request('POST', `/teams/${teamId}/members`, { userId }),
    removeMember: (teamId, userId) => request('DELETE', `/teams/${teamId}/members/${userId}`),

    // Projects
    getProjects: () => request('GET', '/projects'),
    getProject: (id) => request('GET', `/projects/${id}`),
    createProject: (data) => request('POST', '/projects', data),
    updateProject: (id, data) => request('PUT', `/projects/${id}`, data),
    deleteProject: (id) => request('DELETE', `/projects/${id}`),

    // Issues
    getIssues: (projectId, filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return request('GET', `/projects/${projectId}/issues${params ? '?' + params : ''}`);
    },
    getIssue: (id) => request('GET', `/issues/${id}`),
    createIssue: (projectId, data) => request('POST', `/projects/${projectId}/issues`, data),
    updateIssue: (id, data) => request('PUT', `/issues/${id}`, data),
    transitionIssue: (id, status) => request('PATCH', `/issues/${id}/transition`, { status }),
    deleteIssue: (id) => request('DELETE', `/issues/${id}`),

    // Comments
    getComments: (issueId) => request('GET', `/issues/${issueId}/comments`),
    addComment: (issueId, body) => request('POST', `/issues/${issueId}/comments`, { body }),
    deleteComment: (id) => request('DELETE', `/comments/${id}`),

    // Health & Reset
    health: () => request('GET', '/health'),
    reset: () => request('POST', '/reset'),

    // AI
    generateAIReport: (testResults) => request('POST', '/generate-report', { testResults })
  };
})();
