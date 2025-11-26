/* ========================================
   ALERTS SERVICE - Έκτακτες Ειδοποιήσεις
   ======================================== */

const AlertsService = {
  collection: 'alerts',

  // Alert types
  alertTypes: {
    emergency: { icon: '🚨', label: 'Έκτακτη Ανάγκη', color: '#dc2626' },
    weather: { icon: '⛈️', label: 'Καιρός', color: '#f59e0b' },
    schedule: { icon: '📅', label: 'Αλλαγή Προγράμματος', color: '#3b82f6' },
    health: { icon: '🏥', label: 'Υγεία', color: '#10b981' },
    security: { icon: '🔒', label: 'Ασφάλεια', color: '#8b5cf6' },
    general: { icon: '📢', label: 'Γενική', color: '#6b7280' }
  },

  // === CREATE ALERT ===
  async create(data) {
    try {
      const user = AuthService.currentUser;
      const userData = AuthService.currentUserData;

      if (!user || !AuthService.can('announceToAll')) {
        return { success: false, error: 'Δεν έχετε δικαίωμα' };
      }

      const alert = {
        type: data.type || 'general',
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal', // low, normal, high, critical
        targetRoles: data.targetRoles || [], // empty = all
        expiresAt: data.expiresAt || null,
        createdBy: user.uid,
        creatorName: userData?.name || 'Άγνωστος',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        readBy: [],
        acknowledgedBy: [],
        requiresAcknowledge: data.requiresAcknowledge || false
      };

      const docRef = await db.collection(this.collection).add(alert);

      // Send push notification for high priority alerts
      if (data.priority === 'high' || data.priority === 'critical') {
        this.sendAlertNotifications(alert, docRef.id);
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating alert:', error);
      return { success: false, error: error.message };
    }
  },

  // === GET ACTIVE ALERTS ===
  async getActive() {
    try {
      const now = new Date();
      const snapshot = await db.collection(this.collection)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(alert => {
          // Filter expired
          if (alert.expiresAt) {
            const expires = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
            if (expires < now) return false;
          }
          // Filter by role
          const userRole = AuthService.currentUserData?.role;
          if (alert.targetRoles && alert.targetRoles.length > 0) {
            return alert.targetRoles.includes(userRole);
          }
          return true;
        });
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  },

  // === GET ALL ALERTS (for admin) ===
  async getAll(limit = 50) {
    try {
      const snapshot = await db.collection(this.collection)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all alerts:', error);
      return [];
    }
  },

  // === SUBSCRIBE TO ALERTS ===
  subscribe(callback) {
    const unsubscribe = db.collection(this.collection)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(alerts);
      }, error => {
        console.error('Alerts subscription error:', error);
      });

    return unsubscribe;
  },

  // === MARK AS READ ===
  async markRead(alertId) {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) return { success: false };

      await db.collection(this.collection).doc(alertId).update({
        readBy: firebase.firestore.FieldValue.arrayUnion(userId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking alert read:', error);
      return { success: false, error: error.message };
    }
  },

  // === ACKNOWLEDGE ALERT ===
  async acknowledge(alertId) {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) return { success: false };

      await db.collection(this.collection).doc(alertId).update({
        acknowledgedBy: firebase.firestore.FieldValue.arrayUnion(userId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, error: error.message };
    }
  },

  // === CLOSE ALERT ===
  async close(alertId) {
    try {
      await db.collection(this.collection).doc(alertId).update({
        status: 'closed',
        closedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error closing alert:', error);
      return { success: false, error: error.message };
    }
  },

  // === DELETE ALERT ===
  async delete(alertId) {
    try {
      await db.collection(this.collection).doc(alertId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting alert:', error);
      return { success: false, error: error.message };
    }
  },

  // === SEND NOTIFICATIONS ===
  async sendAlertNotifications(alert, alertId) {
    // This would integrate with push notification service
    console.log('Sending alert notifications for:', alertId);
    // In production, this would send FCM notifications
  },

  // === HELPERS ===
  isRead(alert, userId) {
    return alert.readBy?.includes(userId);
  },

  isAcknowledged(alert, userId) {
    return alert.acknowledgedBy?.includes(userId);
  },

  getTypeInfo(type) {
    return this.alertTypes[type] || this.alertTypes.general;
  },

  getPriorityClass(priority) {
    switch (priority) {
      case 'critical': return 'alert-critical';
      case 'high': return 'alert-high';
      case 'low': return 'alert-low';
      default: return 'alert-normal';
    }
  }
};

// Export
window.AlertsService = AlertsService;
