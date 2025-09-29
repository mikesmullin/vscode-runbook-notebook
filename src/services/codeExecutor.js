const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const os = require('os');
const { getFileExtensions, getShebangs, getDefaultShebang, getDefaultExtension, configuration } = require('../constants');

/**
 * Service class for executing code cells
 */
class CodeExecutor {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'runbook-exec');
  }

  /**
   * Execute a code cell
   * @param {string} code - The code to execute
   * @param {string} languageId - The language identifier
   * @param {vscode.CancellationToken} cancellationToken - Cancellation token
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Execution result
   */
  async executeCode(code, languageId, cancellationToken, options = {}) {
    const tempFilePath = await this.writeTempExecutableFile(code, languageId);

    try {
      const result = await this.executeFile(tempFilePath, languageId, cancellationToken, options);
      return result;
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('Failed to clean up temp file:', err);
      }
    }
  }

  /**
   * Write code to a temporary executable file
   * @param {string} code - The code content
   * @param {string} languageId - The language identifier
   * @returns {Promise<string>} - Path to the temporary file
   */
  async writeTempExecutableFile(code, languageId) {
    const hash = crypto.randomBytes(8).toString('hex');
    const fileExtensions = getFileExtensions();
    const shebangs = getShebangs();
    const extension = fileExtensions[languageId] || getDefaultExtension();
    const shebang = shebangs[languageId] || getDefaultShebang();

    await fs.mkdir(this.tempDir, { recursive: true });

    const fileName = `tmp-${hash}.${extension}`;
    const filePath = path.join(this.tempDir, fileName);

    // Normalize line endings to Unix LF to avoid \r issues in Unix environments
    const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const fullContent = shebang + normalizedCode;
    await fs.writeFile(filePath, fullContent, { mode: 0o755 }); // executable

    return filePath;
  }

  /**
   * Execute a file and capture output
   * @param {string} filePath - Path to the file to execute
   * @param {string} languageId - The language identifier
   * @param {vscode.CancellationToken} cancellationToken - Cancellation token
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Execution result with stdout, stderr, and exitCode
   */
  async executeFile(filePath, languageId, cancellationToken, options = {}) {
    return new Promise((resolve, reject) => {
      const { command, args } = this.getExecutionCommand(filePath, languageId);
      const child = spawn(command, args);

      let stdout = '';
      let stderr = '';
      let timeoutId = null;

      // Helper function to kill the process
      const killProcess = () => {
        if (child.pid) {
          try {
            process.kill(child.pid, 'SIGTERM');
            // Give it a moment, then force kill if still running
            setTimeout(() => {
              if (!child.killed) {
                process.kill(child.pid, 'SIGKILL');
              }
            }, 100);
          } catch (err) {
            console.error('Failed to kill process:', err);
          }
        }
      };

      // Handle timeout
      if (options.timeout && typeof options.timeout === 'number' && options.timeout > 0) {
        timeoutId = setTimeout(() => {
          killProcess();
          resolve({
            stdout: stdout + '\n[Process timed out after ' + options.timeout + ' seconds]',
            stderr: stderr + '\n[Process killed due to timeout]',
            exitCode: 124 // Standard timeout exit code
          });
        }, options.timeout * 1000);
      }

      // Handle cancellation
      const cancellationHandler = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        killProcess();
      };

      if (cancellationToken) {
        cancellationToken.onCancellationRequested(cancellationHandler);
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve({ stdout, stderr, exitCode: code });
      });

      child.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(error);
      });
    });
  }

  /**
   * Get the execution command and arguments for a given file and language
   * @param {string} filePath - Path to the file to execute
   * @param {string} languageId - The language identifier
   * @returns {Object} - Object with command and args
   */
  getExecutionCommand(filePath, languageId) {
    let command;
    let args = [];

    if (languageId === 'javascript' || languageId === 'js') {
      command = 'node';
      args = [filePath];
    } else if (languageId === 'python' || languageId === 'py') {
      command = 'python3';
      args = [filePath];
    } else if (languageId === 'bash' || languageId === 'shell' || languageId === 'sh') {
      const wslPath = filePath.replace(/\\/g, '/').replace(/^([A-Z]):/i, (match, drive) => `/mnt/${drive.toLowerCase()}`);
      command = 'bash';
      args = [wslPath];
    } else {
      command = filePath;
      args = [];
    }

    return { command, args };
  }
}

module.exports = {
  CodeExecutor
};