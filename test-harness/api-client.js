// =============================================================================
// Stateful API Client — Reusable HTTP client for test harness
// =============================================================================

class ApiClient {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.user = null;
    this.history = [];
  }

  setToken(token) {
    this.token = token;
  }

  async request(method, path, body = null) {
    const url = `${this.baseUrl}${path}`;
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (this.token) opts.headers['Authorization'] = `Bearer ${this.token}`;
    if (body) opts.body = JSON.stringify(body);

    const start = Date.now();
    const res = await fetch(url, opts);
    const duration = Date.now() - start;
    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    const record = {
      method,
      path,
      body,
      status: res.status,
      response: data,
      duration,
      timestamp: new Date().toISOString()
    };
    this.history.push(record);

    return {
      ok: res.ok,
      status: res.status,
      data,
      duration,
      expectStatus(code) {
        if (res.status !== code) {
          throw new Error(`Expected status ${code}, got ${res.status}: ${JSON.stringify(data)}`);
        }
        return this;
      },
      expectJson(predicate) {
        if (!predicate(data)) {
          throw new Error(`JSON assertion failed: ${JSON.stringify(data)}`);
        }
        return this;
      }
    };
  }

  // Auth helpers
  async register(userData) {
    const res = await this.request('POST', '/auth/register', userData);
    if (res.ok) {
      this.token = res.data.token;
      this.user = res.data.user;
    }
    return res;
  }

  async login(username, password) {
    const res = await this.request('POST', '/auth/login', { username, password });
    if (res.ok) {
      this.token = res.data.token;
      this.user = res.data.user;
    }
    return res;
  }

  // CRUD shortcuts
  async getUsers() { return this.request('GET', '/users'); }
  async getUser(id) { return this.request('GET', `/users/${id}`); }
  async createTeam(data) { return this.request('POST', '/teams', data); }
  async getTeams() { return this.request('GET', '/teams'); }
  async getTeam(id) { return this.request('GET', `/teams/${id}`); }
  async addMember(teamId, userId) { return this.request('POST', `/teams/${teamId}/members`, { userId }); }
  async removeMember(teamId, userId) { return this.request('DELETE', `/teams/${teamId}/members/${userId}`); }
  async createProject(data) { return this.request('POST', '/projects', data); }
  async getProjects() { return this.request('GET', '/projects'); }
  async getProject(id) { return this.request('GET', `/projects/${id}`); }
  async deleteProject(id) { return this.request('DELETE', `/projects/${id}`); }
  async createIssue(projectId, data) { return this.request('POST', `/projects/${projectId}/issues`, data); }
  async getIssues(projectId) { return this.request('GET', `/projects/${projectId}/issues`); }
  async getIssue(id) { return this.request('GET', `/issues/${id}`); }
  async transitionIssue(id, status) { return this.request('PATCH', `/issues/${id}/transition`, { status }); }
  async deleteIssue(id) { return this.request('DELETE', `/issues/${id}`); }
  async addComment(issueId, body) { return this.request('POST', `/issues/${issueId}/comments`, { body }); }
  async getComments(issueId) { return this.request('GET', `/issues/${issueId}/comments`); }
  async deleteComment(id) { return this.request('DELETE', `/comments/${id}`); }
  async health() { return this.request('GET', '/health'); }
  async reset() { return this.request('POST', '/reset'); }

  getHistory() { return this.history; }
  clearHistory() { this.history = []; }
}

module.exports = ApiClient;
