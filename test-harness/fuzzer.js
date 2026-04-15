// =============================================================================
// Fuzzer Engine — Automated boundary/security testing
// =============================================================================

class Fuzzer {
  constructor(client) {
    this.client = client;
    this.findings = [];
  }

  async run() {
    this.findings = [];
    console.log(`\n${'═'.repeat(60)}`);
    console.log('  ⚡ Fuzzer — Boundary & Security Testing');
    console.log(`${'═'.repeat(60)}`);

    await this.fuzzAuth();
    await this.fuzzTeams();
    await this.fuzzProjects();
    await this.fuzzIssues();
    await this.fuzzComments();
    await this.fuzzTokens();

    return this.findings;
  }

  async tryFuzz(name, severity, fn) {
    try {
      await fn();
      // If it succeeded when it shouldn't have, that's a finding
      this.findings.push({ name, severity, status: 'vulnerable', message: 'Expected rejection but input was accepted' });
      console.log(`  🔴 ${name} — VULNERABLE (${severity})`);
    } catch (err) {
      // Server properly rejected — good
      console.log(`  🟢 ${name} — Handled (${err.status || 'error'})`);
    }
  }

  async fuzzAuth() {
    console.log('\n  ── Auth Fuzzing ──');
    const payloads = [
      { name: 'XSS in username', username: '<script>alert(1)</script>', severity: 'high' },
      { name: 'SQL injection', username: "' OR '1'='1' --", severity: 'critical' },
      { name: 'Null bytes', username: 'user\x00null', severity: 'medium' },
      { name: 'Overlong username', username: 'a'.repeat(10000), severity: 'medium' },
      { name: 'Empty object', username: '', severity: 'low' },
      { name: 'Unicode special chars', username: '🎉💀\u200b\u0000', severity: 'medium' },
      { name: 'Integer as username', username: 99999, severity: 'low' },
      { name: 'Object as password', severity: 'medium' }
    ];

    for (const p of payloads) {
      await this.tryFuzz(`Auth: ${p.name}`, p.severity, async () => {
        const res = await this.client.register({
          username: p.username || `fuzz_${Date.now()}`,
          password: p.name === 'Object as password' ? { nested: true } : 'test123',
          email: `fuzz${Date.now()}@test.com`,
          displayName: 'Fuzzer'
        });
        res.expectStatus(400);
      });
    }
  }

  async fuzzTeams() {
    console.log('\n  ── Team Fuzzing ──');
    await this.tryFuzz('Team: empty name', 'low', async () => {
      const res = await this.client.createTeam({ name: '' });
      res.expectStatus(400);
    });
    await this.tryFuzz('Team: name with HTML', 'medium', async () => {
      const res = await this.client.createTeam({ name: '<img src=x onerror=alert(1)>' });
      // This might succeed but data should be stored safely
      if (res.ok) {
        const team = res.data.team;
        if (team.name.includes('<img')) {
          throw new Error('XSS content accepted (may be OK if escaped on render)');
        }
      }
    });
  }

  async fuzzProjects() {
    console.log('\n  ── Project Fuzzing ──');
    await this.tryFuzz('Project: missing teamId', 'low', async () => {
      const res = await this.client.createProject({ name: 'Fuzz', key: 'FZ' });
      res.expectStatus(400);
    });
    await this.tryFuzz('Project: invalid key chars', 'low', async () => {
      const res = await this.client.createProject({ name: 'Fuzz', key: '!@#$', teamId: 'fake' });
      res.expectStatus(400);
    });
  }

  async fuzzIssues() {
    console.log('\n  ── Issue Fuzzing ──');
    await this.tryFuzz('Issue: missing title', 'low', async () => {
      const res = await this.client.createIssue('fake-project', { description: 'no title' });
      res.expectStatus(400);
    });
    await this.tryFuzz('Issue: invalid type', 'low', async () => {
      const res = await this.client.createIssue('fake-project', { title: 'test', type: 'invalid_type' });
      res.expectStatus(400);
    });
    await this.tryFuzz('Issue: invalid priority', 'low', async () => {
      const res = await this.client.createIssue('fake-project', { title: 'test', priority: 'super_critical' });
      res.expectStatus(400);
    });
  }

  async fuzzComments() {
    console.log('\n  ── Comment Fuzzing ──');
    await this.tryFuzz('Comment: empty body', 'low', async () => {
      const res = await this.client.addComment('fake-issue', '');
      res.expectStatus(400);
    });
    await this.tryFuzz('Comment: non-existent issue', 'low', async () => {
      const res = await this.client.addComment('00000000-fake-id', 'Hello');
      res.expectStatus(404);
    });
  }

  async fuzzTokens() {
    console.log('\n  ── Token Fuzzing ──');
    const originalToken = this.client.token;

    await this.tryFuzz('Token: completely invalid', 'high', async () => {
      this.client.setToken('not.a.real.token');
      const res = await this.client.getUsers();
      res.expectStatus(401);
    });

    await this.tryFuzz('Token: expired format', 'high', async () => {
      this.client.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.fake');
      const res = await this.client.getUsers();
      res.expectStatus(401);
    });

    await this.tryFuzz('Token: missing', 'high', async () => {
      this.client.setToken(null);
      const res = await this.client.getUsers();
      res.expectStatus(401);
    });

    // Restore token
    this.client.setToken(originalToken);
  }

  getSummary() {
    const vulnerable = this.findings.filter(f => f.status === 'vulnerable');
    return {
      total: this.findings.length,
      vulnerable: vulnerable.length,
      handled: this.findings.length - vulnerable.length,
      findings: this.findings,
      bySeverity: {
        critical: vulnerable.filter(f => f.severity === 'critical').length,
        high: vulnerable.filter(f => f.severity === 'high').length,
        medium: vulnerable.filter(f => f.severity === 'medium').length,
        low: vulnerable.filter(f => f.severity === 'low').length
      }
    };
  }
}

module.exports = Fuzzer;
