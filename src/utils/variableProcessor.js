/**
 * Global storage for cell execution outputs indexed by their IDs
 */
const cellOutputs = new Map();

/**
 * Process variable substitution in copilot code
 * Replaces {{variable}} with outputs from cells that have matching @options.id
 * @param {string} code - The copilot code content
 * @param {vscode.NotebookDocument} notebook - The notebook document to search for cell IDs
 * @returns {Object} - Object containing processed code and any errors
 */
function processVariableSubstitution(code, notebook) {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const errors = [];
  let processedCode = code;

  let match;
  while ((match = variablePattern.exec(code)) !== null) {
    const variableName = match[1];
    const placeholder = match[0]; // {{variableName}}

    // Look for output in stored cell outputs
    if (cellOutputs.has(variableName)) {
      const output = cellOutputs.get(variableName);
      const replacement = `\`\`\`\n${output}\n\`\`\``;
      processedCode = processedCode.replace(placeholder, replacement);
    } else {
      errors.push(`Variable '${variableName}' not found. Please run the cell with @options {"id": "${variableName}"} first.`);
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
  clearCellOutputs
};