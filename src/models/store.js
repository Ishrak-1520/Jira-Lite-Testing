// =============================================================================
// In-Memory Data Store
// All data lives here — restarting the server wipes everything.
// =============================================================================

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class Store {
  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.projects = new Map();
    this.issues = new Map();
    this.comments = new Map();
    this.issueCounters = new Map(); // projectId -> next issue number

    // Seed an admin user
    this._seedAdmin();
  }

  _seedAdmin() {
    const id = uuidv4();
    const salt = bcrypt.genSaltSync(10);
    this.users.set(id, {
      id,
      username: 'admin',
      password: bcrypt.hashSync('admin123', salt),
      email: 'admin@jiralite.com',
      displayName: 'Admin User',
      role: 'admin',
      teamId: null,
      createdAt: new Date().toISOString()
    });
  }

  // ── Generic helpers ──────────────────────────────────────────────────────
  getAll(collection) {
    return Array.from(this[collection].values());
  }

  getById(collection, id) {
    return this[collection].get(id) || null;
  }

  create(collection, data) {
    const id = data.id || uuidv4();
    const record = { ...data, id, createdAt: new Date().toISOString() };
    this[collection].set(id, record);
    return record;
  }

  update(collection, id, data) {
    const existing = this[collection].get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this[collection].set(id, updated);
    return updated;
  }

  delete(collection, id) {
    return this[collection].delete(id);
  }

  findBy(collection, predicate) {
    return this.getAll(collection).filter(predicate);
  }

  findOneBy(collection, predicate) {
    return this.getAll(collection).find(predicate) || null;
  }

  // ── Issue-specific helpers ───────────────────────────────────────────────
  getNextIssueKey(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return null;
    const count = (this.issueCounters.get(projectId) || 0) + 1;
    this.issueCounters.set(projectId, count);
    return `${project.key}-${count}`;
  }

  getIssuesByProject(projectId) {
    return this.findBy('issues', (i) => i.projectId === projectId);
  }

  getCommentsByIssue(issueId) {
    return this.findBy('comments', (c) => c.issueId === issueId);
  }

  // ── Reset (for testing) ──────────────────────────────────────────────────
  reset() {
    this.users.clear();
    this.teams.clear();
    this.projects.clear();
    this.issues.clear();
    this.comments.clear();
    this.issueCounters.clear();
    this._seedAdmin();
  }
}

// Singleton instance
module.exports = new Store();
