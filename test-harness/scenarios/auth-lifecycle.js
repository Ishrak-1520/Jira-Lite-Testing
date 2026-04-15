// =============================================================================
// Test Scenarios — Auth Lifecycle
// =============================================================================

module.exports = function (client) {
  return [
    {
      name: 'Register a new user',
      fn: async () => {
        const res = await client.register({
          username: 'alice',
          password: 'alice123',
          email: 'alice@company.com',
          displayName: 'Alice Johnson'
        });
        res.expectStatus(201)
          .expectJson(d => d.token && d.user.username === 'alice');
      }
    },
    {
      name: 'Login with valid credentials',
      fn: async () => {
        const res = await client.login('alice', 'alice123');
        res.expectStatus(200)
          .expectJson(d => d.token && d.user.username === 'alice');
      }
    },
    {
      name: 'Reject duplicate registration',
      fn: async () => {
        const res = await client.register({
          username: 'alice',
          password: 'alice123',
          email: 'alice2@company.com',
          displayName: 'Alice Dup'
        });
        res.expectStatus(409);
      }
    },
    {
      name: 'Reject invalid password',
      fn: async () => {
        const res = await client.login('alice', 'wrong_password');
        res.expectStatus(401);
      }
    },
    {
      name: 'Reject non-existent user login',
      fn: async () => {
        const res = await client.login('nonexistent_user', 'password');
        res.expectStatus(401);
      }
    },
    {
      name: 'Reject missing fields on register',
      fn: async () => {
        const res = await client.register({ username: 'incomplete' });
        res.expectStatus(400);
      }
    },
    {
      name: 'Access protected endpoint with valid token',
      fn: async () => {
        await client.login('alice', 'alice123');
        const res = await client.getUsers();
        res.expectStatus(200)
          .expectJson(d => d.users.length >= 2);
      }
    }
  ];
};
