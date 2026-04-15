// =============================================================================
// Shared UI Components — Toast, Modal, Badges, Avatars
// =============================================================================

// ── SVG Icon Library ─────────────────────────────────────────────────────────
const ICONS = {
  // Toast
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',

  // Priority
  priorityCritical: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  priorityHigh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  priorityMedium: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  priorityLow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',

  // Type
  bug: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 10h2"/><path d="M3 10h2"/><path d="M19 14h2"/><path d="M3 14h2"/><path d="M5 6l2 2"/><path d="M17 6l2-2"/><path d="M5 18l2-2"/><path d="M17 18l2 2"/></svg>',
  task: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>',
  story: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  epic: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',

  // Status
  statusOpen: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
  statusInProgress: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2 2"/></svg>',
  statusResolved: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
  statusClosed: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  statusReopened: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 105.36-9.36L3 10"/></svg>',

  // Test harness
  testPass: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  testFail: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',

  // Misc
  arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  sparkles: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z"/></svg>',
};

const UI = (() => {
  // ── Toast Notifications ───────────────────────────────────────────────────
  function toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    const iconMap = {
      success: ICONS.check,
      error: ICONS.x,
      info: ICONS.info,
      warning: ICONS.warning
    };

    el.innerHTML = `<span class="toast-icon toast-icon-${type}">${iconMap[type] || ICONS.info}</span><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openModal(title, contentHTML, footerHTML = null) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = contentHTML;
    
    const footer = document.getElementById('modal-footer');
    if (footerHTML) {
      footer.innerHTML = footerHTML;
      footer.style.display = 'flex';
    } else {
      footer.style.display = 'none';
      footer.innerHTML = '';
    }
    
    document.getElementById('modal-overlay').classList.add('active');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('modal-footer').style.display = 'none';
  }

  // Close modal on overlay click or close button
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  });

  // ── Badges ────────────────────────────────────────────────────────────────
  function priorityBadge(priority) {
    const config = {
      critical: { icon: ICONS.priorityCritical, label: 'Critical' },
      high: { icon: ICONS.priorityHigh, label: 'High' },
      medium: { icon: ICONS.priorityMedium, label: 'Medium' },
      low: { icon: ICONS.priorityLow, label: 'Low' }
    };
    const c = config[priority] || { icon: '', label: priority };
    return `<span class="badge badge-${priority}">${c.icon} ${c.label}</span>`;
  }

  function typeBadge(type) {
    const config = {
      bug: { icon: ICONS.bug, label: 'Bug' },
      task: { icon: ICONS.task, label: 'Task' },
      story: { icon: ICONS.story, label: 'Story' },
      epic: { icon: ICONS.epic, label: 'Epic' }
    };
    const c = config[type] || { icon: '', label: type };
    return `<span class="badge badge-${type}">${c.icon} ${c.label}</span>`;
  }

  function statusBadge(status) {
    const config = {
      open: { icon: ICONS.statusOpen, label: 'Open' },
      in_progress: { icon: ICONS.statusInProgress, label: 'In Progress' },
      resolved: { icon: ICONS.statusResolved, label: 'Resolved' },
      closed: { icon: ICONS.statusClosed, label: 'Closed' },
      reopened: { icon: ICONS.statusReopened, label: 'Reopened' }
    };
    const c = config[status] || { icon: '', label: status };
    return `<span class="badge badge-${status}">${c.icon} ${c.label}</span>`;
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  function avatar(user, size = 'sm') {
    if (!user) return `<div class="avatar-${size}" title="Unassigned">?</div>`;
    const initials = (user.displayName || user.username || '?')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Generate a consistent gradient based on username hash
    const hash = (user.username || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;

    return `<div class="avatar-${size}" title="${user.displayName || user.username}" style="background: linear-gradient(135deg, hsl(${hue1},70%,50%), hsl(${hue2},70%,40%))">${initials}</div>`;
  }

  // ── Time formatting ───────────────────────────────────────────────────────
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // ── Loading states ────────────────────────────────────────────────────────
  function setLoading(btnEl, loading) {
    if (loading) {
      btnEl.disabled = true;
      btnEl.dataset.originalText = btnEl.innerHTML;
      btnEl.innerHTML = '<span class="spinner"></span>';
    } else {
      btnEl.disabled = false;
      if (btnEl.dataset.originalText) {
        btnEl.innerHTML = btnEl.dataset.originalText;
      }
    }
  }

  return {
    toast,
    openModal,
    closeModal,
    priorityBadge,
    typeBadge,
    statusBadge,
    avatar,
    timeAgo,
    setLoading
  };
})();
