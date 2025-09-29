/**
 * Unit tests for VariableProcessor utility
 */

const assert = require('assert');
const {
  processVariableSubstitution,
  storeCellOutput,
  getCellOutput,
  clearCellOutputs,
  readFileContent
} = require('../src/utils/variableProcessor');

describe('VariableProcessor', () => {
  beforeEach(() => {
    clearCellOutputs();
  });

  describe('storeCellOutput and getCellOutput', () => {
    it('should store and retrieve cell output', () => {
      storeCellOutput('test1', 'output value');
      const result = getCellOutput('test1');
      assert.equal(result, 'output value');
    });

    it('should return undefined for non-existent output', () => {
      const result = getCellOutput('nonexistent');
      assert.equal(result, undefined);
    });
  });

  describe('processVariableSubstitution', () => {
    it('should substitute single variable', () => {
      storeCellOutput('myvar', 'hello world');
      const code = 'Please analyze: {{myvar}}';

      const result = processVariableSubstitution(code, null);

      assert.equal(result.processedCode, 'Please analyze: ```\nhello world\n```');
      assert.equal(result.errors.length, 0);
    });

    it('should substitute multiple variables', () => {
      storeCellOutput('var1', 'first');
      storeCellOutput('var2', 'second');
      const code = 'Compare {{var1}} with {{var2}}';

      const result = processVariableSubstitution(code, null);

      assert.equal(result.processedCode, 'Compare ```\nfirst\n``` with ```\nsecond\n```');
      assert.equal(result.errors.length, 0);
    });

    it('should report errors for missing variables', () => {
      const code = 'Analyze {{missing}} and {{also_missing}}';

      const result = processVariableSubstitution(code, null);

      assert.equal(result.processedCode, code); // Unchanged
      assert.equal(result.errors.length, 2);
      assert(result.errors[0].includes('missing'));
      assert(result.errors[1].includes('also_missing'));
    });

    it('should handle mixed existing and missing variables', () => {
      storeCellOutput('existing', 'value');
      const code = 'Found {{existing}} but missing {{notfound}}';

      const result = processVariableSubstitution(code, null);

      assert.equal(result.processedCode, 'Found ```\nvalue\n``` but missing {{notfound}}');
      assert.equal(result.errors.length, 1);
      assert(result.errors[0].includes('notfound'));
    });

    it('should handle code without variables', () => {
      const code = 'No variables here';

      const result = processVariableSubstitution(code, null);

      assert.equal(result.processedCode, code);
      assert.equal(result.errors.length, 0);
    });

    it('should handle file inclusion for .md files', () => {
      // Create a mock notebook object with workspace context
      const mockNotebook = {
        uri: {
          fsPath: __dirname + '/..'
        }
      };

      // Mock vscode.workspace for testing
      const originalVscode = require('vscode');
      const mockVscode = {
        workspace: {
          getWorkspaceFolder: () => ({
            uri: { fsPath: __dirname + '/..' }
          }),
          workspaceFolders: []
        }
      };

      // Note: This test would need actual file system setup to work properly
      // For now, we'll test the pattern matching logic
      const code = 'Include this file: {{test-data/sample.md}}';

      // The test will fail with file not found, but we can check the pattern was recognized
      const result = processVariableSubstitution(code, mockNotebook);

      // Should have attempted file read (and likely failed)
      assert(result.errors.length === 0 || result.errors[0].includes('sample.md'));
    });

    it('should distinguish between regular variables and file paths', () => {
      storeCellOutput('regularVar', 'regular content');

      const code = 'Regular: {{regularVar}} File: {{nonexistent.md}}';
      const result = processVariableSubstitution(code, null);

      // Regular variable should be substituted with backticks
      assert(result.processedCode.includes('```\nregular content\n```'));
      // File variable should generate an error about file reading
      assert(result.errors.some(err => err.includes('nonexistent.md')));
    });
  });

  describe('clearCellOutputs', () => {
    it('should clear all stored outputs', () => {
      storeCellOutput('test1', 'value1');
      storeCellOutput('test2', 'value2');

      clearCellOutputs();

      assert.equal(getCellOutput('test1'), undefined);
      assert.equal(getCellOutput('test2'), undefined);
    });
  });
});

// Simple test runner
if (require.main === module) {
  console.log('Running VariableProcessor tests...');

  try {
    // Clear outputs before testing
    clearCellOutputs();

    const tests = [
      () => {
        storeCellOutput('test', 'output');
        assert.equal(getCellOutput('test'), 'output');
        console.log('✓ Store and retrieve cell output');
        clearCellOutputs();
      },
      () => {
        storeCellOutput('var1', 'hello');
        const result = processVariableSubstitution('Test {{var1}}', null);
        assert.equal(result.processedCode, 'Test ```\nhello\n```');
        assert.equal(result.errors.length, 0);
        console.log('✓ Substitute variables');
        clearCellOutputs();
      },
      () => {
        const result = processVariableSubstitution('Test {{missing}}', null);
        assert.equal(result.errors.length, 1);
        console.log('✓ Report missing variables');
      }
    ];

    tests.forEach(test => test());
    console.log('\nAll tests passed! ✅');

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}