/**
 * Runbook Notebook Extension
 * 
 * This extension creates a notebook-like interface for .md files for Runbooks.
 * It supports two types of cells:
 * - Markdown: rendered markdown
 * - Code: executed via terminal, output shown below
 */

const vscode = require('vscode');
const { NotebookSerializer } = require('./core/notebookSerializer');
const { CellExecutor } = require('./core/cellExecutor');
const { CommandHandler } = require('./core/commandHandler');
const { getSupportedLanguages, configuration } = require('./constants');

/**
 * Main extension class that coordinates all functionality
 */
class RunbookExtension {
  constructor() {
    this.cellExecutor = null;
    this.commandHandler = null;
    this.controller = null;
  }

  /**
   * Initialize the extension
   * @param {vscode.ExtensionContext} context - Extension context
   */
  activate(context) {
    // Initialize services
    this.cellExecutor = new CellExecutor();
    this.commandHandler = new CommandHandler();

    // Register the notebook serializer
    const serializerDisposable = vscode.workspace.registerNotebookSerializer(
      'runbookNotebook',
      new NotebookSerializer()
    );
    context.subscriptions.push(serializerDisposable);

    // Create and register the notebook controller
    this.setupNotebookController(context);

    // Register commands
    this.commandHandler.registerCommands(context);

    // Watch for configuration changes
    this.setupConfigurationWatcher(context);

    console.log('Runbook Notebook Extension activated');
  }

  /**
   * Setup the notebook controller
   * @param {vscode.ExtensionContext} context - Extension context
   */
  setupNotebookController(context) {
    this.controller = vscode.notebooks.createNotebookController(
      'runbookNotebook-controller',
      'runbookNotebook',
      'Runbook Controller'
    );

    this.controller.supportedLanguages = getSupportedLanguages();
    this.controller.supportsExecutionOrder = true;
    this.controller.executeHandler = this.createExecuteHandler();

    context.subscriptions.push(this.controller);
  }

  /**
   * Create the execute handler for the notebook controller
   * @returns {Function} - Execute handler function
   */
  createExecuteHandler() {
    return async (cells, notebook, controller) => {
      for (const cell of cells) {
        const languageId = cell.document?.languageId || cell.languageId || 'unknown';
        const isCodeCell = cell.cellKind === vscode.NotebookCellKind.Code ||
          (cell.document && cell.document.languageId);

        if (isCodeCell) {
          await this.cellExecutor.executeCell(cell, controller, notebook);
        }
      }
    };
  }

  /**
   * Setup configuration change watcher
   * @param {vscode.ExtensionContext} context - Extension context
   */
  setupConfigurationWatcher(context) {
    const configWatcher = configuration.onConfigurationChanged((event) => {
      // Update supported languages if they changed
      if (event.affectsConfiguration('runbook-notebook.languages.supported')) {
        if (this.controller) {
          this.controller.supportedLanguages = getSupportedLanguages();
          console.log('Updated supported languages:', getSupportedLanguages());
        }
      }

      // Log other configuration changes for debugging
      if (configuration.getDebugLogging()) {
        console.log('Runbook Notebook configuration changed:', event);
      }
    });

    context.subscriptions.push(configWatcher);
  }

  /**
   * Deactivate the extension
   */
  deactivate() {
    // Cleanup is handled by VS Code disposing subscriptions
    console.log('Runbook Notebook Extension deactivated');
  }
}

// Create singleton instance
const extension = new RunbookExtension();

/**
 * Extension activation function called by VS Code
 * @param {vscode.ExtensionContext} context - Extension context
 */
function activate(context) {
  extension.activate(context);
}

/**
 * Extension deactivation function called by VS Code
 */
function deactivate() {
  extension.deactivate();
}

module.exports = {
  activate,
  deactivate
};