/* ========================================
   NOTIFICATIONS SERVICE
   Υπενθυμίσεις, Push, Online Status, Typing
   ======================================== */

const NotificationsService = {
  // === STATE ===
  reminderCheckInterval: null,
  shownReminders: new Set(), // Αποφυγή διπλών υπενθυμίσεων
  onlineStatusListener: null,
  typingListeners: {},

  // === INITIALIZATION ===

  init() {
    // Request notification permission
    this.requestPermission();

    // Start reminder checker
    this.startReminderChecker();

    // Setup online status
    this.setupOnlineStatus();

    console.log('NotificationsService initialized');
  },

  // === BROWSER NOTIFICATIONS ===

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  async showNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      // Fallback to toast
      showToast(title, options.type || 'info');
      return;
    }

    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '🏫',
      tag: options.tag || 'school-notification',
      requireInteraction: options.important || false,
      ...options
    });

    notification.onclick = () => {
      window.focus();
      if (options.onClick) options.onClick();
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    return notification;
  },

  // === EVENT REMINDERS ===

  startReminderChecker() {
    // Check every minute
    this.reminderCheckInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);

    // Check immediately on start
    setTimeout(() => this.checkReminders(), 5000);
  },

  stopReminderChecker() {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
      this.reminderCheckInterval = null;
    }
  },

  async checkReminders() {
    if (!AuthService.isLoggedIn()) return;

    try {
      const result = await CalendarService.getUpcoming(20);
      if (!result.success) return;

      const now = new Date();
      const events = result.data;

      events.forEach(event => {
        const eventDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate);
        const timeDiff = eventDate - now;
        const minutesDiff = Math.floor(timeDiff / 60000);

        // Check for different reminder intervals
        const reminderIntervals = [
          { minutes: 15, label: 'σε 15 λεπτά' },
          { minutes: 30, label: 'σε 30 λεπτά' },
          { minutes: 60, label: 'σε 1 ώρα' },
          { minutes: 1440, label: 'αύριο' } // 24 hours
        ];

        reminderIntervals.forEach(({ minutes, label }) => {
          // Allow 2 minute window for checking
          if (minutesDiff >= minutes - 1 && minutesDiff <= minutes + 1) {
            const reminderId = `${event.id}-${minutes}`;

            if (!this.shownReminders.has(reminderId)) {
              this.shownReminders.add(reminderId);
              this.showEventReminder(event, label);
            }
          }
        });
      });

      // Clean up old reminders
      if (this.shownReminders.size > 100) {
        this.shownReminders.clear();
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  },

  showEventReminder(event, timeLabel) {
    const icon = CalendarService.getTypeIcon(event.type);
    const title = `${icon} ${event.title}`;
    const body = `Ξεκινάει ${timeLabel}${event.location ? ` - ${event.location}` : ''}`;

    // Show browser notification
    this.showNotification(title, {
      body: body,
      tag: `event-${event.id}`,
      icon: '📅',
      important: true,
      onClick: () => {
        App.navigate('calendar');
        setTimeout(() => CalendarPage.viewEvent(event.id), 500);
      }
    });

    // Also show colored toast
    this.showColoredToast(title, body, event.color || CalendarService.getTypeColor(event.type));
  },

  // === COLORED NOTIFICATIONS ===

  showColoredToast(title, message, color) {
    const container = document.getElementById('toast-container') || this.createToastContainer();

    const toast = document.createElement('div');
    toast.className = 'toast colored-toast show';
    toast.style.borderLeft = `4px solid ${color}`;
    toast.style.background = this.lightenColor(color, 0.9);

    toast.innerHTML = `
      <div class="toast-content">
        <strong>${escapeHtml(title)}</strong>
        ${message ? `<p style="margin: 4px 0 0; font-size: 13px;">${escapeHtml(message)}</p>` : ''}
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 8000);
  },

  createToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  },

  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round((num >> 16) + (255 - (num >> 16)) * percent);
    const g = Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent);
    const b = Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent);
    return `rgb(${r}, ${g}, ${b})`;
  },

  // === ONLINE STATUS ===

  setupOnlineStatus() {
    if (!AuthService.isLoggedIn()) return;

    const userId = AuthService.currentUser?.uid;
    if (!userId) return;

    // Update status when online
    this.updateOnlineStatus(true);

    // Update on visibility change
    document.addEventListener('visibilitychange', () => {
      this.updateOnlineStatus(!document.hidden);
    });

    // Update on window focus/blur
    window.addEventListener('focus', () => this.updateOnlineStatus(true));
    window.addEventListener('blur', () => this.updateOnlineStatus(false));

    // Update on beforeunload
    window.addEventListener('beforeunload', () => this.updateOnlineStatus(false));

    // Heartbeat every 2 minutes
    setInterval(() => {
      if (!document.hidden && AuthService.isLoggedIn()) {
        this.updateOnlineStatus(true);
      }
    }, 120000);
  },

  async updateOnlineStatus(isOnline) {
    const userId = AuthService.currentUser?.uid;
    if (!userId) return;

    try {
      await firebaseDb.collection('users').doc(userId).update({
        isOnline: isOnline,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      // Silently fail - not critical
    }
  },

  subscribeToUserStatus(userId, callback) {
    return firebaseDb.collection('users').doc(userId)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          callback({
            isOnline: data.isOnline || false,
            lastSeen: data.lastSeen
          });
        }
      });
  },

  // === TYPING INDICATORS ===

  async setTyping(conversationId, isTyping) {
    const userId = AuthService.currentUser?.uid;
    if (!userId || !conversationId) return;

    try {
      const typingRef = firebaseDb.collection('conversations')
        .doc(conversationId)
        .collection('typing')
        .doc(userId);

      if (isTyping) {
        await typingRef.set({
          userId: userId,
          userName: AuthService.currentUserData?.displayName || 'Χρήστης',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Auto-clear after 5 seconds
        setTimeout(() => this.setTyping(conversationId, false), 5000);
      } else {
        await typingRef.delete();
      }
    } catch (error) {
      // Silently fail
    }
  },

  subscribeToTyping(conversationId, callback) {
    const userId = AuthService.currentUser?.uid;

    const unsubscribe = firebaseDb.collection('conversations')
      .doc(conversationId)
      .collection('typing')
      .onSnapshot(snapshot => {
        const typingUsers = [];
        const fiveSecondsAgo = new Date(Date.now() - 5000);

        snapshot.forEach(doc => {
          const data = doc.data();
          // Don't show own typing
          if (data.userId !== userId) {
            const timestamp = data.timestamp?.toDate();
            // Only show if recent
            if (!timestamp || timestamp > fiveSecondsAgo) {
              typingUsers.push(data.userName);
            }
          }
        });

        callback(typingUsers);
      });

    this.typingListeners[conversationId] = unsubscribe;
    return unsubscribe;
  },

  unsubscribeTyping(conversationId) {
    if (this.typingListeners[conversationId]) {
      this.typingListeners[conversationId]();
      delete this.typingListeners[conversationId];
    }
  },

  // === CLEANUP ===

  destroy() {
    this.stopReminderChecker();
    this.updateOnlineStatus(false);
    Object.keys(this.typingListeners).forEach(id => {
      this.unsubscribeTyping(id);
    });
  }
};

// Initialize when auth is ready
if (typeof AuthService !== 'undefined') {
  AuthService.onAuthStateChange((user) => {
    if (user) {
      NotificationsService.init();
    } else {
      NotificationsService.destroy();
    }
  });
}

// Export
window.NotificationsService = NotificationsService;
