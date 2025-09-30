
# System Analysis Runbook

## Step 1: Check system uptime

```bash
# @options {"id": "uptime"}
uptime
```

## Step 2: Check memory usage

```bash
# @options {"id": "memory"}
free -h
```

## Step 3: Analyze system status

Ask Copilot to analyze the collected data:

```copilot
// @options {"mode": "ask"}
Based on the system information:

Uptime: {{uptime}}
Memory: {{memory}}

What potential issues do you see and what should I investigate next?
```