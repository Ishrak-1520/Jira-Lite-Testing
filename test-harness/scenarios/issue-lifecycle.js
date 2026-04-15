// =============================================================================
// Test Scenarios — Issue Lifecycle (Full state machine traversal)
// =============================================================================

module.exports = function (client) {
  let teamId, projectId, issueId;

  return [
    {
      name: 'Setup: login as admin',
      fn: async () => {
        const res = await client.login('admin', 'admin123');
        res.expectStatus(200);
      }
    },
    {
      name: 'Setup: create team',
      fn: async () => {
        const res = await client.createTeam({ name: 'Issue Team' });
        res.expectStatus(201);
        teamId = res.data.team.id;
      }
    },
    {
      name: 'Setup: create project',
      fn: async () => {
        const res = await client.createProject({ name: 'Issue Project', key: 'IP', teamId });
        res.expectStatus(201);
        projectId = res.data.project.id;
      }
    },
    {
      name: 'Create issue (starts as open)',
      fn: async () => {
        const res = await client.createIssue(projectId, {
          title: 'Login button broken',
          description: 'Users cannot click the login button on mobile',
          type: 'bug',
          priority: 'critical'
        });
        res.expectStatus(201)
          .expectJson(d => d.issue.status === 'open' && d.issue.key.startsWith('IP-'));
        issueId = res.data.issue.id;
      }
    },
    {
      name: 'Transition: open → in_progress',
      fn: async () => {
        const res = await client.transitionIssue(issueId, 'in_progress');
        res.expectStatus(200)
          .expectJson(d => d.issue.status === 'in_progress');
      }
    },
    {
      name: 'Reject: in_progress → open (invalid)',
      fn: async () => {
        const res = await client.transitionIssue(issueId, 'open');
        res.expectStatus(400);
      }
    },
    {
      name: 'Transition: in_progress → resolved',
      fn: async () => {
        const res = await client.transitionIssue(issueId, 'resolved');
        res.expectStatus(200)
          .expectJson(d => d.issue.status === 'resolved');
      }
    },
    {
      name: 'Transition: resolved → closed',
      fn: async () => {
        const res = await client.transitionIssue(issueId, 'closed');
        res.expectStatus(200)
          .expectJson(d => d.issue.status === 'closed');
      }
    },
    {
      name: 'Transition: closed → reopened',
      fn: async () => {
        const res = await client.transitionIssue(issueId, 'reopened');
        res.expectStatus(200)
          .expectJson(d => d.issue.status === 'reopened');
      }
    },
    {
      name: 'Transition: reopened → in_progress (full cycle)',
      fn: async () => {
        const res = await client.transitionIssue(issueId, 'in_progress');
        res.expectStatus(200)
          .expectJson(d => d.issue.status === 'in_progress');
      }
    },
    {
      name: 'Verify issue details are enriched',
      fn: async () => {
        const res = await client.getIssue(issueId);
        res.expectStatus(200)
          .expectJson(d => d.issue.reporter && d.issue.project);
      }
    }
  ];
};
