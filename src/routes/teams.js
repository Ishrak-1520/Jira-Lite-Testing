// =============================================================================
// Team Routes — CRUD + member management
// =============================================================================

const express = require('express');
const store = require('../models/store');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeBody, validateSafeText } = require('../middleware/validate');
const { NotFoundError, ValidationError, ConflictError, ForbiddenError } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');

const router = express.Router();

// All team routes require authentication
router.use(authenticate);

// ── Create team (admin only) ──────────────────────────────────────────────────
router.post(
  '/',
  authorize('admin'),
  sanitizeBody('name', 'description'),
  requireFields('name'),
  validateSafeText('name', 'description'),
  (req, res, next) => {
    try {
      const { name, description } = req.body;

      // Check duplicate name
      const existing = store.findOneBy('teams', t => t.name === name);
      if (existing) throw new ConflictError('Team name already exists');

      const team = store.create('teams', {
        name,
        description: description || '',
        leadId: req.user.id,
        memberIds: [req.user.id]
      });

      res.status(201).json({ message: 'Team created', team });
    } catch (err) {
      next(err);
    }
  }
);

// ── List all teams ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const teams = store.getAll('teams');
  res.json({ teams, count: teams.length });
});

// ── Get team by ID ────────────────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const team = store.getById('teams', req.params.id);
    if (!team) throw new NotFoundError('Team');

    // Populate member details
    const members = team.memberIds
      .map(id => store.getById('users', id))
      .filter(Boolean)
      .map(sanitizeUser);

    res.json({ team: { ...team, members } });
  } catch (err) {
    next(err);
  }
});

// ── Update team ───────────────────────────────────────────────────────────────
router.put('/:id', (req, res, next) => {
  try {
    const team = store.getById('teams', req.params.id);
    if (!team) throw new NotFoundError('Team');

    // Only admin or team lead can update
    if (req.user.role !== 'admin' && req.user.id !== team.leadId) {
      throw new ForbiddenError('Only admin or team lead can update team');
    }

    const { name, description, leadId } = req.body;

    // If changing name, check for duplicates
    if (name && name !== team.name) {
      const dup = store.findOneBy('teams', t => t.name === name);
      if (dup) throw new ConflictError('Team name already exists');
    }

    const updated = store.update('teams', req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(leadId && { leadId })
    });

    res.json({ message: 'Team updated', team: updated });
  } catch (err) {
    next(err);
  }
});

// ── Add member to team ────────────────────────────────────────────────────────
router.post('/:id/members', (req, res, next) => {
  try {
    const team = store.getById('teams', req.params.id);
    if (!team) throw new NotFoundError('Team');

    // Only admin or team lead
    if (req.user.role !== 'admin' && req.user.id !== team.leadId) {
      throw new ForbiddenError('Only admin or team lead can add members');
    }

    const { userId } = req.body;
    if (!userId) throw new ValidationError('userId is required');

    const user = store.getById('users', userId);
    if (!user) throw new NotFoundError('User');

    if (team.memberIds.includes(userId)) {
      throw new ConflictError('User is already a team member');
    }

    // Update team
    team.memberIds.push(userId);
    store.update('teams', team.id, { memberIds: team.memberIds });

    // Update user's teamId
    store.update('users', userId, { teamId: team.id });

    res.json({ message: 'Member added', team });
  } catch (err) {
    next(err);
  }
});

// ── Remove member from team ───────────────────────────────────────────────────
router.delete('/:id/members/:userId', (req, res, next) => {
  try {
    const team = store.getById('teams', req.params.id);
    if (!team) throw new NotFoundError('Team');

    if (req.user.role !== 'admin' && req.user.id !== team.leadId) {
      throw new ForbiddenError('Only admin or team lead can remove members');
    }

    const { userId } = req.params;

    if (!team.memberIds.includes(userId)) {
      throw new NotFoundError('Member not found in team');
    }

    // Cannot remove team lead
    if (userId === team.leadId) {
      throw new ValidationError('Cannot remove team lead from team');
    }

    team.memberIds = team.memberIds.filter(id => id !== userId);
    store.update('teams', team.id, { memberIds: team.memberIds });
    store.update('users', userId, { teamId: null });

    res.json({ message: 'Member removed', team });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
