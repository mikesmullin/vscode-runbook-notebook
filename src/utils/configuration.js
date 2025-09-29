const vscode = require('vscode');

/**
 * Configuration manager for the Runbook Notebook Extension
 * Provides access to user-configurable settings with fallback defaults
 */
class Configuration {
  constructor() {
    this.extensionId = 'runbook-notebook';
  }

  /**
   * Get the VS Code configuration for this extension
   * @returns {vscode.WorkspaceConfiguration}
   */
  getConfig() {
    return vscode.workspace.getConfiguration(this.extensionId);
  }

  /**
   * Get the maximum number of turns for Copilot agent mode
   * @returns {number}
   */
  getMaxAgentTurns() {
    return this.getConfig().get('copilot.maxAgentTurns', 3);
  }

  /**
   * Get comment styles for different languages
   * @returns {Object}
   */
  getCommentStyles() {
    const defaultStyles = {
      'copilot': '//',
      'bash': '#',
      'sh': '#',
      'shell': '#',
      'javascript': '//',
      'js': '//',
      'python': '#',
      'py': '#',
      'typescript': '//',
      'ts': '//',
      'ruby': '#',
      'rb': '#',
      'perl': '#',
      'r': '#',
      'yaml': '#',
      'yml': '#',
      'powershell': '#',
      'ps1': '#'
    };

    const userStyles = this.getConfig().get('languages.commentStyles', {});
    return { ...defaultStyles, ...userStyles };
  }

  /**
   * Get file extensions for different languages
   * @returns {Object}
   */
  getFileExtensions() {
    const defaultExtensions = {
      'javascript': 'js',
      'js': 'js',
      'python': 'py',
      'py': 'py',
      'bash': 'sh',
      'shell': 'sh',
      'sh': 'sh'
    };

    const userExtensions = this.getConfig().get('languages.fileExtensions', {});
    return { ...defaultExtensions, ...userExtensions };
  }

  /**
   * Get shebangs for different languages
   * @returns {Object}
   */
  getShebangs() {
    const defaultShebangs = {
      'javascript': '#!/usr/bin/env node\n',
      'js': '#!/usr/bin/env node\n',
      'python': '#!/usr/bin/env python3\n',
      'py': '#!/usr/bin/env python3\n',
      'bash': '#!/bin/bash\n',
      'shell': '#!/bin/bash\n',
      'sh': '#!/bin/bash\n'
    };

    const userShebangs = this.getConfig().get('languages.shebangs', {});
    return { ...defaultShebangs, ...userShebangs };
  }

  /**
   * Get the default shebang for unknown languages
   * @returns {string}
   */
  getDefaultShebang() {
    return this.getConfig().get('languages.defaultShebang', '#!/bin/bash\n');
  }

  /**
   * Get the default file extension for unknown languages
   * @returns {string}
   */
  getDefaultExtension() {
    return this.getConfig().get('languages.defaultExtension', 'sh');
  }

  /**
   * Get supported languages for the notebook controller
   * @returns {Array<string>}
   */
  getSupportedLanguages() {
    const defaultLanguages = [
      'javascript', 'js', 'bash', 'python', 'shell', 'copilot'
    ];

    return this.getConfig().get('languages.supported', defaultLanguages);
  }

  /**
   * Get execution timeout in seconds
   * @returns {number}
   */
  getDefaultExecutionTimeout() {
    return this.getConfig().get('execution.defaultTimeout', 30);
  }

  /**
   * Get whether to enable markdown rendering in output
   * @returns {boolean}
   */
  getEnableMarkdownRendering() {
    return this.getConfig().get('output.enableMarkdownRendering', true);
  }

  /**
   * Get whether to automatically prompt for scrollable output
   * @returns {boolean}
   */
  getAutoPromptScrollableOutput() {
    return this.getConfig().get('output.autoPromptScrollableOutput', true);
  }

  /**
   * Get debug logging enabled state
   * @returns {boolean}
   */
  getDebugLogging() {
    return this.getConfig().get('debug.enabled', false);
  }

  /**
   * Watch for configuration changes
   * @param {Function} callback - Callback function to call when configuration changes
   * @returns {vscode.Disposable}
   */
  onConfigurationChanged(callback) {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.extensionId)) {
        callback(event);
      }
    });
  }
}

// Export singleton instance
module.exports = new Configuration();