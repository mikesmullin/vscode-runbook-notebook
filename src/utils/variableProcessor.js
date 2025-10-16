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
 * Parse variable definitions from markdown tables in the notebook
 * Searches for tables under "## VARIABLES" headings and extracts name/value pairs
 * @param {vscode.NotebookDocument} notebook - The notebook document to search
 * @param {number} currentCellIndex - Index of the current cell being evaluated
 * @returns {Map<string, string>} - Map of variable names (lowercase) to values
 */
function parseVariableTable(notebook, currentCellIndex) {
  const variables = new Map();

  if (!notebook || !notebook.getCells) {
    return variables;
  }

  // Iterate through all cells up to (but not including) the current cell
  const cells = notebook.getCells();
  const endIndex = currentCellIndex !== undefined ? currentCellIndex : cells.length;

  for (let i = 0; i < endIndex; i++) {
    const cell = cells[i];

    // Only process markdown cells
    if (cell.kind !== vscode.NotebookCellKind.Markup) {
      continue;
    }

    const content = cell.document.getText();
    const lines = content.split('\n');

    // Look for "## VARIABLES" heading (case-insensitive, whitespace-tolerant)
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();

      // Check if this is a VARIABLES heading
      if (!/^\s*#{1,6}\s+variables\s*$/i.test(line)) {
        continue;
      }

      // Found a VARIABLES heading, now look for the table
      let tableStartIndex = lineIndex + 1;

      // Skip empty lines until we find the table
      while (tableStartIndex < lines.length && !lines[tableStartIndex].includes('|')) {
        tableStartIndex++;
      }

      if (tableStartIndex >= lines.length) {
        continue; // No table found after this heading
      }

      // Parse the table header to find name and value column indices
      const headerLine = lines[tableStartIndex].trim();
      const headers = headerLine.split('|').map(h => h.trim().toLowerCase());

      const nameColIndex = headers.findIndex(h => h === 'name');
      const valueColIndex = headers.findIndex(h => h === 'value');

      if (nameColIndex === -1 || valueColIndex === -1) {
        continue; // Required columns not found
      }

      // Skip the separator line (e.g., |-|-|-)
      let dataStartIndex = tableStartIndex + 1;
      if (dataStartIndex < lines.length && lines[dataStartIndex].includes('-')) {
        dataStartIndex++;
      }

      // Parse data rows
      for (let rowIndex = dataStartIndex; rowIndex < lines.length; rowIndex++) {
        const rowLine = lines[rowIndex].trim();

        // Stop if we hit an empty line or non-table line
        if (!rowLine || !rowLine.includes('|')) {
          break;
        }

        const cells = rowLine.split('|').map(c => c.trim());

        // Validate we have enough columns
        if (cells.length > Math.max(nameColIndex, valueColIndex)) {
          const name = cells[nameColIndex];
          const value = cells[valueColIndex];

          if (name) {
            // Store with lowercase key for case-insensitive lookup
            // Last definition wins (we're iterating in order, so later definitions overwrite)
            variables.set(name.toLowerCase(), value);
          }
        }
      }
    }
  }

  return variables;
}

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
 * Also checks for variables defined in markdown tables under "## VARIABLES" headings
 * @param {string} code - The code content
 * @param {vscode.NotebookDocument} notebook - The notebook document to search for cell IDs
 * @param {number} currentCellIndex - Index of the current cell being evaluated
 * @returns {Object} - Object containing processed code and any errors
 */
function processVariableSubstitution(code, notebook, currentCellIndex) {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const errors = [];
  let processedCode = code;

  // Parse variable table from markdown cells (only cells before the current one)
  const tableVariables = parseVariableTable(notebook, currentCellIndex);

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
      // Priority 1: Look for output in stored cell outputs (from @options {id: "var"})
      if (cellOutputs.has(variableName)) {
        const output = cellOutputs.get(variableName);
        processedCode = processedCode.replace(placeholder, output);
      }
      // Priority 2: Look for variable in markdown tables
      else if (tableVariables.has(variableName.toLowerCase())) {
        const value = tableVariables.get(variableName.toLowerCase());
        processedCode = processedCode.replace(placeholder, value);
      }
      // Not found anywhere
      else {
        errors.push(`Variable '${variableName}' not found. Define it in a VARIABLES table or run a cell with @options {"id": "${variableName}"}.`);
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
  parseVariableTable,
  storeCellOutput,
  getCellOutput,
  clearCellOutputs,
  readFileContent
};