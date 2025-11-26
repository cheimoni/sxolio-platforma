/* ========================================
   CONSOLE LOGGER - Κρατάει console messages
   ======================================== */

const ConsoleLogger = {
  logs: [],
  maxLogs: 1000, // Μέγιστος αριθμός logs
  
  init() {
    // Intercept console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;
    
    // Override console.log
    console.log = (...args) => {
      this.addLog('log', args);
      originalLog.apply(console, args);
    };
    
    // Override console.warn
    console.warn = (...args) => {
      this.addLog('warn', args);
      originalWarn.apply(console, args);
    };
    
    // Override console.error
    console.error = (...args) => {
      this.addLog('error', args);
      originalError.apply(console, args);
    };
    
    // Override console.info
    console.info = (...args) => {
      this.addLog('info', args);
      originalInfo.apply(console, args);
    };
  },
  
  addLog(level, args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    this.logs.push({
      timestamp,
      level,
      message,
      stack: new Error().stack
    });
    
    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Save to localStorage
    this.saveToStorage();
  },
  
  saveToStorage() {
    try {
      localStorage.setItem('console_logs', JSON.stringify(this.logs.slice(-100))); // Keep last 100 in storage
    } catch (e) {
      // Storage might be full
    }
  },
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('console_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      this.logs = [];
    }
  },
  
  getLogs(level = null, limit = null) {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  },
  
  clearLogs() {
    this.logs = [];
    this.saveToStorage();
  },
  
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  },
  
  downloadLogs() {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Initialize on load
ConsoleLogger.loadFromStorage();
ConsoleLogger.init();

// Export
window.ConsoleLogger = ConsoleLogger;

