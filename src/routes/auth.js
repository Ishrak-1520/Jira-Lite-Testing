// =============================================================================
// Auth Routes — POST /api/auth/register, POST /api/auth/login
// =============================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../models/store');
const { generateToken } = require('../middleware/auth');
const { requireFields, sanitizeBody, validateLength, validateSafeText } = require('../middleware/validate');
const { ValidationError, AuthenticationError, ConflictError } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');

const router = express.Router();

// ── Register ──────────────────────────────────────────────────────────────────
router.post(
  '/register',
  sanitizeBody('username', 'email', 'displayName'),
  requireFields('username', 'password', 'email', 'displayName'),
  validateSafeText('username', 'displayName'),
  validateLength('username', 3, 30),
  validateLength('password', 6, 100),
  validateLength('displayName', 1, 50),
  (req, res, next) => {
    try {
      const { username, password, email, displayName } = req.body;

      // Check for duplicate username
      const existing = store.findOneBy('users', u => u.username === username);
      if (existing) {
        throw new ConflictError('Username already taken');
      }

      // Check for duplicate email
      const existingEmail = store.findOneBy('users', u => u.email === email);
      if (existingEmail) {
        throw new ConflictError('Email already registered');
      }

      // Hash password & create user
      const salt = bcrypt.genSaltSync(10);
      const user = store.create('users', {
        username,
        password: bcrypt.hashSync(password, salt),
        email,
        displayName,
        role: 'member',
        teamId: null
      });

      const token = generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        user: sanitizeUser(user),
        token
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post(
  '/login',
  sanitizeBody('username'),
  requireFields('username', 'password'),
  validateSafeText('username'),
  (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = store.findOneBy('users', u => u.username === username);
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        throw new AuthenticationError('Invalid credentials');
      }

      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        user: sanitizeUser(user),
        token
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
