// =============================================================================
// Test Runner Engine — Executes scenario suites and collects results
// =============================================================================

class Runner {
  constructor() {
    this.suites = [];
    this.results = [];
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.totalSkipped = 0;
  }

  addSuite(name, tests) {
    this.suites.push({ name, tests });
  }

  async run(onProgress) {
    this.results = [];
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.totalSkipped = 0;

    for (const suite of this.suites) {
      const suiteResult = { name: suite.name, tests: [], passed: 0, failed: 0 };

      console.log(`\n${'═'.repeat(60)}`);
      console.log(`  📋 ${suite.name}`);
      console.log(`${'═'.repeat(60)}`);

      for (const test of suite.tests) {
        const start = Date.now();
        try {
          await test.fn();
          const duration = Date.now() - start;
          suiteResult.tests.push({ name: test.name, status: 'pass', duration });
          suiteResult.passed++;
          this.totalPassed++;
          console.log(`  ✅ ${test.name} (${duration}ms)`);
        } catch (err) {
          const duration = Date.now() - start;
          suiteResult.tests.push({ name: test.name, status: 'fail', error: err.message, duration });
          suiteResult.failed++;
          this.totalFailed++;
          console.log(`  ❌ ${test.name} (${duration}ms)`);
          console.log(`     └─ ${err.message}`);
        }

        if (onProgress) onProgress(this.totalPassed + this.totalFailed + this.totalSkipped);
      }

      this.results.push(suiteResult);
    }

    return this.getReport();
  }

  getReport() {
    const total = this.totalPassed + this.totalFailed + this.totalSkipped;
    return {
      total,
      passed: this.totalPassed,
      failed: this.totalFailed,
      skipped: this.totalSkipped,
      passRate: total > 0 ? ((this.totalPassed / total) * 100).toFixed(1) : '0.0',
      suites: this.results,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = Runner;
