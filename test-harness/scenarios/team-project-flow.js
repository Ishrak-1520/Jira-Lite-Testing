// =============================================================================
// Test Scenarios — Team & Project Flow
// =============================================================================

module.exports = function (client) {
  let teamId, memberId, projectId;

  return [
    {
      name: 'Login as admin',
      fn: async () => {
        const res = await client.login('admin', 'admin123');
        res.expectStatus(200);
      }
    },
    {
      name: 'Create a team',
      fn: async () => {
        const res = await client.createTeam({ name: 'Dev Team', description: 'Main development team' });
        res.expectStatus(201)
          .expectJson(d => d.team.name === 'Dev Team');
        teamId = res.data.team.id;
      }
    },
    {
      name: 'Reject duplicate team name',
      fn: async () => {
        const res = await client.createTeam({ name: 'Dev Team' });
        res.expectStatus(409);
      }
    },
    {
      name: 'Register new member and add to team',
      fn: async () => {
        const reg = await client.register({
          username: 'bob_dev',
          password: 'bob123',
          email: 'bob@company.com',
          displayName: 'Bob Developer'
        });
        memberId = reg.data.user.id;
        await client.login('admin', 'admin123');
        const res = await client.addMember(teamId, memberId);
        res.expectStatus(200);
      }
    },
    {
      name: 'Cannot add duplicate member',
      fn: async () => {
        const res = await client.addMember(teamId, memberId);
        res.expectStatus(409);
      }
    },
    {
      name: 'Get team details with populated members',
      fn: async () => {
        const res = await client.getTeam(teamId);
        res.expectStatus(200)
          .expectJson(d => d.team.members && d.team.members.length >= 2);
      }
    },
    {
      name: 'Create project under team',
      fn: async () => {
        const res = await client.createProject({
          name: 'Mobile App',
          key: 'MOB',
          description: 'Mobile application project',
          teamId
        });
        res.expectStatus(201);
        projectId = res.data.project.id;
      }
    },
    {
      name: 'List projects filters by team',
      fn: async () => {
        const res = await client.request('GET', `/projects?teamId=${teamId}`);
        res.expectStatus(200)
          .expectJson(d => d.projects.length >= 1);
      }
    },
    {
      name: 'Get project includes team and issues',
      fn: async () => {
        const res = await client.getProject(projectId);
        res.expectStatus(200)
          .expectJson(d => d.project.team && typeof d.project.issueCount === 'number');
      }
    }
  ];
};
