/**
 * Constants and configuration for the Runbook Notebook Extension
 * 
 * This module now provides access to user-configurable settings.
 * All values can be overridden via VS Code settings under "runbook-notebook.*"
 */

const configuration = require('./utils/configuration');

/**
 * Get language to comment style mapping for @options parsing
 * Configurable via: runbook-notebook.languages.commentStyles
 */
function getCommentStyles() {
  return configuration.getCommentStyles();
}

/**
 * Get file extensions for different languages
 * Configurable via: runbook-notebook.languages.fileExtensions
 */
function getFileExtensions() {
  return configuration.getFileExtensions();
}

/**
 * Get shebangs for different languages
 * Configurable via: runbook-notebook.languages.shebangs
 */
function getShebangs() {
  return configuration.getShebangs();
}

/**
 * Get default shebang for unknown languages
 * Configurable via: runbook-notebook.languages.defaultShebang
 */
function getDefaultShebang() {
  return configuration.getDefaultShebang();
}

/**
 * Get default file extension for unknown languages
 * Configurable via: runbook-notebook.languages.defaultExtension
 */
function getDefaultExtension() {
  return configuration.getDefaultExtension();
}

/**
 * Get maximum turns for Copilot agent mode
 * Configurable via: runbook-notebook.copilot.maxAgentTurns
 */
function getMaxAgentTurns() {
  return configuration.getMaxAgentTurns();
}

/**
 * Get default AI model for Copilot queries
 * Configurable via: runbook-notebook.copilot.defaultModel
 */
function getDefaultModel() {
  return configuration.getDefaultModel();
}

/**
 * Get supported languages for the notebook controller
 * Configurable via: runbook-notebook.languages.supported
 */
function getSupportedLanguages() {
  return configuration.getSupportedLanguages();
}

// Legacy constants for backward compatibility (deprecated)
const COMMENT_STYLES = getCommentStyles();
const FILE_EXTENSIONS = getFileExtensions();
const SHEBANGS = getShebangs();
const DEFAULT_SHEBANG = getDefaultShebang();
const DEFAULT_EXTENSION = getDefaultExtension();
const MAX_AGENT_TURNS = getMaxAgentTurns();
const SUPPORTED_LANGUAGES = getSupportedLanguages();

module.exports = {
  // New configurable functions (recommended)
  getCommentStyles,
  getFileExtensions,
  getShebangs,
  getDefaultShebang,
  getDefaultExtension,
  getMaxAgentTurns,
  getDefaultModel,
  getSupportedLanguages,

  // Legacy constants (deprecated - use functions above)
  COMMENT_STYLES,
  FILE_EXTENSIONS,
  SHEBANGS,
  DEFAULT_SHEBANG,
  DEFAULT_EXTENSION,
  MAX_AGENT_TURNS,
  SUPPORTED_LANGUAGES,

  // Configuration instance for advanced usage
  configuration
};