// =============================================================================
// Comment Routes — Add/List/Delete comments on issues
// =============================================================================

const express = require('express');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');
const { requireFields, sanitizeBody } = require('../middleware/validate');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const { sanitizeUser } = require('../utils/helpers');

const router = express.Router();

router.use(authenticate);

// ── Add comment to issue ──────────────────────────────────────────────────────
router.post(
  '/issues/:issueId/comments',
  sanitizeBody('body'),
  requireFields('body'),
  (req, res, next) => {
    try {
      const issue = store.getById('issues', req.params.issueId);
      if (!issue) throw new NotFoundError('Issue');

      // Cannot comment on closed issues
      if (issue.status === 'closed') {
        throw new ValidationError('Cannot add comments to closed issues');
      }

      const comment = store.create('comments', {
        body: req.body.body,
        authorId: req.user.id,
        issueId: issue.id
      });

      res.status(201).json({
        message: 'Comment added',
        comment: {
          ...comment,
          author: sanitizeUser(store.getById('users', comment.authorId))
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── List comments for an issue ────────────────────────────────────────────────
router.get('/issues/:issueId/comments', (req, res, next) => {
  try {
    const issue = store.getById('issues', req.params.issueId);
    if (!issue) throw new NotFoundError('Issue');

    const comments = store.getCommentsByIssue(issue.id).map(c => ({
      ...c,
      author: sanitizeUser(store.getById('users', c.authorId))
    }));

    res.json({ comments, count: comments.length });
  } catch (err) {
    next(err);
  }
});

// ── Delete comment ────────────────────────────────────────────────────────────
router.delete('/comments/:id', (req, res, next) => {
  try {
    const comment = store.getById('comments', req.params.id);
    if (!comment) throw new NotFoundError('Comment');

    // Only comment author or admin can delete
    if (req.user.role !== 'admin' && req.user.id !== comment.authorId) {
      throw new ForbiddenError('Only comment author or admin can delete comments');
    }

    store.delete('comments', req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
