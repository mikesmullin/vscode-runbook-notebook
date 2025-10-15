# Sample Runbook

This is a sample runbook demonstrating the three cell types.

## Step 1: Check system status

Use this bash script to check system load:

```bash
# @options {"id": "bazooka"}
echo hello
```

**Output:**
```
hello  
```



```bash
echo "|a|b|"
echo "|-|-|"
echo "|1|2|"
echo
echo {{bazooka}}
echo {{bazooka}}

uptime
df -h
echo "Current directory: $(pwd)"
```

**Output:**
```markdown
|a|b|    
|-|-|    
|1|2|    
    
hello    
hello    
 13:13:44 up  6:04,  1 user,  load average: 0.35, 0.39, 0.47    
Filesystem      Size  Used Avail Use% Mounted on    
none             16G     0   16G   0% /usr/lib/modules/6.6.87.2-microsoft-standard-WSL2    
none             16G  4.0K   16G   1% /mnt/wsl    
drivers         931G  711G  221G  77% /usr/lib/wsl/drivers    
/dev/sdd       1007G   13G  944G   2% /    
none             16G  104K   16G   1% /mnt/wslg    
none             16G     0   16G   0% /usr/lib/wsl/lib    
rootfs           16G  2.7M   16G   1% /init    
none             16G  1.1M   16G   1% /run    
none             16G     0   16G   0% /run/lock    
none             16G     0   16G   0% /run/shm    
none             16G   76K   16G   1% /mnt/wslg/versions.txt    
none             16G   76K   16G   1% /mnt/wslg/doc    
C:\             931G  711G  221G  77% /mnt/c    
X:\             3.7T  2.7T  1.1T  73% /mnt/x    
Z:\             7.3T  184G  7.1T   3% /mnt/z    
snapfuse         67M   67M     0 100% /snap/core24/1151    
snapfuse         67M   67M     0 100% /snap/core24/1196    
snapfuse         51M   51M     0 100% /snap/snapd/25202    
tmpfs           3.2G   28K  3.2G   1% /run/user/1000    
none             16G  716K   16G   1% /mnt/wsl/podman-sockets/podman-machine-default/podman-root.sock    
tmpfs           3.2G   16K  3.2G   1% /mnt/wsl/podman-sockets/podman-machine-default/podman-user.sock    
Current directory: /mnt/z/tmp6-vscode-ext/runbook-example/example-runbooks    
```


**Output:**
```markdown
|a|b|  
|-|-|  
|1|2|  
  
hello  
hello  
 13:10:31 up  6:01,  1 user,  load average: 0.28, 0.44, 0.51  
Filesystem      Size  Used Avail Use% Mounted on  
none             16G     0   16G   0% /usr/lib/modules/6.6.87.2-microsoft-standard-WSL2  
none             16G  4.0K   16G   1% /mnt/wsl  
drivers         931G  711G  221G  77% /usr/lib/wsl/drivers  
/dev/sdd       1007G   13G  944G   2% /  
none             16G  104K   16G   1% /mnt/wslg  
none             16G     0   16G   0% /usr/lib/wsl/lib  
rootfs           16G  2.7M   16G   1% /init  
none             16G  1.1M   16G   1% /run  
none             16G     0   16G   0% /run/lock  
none             16G     0   16G   0% /run/shm  
none             16G   76K   16G   1% /mnt/wslg/versions.txt  
none             16G   76K   16G   1% /mnt/wslg/doc  
C:\             931G  711G  221G  77% /mnt/c  
X:\             3.7T  2.7T  1.1T  73% /mnt/x  
Z:\             7.3T  184G  7.1T   3% /mnt/z  
snapfuse         67M   67M     0 100% /snap/core24/1151  
snapfuse         67M   67M     0 100% /snap/core24/1196  
snapfuse         51M   51M     0 100% /snap/snapd/25202  
tmpfs           3.2G   28K  3.2G   1% /run/user/1000  
none             16G  716K   16G   1% /mnt/wsl/podman-sockets/podman-machine-default/podman-root.sock  
tmpfs           3.2G   16K  3.2G   1% /mnt/wsl/podman-sockets/podman-machine-default/podman-user.sock  
Current directory: /mnt/z/tmp6-vscode-ext/runbook-example/example-runbooks
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
```js
// @options {"mode":"agent", "model": "grok-code-fast-1"}
write a joke to hello.txt
```




## Step 4: Simple Copilot Query

Ask Copilot a simple question to test streaming:
```js
// @options {"mode":"agent", "model": "grok-code"}
write a 10-stanza haiku about tacos
```



