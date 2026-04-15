// =============================================================================
// Kanban Board Module — Drag-and-drop issue management
// =============================================================================

const Board = (() => {
  let currentProjectId = null;
  const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'reopened'];

  async function loadProjects() {
    try {
      const data = await API.getProjects();
      const select = document.getElementById('board-project-select');
      const currentVal = select.value;

      select.innerHTML = '<option value="">Select Project</option>' +
        data.projects.map(p =>
          `<option value="${p.id}" ${p.id === currentVal ? 'selected' : ''}>${escapeHtml(p.name)} (${p.key})</option>`
        ).join('');

      // Restore selection if still valid
      if (currentVal && data.projects.find(p => p.id === currentVal)) {
        select.value = currentVal;
      }
    } catch (err) {
      UI.toast('Failed to load projects', 'error');
    }
  }

  function selectProject(projectId) {
    currentProjectId = projectId;
    document.getElementById('board-project-select').value = projectId;
    loadIssues();
  }

  async function loadIssues() {
    if (!currentProjectId) {
      // Clear all columns
      STATUSES.forEach(s => {
        document.getElementById(`col-${s}`).innerHTML = '';
        document.getElementById(`count-${s}`).textContent = '0';
      });
      return;
    }

    try {
      const data = await API.getIssues(currentProjectId);

      // Group issues by status
      const grouped = {};
      STATUSES.forEach(s => grouped[s] = []);
      data.issues.forEach(issue => {
        if (grouped[issue.status]) {
          grouped[issue.status].push(issue);
        }
      });

      // Render each column
      STATUSES.forEach(status => {
        const col = document.getElementById(`col-${status}`);
        const count = document.getElementById(`count-${status}`);
        count.textContent = grouped[status].length;

        if (grouped[status].length === 0) {
          col.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-tertiary);font-size:var(--font-xs)">No issues</div>';
        } else {
          col.innerHTML = grouped[status].map(issue => renderIssueCard(issue)).join('');
        }

        // Setup drag-and-drop for cards
        col.querySelectorAll('.issue-card').forEach(card => {
          card.addEventListener('dragstart', handleDragStart);
          card.addEventListener('dragend', handleDragEnd);
        });
      });
    } catch (err) {
      UI.toast('Failed to load issues: ' + err.message, 'error');
    }
  }

  function renderIssueCard(issue) {
    return `
      <div class="issue-card" draggable="true" data-issue-id="${issue.id}" data-status="${issue.status}" onclick="Issues.showDetail('${issue.id}')">
        <div class="issue-card-key">${issue.key}</div>
        <div class="issue-card-title">${escapeHtml(issue.title)}</div>
        <div class="issue-card-footer">
          <div class="issue-card-meta">
            ${UI.typeBadge(issue.type)}
            ${UI.priorityBadge(issue.priority)}
          </div>
          ${UI.avatar(issue.assignee)}
        </div>
      </div>
    `;
  }

  // ── Drag and Drop ─────────────────────────────────────────────────────────
  let draggedCard = null;

  function handleDragStart(e) {
    draggedCard = this;
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.issueId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.column-body').forEach(col => col.classList.remove('drag-over'));
    draggedCard = null;
  }

  function initDragDrop() {
    document.querySelectorAll('.column-body').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const issueId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;
        const oldStatus = draggedCard?.dataset.status;

        if (oldStatus === newStatus) return;

        try {
          await API.transitionIssue(issueId, newStatus);
          UI.toast(`Issue moved to ${newStatus.replace('_', ' ')}`, 'success');
          loadIssues();
        } catch (err) {
          UI.toast(err.message || 'Cannot transition issue', 'error');
          loadIssues(); // Refresh to correct position
        }
      });
    });
  }

  // ── Create Issue Modal ────────────────────────────────────────────────────
  function showCreateIssueModal() {
    if (!currentProjectId) {
      UI.toast('Select a project first', 'warning');
      return;
    }

    const html = `
      <form id="create-issue-form">
        <div class="form-group">
          <label for="issue-title">Title</label>
          <input type="text" id="issue-title" placeholder="Describe the issue" required>
        </div>
        <div class="form-group">
          <label for="issue-description">Description</label>
          <textarea id="issue-description" placeholder="Detailed description..."></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
          <div class="form-group">
            <label for="issue-type">Type</label>
            <select id="issue-type" class="select-input" style="width:100%">
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="story">Story</option>
              <option value="epic">Epic</option>
            </select>
          </div>
          <div class="form-group">
            <label for="issue-priority">Priority</label>
            <select id="issue-priority" class="select-input" style="width:100%">
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="issue-assignee">Assignee</label>
          <select id="issue-assignee" class="select-input" style="width:100%">
            <option value="">Unassigned</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="create-issue-submit">Create Issue</button>
        </div>
      </form>
    `;

    UI.openModal('Create Issue', html);

    // Load users
    API.getUsers().then(data => {
      const select = document.getElementById('issue-assignee');
      data.users.forEach(u => {
        select.innerHTML += `<option value="${u.id}">${escapeHtml(u.displayName)} (${u.username})</option>`;
      });
    });

    document.getElementById('create-issue-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('create-issue-submit');
      UI.setLoading(btn, true);

      try {
        await API.createIssue(currentProjectId, {
          title: document.getElementById('issue-title').value.trim(),
          description: document.getElementById('issue-description').value.trim(),
          type: document.getElementById('issue-type').value,
          priority: document.getElementById('issue-priority').value,
          assigneeId: document.getElementById('issue-assignee').value || undefined
        });
        UI.closeModal();
        UI.toast('Issue created!', 'success');
        loadIssues();
      } catch (err) {
        UI.toast(err.message, 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });
  }

  function init() {
    document.getElementById('board-project-select').addEventListener('change', (e) => {
      currentProjectId = e.target.value;
      loadIssues();
    });

    document.getElementById('new-issue-btn').addEventListener('click', showCreateIssueModal);
    initDragDrop();
    loadProjects();
  }

  return { init, loadProjects, selectProject, loadIssues, getCurrentProjectId: () => currentProjectId };
})();
