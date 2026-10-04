import { runBackendTests } from './backend_search.test.mjs';
import { runDebounceTests } from './debounce_behavior.test.mjs';
import { runFrontendContractTests } from './frontend_contracts.test.mjs';

async function main() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('       MOVIE TIME COMPREHENSIVE E2E TEST SUITE      ');
  console.log('====================================================');

  const suiteResults = [];

  // Suite 1: Backend Search & API
  try {
    const res1 = await runBackendTests();
    suiteResults.push(res1);
  } catch (err) {
    suiteResults.push({
      suite: 'Backend API & Search Suite',
      tests: [{ name: 'Suite execution', passed: false, error: err }],
      passed: false,
    });
  }

  // Suite 2: useDebounce Hook & Timing
  try {
    const res2 = await runDebounceTests();
    suiteResults.push(res2);
  } catch (err) {
    suiteResults.push({
      suite: 'useDebounce Hook Suite',
      tests: [{ name: 'Suite execution', passed: false, error: err }],
      passed: false,
    });
  }

  // Suite 3: Frontend Architecture & Contracts
  try {
    const res3 = await runFrontendContractTests();
    suiteResults.push(res3);
  } catch (err) {
    suiteResults.push({
      suite: 'Frontend Contracts & Build Suite',
      tests: [{ name: 'Suite execution', passed: false, error: err }],
      passed: false,
    });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('\n====================================================');
  console.log('                   SUMMARY REPORT                   ');
  console.log('====================================================');

  for (const suite of suiteResults) {
    console.log(`\n• ${suite.suite}:`);
    for (const test of suite.tests) {
      totalTests++;
      if (test.passed) {
        totalPassed++;
        console.log(`   [PASS] ${test.name}`);
      } else {
        totalFailed++;
        console.log(`   [FAIL] ${test.name}`);
        if (test.error) {
          console.log(`          Reason: ${test.error.message || test.error}`);
        }
      }
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Total Suites : ${suiteResults.length}`);
  console.log(`Total Tests  : ${totalTests}`);
  console.log(`Passed       : ${totalPassed}`);
  console.log(`Failed       : ${totalFailed}`);
  console.log(`Duration     : ${duration}s`);
  console.log('----------------------------------------------------');

  const overallPassed = totalFailed === 0;
  if (overallPassed) {
    console.log('\n🎉 ALL ACCEPTANCE CRITERIA VERIFIED AND PASSED!\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${totalFailed} TEST(S) FAILED.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
