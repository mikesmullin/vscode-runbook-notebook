/**
 * Test runner for all modular components
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  'optionsParser-simple.test.js',
  'variableProcessor-simple.test.js'
];

console.log('🧪 Running all modular tests...\n');

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test ${testFile} failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  for (const testFile of tests) {
    try {
      console.log(`\n📋 Running ${testFile}...`);
      await runTest(testFile);
      passed++;
      console.log(`✅ ${testFile} passed`);
    } catch (error) {
      failed++;
      console.error(`❌ ${testFile} failed:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
  }
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});