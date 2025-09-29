/**
 * Simple test for file inclusion feature in VariableProcessor
 */

const assert = require('assert');
const path = require('path');

// Set test environment before requiring the module
process.env.NODE_ENV = 'test';

const {
  processVariableSubstitution,
  clearCellOutputs
} = require('../src/utils/variableProcessor');

console.log('Running file inclusion tests...\n');

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✓ ${testName}`);
  } catch (error) {
    console.error(`✗ ${testName}: ${error.message}`);
    throw error;
  }
}

// Clear outputs before testing
clearCellOutputs();

// Test 1: File inclusion for existing file
runTest('File inclusion for existing file', () => {
  const mockNotebook = {
    uri: {
      fsPath: __dirname + '/..'
    }
  };

  const code = 'Include this file: {{test-data/sample.md}}';
  const result = processVariableSubstitution(code, mockNotebook);

  // Should successfully read and include the file content
  assert.equal(result.errors.length, 0, `Unexpected errors: ${result.errors.join(', ')}`);
  assert(result.processedCode.includes('# Test Content'), 'Should contain file content');
  assert(result.processedCode.includes('This is a test markdown file'), 'Should contain full file content');
  // File content should NOT be wrapped in additional backticks by the processor
  // (the original file content may contain backticks, but the processor shouldn't add wrapper backticks)
  assert(!result.processedCode.includes('```\n# Test Content'), 'File content should not be wrapped by processor backticks');
});

// Test 2: File inclusion for non-existent file
runTest('File inclusion for non-existent file', () => {
  const mockNotebook = {
    uri: {
      fsPath: __dirname + '/..'
    }
  };

  const code = 'Include this file: {{nonexistent.md}}';
  const result = processVariableSubstitution(code, mockNotebook);

  // Should generate an error
  assert.equal(result.errors.length, 1);
  assert(result.errors[0].includes('nonexistent.md'));
  assert(result.errors[0].includes('File not found'));
});

// Test 3: Distinguish between regular variables and file paths
runTest('Distinguish between regular variables and file paths', () => {
  // Store a regular variable
  const { storeCellOutput } = require('../src/utils/variableProcessor');
  storeCellOutput('regularVar', 'regular content');

  const mockNotebook = {
    uri: {
      fsPath: __dirname + '/..'
    }
  };

  const code = 'Regular: {{regularVar}} File: {{test-data/sample.md}}';
  const result = processVariableSubstitution(code, mockNotebook);

  // Should have no errors
  assert.equal(result.errors.length, 0, `Unexpected errors: ${result.errors.join(', ')}`);

  // Regular variable should be substituted with backticks
  assert(result.processedCode.includes('```\nregular content\n```'), 'Regular variable should be wrapped in backticks');

  // File variable should be included without backticks
  assert(result.processedCode.includes('# Test Content'), 'File content should be included');

  clearCellOutputs();
});

// Test 4: File paths with subdirectories
runTest('File paths with subdirectories work', () => {
  const mockNotebook = {
    uri: {
      fsPath: __dirname + '/..'
    }
  };

  const code = 'Include: {{test-data/sample.md}}';
  const result = processVariableSubstitution(code, mockNotebook);

  assert.equal(result.errors.length, 0, `Should handle subdirectories: ${result.errors.join(', ')}`);
  assert(result.processedCode.includes('# Test Content'), 'Should include file from subdirectory');
});

console.log('\n🎉 All file inclusion tests passed!');