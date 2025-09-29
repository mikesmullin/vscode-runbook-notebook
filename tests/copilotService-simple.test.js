/**
 * Simple unit tests for CopilotService markdown detection
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

const { CopilotService } = require('../src/services/copilotService');

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}: ${error.message}`);
    process.exit(1);
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

console.log('🧪 Testing CopilotService markdown detection...\n');

// Create service instance for testing
const service = new CopilotService();

// Test cases for markdown code block detection
test('Should detect simple code blocks', () => {
  const content = 'Here is some code:\n```javascript\nconsole.log("hello");\n```\nDone.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, true, 'Should detect simple code blocks');
});

test('Should detect mermaid code blocks', () => {
  const content = 'Here is a chart:\n```mermaid\nxychart-beta\nHour,ResponseTime\n0,120\n1,110\n```\nEnd of chart.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, true, 'Should detect mermaid code blocks');
});

test('Should detect multiple code blocks', () => {
  const content = 'First block:\n```python\nprint("hello")\n```\nSecond block:\n```bash\nls -la\n```\nDone.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, true, 'Should detect multiple code blocks');
});

test('Should not detect single backticks', () => {
  const content = 'Use `console.log()` to output data.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, false, 'Should not detect single backticks');
});

test('Should not detect double backticks', () => {
  const content = 'The command is ``ls -la`` for listing files.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, false, 'Should not detect double backticks');
});

test('Should not detect plain text', () => {
  const content = 'This is just plain text without any code blocks.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, false, 'Should not detect plain text');
});

test('Should handle empty string', () => {
  const content = '';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, false, 'Should handle empty string');
});

test('Should handle null/undefined', () => {
  const resultNull = service.containsMarkdownCodeBlocks(null);
  const resultUndefined = service.containsMarkdownCodeBlocks(undefined);
  assertEquals(resultNull, false, 'Should handle null');
  assertEquals(resultUndefined, false, 'Should handle undefined');
});

test('Should detect code blocks with language specifier', () => {
  const content = 'Here is the code:\n```typescript\ninterface User {\n  name: string;\n}\n```\nEnd.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, true, 'Should detect code blocks with language specifier');
});

test('Should detect code blocks without language specifier', () => {
  const content = 'Here is the code:\n```\nsome generic code\n```\nEnd.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, true, 'Should detect code blocks without language specifier');
});

test('Should detect nested code blocks in longer content', () => {
  const content = 'Here is a comprehensive example:\n\n## Solution\n\nFirst, install the package:\n```bash\nnpm install example\n```\n\nThen use it in your code:\n```javascript\nconst example = require("example");\nconsole.log(example.hello());\n```\n\nThat should work!';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, true, 'Should detect nested code blocks in longer content');
});

test('Should not detect incomplete code blocks', () => {
  const content = 'Here is incomplete:\n```javascript\nconsole.log("hello");\n// Missing closing backticks';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, false, 'Should not detect incomplete code blocks');
});

test('Should detect code blocks with extra backticks', () => {
  const content = 'Code with extra backticks:\n````javascript\nconsole.log("hello");\n````\nDone.';
  const result = service.containsMarkdownCodeBlocks(content);
  assertEquals(result, false, 'Should not detect code blocks with extra backticks (not standard markdown)');
});

console.log('\n✅ All CopilotService markdown detection tests passed!');