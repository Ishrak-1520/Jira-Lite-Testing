// =============================================================================
// User Routes — GET /api/users, GET /api/users/:id
// =============================================================================

const express = require('express');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');
const { NotFoundError } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// ── List all users ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const users = store.getAll('users').map(sanitizeUser);
  res.json({ users, count: users.length });
});

// ── Get user by ID ────────────────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const user = store.getById('users', req.params.id);
    if (!user) throw new NotFoundError('User');
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
