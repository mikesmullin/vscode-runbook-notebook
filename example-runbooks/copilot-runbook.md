# Sample Runbook 3

This is a sample runbook demonstrating Copilot interaction w/ runbook outputs.

## Step 1

```bash
# @options {"id": "running_containers"}
podman ps
```

## Step 2: 

```copilot
// @options {"mode":"agent", "model": "grok-code-fast-1"}

using podman cli, check if a redis container is currently running or not.
- if yes, then stop and remove the redis container using podman cli.
- if no, launch a redis container using podman cli.
```

