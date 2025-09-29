/**
 * Simple unit tests for OptionsParser utility
 */

// Mock vscode module before requiring our modules
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (id === 'vscode') {
    return require('./vscode-mock');
  }
  return originalRequire.apply(this, arguments);
};

const assert = require('assert');
const { parseOptionsFromCode } = require('../src/utils/optionsParser');

console.log('Running OptionsParser tests...\n');

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✓ ${testName}`);
  } catch (error) {
    console.error(`✗ ${testName}: ${error.message}`);
    throw error;
  }
}

// Test 1: Parse valid JSON options for JavaScript
runTest('Parse valid JSON options for JavaScript', () => {
  const code = '// @options {"timeout": 30, "id": "test"}\nconsole.log("hello");';
  const languageId = 'javascript';

  const result = parseOptionsFromCode(code, languageId);

  assert.deepEqual(result.options, { timeout: 30, id: 'test' });
  assert.equal(result.cleanedCode, 'console.log("hello");');
});

// Test 2: Parse JavaScript object notation for Python  
runTest('Parse JavaScript object notation for Python', () => {
  const code = '# @options {timeout: 30, id: "test"}\nprint("hello")';
  const languageId = 'python';

  const result = parseOptionsFromCode(code, languageId);

  assert.deepEqual(result.options, { timeout: 30, id: 'test' });
  assert.equal(result.cleanedCode, 'print("hello")');
});

// Test 3: Handle missing options gracefully
runTest('Handle missing options gracefully', () => {
  const code = 'console.log("hello");';
  const languageId = 'javascript';

  const result = parseOptionsFromCode(code, languageId);

  assert.deepEqual(result.options, {});
  assert.equal(result.cleanedCode, code);
});

// Test 4: Handle invalid options syntax
runTest('Handle invalid options syntax', () => {
  const code = '// @options {invalid json}\nconsole.log("hello");';
  const languageId = 'javascript';

  const result = parseOptionsFromCode(code, languageId);

  assert.deepEqual(result.options, {});
  assert.equal(result.cleanedCode, 'console.log("hello");');
});

// Test 5: Use correct comment style for different languages
runTest('Use correct comment style for different languages', () => {
  const bashCode = '# @options {"timeout": 30}\necho "hello"';
  const jsCode = '// @options {"timeout": 30}\nconsole.log("hello");';

  const bashResult = parseOptionsFromCode(bashCode, 'bash');
  const jsResult = parseOptionsFromCode(jsCode, 'javascript');

  assert.deepEqual(bashResult.options, { timeout: 30 });
  assert.deepEqual(jsResult.options, { timeout: 30 });
});

// Test 6: Handle empty code
runTest('Handle empty code', () => {
  const result = parseOptionsFromCode('', 'javascript');

  assert.deepEqual(result.options, {});
  assert.equal(result.cleanedCode, '');
});

console.log('\n🎉 All OptionsParser tests passed!');