# Database Connection Troubleshooting

Check if the database is running:

```bash
ps aux | grep postgres
```

If not running, start it:

```bash
sudo systemctl start postgresql
```

Ask Copilot for additional troubleshooting steps with agent mode:

```copilot
// @options {"mode": "agent", "model": "grok-code"}
What are common causes of PostgreSQL connection failures and how to fix them? Please check system logs if needed.
```

Use Python to analyze connection metrics:

```python
import psutil
import json

# Get database processes
db_processes = [p for p in psutil.process_iter(['pid', 'name', 'cpu_percent']) 
                if 'postgres' in p.info['name'].lower()]

print(json.dumps([p.info for p in db_processes], indent=2))
```