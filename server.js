// =============================================================================
// Jira-Lite — Express Server Entry Point
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const teamRoutes = require('./src/routes/teams');
const projectRoutes = require('./src/routes/projects');
const issueRoutes = require('./src/routes/issues');
const commentRoutes = require('./src/routes/comments');
const store = require('./src/models/store');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Request logger (dev)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', issueRoutes);      // Handles /api/projects/:id/issues AND /api/issues/:id
app.use('/api', commentRoutes);    // Handles /api/issues/:id/comments AND /api/comments/:id

// ── Server Reset Endpoint (for testing) ───────────────────────────────────────
app.post('/api/reset', (req, res) => {
  store.reset();
  res.json({ message: 'Server state reset. All data wiped.' });
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    counts: {
      users: store.getAll('users').length,
      teams: store.getAll('teams').length,
      projects: store.getAll('projects').length,
      issues: store.getAll('issues').length,
      comments: store.getAll('comments').length
    }
  });
});

// ── AI Reporting ──────────────────────────────────────────────────────────────
app.post('/api/generate-report', async (req, res) => {
  try {
    const { testResults } = req.body;
    const apiKey = process.env.LONGCAT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'LONGCAT_API_KEY environment variable is not set. Please restart the backend with your API key.' });
    }

    if (!testResults) {
      return res.status(400).json({ error: 'Missing test results payload' });
    }

    const prompt = `You are a Principal QA & Security Engineer reviewing an automated test harness run for a commercial SaaS product.
Your goal is to parse the raw JSON test results below and provide a concise, highly professional, realistic System Testing Report formatted in Markdown.
CRITICAL: Do NOT mention that this is for a university project, assignment, or educational institution. The tone must be strictly corporate and realistic.

Generate the report using exactly this structure:
# System Testing & Quality Assurance Report

## 1.0 Executive Summary
(2-3 sentences providing a high-level overview of application health, test coverage, and immediate go/no-go recommendation based on pass rates).

## 2.0 Test Execution Overview
(Analyze the standard business logic flows, noting successes and failures across Auth, Teams, Projects, and Issues).

## 3.0 Vulnerability Assessment
(Analyze the Fuzzing inputs and security anomalies. Highlight any critical or high-severity gaps where boundary testing failed).

## 4.0 Actionable Remediation Plan
(Bullet points for the engineering team on what exactly needs to be fixed to make the system production-ready).

Raw Test Data:
${JSON.stringify(testResults, null, 2).substring(0, 50000)}
`;

    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: 'Longcat API error: ' + err });
    }

    const data = await response.json();
    res.json({ report: data.choices[0].message.content });

  } catch (error) {
    console.error('AI Report Error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  // Don't catch API routes
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error('\x1b[31m[ERROR]\x1b[0m', err.stack || err);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║         🚀  Jira-Lite Server Running             ║
  ║                                                  ║
  ║    Dashboard:  http://localhost:${PORT}             ║
  ║    API Base:   http://localhost:${PORT}/api         ║
  ║    Health:     http://localhost:${PORT}/api/health  ║
  ║                                                  ║
  ║    Default admin: admin / admin123                ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
