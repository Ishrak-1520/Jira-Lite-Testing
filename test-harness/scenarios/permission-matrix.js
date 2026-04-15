// =============================================================================
// Test Scenarios — Permission Matrix
// =============================================================================

module.exports = function (client) {
  let memberToken, adminToken, teamId;

  return [
    {
      name: 'Setup: get admin token',
      fn: async () => {
        const res = await client.login('admin', 'admin123');
        res.expectStatus(200);
        adminToken = res.data.token;
      }
    },
    {
      name: 'Setup: create team as admin',
      fn: async () => {
        client.setToken(adminToken);
        const res = await client.createTeam({ name: 'Perm Team' });
        res.expectStatus(201);
        teamId = res.data.team.id;
      }
    },
    {
      name: 'Setup: register member user',
      fn: async () => {
        const res = await client.register({
          username: 'perm_member',
          password: 'perm123',
          email: 'perm@test.com',
          displayName: 'Permission Test Member'
        });
        res.expectStatus(201);
        memberToken = res.data.token;
      }
    },
    {
      name: 'Member CANNOT create team',
      fn: async () => {
        client.setToken(memberToken);
        const res = await client.createTeam({ name: 'Illegal' });
        res.expectStatus(403);
      }
    },
    {
      name: 'Member CANNOT create project (not lead)',
      fn: async () => {
        client.setToken(memberToken);
        const res = await client.createProject({ name: 'Illegal', key: 'IL', teamId });
        res.expectStatus(403);
      }
    },
    {
      name: 'Admin CAN create project',
      fn: async () => {
        client.setToken(adminToken);
        const res = await client.createProject({ name: 'Perm Project', key: 'PP', teamId });
        res.expectStatus(201);
      }
    },
    {
      name: 'Unauthenticated request returns 401',
      fn: async () => {
        client.setToken(null);
        const res = await client.getTeams();
        res.expectStatus(401);
      }
    },
    {
      name: 'Admin CAN list all users',
      fn: async () => {
        client.setToken(adminToken);
        const res = await client.getUsers();
        res.expectStatus(200)
          .expectJson(d => d.users.length >= 2);
      }
    }
  ];
};
