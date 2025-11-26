/* ========================================
   SUBSTITUTIONS SERVICE - Αντικαταστάσεις
   ======================================== */

const SubstitutionsService = {
  collection: 'substitutions',

  // === CREATE SUBSTITUTION REQUEST ===
  async create(data) {
    try {
      const user = AuthService.currentUser;
      const userData = AuthService.currentUserData;

      if (!user) {
        return { success: false, error: 'Απαιτείται σύνδεση' };
      }

      const substitution = {
        // Original teacher info
        originalTeacherId: user.uid,
        originalTeacherName: userData?.name || 'Άγνωστος',

        // Substitute teacher info
        substituteTeacherId: data.substituteTeacherId || null,
        substituteTeacherName: data.substituteTeacherName || null,

        // Schedule info
        date: data.date,
        period: data.period, // 1-7
        subject: data.subject,
        classroom: data.classroom,

        // Request details
        reason: data.reason,
        notes: data.notes || '',

        // Status
        status: 'pending', // pending, approved, rejected, cancelled

        // Timestamps
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

        // Admin who processed
        processedBy: null,
        processedAt: null,
        processedNote: null
      };

      const docRef = await db.collection(this.collection).add(substitution);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating substitution:', error);
      return { success: false, error: error.message };
    }
  },

  // === GET SUBSTITUTIONS FOR DATE ===
  async getForDate(date) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('date', '==', date)
        .orderBy('period')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting substitutions:', error);
      return [];
    }
  },

  // === GET MY SUBSTITUTIONS ===
  async getMine(asOriginal = true) {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) return [];

      const field = asOriginal ? 'originalTeacherId' : 'substituteTeacherId';
      const snapshot = await db.collection(this.collection)
        .where(field, '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting my substitutions:', error);
      return [];
    }
  },

  // === GET PENDING (for admins) ===
  async getPending() {
    try {
      const snapshot = await db.collection(this.collection)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting pending substitutions:', error);
      return [];
    }
  },

  // === SUBSCRIBE ===
  subscribe(callback, filter = 'all') {
    let query = db.collection(this.collection);

    if (filter === 'pending') {
      query = query.where('status', '==', 'pending');
    } else if (filter === 'mine') {
      const userId = AuthService.currentUser?.uid;
      query = query.where('originalTeacherId', '==', userId);
    }

    query = query.orderBy('createdAt', 'desc').limit(100);

    const unsubscribe = query.onSnapshot(snapshot => {
      const substitutions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(substitutions);
    }, error => {
      console.error('Substitutions subscription error:', error);
    });

    return unsubscribe;
  },

  // === APPROVE SUBSTITUTION ===
  async approve(id, substituteTeacherId, substituteTeacherName, note = '') {
    try {
      const userId = AuthService.currentUser?.uid;
      const userData = AuthService.currentUserData;

      await db.collection(this.collection).doc(id).update({
        status: 'approved',
        substituteTeacherId,
        substituteTeacherName,
        processedBy: userId,
        processedByName: userData?.name || 'Διαχειριστής',
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedNote: note,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error approving substitution:', error);
      return { success: false, error: error.message };
    }
  },

  // === REJECT SUBSTITUTION ===
  async reject(id, note = '') {
    try {
      const userId = AuthService.currentUser?.uid;
      const userData = AuthService.currentUserData;

      await db.collection(this.collection).doc(id).update({
        status: 'rejected',
        processedBy: userId,
        processedByName: userData?.name || 'Διαχειριστής',
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedNote: note,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting substitution:', error);
      return { success: false, error: error.message };
    }
  },

  // === CANCEL (by original teacher) ===
  async cancel(id) {
    try {
      const userId = AuthService.currentUser?.uid;
      const doc = await db.collection(this.collection).doc(id).get();

      if (!doc.exists || doc.data().originalTeacherId !== userId) {
        return { success: false, error: 'Δεν έχετε δικαίωμα' };
      }

      if (doc.data().status !== 'pending') {
        return { success: false, error: 'Δεν μπορεί να ακυρωθεί' };
      }

      await db.collection(this.collection).doc(id).update({
        status: 'cancelled',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling substitution:', error);
      return { success: false, error: error.message };
    }
  },

  // === GET AVAILABLE TEACHERS ===
  async getAvailableTeachers(date, period) {
    try {
      // Get all teachers
      const teachersSnapshot = await db.collection('users')
        .where('role', '==', 'teacher')
        .get();

      // Get busy teachers for this period
      const busySnapshot = await db.collection(this.collection)
        .where('date', '==', date)
        .where('period', '==', period)
        .where('status', '==', 'approved')
        .get();

      const busyIds = new Set();
      busySnapshot.docs.forEach(doc => {
        busyIds.add(doc.data().substituteTeacherId);
        busyIds.add(doc.data().originalTeacherId);
      });

      return teachersSnapshot.docs
        .filter(doc => !busyIds.has(doc.id))
        .map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting available teachers:', error);
      return [];
    }
  },

  // === HELPERS ===
  getStatusInfo(status) {
    switch (status) {
      case 'pending': return { label: 'Εκκρεμεί', color: 'warning', icon: '⏳' };
      case 'approved': return { label: 'Εγκρίθηκε', color: 'success', icon: '✅' };
      case 'rejected': return { label: 'Απορρίφθηκε', color: 'error', icon: '❌' };
      case 'cancelled': return { label: 'Ακυρώθηκε', color: 'gray', icon: '🚫' };
      default: return { label: 'Άγνωστο', color: 'gray', icon: '❓' };
    }
  },

  getPeriodLabel(period) {
    const periods = {
      1: '1η ώρα (08:15-09:00)',
      2: '2η ώρα (09:00-09:45)',
      3: '3η ώρα (10:00-10:45)',
      4: '4η ώρα (10:45-11:30)',
      5: '5η ώρα (11:45-12:30)',
      6: '6η ώρα (12:30-13:15)',
      7: '7η ώρα (13:15-14:00)'
    };
    return periods[period] || `${period}η ώρα`;
  }
};

// Export
window.SubstitutionsService = SubstitutionsService;
