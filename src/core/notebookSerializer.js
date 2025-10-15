const vscode = require('vscode');

/**
 * The NotebookSerializer class converts between the raw file content and VS Code's notebook data structure
 */
class NotebookSerializer {
  /**
   * deserializeNotebook is called when opening a .md file - converts file content to notebook cells
   * @param {Uint8Array} content - Raw file content
   * @param {vscode.CancellationToken} token - Cancellation token
   * @returns {vscode.NotebookData} - Notebook data structure
   */
  deserializeNotebook(content, token) {
    const text = new TextDecoder().decode(content);
    const lines = text.split('\n');
    const cells = [];
    let currentCell = null;
    let inCodeBlock = false;
    let inOutputBlock = false;
    let codeBlockLang = '';
    let codeContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block - create a code cell
          if (currentCell) {
            // Remove trailing newline from code content
            currentCell.value = codeContent.replace(/\n$/, '');
            cells.push(currentCell);
          }
          currentCell = null;
          inCodeBlock = false;
          codeContent = '';
        } else if (inOutputBlock) {
          // End of output block - skip it
          inOutputBlock = false;
        } else {
          // Start of code block
          if (currentCell) {
            cells.push(currentCell);
          }
          // Extract language from ```language (no longer support fenced block attributes)
          const match = line.match(/^```(\w+)\s*$/);
          codeBlockLang = match ? match[1] : '';

          // Create code cell
          const cellKind = vscode.NotebookCellKind.Code;
          currentCell = new vscode.NotebookCellData(cellKind, '', codeBlockLang);
          inCodeBlock = true;
          codeContent = '';
        }
      } else if (line === '**Output:**' && i + 1 < lines.length && lines[i + 1] === '```') {
        // Start of output section - skip it
        inOutputBlock = true;
        i++; // Skip the next ``` line
      } else if (inCodeBlock && !inOutputBlock) {
        // Inside code block - accumulate the code content
        codeContent += line + '\n';
      } else if (!inOutputBlock) {
        // Regular markdown content - create or continue a markdown cell
        if (!currentCell || currentCell.kind !== vscode.NotebookCellKind.Markup) {
          if (currentCell) {
            cells.push(currentCell);
          }
          currentCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, '', 'markdown');
        }
        currentCell.value += line + '\n';
      }
    }
    // Don't forget the last cell
    if (currentCell) {
      cells.push(currentCell);
    }

    return new vscode.NotebookData(cells);
  }

  /**
   * serializeNotebook is called when saving the notebook - converts notebook cells back to .md content
   * @param {vscode.NotebookData} data - Notebook data structure
   * @param {vscode.CancellationToken} token - Cancellation token
   * @returns {Uint8Array} - Serialized file content
   */
  serializeNotebook(data, token) {
    let content = '';
    for (const cell of data.cells) {
      if (cell.kind === vscode.NotebookCellKind.Markup) {
        content += cell.value;
      } else if (cell.kind === vscode.NotebookCellKind.Code) {
        content += this.serializeCodeCell(cell);
      }
    }
    return new TextEncoder().encode(content);
  }

  /**
   * Serialize a code cell to markdown format
   * @param {vscode.NotebookCellData} cell - The cell to serialize
   * @returns {string} - Serialized cell content
   */
  serializeCodeCell(cell) {
    let content = '';

    // Write the code block with language identifier
    const langLine = '```' + cell.languageId;
    // Remove trailing whitespace/newlines from cell value to avoid extra spaces
    const cleanValue = cell.value.replace(/\s+$/, '');
    content += langLine + '\n' + cleanValue + '\n```\n';

    // Include cell outputs if they exist
    if (cell.outputs && cell.outputs.length > 0) {
      content += '\n**Output:**\n```\n';
      for (const output of cell.outputs) {
        content += this.serializeOutput(output);
      }
      content += '```\n';
    }

    content += '\n';
    return content;
  }

  /**
   * Serialize cell output to text format
   * @param {vscode.NotebookCellOutput} output - The output to serialize
   * @returns {string} - Serialized output content
   */
  serializeOutput(output) {
    let content = '';
    for (const item of output.items) {
      if (item.mime === 'text/plain' || item.mime === 'text/markdown') {
        // Decode the output text and add it
        const outputText = new TextDecoder().decode(item.data);
        // Add trailing spaces to each line for proper markdown line breaks
        const linesWithSpaces = outputText
          .split('\n')
          .map(line => line + '  ')
          .join('\n');
        content += linesWithSpaces;
      } else if (item.mime === 'application/vnd.code.notebook.error') {
        // Handle error outputs
        const errorData = JSON.parse(new TextDecoder().decode(item.data));
        content += `Error: ${errorData.message}\n`;
        if (errorData.stack) {
          content += errorData.stack + '\n';
        }
      }
    }
    return content;
  }
}

module.exports = {
  NotebookSerializer
};