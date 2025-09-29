/**
 * Mock vscode module for testing
 */

const vscode = {
  window: {
    showWarningMessage: (message) => {
      console.log(`[Warning] ${message}`);
      return Promise.resolve();
    },
    showInformationMessage: (message, ...options) => {
      console.log(`[Info] ${message}`);
      return Promise.resolve(options[0]); // Return first option by default
    },
    createOutputChannel: (name) => {
      return {
        appendLine: (message) => {
          // console.log(`[${name}] ${message}`);
        },
        dispose: () => { }
      };
    }
  },
  workspace: {
    getConfiguration: (section) => {
      return {
        get: (key) => false, // Default to false for scrolling setting
        update: (key, value, target) => Promise.resolve()
      };
    },
    workspaceFolders: [{
      uri: { fsPath: require('path').join(__dirname, '..') }
    }],
    getWorkspaceFolder: (uri) => ({
      uri: { fsPath: require('path').join(__dirname, '..') }
    })
  },
  ConfigurationTarget: {
    Workspace: 1
  },
  NotebookCellOutput: class {
    constructor(items) {
      this.items = items;
    }
  },
  NotebookCellOutputItem: {
    text: (content, mimeType) => ({
      data: content,
      mime: mimeType
    })
  }
};

module.exports = vscode;