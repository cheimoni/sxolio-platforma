// @FILE-INFO: ConnectionManager.js | src/utils/ConnectionManager.js
// TYPE: Utility Helper
// LAYER: Infrastructure
// PURPOSE: Firebase connection management and retry logic

import { ref, onValue, goOnline, goOffline, set, update, push, remove } from 'firebase/database';

class ConnectionManager {
    constructor(database) {
        this.database = database;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000; // Start with 1 second
        this.listeners = [];
        this.connectionCallbacks = [];
        
        this.initialize();
    }

    initialize() {
        // Monitor connection status
        const connectedRef = ref(this.database, '.info/connected');
        const connectedListener = onValue(connectedRef, (snapshot) => {
            const connected = snapshot.val();
            this.isConnected = connected;
            
            if (connected) {
                console.log('✅ Firebase connected');
                this.retryCount = 0;
                this.retryDelay = 1000;
                this.notifyConnectionChange(true);
            } else {
                console.log('❌ Firebase disconnected');
                this.notifyConnectionChange(false);
                this.scheduleReconnect();
            }
        });

        this.listeners.push(connectedListener);

        // Monitor server timestamp for latency
        const offsetRef = ref(this.database, '.info/serverTimeOffset');
        const offsetListener = onValue(offsetRef, (snapshot) => {
            const offset = snapshot.val();
            if (Math.abs(offset) > 5000) { // More than 5 seconds difference
                console.warn('⚠️ High latency detected:', offset, 'ms');
            }
        });

        this.listeners.push(offsetListener);
    }

    // Add callback for connection status changes
    onConnectionChange(callback) {
        this.connectionCallbacks.push(callback);
        // Immediately call with current status
        callback(this.isConnected);
    }

    // Remove connection change callback
    removeConnectionListener(callback) {
        this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    }

    // Notify all listeners of connection status change
    notifyConnectionChange(connected) {
        this.connectionCallbacks.forEach(callback => {
            try {
                callback(connected);
            } catch (error) {
                console.error('Error in connection callback:', error);
            }
        });
    }

    // Schedule reconnection with exponential backoff
    scheduleReconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        const delay = Math.min(this.retryDelay * Math.pow(2, this.retryCount), 30000);
        console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.retryCount + 1})`);

        setTimeout(() => {
            this.reconnect();
        }, delay);
    }

    // Force reconnection
    async reconnect() {
        this.retryCount++;
        console.log(`🔄 Attempting reconnection (${this.retryCount}/${this.maxRetries})`);

        try {
            // Force disconnect and reconnect
            goOffline(this.database);
            await new Promise(resolve => setTimeout(resolve, 1000));
            goOnline(this.database);

            // Wait for connection status to update
            await this.waitForConnection(10000);
            
        } catch (error) {
            console.error('❌ Reconnection failed:', error);
            this.scheduleReconnect();
        }
    }

    // Wait for connection with timeout
    waitForConnection(timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                resolve(true);
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, timeout);

            const checkConnection = (connected) => {
                if (connected) {
                    clearTimeout(timeoutId);
                    this.removeConnectionListener(checkConnection);
                    resolve(true);
                }
            };

            this.onConnectionChange(checkConnection);
        });
    }

    // Execute operation with retry logic
    async executeWithRetry(operation, maxRetries = 3) {
        let attempt = 0;
        let lastError;

        while (attempt < maxRetries) {
            try {
                // Wait for connection if disconnected
                if (!this.isConnected) {
                    console.log('⏳ Waiting for connection...');
                    await this.waitForConnection(10000);
                }

                // Execute the operation
                const result = await operation();
                console.log(`✅ Operation succeeded on attempt ${attempt + 1}`);
                return result;

            } catch (error) {
                lastError = error;
                attempt++;
                console.error(`❌ Operation failed on attempt ${attempt}:`, error);

                if (attempt < maxRetries) {
                    // Wait before retry with exponential backoff
                    const delay = 1000 * Math.pow(2, attempt - 1);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Try to reconnect if disconnected
                    if (!this.isConnected) {
                        await this.reconnect();
                    }
                }
            }
        }

        // All retries failed
        console.error(`❌ Operation failed after ${maxRetries} attempts`);
        throw lastError;
    }

    // Get current connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries
        };
    }

    // Reset retry counter (call when user performs action)
    resetRetryCount() {
        this.retryCount = 0;
    }

    // Cleanup method
    destroy() {
        this.connectionCallbacks = [];
        this.listeners.forEach(listener => {
            try {
                if (typeof listener === 'function') {
                    listener(); // Call unsubscribe function
                }
            } catch (error) {
                console.error('Error cleaning up listener:', error);
            }
        });
        this.listeners = [];
    }
}

// Helper function to create database operations with retry
export const createDatabaseOperation = (connectionManager) => {
    return {
        // Set value with retry
        setWithRetry: (firebaseRef, value) => {
            return connectionManager.executeWithRetry(async () => {
                await set(firebaseRef, value);
            });
        },

        // Update value with retry
        updateWithRetry: (firebaseRef, updates) => {
            return connectionManager.executeWithRetry(async () => {
                await update(firebaseRef, updates);
            });
        },

        // Push value with retry
        pushWithRetry: (firebaseRef, value) => {
            return connectionManager.executeWithRetry(async () => {
                const newRef = push(firebaseRef);
                await set(newRef, value);
                return newRef;
            });
        },

        // Remove value with retry
        removeWithRetry: (firebaseRef) => {
            return connectionManager.executeWithRetry(async () => {
                await remove(firebaseRef);
            });
        }
    };
};

// Simple usage example:
// const connectionManager = new ConnectionManager(database);
// const dbOps = createDatabaseOperation(connectionManager);
// 
// // Use like this:
// await dbOps.setWithRetry(ref(database, 'path'), value);

export default ConnectionManager;