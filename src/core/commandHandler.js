const vscode = require('vscode');

/**
 * Handler for VS Code commands related to the runbook extension
 */
class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.setupCommands();
  }

  /**
   * Setup all command handlers
   */
  setupCommands() {
    this.commands.set('runbookNotebook.openAsTextEditor', this.openAsTextEditor.bind(this));
    this.commands.set('runbookNotebook.openAsNotebook', this.openAsNotebook.bind(this));
    this.commands.set('runbookNotebook.insertCodeCell', this.insertCodeCell.bind(this));
  }

  /**
   * Register all commands with VS Code
   * @param {vscode.ExtensionContext} context - Extension context
   */
  registerCommands(context) {
    for (const [commandId, handler] of this.commands) {
      const disposable = vscode.commands.registerCommand(commandId, handler);
      context.subscriptions.push(disposable);
    }
  }

  /**
   * Open the current notebook as a text editor
   */
  async openAsTextEditor() {
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (activeTab && activeTab.input && activeTab.input.uri) {
      await vscode.commands.executeCommand('vscode.openWith', activeTab.input.uri, 'default', { preview: false });
    }
  }

  /**
   * Open the current text file as a notebook
   */
  async openAsNotebook() {
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
    if (activeTab && activeTab.input && activeTab.input.uri) {
      await vscode.commands.executeCommand('vscode.openWith', activeTab.input.uri, 'runbookNotebook', { preview: false });
    }
  }

  /**
   * Insert a new code cell at the current position
   */
  async insertCodeCell() {
    const editor = vscode.window.activeNotebookEditor;
    if (editor) {
      const index = editor.selection.end;
      const cellData = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '', 'bash');
      const edit = new vscode.WorkspaceEdit();
      edit.set(editor.notebook.uri, [new vscode.NotebookEdit(new vscode.NotebookRange(index, index), [cellData])]);
      await vscode.workspace.applyEdit(edit);
    }
  }
}

module.exports = {
  CommandHandler
};