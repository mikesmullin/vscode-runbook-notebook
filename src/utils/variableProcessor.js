const path = require('path');
const fs = require('fs');

// Lazy load vscode to handle test environment
let vscode = null;
try {
  vscode = require('vscode');
} catch (error) {
  // vscode module not available, likely in test environment
  if (process.env.NODE_ENV === 'test' || require.main?.filename?.includes('test')) {
    vscode = require('../../tests/vscode-mock');
  }
}

/**
 * Global storage for cell execution outputs indexed by their IDs
 */
const cellOutputs = new Map();

/**
 * Read file content from workspace relative path
 * @param {string} filePath - The relative file path
 * @param {vscode.NotebookDocument} notebook - The notebook document to get workspace context
 * @returns {string} - The file content
 * @throws {Error} - If file cannot be read
 */
function readFileContent(filePath, notebook) {
  // Get workspace folder from the notebook document
  let workspaceFolder = null;

  if (notebook && notebook.uri) {
    workspaceFolder = vscode.workspace.getWorkspaceFolder(notebook.uri);
  }

  if (!workspaceFolder) {
    // Fallback to first workspace folder if available
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      workspaceFolder = workspaceFolders[0];
    } else {
      throw new Error('No workspace folder found');
    }
  }

  // Construct absolute path
  const absolutePath = path.join(workspaceFolder.uri.fsPath, filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file content
  const content = fs.readFileSync(absolutePath, 'utf8');
  return content;
}

/**
 * Process variable substitution in code
 * Replaces {{variable}} with outputs from cells that have matching @options.id
 * For {{*.md}} patterns, reads file content from workspace relative path
 * @param {string} code - The code content
 * @param {vscode.NotebookDocument} notebook - The notebook document to search for cell IDs
 * @returns {Object} - Object containing processed code and any errors
 */
function processVariableSubstitution(code, notebook) {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const errors = [];
  let processedCode = code;

  let match;
  while ((match = variablePattern.exec(code)) !== null) {
    const variableName = match[1];
    const placeholder = match[0]; // {{variableName}}

    // Check if variable name looks like a file path ending with .md
    if (variableName.endsWith('.md')) {
      try {
        const replacement = readFileContent(variableName, notebook);
        processedCode = processedCode.replace(placeholder, replacement);
      } catch (error) {
        errors.push(`Failed to read file '${variableName}': ${error.message}`);
      }
    } else {
      // Look for output in stored cell outputs
      if (cellOutputs.has(variableName)) {
        const output = cellOutputs.get(variableName);
        // Use raw output for code cells
        processedCode = processedCode.replace(placeholder, output);
      } else {
        errors.push(`Variable '${variableName}' not found. Please run the cell with @options {"id": "${variableName}"} first.`);
      }
    }
  }

  return { processedCode, errors };
}

/**
 * Store output for variable substitution
 * @param {string} id - The variable ID
 * @param {string} output - The output to store
 */
function storeCellOutput(id, output) {
  cellOutputs.set(id, output);
}

/**
 * Get stored cell output
 * @param {string} id - The variable ID
 * @returns {string|undefined} - The stored output or undefined if not found
 */
function getCellOutput(id) {
  return cellOutputs.get(id);
}

/**
 * Clear all stored cell outputs
 */
function clearCellOutputs() {
  cellOutputs.clear();
}

module.exports = {
  processVariableSubstitution,
  storeCellOutput,
  getCellOutput,
  clearCellOutputs,
  readFileContent
};