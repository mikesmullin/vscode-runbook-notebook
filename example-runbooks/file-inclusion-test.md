# File Inclusion Test Runbook

This runbook demonstrates the new file inclusion feature where `{{*.md}}` variables read file content.

## Test Data

Here's some test data in a separate file:

```copilot
// @options {"mode": "agent"}
Please analyze the content from this file:

{{test-data/sample.md}}

Summarize what you find in this file and tell me what type of content it contains.
```

## Another Example

You can also include files from subdirectories:

```copilot
Show me the content of: {{test-data/sample.md}}

Format it nicely and explain what each section does.
```