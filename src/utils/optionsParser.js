const vscode = require('vscode');
const { getCommentStyles } = require('../constants');

/**
 * Parse @options from the first line of code based on language-appropriate comment syntax
 * @param {string} code - The code content
 * @param {string} languageId - The language identifier
 * @returns {Object} - Object containing parsed options and cleaned code
 */
function parseOptionsFromCode(code, languageId) {
  const lines = code.split('\n');
  if (lines.length === 0) {
    return { options: {}, cleanedCode: code };
  }

  const commentStyles = getCommentStyles();
  const commentStyle = commentStyles[languageId] || '//';
  const optionsPrefix = `${commentStyle} @options `;
  const firstLine = lines[0].trim();

  if (!firstLine.startsWith(optionsPrefix)) {
    return { options: {}, cleanedCode: code };
  }

  const optionsStr = firstLine.substring(optionsPrefix.length).trim();
  let options = {};

  try {
    // First try standard JSON parsing
    options = JSON.parse(optionsStr);
  } catch (e) {
    // Try using Function constructor as fallback for JavaScript object notation
    try {
      options = new Function('return ' + optionsStr)();
    } catch (e2) {
      console.warn(`Failed to parse @options in ${languageId} cell: ${e2.message}`);
      // Show warning to user about invalid syntax
      vscode.window.showWarningMessage(
        `Invalid @options syntax in ${languageId} cell. Expected format: ${commentStyle} @options {"key": "value"}. Using default options.`
      );
      options = {};
    }
  }

  // Remove the @options line from the code
  const cleanedCode = lines.slice(1).join('\n');

  return { options, cleanedCode };
}

module.exports = {
  parseOptionsFromCode
};