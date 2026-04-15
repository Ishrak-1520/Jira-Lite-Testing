// =============================================================================
// Project Routes — CRUD for projects
// =============================================================================

const express = require('express');
const store = require('../models/store');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeBody, validateLength, validateSafeText } = require('../middleware/validate');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// ── Create project ────────────────────────────────────────────────────────────
router.post(
  '/',
  sanitizeBody('name', 'key', 'description'),
  requireFields('name', 'key', 'teamId'),
  validateSafeText('name', 'description'),
  validateLength('key', 2, 10),
  (req, res, next) => {
    try {
      const { name, key, description, teamId } = req.body;

      // Only admin or team lead can create projects
      const team = store.getById('teams', teamId);
      if (!team) throw new NotFoundError('Team');

      if (req.user.role !== 'admin' && req.user.id !== team.leadId) {
        throw new ForbiddenError('Only admin or team lead can create projects');
      }

      // Key must be uppercase alphanumeric
      const cleanKey = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanKey.length < 2) throw new ValidationError('Project key must be at least 2 alphanumeric characters');

      // Check duplicate key
      const dupKey = store.findOneBy('projects', p => p.key === cleanKey);
      if (dupKey) throw new ConflictError('Project key already in use');

      const project = store.create('projects', {
        name,
        key: cleanKey,
        description: description || '',
        teamId,
        leadId: req.user.id
      });

      res.status(201).json({ message: 'Project created', project });
    } catch (err) {
      next(err);
    }
  }
);

// ── List all projects ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  let projects = store.getAll('projects');

  // Optional filter by teamId
  if (req.query.teamId) {
    projects = projects.filter(p => p.teamId === req.query.teamId);
  }

  // Enrich with issue counts
  projects = projects.map(p => ({
    ...p,
    issueCount: store.getIssuesByProject(p.id).length
  }));

  res.json({ projects, count: projects.length });
});

// ── Get project by ID ─────────────────────────────────────────────────────────
router.get('/:id', (req, res, next) => {
  try {
    const project = store.getById('projects', req.params.id);
    if (!project) throw new NotFoundError('Project');

    const issues = store.getIssuesByProject(project.id);
    const team = store.getById('teams', project.teamId);

    res.json({
      project: {
        ...project,
        team,
        issues,
        issueCount: issues.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── Update project ────────────────────────────────────────────────────────────
router.put('/:id', (req, res, next) => {
  try {
    const project = store.getById('projects', req.params.id);
    if (!project) throw new NotFoundError('Project');

    if (req.user.role !== 'admin' && req.user.id !== project.leadId) {
      throw new ForbiddenError('Only admin or project lead can update project');
    }

    const { name, description, leadId } = req.body;
    const updated = store.update('projects', req.params.id, {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(leadId && { leadId })
    });

    res.json({ message: 'Project updated', project: updated });
  } catch (err) {
    next(err);
  }
});

// ── Delete project ────────────────────────────────────────────────────────────
router.delete('/:id', (req, res, next) => {
  try {
    const project = store.getById('projects', req.params.id);
    if (!project) throw new NotFoundError('Project');

    if (req.user.role !== 'admin' && req.user.id !== project.leadId) {
      throw new ForbiddenError('Only admin or project lead can delete project');
    }

    // Delete all issues and comments in this project
    const issues = store.getIssuesByProject(project.id);
    for (const issue of issues) {
      const comments = store.getCommentsByIssue(issue.id);
      for (const comment of comments) {
        store.delete('comments', comment.id);
      }
      store.delete('issues', issue.id);
    }

    store.delete('projects', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
