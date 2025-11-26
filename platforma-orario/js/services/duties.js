/* ========================================
   DUTIES SERVICE - Εφημερίες Καθηγητών
   ======================================== */

const DutiesService = {
  activeListeners: [],

  // Τύποι εφημερίας
  dutyTypes: {
    morning: { label: 'Πρωινή', time: '07:30-08:15', icon: '🌅' },
    break1: { label: '1ο Διάλειμμα', time: '09:00-09:15', icon: '☕' },
    break2: { label: '2ο Διάλειμμα', time: '10:00-10:15', icon: '☕' },
    break3: { label: '3ο Διάλειμμα', time: '11:00-11:15', icon: '☕' },
    lunch: { label: 'Μεσημεριανό', time: '12:00-12:30', icon: '🍽️' },
    afternoon: { label: 'Απογευματινή', time: '13:30-14:00', icon: '🌇' }
  },

  // Ημέρες
  weekDays: ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'],

  // === FETCH METHODS ===

  async getWeek(startDate) {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const snapshot = await firebaseDb.collection('duties')
        .where('date', '>=', startDate)
        .where('date', '<', endDate)
        .get();

      const duties = [];
      snapshot.forEach(doc => {
        duties.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: duties };
    } catch (error) {
      console.error('Error fetching duties:', error);
      return { success: false, error: error.message };
    }
  },

  async getForTeacher(teacherId, startDate, endDate) {
    try {
      const snapshot = await firebaseDb.collection('duties')
        .where('teacherId', '==', teacherId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();

      const duties = [];
      snapshot.forEach(doc => {
        duties.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: duties };
    } catch (error) {
      console.error('Error fetching teacher duties:', error);
      return { success: false, error: error.message };
    }
  },

  subscribe(startDate, callback) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const unsubscribe = firebaseDb.collection('duties')
      .where('date', '>=', startDate)
      .where('date', '<', endDate)
      .onSnapshot(snapshot => {
        const duties = [];
        snapshot.forEach(doc => {
          duties.push({ id: doc.id, ...doc.data() });
        });
        callback(duties);
      }, error => {
        console.error('Duties subscription error:', error);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // === CREATE / UPDATE / DELETE ===

  async assign(data) {
    try {
      const currentUser = AuthService.currentUserData;

      const duty = {
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        date: data.date,
        dutyType: data.dutyType,
        location: data.location || '',
        notes: data.notes || '',
        status: 'assigned', // assigned, completed, swapped
        assignedBy: AuthService.currentUser.uid,
        assignedByName: currentUser?.displayName || 'Σύστημα',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('duties').add(duty);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error assigning duty:', error);
      return { success: false, error: error.message };
    }
  },

  async update(dutyId, data) {
    try {
      await firebaseDb.collection('duties').doc(dutyId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating duty:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(dutyId) {
    try {
      await firebaseDb.collection('duties').doc(dutyId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting duty:', error);
      return { success: false, error: error.message };
    }
  },

  // === SWAP REQUEST ===

  async requestSwap(dutyId, requestData) {
    try {
      const swapRequest = {
        dutyId: dutyId,
        requesterId: AuthService.currentUser.uid,
        requesterName: AuthService.currentUserData?.displayName,
        targetTeacherId: requestData.targetTeacherId,
        targetTeacherName: requestData.targetTeacherName,
        reason: requestData.reason || '',
        status: 'pending', // pending, approved, rejected
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('dutySwapRequests').add(swapRequest);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error requesting swap:', error);
      return { success: false, error: error.message };
    }
  },

  // === HELPERS ===

  getDutyTypeInfo(type) {
    return this.dutyTypes[type] || { label: type, time: '', icon: '📋' };
  },

  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  formatDate(date) {
    return date.toLocaleDateString('el-GR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  },

  unsubscribeAll() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
  }
};

// Export
window.DutiesService = DutiesService;
