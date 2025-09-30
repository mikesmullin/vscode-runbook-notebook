
# Performance Monitoring Dashboard

This runbook demonstrates a 5-step performance monitoring scenario that generates different mermaid xy graphs using fake data.

## Step 1: Generate Server Response Time Data

Generate fake response time data for analysis:

```javascript
// @options {"id": "response_times"}
// Generate fake server response time data
const hours = Array.from({length: 24}, (_, i) => i);
const responseTimes = hours.map(hour => {
    // Simulate higher response times during peak hours (9-17)
    const baseTime = 100;
    const peakMultiplier = (hour >= 9 && hour <= 17) ? 2.5 : 1;
    const randomVariation = Math.random() * 50;
    return Math.round(baseTime * peakMultiplier + randomVariation);
});

// Generate proper mermaid xychart syntax
console.log("```mermaid");
console.log("xychart-beta");
console.log('    title "Server Response Times Over 24 Hours"');
console.log(`    x-axis [${hours.join(', ')}]`);
console.log('    y-axis "Response Time (ms)" 0 --> 400');
console.log(`    line [${responseTimes.join(', ')}]`);
console.log("```");
```

## Step 2: Create Response Time XY Graph

Use Copilot to generate a mermaid chart from the response time data:

```copilot
// @options {"mode": "ask"}
Create a mermaid xy chart showing server response times over 24 hours using random pretend data:

{{charts.md}}

The chart should:
- Show hours (0-23) on the x-axis
- Show response times in milliseconds on the y-axis
- Use appropriate title and axis labels
- Include the raw mermaid code in markdown code blocks
```

## Step 3: Generate Memory Usage Data

Create fake memory usage data for different services:

```python
# @options {"id": "memory_data"}
import random

# Generate fake memory usage data for 5 services over 12 time periods
services = ["WebServer", "Database", "Cache", "Queue", "Analytics"]
time_periods = list(range(1, 13))

print("Service,TimePeriod,MemoryUsage")
for service in services:
    base_memory = random.randint(200, 800)  # Base memory usage in MB
    for period in time_periods:
        # Add some variation and trend
        variation = random.randint(-50, 100)
        trend = period * random.randint(5, 15)  # Growing memory usage over time
        memory = max(50, base_memory + variation + trend)  # Ensure minimum 50MB
        print(f"{service},{period},{memory}")
```

## Step 4: Create Memory Usage XY Graph

Generate a multi-series XY chart for memory usage trends:

```copilot
// @options {"mode": "ask"}
Create a mermaid XY chart showing memory usage trends for multiple services using this data:

{{charts.md}}

{{memory_data}}

The chart should:
- Show time periods (1-12) on the x-axis
- Show memory usage in MB on the y-axis
- Display multiple lines for each service (WebServer, Database, Cache, Queue, Analytics)
- Add appropriate title and axis labels
- Include the raw mermaid code in markdown code blocks
```

## Step 5: Generate Performance Summary Table

Create a formatted markdown table summarizing system performance metrics:

```copilot
// @options {"mode": "ask"}
Create a comprehensive markdown table that summarizes system performance metrics using this pretend data:

**Server Information:**
- WebServer01: CPU 78%, Memory 4.2GB, Disk 45%, Network 234MB/s
- DatabaseSrv: CPU 92%, Memory 8.1GB, Disk 67%, Network 156MB/s  
- CacheCluster: CPU 34%, Memory 2.8GB, Disk 23%, Network 89MB/s
- QueueWorker: CPU 56%, Memory 1.9GB, Disk 34%, Network 67MB/s
- AnalyticsSrv: CPU 89%, Memory 6.4GB, Disk 78%, Network 123MB/s

**Service Status:**
- WebServer01: Healthy, Last restart: 2 days ago
- DatabaseSrv: Warning (High CPU), Last restart: 7 days ago
- CacheCluster: Healthy, Last restart: 1 day ago
- QueueWorker: Healthy, Last restart: 3 days ago
- AnalyticsSrv: Critical (High CPU & Disk), Last restart: 12 days ago

Create a well-formatted markdown table with these columns:
- Service Name
- CPU Usage (%)
- Memory (GB)
- Disk Usage (%)
- Network (MB/s)
- Status
- Last Restart
- Action Required

Use appropriate status indicators (✅ Healthy, ⚠️ Warning, 🚨 Critical) and suggest actions for problematic services.
```

## Step 6: System Health Summary

Analyze the generated data and provide insights:

```copilot
// @options {"mode": "ask"}
Based on the performance data we've collected:

Response Times: {{response_times}}
Memory Usage: {{memory_data}}

Please provide:
1. Key observations about the system performance patterns
2. Potential performance issues identified
3. Recommendations for optimization
4. Suggested monitoring alerts that should be configured

Format your response as a structured analysis with clear sections.
```

