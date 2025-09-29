/**
 * Unit tests for OptionsParser utility
 * 
 * This demonstrates how the modular architecture enables focused unit testing
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

describe('OptionsParser', () => {
  describe('parseOptionsFromCode', () => {
    it('should parse valid JSON options for JavaScript', () => {
      const code = '// @options {"timeout": 30, "id": "test"}\nconsole.log("hello");';
      const languageId = 'javascript';

      const result = parseOptionsFromCode(code, languageId);

      assert.deepEqual(result.options, { timeout: 30, id: 'test' });
      assert.equal(result.cleanedCode, 'console.log("hello");');
    });

    it('should parse valid JavaScript object notation for Python', () => {
      const code = '# @options {timeout: 30, id: "test"}\nprint("hello")';
      const languageId = 'python';

      const result = parseOptionsFromCode(code, languageId);

      assert.deepEqual(result.options, { timeout: 30, id: 'test' });
      assert.equal(result.cleanedCode, 'print("hello")');
    });

    it('should handle missing options gracefully', () => {
      const code = 'console.log("hello");';
      const languageId = 'javascript';

      const result = parseOptionsFromCode(code, languageId);

      assert.deepEqual(result.options, {});
      assert.equal(result.cleanedCode, code);
    });

    it('should handle invalid options syntax', () => {
      const code = '// @options {invalid json}\nconsole.log("hello");';
      const languageId = 'javascript';

      const result = parseOptionsFromCode(code, languageId);

      assert.deepEqual(result.options, {});
      assert.equal(result.cleanedCode, 'console.log("hello");');
    });

    it('should use correct comment style for different languages', () => {
      const bashCode = '# @options {"timeout": 30}\necho "hello"';
      const jsCode = '// @options {"timeout": 30}\nconsole.log("hello");';

      const bashResult = parseOptionsFromCode(bashCode, 'bash');
      const jsResult = parseOptionsFromCode(jsCode, 'javascript');

      assert.deepEqual(bashResult.options, { timeout: 30 });
      assert.deepEqual(jsResult.options, { timeout: 30 });
    });

    it('should handle empty code', () => {
      const result = parseOptionsFromCode('', 'javascript');

      assert.deepEqual(result.options, {});
      assert.equal(result.cleanedCode, '');
    });
  });
});

// Simple test runner for demonstration
if (require.main === module) {
  console.log('Running OptionsParser tests...');

  try {

    // Run tests
    const tests = [
      () => {
        const code = '// @options {"timeout": 30}\nconsole.log("hello");';
        const result = parseOptionsFromCode(code, 'javascript');
        assert.deepEqual(result.options, { timeout: 30 });
        console.log('✓ Parse valid JSON options');
      },
      () => {
        const code = 'console.log("hello");';
        const result = parseOptionsFromCode(code, 'javascript');
        assert.deepEqual(result.options, {});
        console.log('✓ Handle missing options');
      },
      () => {
        const code = '// @options {timeout: 30}\nconsole.log("hello");';
        const result = parseOptionsFromCode(code, 'javascript');
        assert.deepEqual(result.options, { timeout: 30 });
        console.log('✓ Parse JavaScript object notation');
      }
    ];

    tests.forEach(test => test());
    console.log('\nAll tests passed! ✅');

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}