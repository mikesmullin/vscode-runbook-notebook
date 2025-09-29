/**
 * Runbook Notebook Extension
 * 
 * This extension creates a notebook-like interface for .md files for Runbooks.
 * It supports three types of cells:
 * - Markdown: rendered markdown
 * - Code (normal): executed via terminal, output shown below
 * - Code (copilot): prompts sent to GitHub Copilot, response shown below
 */

const vscode = require('vscode');
const { NotebookSerializer } = require('./core/notebookSerializer');
const { CellExecutor } = require('./core/cellExecutor');
const { CommandHandler } = require('./core/commandHandler');
const { CopilotService } = require('./services/copilotService');
const { SUPPORTED_LANGUAGES } = require('./constants');

/**
 * Main extension class that coordinates all functionality
 */
class RunbookExtension {
  constructor() {
    this.copilotService = null;
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
    this.copilotService = new CopilotService();
    this.cellExecutor = new CellExecutor(this.copilotService);
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

    // Add services to subscriptions for cleanup
    context.subscriptions.push(this.copilotService);

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

    this.controller.supportedLanguages = SUPPORTED_LANGUAGES;
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