# Sample Runbook

This is a sample runbook demonstrating the three cell types.

## Step 1: Check system status

Use this bash script to check system load:

```bash
uptime
df -h
echo "Current directory: $(pwd)"
```

```bash
# @options {"timeout": 2}
echo "This will appear as failure"
sleep 10
echo "this only appears after sleep completes"
exit 1  # Force non-zero exit code
```

## Step 2: Test JavaScript execution

Try this JavaScript code:

```js
console.log("Hello from JavaScript execution!");
console.log("Current timestamp:", Date.now());
```

## Step 3: Analyze logs

If there are issues, ask Copilot for help analyzing logs:

```copilot
// @options {"mode":"agent", "model": "grok-code-fast-1"}
write a joke to hello.txt
```

## Step 4: Simple Copilot Query

Ask Copilot a simple question to test streaming:

```copilot
// @options {"mode":"agent", "model": "grok-code"}
write a 10-stanza haiku about tacos
```
