/* ========================================
   ANNOUNCEMENTS SERVICE
   ======================================== */

const AnnouncementsService = {
  // Active listeners
  activeListeners: [],

  // === FETCH METHODS ===

  // Λήψη όλων των ανακοινώσεων
  async getAll(limit = 50) {
    try {
      const snapshot = await firebaseDb.collection('announcements')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const announcements = [];
      snapshot.forEach(doc => {
        announcements.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: announcements };
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη ανακοινώσεων για συγκεκριμένο χρήστη
  async getForUser(userId, userRole) {
    try {
      // Fetch all and filter client-side (Firestore limitation for complex queries)
      const result = await this.getAll(100);

      if (!result.success) return result;

      const filtered = result.data.filter(ann => {
        // All users can see "all" announcements
        if (ann.target === 'all') return true;

        // Check role-based targeting
        if (ann.target === 'teachers' && userRole === ROLES.TEACHER) return true;
        if (ann.target === 'admins' && isAdmin(userRole)) return true;

        // Check specific user targeting
        if (ann.targetUsers?.includes(userId)) return true;

        // Check department targeting
        // TODO: Implement department-based filtering

        return false;
      });

      return { success: true, data: filtered };
    } catch (error) {
      console.error('Error fetching user announcements:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener για ανακοινώσεις
  subscribe(callback) {
    const unsubscribe = firebaseDb.collection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const announcements = [];
        snapshot.forEach(doc => {
          announcements.push({ id: doc.id, ...doc.data() });
        });
        callback(announcements);
      }, error => {
        console.error('Announcements subscription error:', error);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // === CREATE / UPDATE / DELETE ===

  // Δημιουργία ανακοίνωσης
  async create(data) {
    try {
      const currentUser = AuthService.currentUserData;

      const announcementData = {
        title: data.title.trim(),
        content: data.content.trim(),
        target: data.target || 'all',
        targetUsers: data.targetUsers || [],
        targetDepartments: data.targetDepartments || [],
        priority: data.priority || 'normal', // low, normal, high
        authorId: AuthService.currentUser.uid,
        authorName: currentUser?.displayName || 'Άγνωστος',
        authorRole: currentUser?.role || '',
        readBy: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('announcements').add(announcementData);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating announcement:', error);
      return { success: false, error: error.message };
    }
  },

  // Ενημέρωση ανακοίνωσης
  async update(announcementId, data) {
    try {
      await firebaseDb.collection('announcements').doc(announcementId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating announcement:', error);
      return { success: false, error: error.message };
    }
  },

  // Διαγραφή ανακοίνωσης
  async delete(announcementId) {
    try {
      await firebaseDb.collection('announcements').doc(announcementId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return { success: false, error: error.message };
    }
  },

  // === READ STATUS ===

  // Σήμανση ως αναγνωσμένο
  async markAsRead(announcementId, userId) {
    try {
      await firebaseDb.collection('announcements').doc(announcementId).update({
        readBy: firebase.firestore.FieldValue.arrayUnion(userId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Έλεγχος αν έχει διαβαστεί
  isRead(announcement, userId) {
    return announcement.readBy?.includes(userId) || false;
  },

  // Μέτρηση αδιάβαστων
  async getUnreadCount(userId, userRole) {
    const result = await this.getForUser(userId, userRole);

    if (!result.success) return 0;

    return result.data.filter(ann => !this.isRead(ann, userId)).length;
  },

  // === HELPERS ===

  // Get priority label
  getPriorityLabel(priority) {
    const labels = {
      low: 'Χαμηλή',
      normal: 'Κανονική',
      high: 'Υψηλή'
    };
    return labels[priority] || 'Κανονική';
  },

  // Get target label
  getTargetLabel(target) {
    const labels = {
      all: 'Όλοι',
      teachers: 'Καθηγητές',
      admins: 'Διοίκηση',
      specific: 'Συγκεκριμένοι'
    };
    return labels[target] || target;
  },

  // === CLEANUP ===

  unsubscribeAll() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
  }
};

// Export
window.AnnouncementsService = AnnouncementsService;
