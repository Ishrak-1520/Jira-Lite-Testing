// =============================================================================
// App Module — SPA Router, Initialization, Global Event Wiring
// =============================================================================

const App = (() => {
  function init() {
    Auth.init();
    Board.init();

    // Check for existing session
    if (API.getToken() && API.getUser()) {
      showApp();
    }

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(item.dataset.view);
      });
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      API.setToken(null);
      API.setUser(null);
      showAuth();
      UI.toast('Signed out', 'info');
    });

    // New project button
    document.getElementById('new-project-btn').addEventListener('click', Dashboard.showCreateModal);

    // New team button
    document.getElementById('new-team-btn').addEventListener('click', Teams.showCreateModal);

    // Test harness buttons
    document.getElementById('run-all-tests-btn').addEventListener('click', runTests);
    document.getElementById('run-fuzzer-btn').addEventListener('click', runFuzzer);
    document.getElementById('generate-ai-report-btn').addEventListener('click', generateAIReport);
  }

  function showAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('app-shell').classList.remove('active');
  }

  function showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-shell').classList.add('active');

    // Update user info in sidebar
    const user = API.getUser();
    if (user) {
      document.getElementById('user-name').textContent = user.displayName;
      document.getElementById('user-role').textContent = user.role;
      document.getElementById('user-avatar').textContent =
        (user.displayName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    // Load initial data
    Dashboard.load();
    Board.loadProjects();
  }

  function switchView(viewName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${viewName}"]`);
    if (navItem) navItem.classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(`view-${viewName}`);
    if (view) view.classList.add('active');

    // Load view data
    switch (viewName) {
      case 'dashboard':
        Dashboard.load();
        break;
      case 'board':
        Board.loadIssues();
        break;
      case 'teams':
        Teams.load();
        break;
      case 'test-harness':
        // Test harness loads on demand
        document.getElementById('generate-ai-report-btn').disabled = !window.lastTestResults;
        break;
    }
  }

  // ── AI Reporting Integration ──────────────────────────────────────────────
  async function generateAIReport() {
    const btn = document.getElementById('generate-ai-report-btn');
    UI.setLoading(btn, true);
    
    try {
      const data = await API.generateAIReport(window.lastTestResults);
      if (!data.report) throw new Error('No report generated');

      const rawMarkdown = data.report;
      
      // Use marked.js to render safe, high-quality HTML from the Markdown
      const parsedHTML = marked.parse(rawMarkdown);
      
      // Wrap it in a printable container
      const content = `<div id="ai-report-doc" class="ai-report-document markdown-body">
        ${parsedHTML}
      </div>`;

      const footer = `
        <button class="btn btn-secondary" id="btn-dl-md">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
           Download .MD
        </button>
        <button class="btn btn-primary" id="btn-dl-pdf" style="background: var(--blue-primary); color: white;">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
           Download .PDF
        </button>
      `;
        
      UI.openModal('System Testing & QA Report', content, footer);

      // Handle Markdown Download
      document.getElementById('btn-dl-md').onclick = () => {
        const blob = new Blob([rawMarkdown], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'System_Testing_QA_Report.md';
        a.click();
      };

      // Handle PDF Download
      document.getElementById('btn-dl-pdf').onclick = () => {
        const element = document.getElementById('ai-report-doc');
        const opt = {
          margin:       0.8,
          filename:     'System_Testing_QA_Report.pdf',
          image:        { type: 'jpeg', quality: 1.0 },
          html2canvas:  { scale: 2, useCORS: true },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
      };
      
    } catch (e) {
      UI.toast(e.message || 'Failed to generate AI report (Is your API key set?)', 'error');
    } finally {
      UI.setLoading(btn, false);
    }
  }

  // ── Test Harness Integration (Frontend Runner) ────────────────────────────
  async function runTests() {
    const btn = document.getElementById('run-all-tests-btn');
    UI.setLoading(btn, true);

    const progressContainer = document.getElementById('test-progress-container');
    const progressFill = document.getElementById('test-progress-fill');
    const progressLabel = document.getElementById('test-progress-label');
    const progressPct = document.getElementById('test-progress-pct');
    progressContainer.style.display = 'block';

    const results = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    const scenarios = [
      { name: 'Auth Lifecycle', tests: getAuthTests() },
      { name: 'Team & Project Flow', tests: getTeamProjectTests() },
      { name: 'Issue Lifecycle', tests: getIssueLifecycleTests() },
      { name: 'Comment Rules', tests: getCommentTests() },
      { name: 'Permission Checks', tests: getPermissionTests() },
      { name: 'Edge Cases', tests: getEdgeCaseTests() }
    ];

    const totalScenarios = scenarios.length;
    let completedScenarios = 0;

    // Reset server state
    try {
      await API.reset();
    } catch (e) { /* ok */ }

    for (const scenario of scenarios) {
      progressLabel.textContent = `Running: ${scenario.name}...`;
      const scenarioResult = { name: scenario.name, tests: [] };

      for (const test of scenario.tests) {
        totalTests++;
        try {
          await test.fn();
          scenarioResult.tests.push({ name: test.name, status: 'pass' });
          passedTests++;
        } catch (err) {
          scenarioResult.tests.push({ name: test.name, status: 'fail', error: err.message });
          failedTests++;
        }
      }

      results.push(scenarioResult);
      completedScenarios++;
      const pct = Math.round((completedScenarios / totalScenarios) * 100);
      progressFill.style.width = pct + '%';
      progressPct.textContent = pct + '%';
    }

    progressLabel.textContent = 'Tests complete!';
    progressFill.style.width = '100%';
    progressPct.textContent = '100%';

    // Update summary
    document.getElementById('test-total').textContent = totalTests;
    document.getElementById('test-passed').textContent = passedTests;
    document.getElementById('test-failed').textContent = failedTests;
    document.getElementById('test-skipped').textContent = 0;

    window.lastTestResults = results;
    document.getElementById('generate-ai-report-btn').disabled = false;
    
    // Render results
    renderTestResults(results);
    UI.setLoading(btn, false);

    if (failedTests === 0) {
      UI.toast(`All ${totalTests} tests passed!`, 'success');
    } else {
      UI.toast(`${failedTests} of ${totalTests} tests failed`, 'error');
    }
  }

  function renderTestResults(results) {
    const container = document.getElementById('test-results');
    container.innerHTML = results.map((scenario, idx) => {
      const passed = scenario.tests.filter(t => t.status === 'pass').length;
      const failed = scenario.tests.filter(t => t.status === 'fail').length;
      const allPassed = failed === 0;

      return `
        <div class="test-scenario">
          <div class="test-scenario-header" onclick="this.nextElementSibling.classList.toggle('expanded')">
            <div class="test-scenario-name">
              <div class="test-icon ${allPassed ? 'test-icon-pass' : 'test-icon-fail'}">${allPassed ? ICONS.testPass : ICONS.testFail}</div>
              ${scenario.name}
            </div>
            <div class="test-scenario-stats">
              <span style="color:var(--green-400)">${passed} passed</span>
              ${failed > 0 ? `<span style="color:var(--red-400)">${failed} failed</span>` : ''}
            </div>
          </div>
          <div class="test-case-list ${idx === 0 || failed > 0 ? 'expanded' : ''}">
            ${scenario.tests.map(t => `
              <div class="test-case">
                <div class="test-case-name">
                  <div class="test-icon test-icon-${t.status}">${t.status === 'pass' ? ICONS.testPass : ICONS.testFail}</div>
                  ${t.name}
                </div>
                <span class="test-case-result" style="color:${t.status === 'pass' ? 'var(--green-400)' : 'var(--red-400)'}">
                  ${t.status === 'pass' ? 'PASS' : t.error || 'FAIL'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Fuzzer ────────────────────────────────────────────────────────────────
  async function runFuzzer() {
    const btn = document.getElementById('run-fuzzer-btn');
    UI.setLoading(btn, true);
    
    const progressContainer = document.getElementById('test-progress-container');
    const progressFill = document.getElementById('test-progress-fill');
    const progressLabel = document.getElementById('test-progress-label');
    const progressPct = document.getElementById('test-progress-pct');
    progressContainer.style.display = 'block';
    progressLabel.textContent = 'Running fuzzer...';
    progressFill.style.width = '0%';

    // Reset state
    try { await API.reset(); } catch(e) {}

    // Login as admin for fuzzing
    let adminToken;
    try {
      const loginData = await API.login('admin', 'admin123');
      adminToken = loginData.token;
      API.setToken(adminToken);
    } catch(e) {
      UI.toast('Failed to login for fuzzing', 'error');
      UI.setLoading(btn, false);
      return;
    }

    const results = [];
    let totalTests = 0, passedTests = 0, failedTests = 0;

    const fuzzPayloads = [
      { name: 'XSS in username', fn: () => API.register({ username: '<script>alert(1)</script>', password: 'test123', email: 'xss@test.com', displayName: 'XSS Test' }) },
      { name: 'SQL injection in username', fn: () => API.register({ username: "admin' OR '1'='1", password: 'test123', email: 'sqli@test.com', displayName: 'SQLi Test' }) },
      { name: 'Empty body on register', fn: () => API.register({}) },
      { name: 'Overlong username (500 chars)', fn: () => API.register({ username: 'a'.repeat(500), password: 'test123', email: 'long@test.com', displayName: 'Long' }) },
      { name: 'Unicode username', fn: () => API.register({ username: '用户名テスト🎉', password: 'test123', email: 'unicode@test.com', displayName: 'Unicode' }) },
      { name: 'Missing password', fn: () => API.login('admin', '') },
      { name: 'Null token', fn: async () => { const old = API.getToken(); API.setToken(null); try { await API.getUsers(); } finally { API.setToken(old); } } },
      { name: 'Malformed token', fn: async () => { const old = API.getToken(); API.setToken('not.a.real.token'); try { await API.getUsers(); } finally { API.setToken(old); } } },
      { name: 'Create team empty name', fn: () => API.createTeam({ name: '' }) },
      { name: 'Create team with special chars', fn: () => API.createTeam({ name: '"><img src=x onerror=alert(1)>', description: 'test' }) },
      { name: 'Get non-existent user', fn: () => API.getUser('00000000-0000-0000-0000-000000000000') },
      { name: 'Get non-existent project', fn: () => API.getProject('00000000-0000-0000-0000-000000000000') },
      { name: 'Get non-existent issue', fn: () => API.getIssue('00000000-0000-0000-0000-000000000000') },
      { name: 'Create project missing teamId', fn: () => API.createProject({ name: 'Test', key: 'TST' }) },
      { name: 'Create issue missing title', fn: () => API.createIssue('fake-id', {}) },
      { name: 'Invalid issue transition', fn: async () => {
        API.setToken(adminToken);
        const team = await API.createTeam({ name: 'FuzzTeam' + Date.now() });
        const proj = await API.createProject({ name: 'FuzzProj', key: 'FZ' + Math.floor(Math.random()*999), teamId: team.team.id });
        const issue = await API.createIssue(proj.project.id, { title: 'Fuzz Issue' });
        await API.transitionIssue(issue.issue.id, 'closed'); // open -> closed is invalid
      }},
      { name: 'Comment on closed issue', fn: async () => {
        API.setToken(adminToken);
        const team = await API.createTeam({ name: 'FuzzTeam2' + Date.now() });
        const proj = await API.createProject({ name: 'FuzzProj2', key: 'FY' + Math.floor(Math.random()*999), teamId: team.team.id });
        const issue = await API.createIssue(proj.project.id, { title: 'Close Me' });
        await API.transitionIssue(issue.issue.id, 'in_progress');
        await API.transitionIssue(issue.issue.id, 'resolved');
        await API.transitionIssue(issue.issue.id, 'closed');
        await API.addComment(issue.issue.id, 'Should fail');
      }},
      { name: 'Number as string field', fn: () => API.register({ username: 12345, password: 'test123', email: 'num@test.com', displayName: 'Number' }) },
      { name: 'Array as string field', fn: () => API.register({ username: ['array'], password: 'test123', email: 'arr@test.com', displayName: 'Array' }) },
    ];

    const scenarioResult = { name: 'Fuzzer — Boundary & Security', tests: [] };

    for (let i = 0; i < fuzzPayloads.length; i++) {
      const fuzz = fuzzPayloads[i];
      totalTests++;
      progressLabel.textContent = `Fuzzing: ${fuzz.name}...`;
      const pct = Math.round(((i + 1) / fuzzPayloads.length) * 100);
      progressFill.style.width = pct + '%';
      progressPct.textContent = pct + '%';

      try {
        await fuzz.fn();
        // If the fuzz payload that SHOULD fail succeeds, that's a finding
        scenarioResult.tests.push({ name: fuzz.name, status: 'fail', error: 'Expected rejection but succeeded' });
        failedTests++;
      } catch (err) {
        // Expected: the server properly rejected bad input
        scenarioResult.tests.push({ name: fuzz.name, status: 'pass' });
        passedTests++;
      }
    }

    results.push(scenarioResult);

    // Restore admin token
    API.setToken(adminToken);

    document.getElementById('test-total').textContent = totalTests;
    document.getElementById('test-passed').textContent = passedTests;
    document.getElementById('test-failed').textContent = failedTests;
    document.getElementById('test-skipped').textContent = 0;

    progressLabel.textContent = 'Fuzzing complete!';
    progressFill.style.width = '100%';
    progressPct.textContent = '100%';

    window.lastTestResults = results;
    document.getElementById('generate-ai-report-btn').disabled = false;

    renderTestResults(results);
    UI.setLoading(btn, false);

    if (failedTests === 0) {
      UI.toast(`Fuzzer: all ${totalTests} inputs properly handled!`, 'success');
    } else {
      UI.toast(`Fuzzer: ${failedTests} potential issues found`, 'warning');
    }
  }

  // ── Test Scenario Definitions ─────────────────────────────────────────────
  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  function getAuthTests() {
    let testToken, testUser;
    return [
      { name: 'Register a new user', fn: async () => {
        const data = await API.register({ username: 'testuser', password: 'test123', email: 'test@test.com', displayName: 'Test User' });
        assert(data.token, 'Should return token');
        assert(data.user.username === 'testuser', 'Username should match');
        testToken = data.token;
        testUser = data.user;
      }},
      { name: 'Login with valid credentials', fn: async () => {
        const data = await API.login('testuser', 'test123');
        assert(data.token, 'Should return token');
        API.setToken(data.token);
      }},
      { name: 'Reject duplicate username', fn: async () => {
        try {
          await API.register({ username: 'testuser', password: 'test123', email: 'test2@test.com', displayName: 'Dup' });
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 409 || e.message.includes('already'), 'Should be conflict');
        }
      }},
      { name: 'Reject invalid login', fn: async () => {
        try {
          await API.login('testuser', 'wrongpassword');
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 401, 'Should be 401');
        }
      }},
      { name: 'Access protected endpoint', fn: async () => {
        const loginData = await API.login('admin', 'admin123');
        API.setToken(loginData.token);
        const data = await API.getUsers();
        assert(data.users.length >= 2, 'Should list users');
      }}
    ];
  }

  function getTeamProjectTests() {
    let teamId, projectId;
    return [
      { name: 'Create a team', fn: async () => {
        const loginData = await API.login('admin', 'admin123');
        API.setToken(loginData.token);
        const data = await API.createTeam({ name: 'Engineering', description: 'Dev team' });
        assert(data.team.name === 'Engineering', 'Team name should match');
        teamId = data.team.id;
      }},
      { name: 'List teams', fn: async () => {
        const data = await API.getTeams();
        assert(data.teams.length >= 1, 'Should have at least one team');
      }},
      { name: 'Add member to team', fn: async () => {
        const users = await API.getUsers();
        const nonAdmin = users.users.find(u => u.username === 'testuser');
        if (nonAdmin) {
          await API.addMember(teamId, nonAdmin.id);
        }
      }},
      { name: 'Create a project', fn: async () => {
        const data = await API.createProject({ name: 'Test Project', key: 'TP', description: 'A test project', teamId });
        assert(data.project.key === 'TP', 'Key should match');
        projectId = data.project.id;
      }},
      { name: 'List projects', fn: async () => {
        const data = await API.getProjects();
        assert(data.projects.length >= 1, 'Should have at least one project');
      }},
      { name: 'Get project details', fn: async () => {
        const data = await API.getProject(projectId);
        assert(data.project.team, 'Should include team');
      }}
    ];
  }

  function getIssueLifecycleTests() {
    let issueId, projectId;
    return [
      { name: 'Setup: create project', fn: async () => {
        const loginData = await API.login('admin', 'admin123');
        API.setToken(loginData.token);
        const teams = await API.getTeams();
        const teamId = teams.teams[0]?.id;
        if (!teamId) throw new Error('No team available');
        const proj = await API.createProject({ name: 'Lifecycle Test', key: 'LT', teamId });
        projectId = proj.project.id;
      }},
      { name: 'Create an issue', fn: async () => {
        const data = await API.createIssue(projectId, { title: 'Test Bug', type: 'bug', priority: 'high' });
        assert(data.issue.status === 'open', 'Should start as open');
        issueId = data.issue.id;
      }},
      { name: 'Transition: open → in_progress', fn: async () => {
        const data = await API.transitionIssue(issueId, 'in_progress');
        assert(data.issue.status === 'in_progress', 'Should be in_progress');
      }},
      { name: 'Transition: in_progress → resolved', fn: async () => {
        const data = await API.transitionIssue(issueId, 'resolved');
        assert(data.issue.status === 'resolved', 'Should be resolved');
      }},
      { name: 'Transition: resolved → closed', fn: async () => {
        const data = await API.transitionIssue(issueId, 'closed');
        assert(data.issue.status === 'closed', 'Should be closed');
      }},
      { name: 'Transition: closed → reopened', fn: async () => {
        const data = await API.transitionIssue(issueId, 'reopened');
        assert(data.issue.status === 'reopened', 'Should be reopened');
      }},
      { name: 'Transition: reopened → in_progress', fn: async () => {
        const data = await API.transitionIssue(issueId, 'in_progress');
        assert(data.issue.status === 'in_progress', 'Should be in_progress again');
      }},
      { name: 'Reject invalid transition: in_progress → closed', fn: async () => {
        try {
          await API.transitionIssue(issueId, 'closed');
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 400 || e.message.includes('Invalid'), 'Should reject invalid transition');
        }
      }}
    ];
  }

  function getCommentTests() {
    let issueId, projectId;
    return [
      { name: 'Setup: create issue', fn: async () => {
        const loginData = await API.login('admin', 'admin123');
        API.setToken(loginData.token);
        const teams = await API.getTeams();
        const proj = await API.createProject({ name: 'Comment Test', key: 'CT', teamId: teams.teams[0].id });
        projectId = proj.project.id;
        const issue = await API.createIssue(projectId, { title: 'Comment Target' });
        issueId = issue.issue.id;
      }},
      { name: 'Add comment to open issue', fn: async () => {
        const data = await API.addComment(issueId, 'First comment!');
        assert(data.comment.body === 'First comment!', 'Body should match');
      }},
      { name: 'List comments', fn: async () => {
        const data = await API.getComments(issueId);
        assert(data.count >= 1, 'Should have comments');
      }},
      { name: 'Add comment to in_progress issue', fn: async () => {
        await API.transitionIssue(issueId, 'in_progress');
        await API.addComment(issueId, 'In progress comment');
      }},
      { name: 'Reject comment on closed issue', fn: async () => {
        await API.transitionIssue(issueId, 'resolved');
        await API.transitionIssue(issueId, 'closed');
        try {
          await API.addComment(issueId, 'Should fail');
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.message.includes('closed') || e.status === 400, 'Should reject on closed');
        }
      }},
      { name: 'Comment allowed after reopen', fn: async () => {
        await API.transitionIssue(issueId, 'reopened');
        const data = await API.addComment(issueId, 'Reopened comment');
        assert(data.comment, 'Should allow comment after reopen');
      }}
    ];
  }

  function getPermissionTests() {
    return [
      { name: 'Member cannot create team', fn: async () => {
        const reg = await API.register({ username: 'member1_' + Date.now(), password: 'test123', email: `m1_${Date.now()}@test.com`, displayName: 'Member 1' });
        API.setToken(reg.token);
        try {
          await API.createTeam({ name: 'Illegal Team' });
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 403, 'Should be 403');
        }
      }},
      { name: 'Unauthenticated access rejected', fn: async () => {
        const oldToken = API.getToken();
        API.setToken(null);
        try {
          await API.getUsers();
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 401, 'Should be 401');
        } finally {
          API.setToken(oldToken);
        }
      }},
      { name: 'Admin can access all endpoints', fn: async () => {
        const loginData = await API.login('admin', 'admin123');
        API.setToken(loginData.token);
        const data = await API.getUsers();
        assert(data.users.length >= 1, 'Admin should see users');
      }}
    ];
  }

  function getEdgeCaseTests() {
    return [
      { name: 'Get non-existent resource returns 404', fn: async () => {
        const loginData = await API.login('admin', 'admin123');
        API.setToken(loginData.token);
        try {
          await API.getProject('nonexistent-id');
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 404, 'Should be 404');
        }
      }},
      { name: 'Create issue with all optional fields', fn: async () => {
        const teams = await API.getTeams();
        const proj = await API.createProject({ name: 'Edge' + Date.now(), key: 'ED' + Math.floor(Math.random()*999), teamId: teams.teams[0].id });
        const data = await API.createIssue(proj.project.id, {
          title: 'Full Issue',
          description: 'Full description',
          type: 'epic',
          priority: 'critical'
        });
        assert(data.issue.type === 'epic', 'Type should be epic');
        assert(data.issue.priority === 'critical', 'Priority should be critical');
      }},
      { name: 'Health endpoint works', fn: async () => {
        const data = await API.health();
        assert(data.status === 'ok', 'Health should be ok');
        assert(typeof data.counts.users === 'number', 'Should have user count');
      }},
      { name: 'Empty string title rejected', fn: async () => {
        const teams = await API.getTeams();
        const proj = await API.createProject({ name: 'Edge2' + Date.now(), key: 'EF' + Math.floor(Math.random()*999), teamId: teams.teams[0].id });
        try {
          await API.createIssue(proj.project.id, { title: '' });
          throw new Error('Should have rejected');
        } catch (e) {
          assert(e.status === 400, 'Should be 400');
        }
      }}
    ];
  }

  // DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);

  return { showAuth, showApp, switchView };
})();
