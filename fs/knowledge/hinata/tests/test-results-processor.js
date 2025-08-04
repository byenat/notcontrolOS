/**
 * Jest 测试结果处理器
 * 
 * 处理和格式化测试结果输出。
 */

module.exports = (testResults) => {
  const {
    numFailedTests,
    numPassedTests,
    numPendingTests,
    testResults: results,
    startTime,
    success
  } = testResults;

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log('\n' + '='.repeat(60));
  console.log('🧪 HiNATA Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${numPassedTests}`);
  console.log(`❌ Failed: ${numFailedTests}`);
  console.log(`⏸️  Pending: ${numPendingTests}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`🎯 Success: ${success ? 'YES' : 'NO'}`);
  console.log('='.repeat(60));

  if (numFailedTests > 0) {
    console.log('\n❌ Failed Tests:');
    results.forEach((result) => {
      if (result.numFailingTests > 0) {
        console.log(`  📁 ${result.testFilePath}`);
        result.testResults.forEach((test) => {
          if (test.status === 'failed') {
            console.log(`    ❌ ${test.title}`);
            if (test.failureMessages && test.failureMessages.length > 0) {
              test.failureMessages.forEach((message) => {
                console.log(`       ${message.split('\n')[0]}`);
              });
            }
          }
        });
      }
    });
  }

  if (success) {
    console.log('\n🎉 All tests passed! HiNATA is ready for integration.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix before proceeding.');
  }

  console.log('\n');

  return testResults;
};