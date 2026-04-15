// =============================================================================
// Report Generator — Formats and outputs test/fuzz results
// =============================================================================

class Reporter {
  static printReport(report) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log('  📊 TEST REPORT');
    console.log(`${'═'.repeat(60)}`);
    console.log(`  Total:   ${report.total}`);
    console.log(`  Passed:  \x1b[32m${report.passed}\x1b[0m`);
    console.log(`  Failed:  \x1b[31m${report.failed}\x1b[0m`);
    console.log(`  Skipped: \x1b[33m${report.skipped}\x1b[0m`);
    console.log(`  Rate:    ${report.passRate}%`);
    console.log(`${'─'.repeat(60)}`);

    for (const suite of report.suites) {
      const icon = suite.failed === 0 ? '✅' : '❌';
      console.log(`\n  ${icon} ${suite.name} (${suite.passed}/${suite.passed + suite.failed})`);

      for (const test of suite.tests) {
        if (test.status === 'fail') {
          console.log(`     ❌ ${test.name}`);
          console.log(`        └─ ${test.error}`);
        }
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    if (report.failed === 0) {
      console.log('  🎉 ALL TESTS PASSED!');
    } else {
      console.log(`  ⚠️  ${report.failed} test(s) failed`);
    }
    console.log(`${'═'.repeat(60)}\n`);
  }

  static printFuzzerReport(summary) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log('  🛡️  FUZZER REPORT');
    console.log(`${'═'.repeat(60)}`);
    console.log(`  Total payloads:  ${summary.total}`);
    console.log(`  Properly handled: \x1b[32m${summary.handled}\x1b[0m`);
    console.log(`  Vulnerabilities:  \x1b[31m${summary.vulnerable}\x1b[0m`);

    if (summary.vulnerable > 0) {
      console.log(`\n  By Severity:`);
      console.log(`    Critical: ${summary.bySeverity.critical}`);
      console.log(`    High:     ${summary.bySeverity.high}`);
      console.log(`    Medium:   ${summary.bySeverity.medium}`);
      console.log(`    Low:      ${summary.bySeverity.low}`);

      console.log(`\n  Findings:`);
      for (const f of summary.findings.filter(f => f.status === 'vulnerable')) {
        console.log(`    🔴 [${f.severity.toUpperCase()}] ${f.name}: ${f.message}`);
      }
    }

    console.log(`${'═'.repeat(60)}\n`);
  }

  static toJSON(report, fuzzSummary) {
    return JSON.stringify({
      testReport: report,
      fuzzerReport: fuzzSummary,
      generatedAt: new Date().toISOString()
    }, null, 2);
  }
}

module.exports = Reporter;
