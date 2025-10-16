# Agent Runbook

This demonstrates 👺 Daemon (`d`) CLI integration.

## Variables

name|value|help
-|-|-
abc|123|blah blah
def|456|blah blah 2


## Step 1: Generate some output

Use this bash script to echo some string into an output variable:

```bash
# @options { id: "example" }
echo hello world {{abc}}
```

**Output:**
```
hello world 123  
```





## Step 2: Pass it to an agent

Spawn a new agent, ask it about the output.

```bash
LOG=-debug d agent @solo <<EOF
tell me a joke about the following:
{{example}} {{deF}}
EOF
```

**Output:**
```
  
[90m0s[39m[0m [0m[38;2;206;173;73m ┃ 🧑 [38;2;206;173;73m[1mUser[22m[39m  
   [38;2;206;173;73m ┃    tell me a joke about the following:  
   [38;2;206;173;73m ┃    hello world 123 456[0m[0m  
  
  
[90m1s[39m[0m [0m[36m ┃ 🤖 [36m[1m[31mAssistant[39m[22m[39m  
   [36m ┃    Why did the "hello world" program get confused by 123 456? Because it couldn't handle the unexpected parameters—it was just trying to break the ice![0m[0m  
  
  
  
Why did the "hello world" program get confused by 123 456? Because it couldn't handle the unexpected parameters—it was just trying to break the ice!  
```






