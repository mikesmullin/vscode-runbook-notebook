/**
 * Utility functions for detecting markdown content in text
 */

/**
 * Enhanced markdown detection that looks for various markdown patterns
 * @param {string} content - Content to check
 * @returns {boolean} - True if content contains markdown patterns
 */
function containsMarkdownPatterns(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Pattern 1: Triple backticks (code blocks)
  const codeBlockPattern = /(?<!`)```(?!`)[\w]*[\s\S]*?```(?!`)/;
  if (codeBlockPattern.test(content)) {
    return true;
  }

  // Pattern 2: Headers at start of line (# ## ### etc.)
  const headerPattern = /^#{1,6}\s+.+$/m;
  if (headerPattern.test(content)) {
    return true;
  }

  // Pattern 3: Bullet points at start of line (- * +)
  const bulletPattern = /^[\s]*[-*+]\s+.+$/m;
  if (bulletPattern.test(content)) {
    return true;
  }

  // Pattern 4: Bold text (two asterisks)
  const boldPattern = /\*\*[^*]+\*\*/;
  if (boldPattern.test(content)) {
    return true;
  }

  // Pattern 5: Triple dash (horizontal rule) at start of line
  const horizontalRulePattern = /^[\s]*---[\s]*$/m;
  if (horizontalRulePattern.test(content)) {
    return true;
  }

  // Pattern 6: Markdown table dividers - supports both full format (|--|--|) and minimal format (--|--|--) 
  const tableDividerPattern = /^\s*((\|[\s]*[-:]+[\s]*)+\||[\s]*[-:]+[\s]*(\|[\s]*[-:]+[\s]*)+)/m;
  if (tableDividerPattern.test(content)) {
    return true;
  }

  // Pattern 7: Markdown table rows (basic detection)
  const tableRowPattern = /^\s*\|.*\|.*\|/m;
  if (tableRowPattern.test(content)) {
    return true;
  }

  return false;
}

/**
 * Legacy function name for backward compatibility
 * @param {string} content - Content to check
 * @returns {boolean} - True if content contains markdown patterns
 */
function containsMarkdownCodeBlocks(content) {
  return containsMarkdownPatterns(content);
}

module.exports = {
  containsMarkdownPatterns,
  containsMarkdownCodeBlocks
};