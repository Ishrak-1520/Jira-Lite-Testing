// =============================================================================
// Issue Routes — CRUD + status transitions
// =============================================================================

const express = require('express');
const store = require('../models/store');
const { authenticate } = require('../middleware/auth');
const { requireFields, sanitizeBody, validateEnum } = require('../middleware/validate');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const { ISSUE_TYPES, ISSUE_PRIORITIES, isValidTransition, sanitizeUser } = require('../utils/helpers');

const router = express.Router();

router.use(authenticate);

// ── Create issue ──────────────────────────────────────────────────────────────
router.post(
  '/projects/:projectId/issues',
  sanitizeBody('title', 'description'),
  requireFields('title'),
  validateEnum('type', ISSUE_TYPES),
  validateEnum('priority', ISSUE_PRIORITIES),
  (req, res, next) => {
    try {
      const project = store.getById('projects', req.params.projectId);
      if (!project) throw new NotFoundError('Project');

      const { title, description, type, priority, assigneeId } = req.body;

      // Validate assignee exists if provided
      if (assigneeId) {
        const assignee = store.getById('users', assigneeId);
        if (!assignee) throw new NotFoundError('Assignee user');
      }

      const issueKey = store.getNextIssueKey(project.id);

      const issue = store.create('issues', {
        key: issueKey,
        title,
        description: description || '',
        type: type || 'task',
        priority: priority || 'medium',
        status: 'open',
        assigneeId: assigneeId || null,
        reporterId: req.user.id,
        projectId: project.id
      });

      res.status(201).json({ message: 'Issue created', issue });
    } catch (err) {
      next(err);
    }
  }
);

// ── List issues for a project ─────────────────────────────────────────────────
router.get('/projects/:projectId/issues', (req, res, next) => {
  try {
    const project = store.getById('projects', req.params.projectId);
    if (!project) throw new NotFoundError('Project');

    let issues = store.getIssuesByProject(project.id);

    // Optional filters
    const { status, type, priority, assigneeId } = req.query;
    if (status) issues = issues.filter(i => i.status === status);
    if (type) issues = issues.filter(i => i.type === type);
    if (priority) issues = issues.filter(i => i.priority === priority);
    if (assigneeId) issues = issues.filter(i => i.assigneeId === assigneeId);

    // Enrich with user details
    issues = issues.map(issue => ({
      ...issue,
      reporter: sanitizeUser(store.getById('users', issue.reporterId)),
      assignee: issue.assigneeId ? sanitizeUser(store.getById('users', issue.assigneeId)) : null,
      commentCount: store.getCommentsByIssue(issue.id).length
    }));

    res.json({ issues, count: issues.length });
  } catch (err) {
    next(err);
  }
});

// ── Get issue by ID ───────────────────────────────────────────────────────────
router.get('/issues/:id', (req, res, next) => {
  try {
    const issue = store.getById('issues', req.params.id);
    if (!issue) throw new NotFoundError('Issue');

    const comments = store.getCommentsByIssue(issue.id).map(c => ({
      ...c,
      author: sanitizeUser(store.getById('users', c.authorId))
    }));

    const enriched = {
      ...issue,
      reporter: sanitizeUser(store.getById('users', issue.reporterId)),
      assignee: issue.assigneeId ? sanitizeUser(store.getById('users', issue.assigneeId)) : null,
      project: store.getById('projects', issue.projectId),
      comments,
      commentCount: comments.length
    };

    res.json({ issue: enriched });
  } catch (err) {
    next(err);
  }
});

// ── Update issue ──────────────────────────────────────────────────────────────
router.put('/issues/:id', (req, res, next) => {
  try {
    const issue = store.getById('issues', req.params.id);
    if (!issue) throw new NotFoundError('Issue');

    const project = store.getById('projects', issue.projectId);

    // Assignee, project lead, or admin can update
    const canUpdate =
      req.user.role === 'admin' ||
      req.user.id === issue.assigneeId ||
      req.user.id === issue.reporterId ||
      (project && req.user.id === project.leadId);

    if (!canUpdate) {
      throw new ForbiddenError('Cannot update this issue');
    }

    const { title, description, type, priority, assigneeId } = req.body;

    // Validate enums if provided
    if (type && !ISSUE_TYPES.includes(type)) {
      throw new ValidationError(`Invalid issue type. Allowed: ${ISSUE_TYPES.join(', ')}`);
    }
    if (priority && !ISSUE_PRIORITIES.includes(priority)) {
      throw new ValidationError(`Invalid priority. Allowed: ${ISSUE_PRIORITIES.join(', ')}`);
    }
    if (assigneeId) {
      const assignee = store.getById('users', assigneeId);
      if (!assignee) throw new NotFoundError('Assignee user');
    }

    const updated = store.update('issues', req.params.id, {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(type && { type }),
      ...(priority && { priority }),
      ...(assigneeId !== undefined && { assigneeId })
    });

    res.json({ message: 'Issue updated', issue: updated });
  } catch (err) {
    next(err);
  }
});

// ── Transition issue status ───────────────────────────────────────────────────
router.patch('/issues/:id/transition', (req, res, next) => {
  try {
    const issue = store.getById('issues', req.params.id);
    if (!issue) throw new NotFoundError('Issue');

    const { status } = req.body;
    if (!status) throw new ValidationError('status is required');

    const project = store.getById('projects', issue.projectId);

    // Only assignee, project lead, or admin can transition
    const canTransition =
      req.user.role === 'admin' ||
      req.user.id === issue.assigneeId ||
      (project && req.user.id === project.leadId);

    if (!canTransition) {
      throw new ForbiddenError('Cannot transition this issue');
    }

    // Validate transition
    if (!isValidTransition(issue.status, status)) {
      throw new ValidationError(
        `Invalid transition: ${issue.status} → ${status}. ` +
        `Allowed transitions from '${issue.status}': ${require('../utils/helpers').VALID_TRANSITIONS[issue.status]?.join(', ') || 'none'}`
      );
    }

    const updated = store.update('issues', req.params.id, { status });

    res.json({
      message: `Issue transitioned: ${issue.status} → ${status}`,
      issue: updated
    });
  } catch (err) {
    next(err);
  }
});

// ── Delete issue ──────────────────────────────────────────────────────────────
router.delete('/issues/:id', (req, res, next) => {
  try {
    const issue = store.getById('issues', req.params.id);
    if (!issue) throw new NotFoundError('Issue');

    const project = store.getById('projects', issue.projectId);

    if (req.user.role !== 'admin' && (!project || req.user.id !== project.leadId)) {
      throw new ForbiddenError('Only admin or project lead can delete issues');
    }

    // Delete associated comments
    const comments = store.getCommentsByIssue(issue.id);
    for (const comment of comments) {
      store.delete('comments', comment.id);
    }

    store.delete('issues', req.params.id);
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
