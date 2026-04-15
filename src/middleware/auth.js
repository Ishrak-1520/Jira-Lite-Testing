// =============================================================================
// Authentication Middleware
// =============================================================================

const jwt = require('jsonwebtoken');
const store = require('../models/store');
const { AuthenticationError, ForbiddenError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'jira-lite-secret-key-2026';
const JWT_EXPIRES_IN = '24h';

/**
 * Generate a JWT token for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Middleware: Require authentication.
 * Attaches `req.user` with the full user object (sans password).
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.getById('users', decoded.id);

    if (!user) {
      throw new AuthenticationError('User no longer exists');
    }

    // Attach user (without password) to request
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    }
    next(err);
  }
}

/**
 * Middleware: Require specific role(s).
 * Must be used AFTER authenticate middleware.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticate,
  authorize
};
