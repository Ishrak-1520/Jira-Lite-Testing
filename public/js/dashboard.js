// =============================================================================
// Dashboard Module — Project overview, stats, project CRUD
// =============================================================================

const Dashboard = (() => {
  async function load() {
    try {
      const [projectsData, healthData] = await Promise.all([
        API.getProjects(),
        API.health()
      ]);

      // Update stats
      document.getElementById('stat-projects').textContent = healthData.counts.projects;
      document.getElementById('stat-issues').textContent = healthData.counts.issues;
      document.getElementById('stat-members').textContent = healthData.counts.users;

      // Count resolved issues across all projects
      let resolvedCount = 0;
      for (const p of projectsData.projects) {
        try {
          const issues = await API.getIssues(p.id, { status: 'resolved' });
          resolvedCount += issues.count;
        } catch (e) { /* skip */ }
      }
      // Also count closed
      for (const p of projectsData.projects) {
        try {
          const issues = await API.getIssues(p.id, { status: 'closed' });
          resolvedCount += issues.count;
        } catch (e) { /* skip */ }
      }
      document.getElementById('stat-resolved').textContent = resolvedCount;

      // Render projects
      renderProjects(projectsData.projects);
    } catch (err) {
      UI.toast('Failed to load dashboard: ' + err.message, 'error');
    }
  }

  function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    const empty = document.getElementById('no-projects');

    if (projects.length === 0) {
      grid.innerHTML = '';
      grid.appendChild(empty);
      empty.style.display = 'flex';
      return;
    }

    grid.innerHTML = projects.map(p => `
      <div class="project-card glass" data-project-id="${p.id}" onclick="Dashboard.openProject('${p.id}')">
        <div class="project-card-header">
          <span class="project-card-key">${p.key}</span>
        </div>
        <h4>${escapeHtml(p.name)}</h4>
        <p>${escapeHtml(p.description || 'No description')}</p>
        <div class="project-card-stats">
          <span class="project-card-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${p.issueCount || 0} issues
          </span>
          <span class="project-card-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${UI.timeAgo(p.createdAt)}
          </span>
        </div>
      </div>
    `).join('');
  }

  function openProject(projectId) {
    // Switch to board view with this project selected
    App.switchView('board');
    Board.selectProject(projectId);
  }

  function showCreateModal() {
    const html = `
      <form id="create-project-form">
        <div class="form-group">
          <label for="proj-name">Project Name</label>
          <input type="text" id="proj-name" placeholder="My Awesome Project" required>
        </div>
        <div class="form-group">
          <label for="proj-key">Project Key</label>
          <input type="text" id="proj-key" placeholder="MAP" maxlength="10" required style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label for="proj-description">Description</label>
          <textarea id="proj-description" placeholder="What's this project about?"></textarea>
        </div>
        <div class="form-group">
          <label for="proj-team">Team</label>
          <select id="proj-team" class="select-input" style="width:100%" required>
            <option value="">Loading teams...</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="create-project-submit">Create Project</button>
        </div>
      </form>
    `;

    UI.openModal('Create Project', html);

    // Load teams into select
    API.getTeams().then(data => {
      const select = document.getElementById('proj-team');
      if (data.teams.length === 0) {
        select.innerHTML = '<option value="">No teams — create one first</option>';
      } else {
        select.innerHTML = data.teams.map(t =>
          `<option value="${t.id}">${escapeHtml(t.name)}</option>`
        ).join('');
      }
    });

    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('create-project-submit');
      UI.setLoading(btn, true);

      try {
        await API.createProject({
          name: document.getElementById('proj-name').value.trim(),
          key: document.getElementById('proj-key').value.trim().toUpperCase(),
          description: document.getElementById('proj-description').value.trim(),
          teamId: document.getElementById('proj-team').value
        });
        UI.closeModal();
        UI.toast('Project created successfully!', 'success');
        load();
        Board.loadProjects();
      } catch (err) {
        UI.toast(err.message, 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });
  }

  return { load, openProject, showCreateModal };
})();

// ── HTML escaping utility ─────────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
