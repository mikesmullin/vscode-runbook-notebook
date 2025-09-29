/**
 * Mock vscode module for testing
 */

const vscode = {
  window: {
    showWarningMessage: (message) => {
      console.log(`[Warning] ${message}`);
      return Promise.resolve();
    }
  }
};

module.exports = vscode;