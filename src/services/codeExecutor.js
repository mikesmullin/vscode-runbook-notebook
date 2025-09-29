const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const os = require('os');

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

const { getFileExtensions, getShebangs, getDefaultShebang, getDefaultExtension, configuration } = require('../constants');

/**
 * Service class for executing code cells
 */
class CodeExecutor {
  constructor() {
    // Use workspace root instead of system temp directory
    this.tempDir = this.getWorkspaceRoot();
  }

  /**
   * Get the workspace root directory
   * @returns {string} - Path to workspace root
   */
  getWorkspaceRoot() {
    if (vscode && vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      return vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    // Fallback to current working directory if no workspace
    return process.cwd();
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
      const { command, args, spawnOptions } = this.getExecutionCommand(filePath, languageId);
      const child = spawn(command, args, spawnOptions);

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
   * @returns {Object} - Object with command, args, and spawnOptions
   */
  getExecutionCommand(filePath, languageId) {
    let command;
    let args = [];
    const spawnOptions = {
      cwd: this.tempDir, // Run from workspace root
      env: { ...process.env }, // Forward VS Code's environment variables
      shell: false
    };

    if (languageId === 'javascript' || languageId === 'js') {
      command = 'node';
      args = [filePath];
    } else if (languageId === 'python' || languageId === 'py') {
      command = 'python3';
      args = [filePath];
    } else if (languageId === 'bash' || languageId === 'shell' || languageId === 'sh') {
      // Use default terminal shell (login shell) instead of hardcoded bash
      const shell = this.getDefaultShell();

      if (shell === 'wsl.exe') {
        // For WSL, convert Windows path to WSL path
        const wslPath = filePath.replace(/\\/g, '/').replace(/^([A-Z]):/i, (match, drive) => `/mnt/${drive.toLowerCase()}`);
        command = 'wsl.exe';
        args = ['-e', 'bash', '-l', '-c', `exec "${wslPath}"`];
      } else {
        command = shell;
        args = ['-l', '-c', `exec "${filePath}"`]; // -l for login shell, -c to execute command
      }
    } else {
      command = filePath;
      args = [];
    }

    return { command, args, spawnOptions };
  }

  /**
   * Get the default shell configured in VS Code
   * @returns {string} - Default shell command
   */
  getDefaultShell() {
    // Try to get the default terminal profile from VS Code configuration
    if (vscode && vscode.workspace) {
      const config = vscode.workspace.getConfiguration('terminal.integrated');

      // Check for platform-specific default profile
      const platform = os.platform();
      if (platform === 'win32') {
        const defaultProfile = config.get('defaultProfile.windows');
        if (defaultProfile === 'WSL') {
          return 'wsl.exe';
        }
        if (defaultProfile === 'PowerShell') {
          return 'powershell.exe';
        }
        if (defaultProfile === 'Command Prompt') {
          return 'cmd.exe';
        }
        // Check if WSL is available as default
        const profiles = config.get('profiles.windows', {});
        if (profiles['WSL'] || profiles['Ubuntu'] || profiles['Ubuntu (WSL)']) {
          return 'wsl.exe';
        }
      } else if (platform === 'darwin') {
        const defaultProfile = config.get('defaultProfile.osx');
        if (defaultProfile === 'zsh') {
          return '/bin/zsh';
        }
        if (defaultProfile === 'bash') {
          return '/bin/bash';
        }
      } else if (platform === 'linux') {
        const defaultProfile = config.get('defaultProfile.linux');
        if (defaultProfile === 'zsh') {
          return '/bin/zsh';
        }
        if (defaultProfile === 'bash') {
          return '/bin/bash';
        }
      }
    }

    // Fallback based on platform
    const platform = os.platform();
    if (platform === 'win32') {
      // Check if we're in WSL context or if WSL is preferred
      if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
        return '/bin/bash'; // We're inside WSL
      }
      return 'wsl.exe'; // Prefer WSL on Windows
    } else if (platform === 'darwin') {
      return '/bin/zsh'; // Default shell on macOS
    } else {
      return '/bin/bash'; // Default for Linux
    }
  }
}

module.exports = {
  CodeExecutor
};