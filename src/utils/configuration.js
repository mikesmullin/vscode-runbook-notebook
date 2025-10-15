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
   * Get comment styles for different languages
   * @returns {Object}
   */
  getCommentStyles() {
    const defaultStyles = {
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
      'bash', 'javascript', 'js', 'python', 'shell'
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