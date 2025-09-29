const vscode = require('vscode');
const { spawn } = require('child_process');
const os = require('os');
const { MAX_AGENT_TURNS } = require('../constants');

/**
 * Service class for interacting with GitHub Copilot
 */
class CopilotService {
  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Runbook Copilot');
    this.hasPromptedForScrolling = false;
  }

  /**
   * Check if notebook output scrolling is enabled and prompt user to enable it if not
   */
  async checkAndPromptForScrollableOutput() {
    // Only prompt once per session
    if (this.hasPromptedForScrolling) {
      return;
    }

    this.hasPromptedForScrolling = true;

    try {
      const config = vscode.workspace.getConfiguration('notebook');
      const currentScrolling = config.get('output.scrolling');

      // If scrolling is already enabled, nothing to do
      if (currentScrolling) {
        return;
      }

      // Show a one-click prompt to enable scrollable output
      const selection = await vscode.window.showInformationMessage(
        'Enable scrollable notebook output for better Copilot streaming experience? This prevents "Output is truncated" warnings.',
        'Enable Scrolling',
        'Not Now'
      );

      if (selection === 'Enable Scrolling') {
        await config.update('output.scrolling', true, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage('Scrollable notebook output enabled! Long Copilot responses will now be fully scrollable.');
      }
    } catch (error) {
      // Fail silently - this is a nice-to-have feature
      this.outputChannel.appendLine(`Could not check scrollable output setting: ${error.message}`);
    }
  }

  /**
   * Send a prompt to Copilot and get the response
   * @param {string} prompt - The prompt to send
   * @param {vscode.CancellationToken} token - Cancellation token
   * @param {Object} options - Options for the request
   * @param {vscode.NotebookCellExecution} execution - Execution context for streaming updates
   * @returns {Promise<Object>} - Response object with content and model info
   */
  async askCopilot(prompt, token, options = {}, execution = null) {
    try {
      const models = await this.selectCopilotModels(options);
      const model = models[0];

      this.outputChannel.appendLine(`Selected model: ${model.family}, mode: ${options.mode || 'ask'}`);

      const tools = this.getToolsForMode(options.mode);
      this.outputChannel.appendLine(`Tools provided: ${tools.length}`);

      const response = await this.executeAgentLoop(model, prompt, tools, token, execution);

      return {
        content: response,
        model: model.name
      };

    } catch (error) {
      this.outputChannel.appendLine(`Error: ${error}`);
      throw this.handleCopilotError(error);
    }
  }

  /**
   * Select appropriate Copilot models
   * @param {Object} options - Options that may specify model preference
   * @returns {Promise<Array>} - Array of available models
   */
  async selectCopilotModels(options) {
    let models = await vscode.lm.selectChatModels({
      vendor: 'copilot'
    });

    if (models.length === 0) {
      throw new Error('No Copilot models available. Please ensure GitHub Copilot extension is installed and you have an active subscription.');
    }

    this.outputChannel.appendLine(`Available models: ${models.map(m => m.family).join(', ')}`);

    // Filter by model if specified
    if (options.model) {
      const filtered = models.filter(m => m.family.includes(options.model));
      this.outputChannel.appendLine(`Filtered for '${options.model}': ${filtered.map(m => m.family).join(', ')}`);
      if (filtered.length > 0) {
        models = filtered;
      } else {
        this.outputChannel.appendLine(`Specified model '${options.model}' not found. Using default model.`);
      }
    }

    return models;
  }

  /**
   * Get tools based on the mode
   * @param {string} mode - The mode (e.g., 'agent')
   * @returns {Array} - Array of tool definitions
   */
  getToolsForMode(mode) {
    if (mode === 'agent') {
      return [{
        name: 'execute_command',
        description: 'Execute a shell command in the terminal and return the output.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The shell command to execute (e.g., "ls -la" or "whoami").'
            }
          },
          required: ['command']
        }
      }];
    }
    return [];
  }

  /**
   * Execute the agent conversation loop with tool support
   * @param {Object} model - The language model
   * @param {string} prompt - Initial prompt
   * @param {Array} tools - Available tools
   * @param {vscode.CancellationToken} token - Cancellation token
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @returns {Promise<string>} - Final response content
   */
  async executeAgentLoop(model, prompt, tools, token, execution) {
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];
    let fullResponse = '';
    let turnCount = 0;

    while (turnCount < MAX_AGENT_TURNS) {
      turnCount++;
      this.outputChannel.appendLine(`\n--- Turn ${turnCount} ---`);

      const response = await model.sendRequest(messages, { tools }, token);
      const { turnResponse, toolCalls, hasToolCalls } = await this.processModelResponse(
        response, token, execution, fullResponse
      );

      fullResponse += turnResponse;

      if (hasToolCalls) {
        await this.handleToolCalls(toolCalls, messages, turnResponse, execution, fullResponse);
      } else {
        // No more tool calls, conversation is complete
        this.updateExecutionOutput(execution, fullResponse);
        break;
      }
    }

    return fullResponse;
  }

  /**
   * Process the model response stream
   * @param {Object} response - The model response
   * @param {vscode.CancellationToken} token - Cancellation token
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {string} previousContent - Content from previous turns
   * @returns {Promise<Object>} - Object with response data
   */
  async processModelResponse(response, token, execution, previousContent) {
    let turnResponse = '';
    let toolCalls = [];

    try {
      let streamingOutput = previousContent;
      for await (const part of response.stream) {
        if (token.isCancellationRequested) {
          break;
        }
        if (part instanceof vscode.LanguageModelTextPart) {
          const text = part.value;
          turnResponse += text;
          streamingOutput += text;
          this.outputChannel.appendLine(`Text part: ${text}`);

          this.updateExecutionOutput(execution, streamingOutput);
        } else if (part instanceof vscode.LanguageModelToolCallPart) {
          toolCalls.push(part);
          this.outputChannel.appendLine(`Tool call part: ${part.name} with callId: ${part.callId} and input: ${JSON.stringify(part.input)}`);
        }
      }
    } catch (error) {
      this.outputChannel.appendLine(`Stream error: ${error.message}`);
    }

    this.outputChannel.appendLine(`Response text: ${turnResponse}`);
    this.outputChannel.appendLine(`Tool calls found: ${toolCalls.length}`);

    const hasToolCalls = toolCalls.length > 0 || this.parseToolCallsFromText(turnResponse).length > 0;

    return { turnResponse, toolCalls, hasToolCalls };
  }

  /**
   * Handle tool calls and update conversation
   * @param {Array} toolCalls - Tool calls from the model
   * @param {Array} messages - Conversation messages
   * @param {string} turnResponse - Current turn response text
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {string} fullResponse - Full accumulated response
   */
  async handleToolCalls(toolCalls, messages, turnResponse, execution, fullResponse) {
    // Add the assistant message with tool calls to the conversation
    const assistantMessage = vscode.LanguageModelChatMessage.Assistant([
      ...(turnResponse ? [new vscode.LanguageModelTextPart(turnResponse)] : []),
      ...toolCalls
    ]);
    messages.push(assistantMessage);

    // Execute each tool call
    for (const toolCall of toolCalls) {
      if (toolCall.name === 'execute_command') {
        await this.executeToolCommand(toolCall, messages, execution, fullResponse);
      }
    }

    // Handle fallback tool calls parsed from text
    const textToolCalls = this.parseToolCallsFromText(turnResponse);
    for (const textToolCall of textToolCalls) {
      await this.executeTextToolCommand(textToolCall, messages, execution, fullResponse);
    }
  }

  /**
   * Execute a tool command and handle the result
   * @param {Object} toolCall - The tool call object
   * @param {Array} messages - Conversation messages
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {string} fullResponse - Current full response
   */
  async executeToolCommand(toolCall, messages, execution, fullResponse) {
    const command = toolCall.input.command;
    this.outputChannel.appendLine(`Executing tool: ${command}`);

    try {
      const result = await this.executeCommand(command);
      this.outputChannel.appendLine(`Tool result: ${result}`);

      // Add tool result message
      messages.push(vscode.LanguageModelChatMessage.User([
        new vscode.LanguageModelToolResultPart(toolCall.callId, [new vscode.LanguageModelTextPart(result)])
      ]));

      const toolOutput = `\n\nExecuted: ${command}\nOutput: ${result}`;
      fullResponse += toolOutput;
      this.updateExecutionOutput(execution, fullResponse);
    } catch (error) {
      this.handleToolError(error, toolCall, messages, execution, fullResponse, command);
    }
  }

  /**
   * Handle tool execution errors
   * @param {Error} error - The error that occurred
   * @param {Object} toolCall - The tool call object
   * @param {Array} messages - Conversation messages
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {string} fullResponse - Current full response
   * @param {string} command - The command that failed
   */
  handleToolError(error, toolCall, messages, execution, fullResponse, command) {
    this.outputChannel.appendLine(`Tool error: ${error.message}`);

    // Add error result message
    messages.push(vscode.LanguageModelChatMessage.User([
      new vscode.LanguageModelToolResultPart(toolCall.callId, [new vscode.LanguageModelTextPart(`Error: ${error.message}`)])
    ]));

    const errorOutput = `\n\nError executing ${command}: ${error.message}`;
    fullResponse += errorOutput;
    this.updateExecutionOutput(execution, fullResponse);
  }

  /**
   * Parse tool calls from text response (fallback for models without structured tool support)
   * @param {string} text - The response text
   * @returns {Array} - Array of parsed tool calls
   */
  parseToolCallsFromText(text) {
    const toolCallMatch = text.match(/🛠️ execute_command \(.*?\) (\{.*?\})/);
    if (toolCallMatch) {
      try {
        const args = JSON.parse(toolCallMatch[1]);
        return [{ command: args.command }];
      } catch (error) {
        this.outputChannel.appendLine(`Failed to parse tool call from text: ${error.message}`);
      }
    }
    return [];
  }

  /**
   * Execute a tool command parsed from text
   * @param {Object} textToolCall - Parsed tool call
   * @param {Array} messages - Conversation messages
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {string} fullResponse - Current full response
   */
  async executeTextToolCommand(textToolCall, messages, execution, fullResponse) {
    const command = textToolCall.command;
    this.outputChannel.appendLine(`Parsed tool call from text: ${command}`);

    try {
      const result = await this.executeCommand(command);
      this.outputChannel.appendLine(`Executed: ${command}, Result: ${result}`);

      // Add a simple user message with the result
      messages.push(vscode.LanguageModelChatMessage.User(`Command executed: ${command}\nOutput: ${result}`));
      const toolOutput = `\n\nExecuted: ${command}\nOutput: ${result}`;
      fullResponse += toolOutput;
      this.updateExecutionOutput(execution, fullResponse);
    } catch (error) {
      this.outputChannel.appendLine(`Execution error: ${error.message}`);
      messages.push(vscode.LanguageModelChatMessage.User(`Command execution failed: ${error.message}`));
      const errorOutput = `\n\nError: ${error.message}`;
      fullResponse += errorOutput;
      this.updateExecutionOutput(execution, fullResponse);
    }
  }

  /**
   * Update notebook cell execution output
   * @param {vscode.NotebookCellExecution} execution - Execution context
   * @param {string} content - Content to display
   */
  updateExecutionOutput(execution, content) {
    if (execution) {
      // Check if content contains triple-backticks (markdown code blocks)
      const hasCodeBlocks = this.containsMarkdownCodeBlocks(content);

      let cellOutput;
      if (hasCodeBlocks) {
        // Use markdown mime type for rich output when code blocks are detected
        cellOutput = new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.text(content, 'text/markdown')
        ]);
      } else {
        // Use plain text for regular responses
        cellOutput = new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.text(content, 'text/plain')
        ]);
      }

      execution.replaceOutput([cellOutput]);
    }
  }

  /**
   * Check if content contains markdown code blocks (triple-backticks)
   * @param {string} content - Content to check
   * @returns {boolean} - True if content contains markdown code blocks
   */
  containsMarkdownCodeBlocks(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Look for triple-backticks patterns that indicate markdown code blocks
    // Uses negative lookbehind and lookahead to ensure exactly 3 backticks
    const codeBlockPattern = /(?<!`)```(?!`)[\w]*[\s\S]*?```(?!`)/;
    return codeBlockPattern.test(content);
  }

  /**
   * Execute a shell command and return the output
   * @param {string} command - The command to execute
   * @returns {Promise<string>} - Command output
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
      const isWindows = os.platform() === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/bash';
      const args = isWindows ? ['/c', command] : ['-c', command];

      const child = spawn(shell, args, { stdio: ['pipe', 'pipe', 'pipe'], cwd: workspaceFolder });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Handle Copilot-specific errors
   * @param {Error} error - The error to handle
   * @returns {Error} - Processed error
   */
  handleCopilotError(error) {
    if (error instanceof vscode.LanguageModelError) {
      let errorMessage = `Copilot Error: ${error.message}`;

      // Check specific error codes
      if (error.code === vscode.LanguageModelError.Blocked.name) {
        errorMessage = 'Copilot quota limit exceeded. Please try again later.';
      } else if (error.code === vscode.LanguageModelError.NoPermissions.name) {
        errorMessage = 'No permission to use Copilot. Please ensure you have an active subscription.';
      } else if (error.code === vscode.LanguageModelError.NotFound.name) {
        errorMessage = 'Copilot model not found. Please ensure GitHub Copilot extension is installed.';
      }

      return new Error(errorMessage);
    }

    return error;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.outputChannel.dispose();
  }
}

module.exports = {
  CopilotService
};