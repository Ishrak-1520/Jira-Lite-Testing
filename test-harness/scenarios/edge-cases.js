// =============================================================================
// Test Scenarios — Edge Cases
// =============================================================================

module.exports = function (client) {
  return [
    {
      name: 'Health endpoint returns valid response',
      fn: async () => {
        const res = await client.health();
        res.expectStatus(200)
          .expectJson(d => d.status === 'ok' && typeof d.counts.users === 'number');
      }
    },
    {
      name: 'Get non-existent user returns 404',
      fn: async () => {
        await client.login('admin', 'admin123');
        const res = await client.getUser('00000000-0000-0000-0000-000000000000');
        res.expectStatus(404);
      }
    },
    {
      name: 'Get non-existent project returns 404',
      fn: async () => {
        const res = await client.getProject('00000000-0000-0000-0000-000000000000');
        res.expectStatus(404);
      }
    },
    {
      name: 'Get non-existent issue returns 404',
      fn: async () => {
        const res = await client.getIssue('00000000-0000-0000-0000-000000000000');
        res.expectStatus(404);
      }
    },
    {
      name: 'Delete non-existent issue returns 404',
      fn: async () => {
        const res = await client.deleteIssue('00000000-0000-0000-0000-000000000000');
        res.expectStatus(404);
      }
    },
    {
      name: 'Create issue with all optional fields',
      fn: async () => {
        const teams = await client.getTeams();
        if (teams.data.teams.length === 0) {
          await client.createTeam({ name: 'Edge Team' + Date.now() });
        }
        const teamsFresh = await client.getTeams();
        const proj = await client.createProject({
          name: 'Edge Project ' + Date.now(),
          key: 'EG' + Math.floor(Math.random() * 999),
          teamId: teamsFresh.data.teams[0].id
        });
        const res = await client.createIssue(proj.data.project.id, {
          title: 'Full Featured Issue',
          description: 'This has everything',
          type: 'epic',
          priority: 'critical'
        });
        res.expectStatus(201)
          .expectJson(d => d.issue.type === 'epic' && d.issue.priority === 'critical');
      }
    },
    {
      name: 'Server reset clears all data',
      fn: async () => {
        await client.login('admin', 'admin123');
        await client.reset();
        const health = await client.health();
        health.expectStatus(200)
          .expectJson(d => d.counts.teams === 0 && d.counts.projects === 0);
        // Re-login after reset (admin is re-seeded)
        await client.login('admin', 'admin123');
      }
    }
  ];
};
