// =============================================================================
// Test Harness Entry Point — CLI runner
// Usage: node test-harness/index.js [--fuzz]
// =============================================================================

const ApiClient = require('./api-client');
const Runner = require('./runner');
const Fuzzer = require('./fuzzer');
const Reporter = require('./reporter');

// Scenario imports
const authScenario = require('./scenarios/auth-lifecycle');
const issueScenario = require('./scenarios/issue-lifecycle');
const permissionScenario = require('./scenarios/permission-matrix');
const commentScenario = require('./scenarios/comment-rules');
const teamProjectScenario = require('./scenarios/team-project-flow');
const edgeCaseScenario = require('./scenarios/edge-cases');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const runFuzz = process.argv.includes('--fuzz');

async function main() {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║    🧪  Jira-Lite Test Harness                    ║
  ║                                                  ║
  ║    Target: ${BASE_URL.padEnd(35)}   ║
  ║    Mode:   ${(runFuzz ? 'Tests + Fuzzer' : 'Tests only').padEnd(35)}   ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);

  const client = new ApiClient(BASE_URL);

  // ── Reset server state ──────────────────────────────────────────────────
  console.log('  🔄 Resetting server state...');
  try {
    await client.reset();
    console.log('  ✅ Server state reset\n');
  } catch (err) {
    console.log('  ⚠️  Could not reset server (is it running?)\n');
    console.log(`  Error: ${err.message}`);
    process.exit(1);
  }

  // ── Run Test Scenarios ──────────────────────────────────────────────────
  const runner = new Runner();

  // Login as admin first for scenario setup
  await client.login('admin', 'admin123');

  runner.addSuite('Auth Lifecycle', authScenario(client));
  runner.addSuite('Team & Project Flow', teamProjectScenario(client));
  runner.addSuite('Issue Lifecycle', issueScenario(client));
  runner.addSuite('Comment Rules', commentScenario(client));
  runner.addSuite('Permission Matrix', permissionScenario(client));
  runner.addSuite('Edge Cases', edgeCaseScenario(client));

  const report = await runner.run();
  Reporter.printReport(report);

  // ── Run Fuzzer (if --fuzz flag) ─────────────────────────────────────────
  let fuzzSummary = null;
  if (runFuzz) {
    // Reset and re-login for fuzzing
    await client.login('admin', 'admin123');
    await client.reset();
    await client.login('admin', 'admin123');

    const fuzzer = new Fuzzer(client);
    await fuzzer.run();
    fuzzSummary = fuzzer.getSummary();
    Reporter.printFuzzerReport(fuzzSummary);
  }

  // ── Exit code ───────────────────────────────────────────────────────────
  const exitCode = report.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch(err => {
  console.error('\n  💥 Harness crashed:', err.message);
  process.exit(2);
});
