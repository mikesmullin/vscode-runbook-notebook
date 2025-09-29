/**
 * Simple unit tests for VariableProcessor utility
 */

const assert = require('assert');
const {
  processVariableSubstitution,
  storeCellOutput,
  getCellOutput,
  clearCellOutputs
} = require('../src/utils/variableProcessor');

console.log('Running VariableProcessor tests...\n');

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

// Test 1: Store and retrieve cell output
runTest('Store and retrieve cell output', () => {
  storeCellOutput('test1', 'output value');
  const result = getCellOutput('test1');
  assert.equal(result, 'output value');
  clearCellOutputs();
});

// Test 2: Return undefined for non-existent output
runTest('Return undefined for non-existent output', () => {
  const result = getCellOutput('nonexistent');
  assert.equal(result, undefined);
});

// Test 3: Substitute single variable
runTest('Substitute single variable', () => {
  storeCellOutput('myvar', 'hello world');
  const code = 'Please analyze: {{myvar}}';

  const result = processVariableSubstitution(code, null);

  assert.equal(result.processedCode, 'Please analyze: ```\nhello world\n```');
  assert.equal(result.errors.length, 0);
  clearCellOutputs();
});

// Test 4: Substitute multiple variables
runTest('Substitute multiple variables', () => {
  storeCellOutput('var1', 'first');
  storeCellOutput('var2', 'second');
  const code = 'Compare {{var1}} with {{var2}}';

  const result = processVariableSubstitution(code, null);

  assert.equal(result.processedCode, 'Compare ```\nfirst\n``` with ```\nsecond\n```');
  assert.equal(result.errors.length, 0);
  clearCellOutputs();
});

// Test 5: Report errors for missing variables
runTest('Report errors for missing variables', () => {
  const code = 'Analyze {{missing}} and {{also_missing}}';

  const result = processVariableSubstitution(code, null);

  assert.equal(result.processedCode, code); // Unchanged
  assert.equal(result.errors.length, 2);
  assert(result.errors[0].includes('missing'));
  assert(result.errors[1].includes('also_missing'));
});

// Test 6: Handle mixed existing and missing variables
runTest('Handle mixed existing and missing variables', () => {
  storeCellOutput('existing', 'value');
  const code = 'Found {{existing}} but missing {{notfound}}';

  const result = processVariableSubstitution(code, null);

  assert.equal(result.processedCode, 'Found ```\nvalue\n``` but missing {{notfound}}');
  assert.equal(result.errors.length, 1);
  assert(result.errors[0].includes('notfound'));
  clearCellOutputs();
});

// Test 7: Handle code without variables
runTest('Handle code without variables', () => {
  const code = 'No variables here';

  const result = processVariableSubstitution(code, null);

  assert.equal(result.processedCode, code);
  assert.equal(result.errors.length, 0);
});

// Test 8: Clear all stored outputs
runTest('Clear all stored outputs', () => {
  storeCellOutput('test1', 'value1');
  storeCellOutput('test2', 'value2');

  clearCellOutputs();

  assert.equal(getCellOutput('test1'), undefined);
  assert.equal(getCellOutput('test2'), undefined);
});

console.log('\n🎉 All VariableProcessor tests passed!');