// =============================================================================
// Utility Helpers
// =============================================================================

/**
 * Valid issue status transitions.
 * Each key maps to an array of statuses it can transition TO.
 */
const VALID_TRANSITIONS = {
  open:        ['in_progress'],
  in_progress: ['resolved'],
  resolved:    ['closed'],
  closed:      ['reopened'],
  reopened:    ['in_progress']
};

const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'reopened'];
const ISSUE_TYPES = ['bug', 'task', 'story', 'epic'];
const ISSUE_PRIORITIES = ['critical', 'high', 'medium', 'low'];
const USER_ROLES = ['admin', 'member'];

/**
 * Strip sensitive fields from a user object before sending to client.
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

/**
 * Pick specified keys from an object.
 */
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Check if a status transition is valid.
 */
function isValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  return allowed && allowed.includes(to);
}

module.exports = {
  VALID_TRANSITIONS,
  ISSUE_STATUSES,
  ISSUE_TYPES,
  ISSUE_PRIORITIES,
  USER_ROLES,
  sanitizeUser,
  pick,
  isValidTransition
};
