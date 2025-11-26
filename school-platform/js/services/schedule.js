/* ========================================
   SCHEDULE SERVICE - Διαχείριση Ωραρίου
   ======================================== */

const ScheduleService = {
  collection: 'scheduleSettings',

  // Default schedules (from PDF)
  defaultSchedules: {
    long: {
      name: 'Δευτέρα & Πέμπτη (8 περίοδοι)',
      days: [1, 4], // Monday, Thursday
      periods: [
        { type: 'period', num: 1, start: '07:30', end: '08:10', label: '1η Περίοδος' },
        { type: 'period', num: 2, start: '08:10', end: '08:50', label: '2η Περίοδος' },
        { type: 'break', num: 1, start: '08:50', end: '09:10', label: '1ο Διάλειμμα', duration: 20 },
        { type: 'period', num: 3, start: '09:10', end: '09:50', label: '3η Περίοδος' },
        { type: 'period', num: 4, start: '09:50', end: '10:30', label: '4η Περίοδος' },
        { type: 'break', num: 2, start: '10:30', end: '10:45', label: '2ο Διάλειμμα', duration: 15 },
        { type: 'period', num: 5, start: '10:45', end: '11:25', label: '5η Περίοδος' },
        { type: 'period', num: 6, start: '11:25', end: '12:05', label: '6η Περίοδος' },
        { type: 'break', num: 3, start: '12:05', end: '12:15', label: '3ο Διάλειμμα', duration: 10 },
        { type: 'period', num: 7, start: '12:15', end: '12:55', label: '7η Περίοδος' },
        { type: 'period', num: 8, start: '12:55', end: '13:35', label: '8η Περίοδος' }
      ]
    },
    short: {
      name: 'Τρίτη, Τετάρτη, Παρασκευή (7 περίοδοι)',
      days: [2, 3, 5], // Tuesday, Wednesday, Friday
      periods: [
        { type: 'period', num: 1, start: '07:30', end: '08:15', label: '1η Περίοδος' },
        { type: 'period', num: 2, start: '08:15', end: '09:00', label: '2η Περίοδος' },
        { type: 'break', num: 1, start: '09:00', end: '09:15', label: '1ο Διάλειμμα', duration: 15 },
        { type: 'period', num: 3, start: '09:15', end: '10:00', label: '3η Περίοδος' },
        { type: 'period', num: 4, start: '10:00', end: '10:45', label: '4η Περίοδος' },
        { type: 'break', num: 2, start: '10:45', end: '11:10', label: '2ο Διάλειμμα', duration: 25 },
        { type: 'period', num: 5, start: '11:10', end: '11:55', label: '5η Περίοδος' },
        { type: 'period', num: 6, start: '11:55', end: '12:40', label: '6η Περίοδος' },
        { type: 'break', num: 3, start: '12:40', end: '12:50', label: '3ο Διάλειμμα', duration: 10 },
        { type: 'period', num: 7, start: '12:50', end: '13:35', label: '7η Περίοδος' }
      ]
    }
  },

  // Cache
  cachedSchedules: null,

  // === GET SCHEDULES ===
  async getSchedules() {
    if (this.cachedSchedules) {
      return this.cachedSchedules;
    }

    try {
      const doc = await db.collection(this.collection).doc('current').get();

      if (doc.exists) {
        this.cachedSchedules = doc.data();
        return this.cachedSchedules;
      }

      // Return defaults if no custom schedule exists
      return this.defaultSchedules;
    } catch (error) {
      console.error('Error getting schedules:', error);
      return this.defaultSchedules;
    }
  },

  // === SAVE SCHEDULES ===
  async saveSchedules(schedules) {
    try {
      if (!AuthService.can('manageUsers') && !isSuperAdmin(AuthService.currentUserData?.role)) {
        return { success: false, error: 'Δεν έχετε δικαίωμα' };
      }

      await db.collection(this.collection).doc('current').set({
        ...schedules,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: AuthService.currentUser?.uid
      });

      this.cachedSchedules = schedules;

      // Update SchoolClock with new schedules
      if (window.SchoolClock) {
        SchoolClock.schedules = schedules;
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving schedules:', error);
      return { success: false, error: error.message };
    }
  },

  // === ADD PERIOD ===
  addPeriod(scheduleType, afterIndex, periodData) {
    const schedule = this.cachedSchedules || this.defaultSchedules;
    const periods = [...schedule[scheduleType].periods];

    // Calculate new period number
    const periodCount = periods.filter(p => p.type === 'period').length;
    const newPeriod = {
      type: 'period',
      num: periodCount + 1,
      start: periodData.start,
      end: periodData.end,
      label: `${periodCount + 1}η Περίοδος`
    };

    periods.splice(afterIndex + 1, 0, newPeriod);

    // Renumber periods
    let periodNum = 1;
    periods.forEach(p => {
      if (p.type === 'period') {
        p.num = periodNum;
        p.label = `${periodNum}η Περίοδος`;
        periodNum++;
      }
    });

    return periods;
  },

  // === REMOVE PERIOD ===
  removePeriod(scheduleType, index) {
    const schedule = this.cachedSchedules || this.defaultSchedules;
    const periods = [...schedule[scheduleType].periods];

    periods.splice(index, 1);

    // Renumber periods and breaks
    let periodNum = 1;
    let breakNum = 1;
    periods.forEach(p => {
      if (p.type === 'period') {
        p.num = periodNum;
        p.label = `${periodNum}η Περίοδος`;
        periodNum++;
      } else if (p.type === 'break') {
        p.num = breakNum;
        p.label = `${breakNum}ο Διάλειμμα`;
        breakNum++;
      }
    });

    return periods;
  },

  // === ADD BREAK ===
  addBreak(scheduleType, afterIndex, breakData) {
    const schedule = this.cachedSchedules || this.defaultSchedules;
    const periods = [...schedule[scheduleType].periods];

    const breakCount = periods.filter(p => p.type === 'break').length;
    const duration = this.calculateDuration(breakData.start, breakData.end);

    const newBreak = {
      type: 'break',
      num: breakCount + 1,
      start: breakData.start,
      end: breakData.end,
      label: `${breakCount + 1}ο Διάλειμμα`,
      duration: duration
    };

    periods.splice(afterIndex + 1, 0, newBreak);

    // Renumber breaks
    let breakNum = 1;
    periods.forEach(p => {
      if (p.type === 'break') {
        p.num = breakNum;
        p.label = `${breakNum}ο Διάλειμμα`;
        breakNum++;
      }
    });

    return periods;
  },

  // === UPDATE PERIOD/BREAK TIMES ===
  updateTimes(scheduleType, index, start, end) {
    const schedule = this.cachedSchedules || this.defaultSchedules;
    const periods = [...schedule[scheduleType].periods];

    periods[index].start = start;
    periods[index].end = end;

    if (periods[index].type === 'break') {
      periods[index].duration = this.calculateDuration(start, end);
    }

    return periods;
  },

  // === HELPERS ===
  calculateDuration(start, end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  },

  formatTime(time) {
    return time;
  },

  // === RESET TO DEFAULTS ===
  async resetToDefaults() {
    try {
      await db.collection(this.collection).doc('current').delete();
      this.cachedSchedules = null;

      if (window.SchoolClock) {
        SchoolClock.schedules = this.defaultSchedules;
      }

      return { success: true };
    } catch (error) {
      console.error('Error resetting schedules:', error);
      return { success: false, error: error.message };
    }
  },

  // === SPECIAL SCHEDULE FOR SPECIFIC DATE ===
  async setSpecialSchedule(date, schedule, reason) {
    try {
      await db.collection('specialSchedules').doc(date).set({
        date,
        schedule,
        reason,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: AuthService.currentUser?.uid
      });
      return { success: true };
    } catch (error) {
      console.error('Error setting special schedule:', error);
      return { success: false, error: error.message };
    }
  },

  async getSpecialSchedule(date) {
    try {
      const doc = await db.collection('specialSchedules').doc(date).get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting special schedule:', error);
      return null;
    }
  }
};

// Export
window.ScheduleService = ScheduleService;
