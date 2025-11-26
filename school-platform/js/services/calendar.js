/* ========================================
   CALENDAR SERVICE - Events & Ημερολόγιο
   ======================================== */

const CalendarService = {
  // Active listeners
  activeListeners: [],

  // === FETCH METHODS ===

  // Λήψη όλων των events
  async getAll() {
    try {
      const snapshot = await firebaseDb.collection('events')
        .orderBy('startDate', 'asc')
        .get();

      const events = [];
      snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: events };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη events για συγκεκριμένο μήνα
  async getByMonth(year, month) {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const snapshot = await firebaseDb.collection('events')
        .where('startDate', '>=', startOfMonth)
        .where('startDate', '<=', endOfMonth)
        .orderBy('startDate', 'asc')
        .get();

      const events = [];
      snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: events };
    } catch (error) {
      console.error('Error fetching monthly events:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη επερχόμενων events
  async getUpcoming(limit = 10) {
    try {
      const now = new Date();

      const snapshot = await firebaseDb.collection('events')
        .where('startDate', '>=', now)
        .orderBy('startDate', 'asc')
        .limit(limit)
        .get();

      const events = [];
      snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: events };
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener
  subscribe(callback) {
    const unsubscribe = firebaseDb.collection('events')
      .orderBy('startDate', 'asc')
      .onSnapshot(snapshot => {
        const events = [];
        snapshot.forEach(doc => {
          events.push({ id: doc.id, ...doc.data() });
        });
        callback(events);
      }, error => {
        console.error('Events subscription error:', error);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // === CREATE / UPDATE / DELETE ===

  // Δημιουργία event
  async create(eventData) {
    try {
      const currentUser = AuthService.currentUserData;

      const data = {
        title: eventData.title.trim(),
        description: eventData.description?.trim() || '',
        type: eventData.type || 'event',
        startDate: eventData.startDate,
        endDate: eventData.endDate || eventData.startDate,
        allDay: eventData.allDay || false,
        location: eventData.location?.trim() || '',
        participants: eventData.participants || ['all'],
        color: eventData.color || this.getTypeColor(eventData.type),
        createdBy: AuthService.currentUser.uid,
        creatorName: currentUser?.displayName || 'Άγνωστος',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('events').add(data);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
  },

  // Ενημέρωση event
  async update(eventId, data) {
    try {
      await firebaseDb.collection('events').doc(eventId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }
  },

  // Διαγραφή event
  async delete(eventId) {
    try {
      await firebaseDb.collection('events').doc(eventId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message };
    }
  },

  // === HELPERS ===

  // Get type color
  getTypeColor(type) {
    const colors = {
      meeting: '#3b82f6',    // blue
      deadline: '#ef4444',   // red
      event: '#16a34a',      // green
      holiday: '#f59e0b'     // orange
    };
    return colors[type] || '#6b7280';
  },

  // Get type label
  getTypeLabel(type) {
    const labels = {
      meeting: 'Σύσκεψη',
      deadline: 'Προθεσμία',
      event: 'Εκδήλωση',
      holiday: 'Αργία'
    };
    return labels[type] || type;
  },

  // Get type icon
  getTypeIcon(type) {
    const icons = {
      meeting: '👥',
      deadline: '⏰',
      event: '🎉',
      holiday: '🏖️'
    };
    return icons[type] || '📅';
  },

  // Format event date
  formatEventDate(startDate, endDate, allDay) {
    const start = startDate?.toDate ? startDate.toDate() : new Date(startDate);
    const end = endDate?.toDate ? endDate.toDate() : new Date(endDate);

    const dateOptions = { day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };

    if (allDay) {
      if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString('el-GR', dateOptions);
      }
      return `${start.toLocaleDateString('el-GR', dateOptions)} - ${end.toLocaleDateString('el-GR', dateOptions)}`;
    }

    return `${start.toLocaleDateString('el-GR', dateOptions)} ${start.toLocaleTimeString('el-GR', timeOptions)}`;
  },

  // Get events for a specific date
  getEventsForDate(events, date) {
    const dateStr = date.toDateString();
    return events.filter(event => {
      const eventDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate);
      return eventDate.toDateString() === dateStr;
    });
  },

  // === CLEANUP ===

  unsubscribeAll() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
  }
};

// Export
window.CalendarService = CalendarService;
