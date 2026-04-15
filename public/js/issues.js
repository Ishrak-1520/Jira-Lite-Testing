// =============================================================================
// Issue Detail Module — View, transition, and comment on issues
// =============================================================================

const Issues = (() => {
  const VALID_TRANSITIONS = {
    open: ['in_progress'],
    in_progress: ['resolved'],
    resolved: ['closed'],
    closed: ['reopened'],
    reopened: ['in_progress']
  };

  async function showDetail(issueId) {
    try {
      const data = await API.getIssue(issueId);
      const issue = data.issue;

      const transitions = VALID_TRANSITIONS[issue.status] || [];

      const html = `
        <div class="issue-detail-header">
          <span class="issue-detail-key">${issue.key}</span>
          <h3 class="issue-detail-title">${escapeHtml(issue.title)}</h3>
          <div class="issue-detail-meta">
            ${UI.statusBadge(issue.status)}
            ${UI.typeBadge(issue.type)}
            ${UI.priorityBadge(issue.priority)}
          </div>
        </div>

        <div class="issue-detail-section">
          <h5>Description</h5>
          <p>${escapeHtml(issue.description) || '<em style="color:var(--text-tertiary)">No description provided</em>'}</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-6)">
          <div class="issue-detail-section" style="margin:0">
            <h5>Reporter</h5>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              ${UI.avatar(issue.reporter)}
              <span style="font-size:var(--font-sm)">${escapeHtml(issue.reporter?.displayName || 'Unknown')}</span>
            </div>
          </div>
          <div class="issue-detail-section" style="margin:0">
            <h5>Assignee</h5>
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              ${UI.avatar(issue.assignee)}
              <span style="font-size:var(--font-sm)">${issue.assignee ? escapeHtml(issue.assignee.displayName) : '<em style="color:var(--text-tertiary)">Unassigned</em>'}</span>
            </div>
          </div>
        </div>

        ${transitions.length > 0 ? `
        <div class="issue-detail-section">
          <h5>Transition</h5>
          <div class="transition-buttons">
            ${transitions.map(t => `
              <button class="transition-btn" onclick="Issues.transition('${issue.id}', '${t}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Move to ${t.replace('_', ' ')}
              </button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="issue-detail-section">
          <h5>Comments (${issue.commentCount})</h5>
          <div class="comment-thread" id="comment-thread">
            ${issue.comments.length === 0
              ? '<p style="color:var(--text-tertiary);font-size:var(--font-sm)">No comments yet</p>'
              : issue.comments.map(c => `
                <div class="comment-item">
                  ${UI.avatar(c.author)}
                  <div class="comment-body">
                    <div class="comment-author">${escapeHtml(c.author?.displayName || 'Unknown')}</div>
                    <div class="comment-text">${escapeHtml(c.body)}</div>
                    <div class="comment-time">${UI.timeAgo(c.createdAt)}</div>
                  </div>
                </div>
              `).join('')
            }
          </div>
          ${issue.status !== 'closed' ? `
          <div class="comment-form">
            <input type="text" id="comment-input" placeholder="Add a comment..." onkeydown="if(event.key==='Enter')Issues.addComment('${issue.id}')">
            <button class="btn btn-primary btn-sm" onclick="Issues.addComment('${issue.id}')">Send</button>
          </div>
          ` : '<p style="color:var(--text-tertiary);font-size:var(--font-xs);margin-top:var(--space-3)">Comments are disabled on closed issues</p>'}
        </div>

        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-danger btn-sm" onclick="Issues.deleteIssue('${issue.id}')">Delete Issue</button>
        </div>
      `;

      UI.openModal(`${issue.key} — ${escapeHtml(issue.title)}`, html);
    } catch (err) {
      UI.toast('Failed to load issue: ' + err.message, 'error');
    }
  }

  async function transition(issueId, status) {
    try {
      await API.transitionIssue(issueId, status);
      UI.toast(`Issue transitioned to ${status.replace('_', ' ')}`, 'success');
      UI.closeModal();
      Board.loadIssues();
      Dashboard.load();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function addComment(issueId) {
    const input = document.getElementById('comment-input');
    const body = input.value.trim();
    if (!body) return;

    try {
      await API.addComment(issueId, body);
      UI.toast('Comment added', 'success');
      // Refresh issue detail
      showDetail(issueId);
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function deleteIssue(issueId) {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    try {
      await API.deleteIssue(issueId);
      UI.toast('Issue deleted', 'success');
      UI.closeModal();
      Board.loadIssues();
      Dashboard.load();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  return { showDetail, transition, addComment, deleteIssue };
})();
