// =============================================================================
// Test Scenarios — Comment Rules
// =============================================================================

module.exports = function (client) {
  let teamId, projectId, issueId;

  return [
    {
      name: 'Setup: login as admin and create team/project/issue',
      fn: async () => {
        await client.login('admin', 'admin123');
        const team = await client.createTeam({ name: 'Comment Team' });
        teamId = team.data.team.id;
        const proj = await client.createProject({ name: 'Comment Project', key: 'CP', teamId });
        projectId = proj.data.project.id;
        const issue = await client.createIssue(projectId, { title: 'Commentable Issue' });
        issueId = issue.data.issue.id;
      }
    },
    {
      name: 'Can comment on open issue',
      fn: async () => {
        const res = await client.addComment(issueId, 'Comment on open issue');
        res.expectStatus(201)
          .expectJson(d => d.comment.body === 'Comment on open issue');
      }
    },
    {
      name: 'Can comment on in_progress issue',
      fn: async () => {
        await client.transitionIssue(issueId, 'in_progress');
        const res = await client.addComment(issueId, 'Working on it');
        res.expectStatus(201);
      }
    },
    {
      name: 'Can comment on resolved issue',
      fn: async () => {
        await client.transitionIssue(issueId, 'resolved');
        const res = await client.addComment(issueId, 'Looks good');
        res.expectStatus(201);
      }
    },
    {
      name: 'CANNOT comment on closed issue',
      fn: async () => {
        await client.transitionIssue(issueId, 'closed');
        const res = await client.addComment(issueId, 'Should fail');
        res.expectStatus(400);
      }
    },
    {
      name: 'Can comment after reopening',
      fn: async () => {
        await client.transitionIssue(issueId, 'reopened');
        const res = await client.addComment(issueId, 'Reopened and commenting');
        res.expectStatus(201);
      }
    },
    {
      name: 'List comments shows all comments',
      fn: async () => {
        const res = await client.getComments(issueId);
        res.expectStatus(200)
          .expectJson(d => d.count >= 4);
      }
    },
    {
      name: 'Reject empty comment body',
      fn: async () => {
        const res = await client.addComment(issueId, '');
        res.expectStatus(400);
      }
    }
  ];
};
