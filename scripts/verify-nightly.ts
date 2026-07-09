import { computeVerifyOutcome } from './report.js';
import { runVerify } from './verify.js';

async function main(): Promise<void> {
  console.log('Stake Planner verify:nightly (~30 min)');
  const report = await runVerify({
    profile: 'nightly',
    includeProperty: true,
    includeSoak: true,
    includePerformance: true,
  });

  console.log(`\nOverall: ${report.verdict} (${(report.durationMs / 1000).toFixed(1)}s)`);
  if (report.reasons.length > 0) {
    console.log('\nReasons:');
    for (const reason of report.reasons) {
      console.log(`  • ${reason}`);
    }
  }

  const outcome = computeVerifyOutcome(
    report.steps,
    'nightly',
    report.lintErrorCount ?? 0,
    report.totalWarnings ?? 0,
  );
  process.exit(outcome.exitOk ? 0 : 1);
}

void main();
