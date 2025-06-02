const fs = require('fs');
const path = require('path');

class TokenMonitor {
  constructor() {
    this.refreshCounts = new Map();
    this.logFile = path.join(__dirname, '../logs/token-refresh.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  logRefreshAttempt(ip, userAgent = 'unknown') {
    const timestamp = new Date().toISOString();
    const key = `${ip}-${userAgent}`;
    
    // Track counts per IP/User-Agent combination
    const currentCount = this.refreshCounts.get(key) || 0;
    this.refreshCounts.set(key, currentCount + 1);
    
    const logEntry = {
      timestamp,
      ip,
      userAgent,
      count: currentCount + 1,
      type: 'refresh_attempt'
    };

    // Log to file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);

    // Check for suspicious activity
    if (currentCount + 1 > 5) {
      this.logSuspiciousActivity(ip, userAgent, currentCount + 1);
    }

    // Clean up old entries every 100 requests
    if (this.refreshCounts.size > 100) {
      this.cleanup();
    }

    return currentCount + 1;
  }

  logSuspiciousActivity(ip, userAgent, count) {
    const alertEntry = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      count,
      type: 'suspicious_activity',
      message: `High refresh token activity detected: ${count} attempts`
    };

    const alertLine = JSON.stringify(alertEntry) + '\n';
    fs.appendFileSync(this.logFile, alertLine);
    
    console.warn(`🚨 ALERT: High refresh token activity from ${ip}: ${count} attempts`);
  }

  cleanup() {
    // Reset counts every hour to prevent memory buildup
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.refreshCounts.clear();
    
    console.log('🧹 Token monitor cleanup completed');
  }

  getStats() {
    const stats = {
      totalActiveIPs: this.refreshCounts.size,
      highActivityIPs: [],
      timestamp: new Date().toISOString()
    };

    for (const [key, count] of this.refreshCounts.entries()) {
      if (count > 3) {
        const [ip, userAgent] = key.split('-');
        stats.highActivityIPs.push({ ip, userAgent, count });
      }
    }

    return stats;
  }

  // Method to check recent logs for patterns
  analyzeRecentActivity(minutes = 5) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return { error: 'No log file found' };
      }

      const logContent = fs.readFileSync(this.logFile, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line);
      
      const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
      const recentEntries = [];

      for (const line of lines.slice(-1000)) { // Check last 1000 entries
        try {
          const entry = JSON.parse(line);
          if (new Date(entry.timestamp) > cutoffTime) {
            recentEntries.push(entry);
          }
        } catch (e) {
          // Skip malformed lines
        }
      }

      const analysis = {
        timeWindow: `${minutes} minutes`,
        totalRequests: recentEntries.length,
        uniqueIPs: new Set(recentEntries.map(e => e.ip)).size,
        suspiciousActivity: recentEntries.filter(e => e.type === 'suspicious_activity').length,
        topIPs: this.getTopIPs(recentEntries)
      };

      return analysis;
    } catch (error) {
      return { error: error.message };
    }
  }

  getTopIPs(entries) {
    const ipCounts = {};
    entries.forEach(entry => {
      ipCounts[entry.ip] = (ipCounts[entry.ip] || 0) + 1;
    });

    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
  }
}

// Singleton instance
const tokenMonitor = new TokenMonitor();

module.exports = tokenMonitor;
