# Agent Runbook

This demonstrates 👺 Daemon (`d`) CLI integration.

## Step 1: Generate some output

Use this bash script to echo some string into an output variable:

```bash
# @options { id: "example" }
echo hello world
```

**Output:**
```
hello world  
```



## Step 2: Pass it to an agent

Spawn a new agent, ask it about the output.

```bash
LOG=-debug d agent @solo <<EOF
tell me a joke about the following:
{{example}}
EOF
```

**Output:**
```
  
[90m0s[39m[0m [0m[38;2;206;173;73m ┃ 🧑 [38;2;206;173;73m[1mUser[22m[39m  
   [38;2;206;173;73m ┃    tell me a joke about the following:  
   [38;2;206;173;73m ┃    hello world[0m[0m  
  
  
[90m1s[39m[0m [0m[36m ┃ 🤖 [36m[1m[31mAssistant[39m[22m[39m  
   [36m ┃    Why did the computer say "Hello World"? Because it wanted to introduce itself before crashing![0m[0m  
  
  
  
Why did the computer say "Hello World"? Because it wanted to introduce itself before crashing!  
```



