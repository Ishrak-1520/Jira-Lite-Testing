// =============================================================================
// Teams Module — Team management UI
// =============================================================================

const Teams = (() => {
  async function load() {
    try {
      const data = await API.getTeams();
      renderTeams(data.teams);
    } catch (err) {
      UI.toast('Failed to load teams: ' + err.message, 'error');
    }
  }

  function renderTeams(teams) {
    const grid = document.getElementById('teams-grid');
    const empty = document.getElementById('no-teams');

    if (teams.length === 0) {
      grid.innerHTML = '';
      grid.appendChild(empty);
      empty.style.display = 'flex';
      return;
    }

    grid.innerHTML = teams.map(team => `
      <div class="team-card glass" onclick="Teams.showDetail('${team.id}')">
        <h4>${escapeHtml(team.name)}</h4>
        <p>${escapeHtml(team.description || 'No description')}</p>
        <div class="team-members">
          ${team.memberIds.slice(0, 5).map((_, i) => 
            `<div class="avatar-sm" style="background:linear-gradient(135deg,hsl(${(i * 60) % 360},70%,50%),hsl(${((i * 60) + 40) % 360},70%,40%))">${i + 1}</div>`
          ).join('')}
          ${team.memberIds.length > 5 ? `<div class="avatar-sm" style="background:var(--bg-elevated);font-size:10px">+${team.memberIds.length - 5}</div>` : ''}
        </div>
        <div class="team-card-footer">
          <span>${team.memberIds.length} member${team.memberIds.length !== 1 ? 's' : ''}</span>
          <span>${UI.timeAgo(team.createdAt)}</span>
        </div>
      </div>
    `).join('');
  }

  async function showDetail(teamId) {
    try {
      const data = await API.getTeam(teamId);
      const team = data.team;

      const html = `
        <div class="issue-detail-section">
          <h5>Team Name</h5>
          <p style="font-size:var(--font-lg);font-weight:600;color:var(--text-primary)">${escapeHtml(team.name)}</p>
        </div>
        <div class="issue-detail-section">
          <h5>Description</h5>
          <p>${escapeHtml(team.description) || '<em style="color:var(--text-tertiary)">No description</em>'}</p>
        </div>
        <div class="issue-detail-section">
          <h5>Members (${team.members?.length || 0})</h5>
          <div class="comment-thread">
            ${(team.members || []).map(m => `
              <div class="comment-item" style="justify-content:space-between">
                <div style="display:flex;gap:var(--space-3);align-items:center">
                  ${UI.avatar(m)}
                  <div>
                    <div class="comment-author">${escapeHtml(m.displayName)}</div>
                    <div style="font-size:var(--font-xs);color:var(--text-tertiary)">@${m.username} · ${m.role}</div>
                  </div>
                </div>
                ${m.id === team.leadId ? '<span class="badge badge-task">Lead</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="issue-detail-section">
          <h5>Add Member</h5>
          <div class="comment-form">
            <select id="add-member-select" class="select-input" style="flex:1">
              <option value="">Loading users...</option>
            </select>
            <button class="btn btn-primary btn-sm" onclick="Teams.addMember('${team.id}')">Add</button>
          </div>
        </div>
      `;

      UI.openModal(team.name, html);

      // Load available users
      const usersData = await API.getUsers();
      const select = document.getElementById('add-member-select');
      const existingIds = team.memberIds || [];
      const available = usersData.users.filter(u => !existingIds.includes(u.id));

      if (available.length === 0) {
        select.innerHTML = '<option value="">No available users</option>';
      } else {
        select.innerHTML = '<option value="">Select user...</option>' +
          available.map(u => `<option value="${u.id}">${escapeHtml(u.displayName)} (${u.username})</option>`).join('');
      }
    } catch (err) {
      UI.toast('Failed to load team: ' + err.message, 'error');
    }
  }

  async function addMember(teamId) {
    const select = document.getElementById('add-member-select');
    const userId = select.value;
    if (!userId) {
      UI.toast('Select a user first', 'warning');
      return;
    }

    try {
      await API.addMember(teamId, userId);
      UI.toast('Member added!', 'success');
      showDetail(teamId);
      load();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  function showCreateModal() {
    const html = `
      <form id="create-team-form">
        <div class="form-group">
          <label for="team-name">Team Name</label>
          <input type="text" id="team-name" placeholder="Engineering, Design, etc." required>
        </div>
        <div class="form-group">
          <label for="team-description">Description</label>
          <textarea id="team-description" placeholder="What does this team do?"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="create-team-submit">Create Team</button>
        </div>
      </form>
    `;

    UI.openModal('Create Team', html);

    document.getElementById('create-team-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('create-team-submit');
      UI.setLoading(btn, true);

      try {
        await API.createTeam({
          name: document.getElementById('team-name').value.trim(),
          description: document.getElementById('team-description').value.trim()
        });
        UI.closeModal();
        UI.toast('Team created!', 'success');
        load();
      } catch (err) {
        UI.toast(err.message, 'error');
      } finally {
        UI.setLoading(btn, false);
      }
    });
  }

  return { load, showDetail, addMember, showCreateModal };
})();
