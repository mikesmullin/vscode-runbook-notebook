/**
 * Constants and configuration for the Runbook Notebook Extension
 */

/**
 * Language to comment style mapping for @options parsing
 */
const COMMENT_STYLES = {
  'copilot': '//',
  'bash': '#',
  'sh': '#',
  'shell': '#',
  'javascript': '//',
  'js': '//',
  'python': '#',
  'py': '#',
  'typescript': '//',
  'ts': '//',
  'ruby': '#',
  'rb': '#',
  'perl': '#',
  'r': '#',
  'yaml': '#',
  'yml': '#',
  'powershell': '#',
  'ps1': '#'
};

/**
 * File extensions for different languages
 */
const FILE_EXTENSIONS = {
  'javascript': 'js',
  'js': 'js',
  'python': 'py',
  'py': 'py',
  'bash': 'sh',
  'shell': 'sh',
  'sh': 'sh'
};

/**
 * Shebangs for different languages
 */
const SHEBANGS = {
  'javascript': '#!/usr/bin/env node\n',
  'js': '#!/usr/bin/env node\n',
  'python': '#!/usr/bin/env python3\n',
  'py': '#!/usr/bin/env python3\n',
  'bash': '#!/bin/bash\n',
  'shell': '#!/bin/bash\n',
  'sh': '#!/bin/bash\n'
};

/**
 * Default shebang for unknown languages
 */
const DEFAULT_SHEBANG = '#!/bin/bash\n';

/**
 * Default file extension for unknown languages
 */
const DEFAULT_EXTENSION = 'sh';

/**
 * Maximum turns for Copilot agent mode
 */
const MAX_AGENT_TURNS = 3;

/**
 * Supported languages for the notebook controller
 */
const SUPPORTED_LANGUAGES = [
  'javascript', 'js', 'bash', 'python', 'shell', 'copilot'
];

module.exports = {
  COMMENT_STYLES,
  FILE_EXTENSIONS,
  SHEBANGS,
  DEFAULT_SHEBANG,
  DEFAULT_EXTENSION,
  MAX_AGENT_TURNS,
  SUPPORTED_LANGUAGES
};