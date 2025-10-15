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

const { parseOptionsFromCode } = require('../utils/optionsParser');
const { processVariableSubstitution, storeCellOutput } = require('../utils/variableProcessor');
const { CodeExecutor } = require('../services/codeExecutor');
const { containsMarkdownPatterns } = require('../utils/markdownDetector');

/**
 * Service class for executing notebook cells
 */
class CellExecutor {
  constructor() {
    this.codeExecutor = new CodeExecutor();
  }

  /**
   * Execute a single notebook cell
   * @param {vscode.NotebookCell} cell - The cell to execute
   * @param {vscode.NotebookController} controller - The notebook controller
   * @param {vscode.NotebookDocument} notebook - The notebook document
   */
  async executeCell(cell, controller, notebook) {
    const execution = controller.createNotebookCellExecution(cell);
    execution.start(Date.now());

    try {
      const languageId = cell.document?.languageId || cell.languageId || 'unknown';
      const isCodeCell = cell.cellKind === vscode.NotebookCellKind.Code ||
        (cell.document && cell.document.languageId);

      if (isCodeCell) {
        await this.executeCodeCell(cell, execution, notebook);
      }
    } catch (error) {
      this.handleExecutionError(error, execution);
    }
  }

  /**
   * Execute a code cell
   * @param {vscode.NotebookCell} cell - The cell to execute
   * @param {vscode.NotebookCellExecution} execution - The execution context
   * @param {vscode.NotebookDocument} notebook - The notebook document
   */
  async executeCodeCell(cell, execution, notebook) {
    // Check if execution was cancelled
    if (execution.token.isCancellationRequested) {
      execution.end(false, Date.now());
      return;
    }

    const code = cell.document.getText();
    const languageId = cell.document?.languageId || cell.languageId || 'unknown';
    const { options, cleanedCode } = parseOptionsFromCode(code, languageId);

    // Process variable substitution
    const { processedCode, errors } = processVariableSubstitution(cleanedCode, notebook);

    // If there are variable substitution errors, show them and stop execution
    if (errors.length > 0) {
      const errorMessage = errors.join('\n');
      execution.replaceOutput([new vscode.NotebookCellOutput([
        vscode.NotebookCellOutputItem.error({
          name: 'VariableSubstitutionError',
          message: errorMessage,
          stack: errorMessage
        })
      ])]);
      execution.end(false, Date.now());
      return;
    }

    // Execute the code
    const result = await this.codeExecutor.executeCode(processedCode, languageId, execution.token, options);

    // Handle execution result
    if (result.exitCode !== 0) {
      this.handleCodeExecutionError(result, execution);
    } else {
      this.handleCodeExecutionSuccess(result, execution, options);
    }
  }

  /**
   * Handle successful code execution
   * @param {Object} result - Execution result
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {Object} options - Cell options
   */
  handleCodeExecutionSuccess(result, execution, options) {
    const output = result.stdout + (result.stderr ? '\nSTDERR:\n' + result.stderr : '');

    // Check if output contains markdown patterns
    const hasMarkdown = containsMarkdownPatterns(output);

    // Use markdown MIME type if output contains markdown patterns, otherwise plain text
    const mimeType = hasMarkdown ? 'text/markdown' : 'text/plain';

    // For markdown output, add trailing spaces to each line for proper line breaks
    let displayOutput = output;
    if (hasMarkdown) {
      const lines = output.split('\n');
      displayOutput = lines.map((line, index) => {
        // Add trailing spaces to all lines except the very last one
        if (index < lines.length - 1) {
          return line + '  ';
        }
        return line;
      }).join('\n');
    }

    const cellOutput = new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.text(displayOutput, mimeType)
    ]);
    execution.replaceOutput([cellOutput]);

    // Store output for variable substitution if ID is provided
    if (options.id) {
      storeCellOutput(options.id, result.stdout.trim());
    }

    execution.end(true, Date.now());
  }  /**
   * Handle code execution error
   * @param {Object} result - Execution result with error
   * @param {vscode.NotebookCellExecution} execution - Execution context
   */
  handleCodeExecutionError(result, execution) {
    const errorMessage = `Command failed with exit code ${result.exitCode}`;
    const errorOutput = result.stderr || result.stdout || 'Unknown error';
    execution.replaceOutput([new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.error({
        name: 'ExecutionError',
        message: errorMessage,
        stack: errorOutput
      })
    ])]);
    execution.end(false, Date.now());
  }



  /**
   * Handle general execution errors
   * @param {Error} error - The error that occurred
   * @param {vscode.NotebookCellExecution} execution - Execution context
   */
  handleExecutionError(error, execution) {
    // Check if execution was cancelled
    if (execution.token.isCancellationRequested) {
      execution.end(false, Date.now());
      return;
    }

    execution.replaceOutput([new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.error({
        name: 'ExecutionError',
        message: `Error: ${error.message}`,
        stack: error.stack || error.message
      })
    ])]);
    execution.end(false, Date.now());
  }
}

module.exports = {
  CellExecutor
};