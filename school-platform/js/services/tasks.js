/* ========================================
   TASKS SERVICE - Εργασίες/Υπενθυμίσεις
   ======================================== */

const TasksService = {
  collection: 'tasks',

  // === CREATE TASK ===
  async create(data) {
    try {
      const user = AuthService.currentUser;
      const userData = AuthService.currentUserData;

      if (!user) {
        return { success: false, error: 'Απαιτείται σύνδεση' };
      }

      const task = {
        title: data.title,
        description: data.description || '',
        priority: data.priority || 'medium', // low, medium, high
        dueDate: data.dueDate || null,
        category: data.category || 'general', // general, meeting, deadline, personal

        // Assignment
        createdBy: user.uid,
        creatorName: userData?.name || 'Άγνωστος',
        assignedTo: data.assignedTo || user.uid, // default to self
        assignedToName: data.assignedToName || userData?.name || 'Άγνωστος',

        // Status
        status: 'pending', // pending, in_progress, completed, cancelled
        completedAt: null,

        // Timestamps
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

        // Reminders
        reminderAt: data.reminderAt || null,
        reminderSent: false
      };

      const docRef = await db.collection(this.collection).add(task);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }
  },

  // === GET MY TASKS ===
  async getMine(includeCompleted = false) {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) return [];

      let query = db.collection(this.collection)
        .where('assignedTo', '==', userId);

      if (!includeCompleted) {
        query = query.where('status', 'in', ['pending', 'in_progress']);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  // === GET TASKS I CREATED (for others) ===
  async getCreatedByMe() {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) return [];

      const snapshot = await db.collection(this.collection)
        .where('createdBy', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting created tasks:', error);
      return [];
    }
  },

  // === SUBSCRIBE TO MY TASKS ===
  subscribe(callback) {
    const userId = AuthService.currentUser?.uid;
    if (!userId) return () => {};

    const unsubscribe = db.collection(this.collection)
      .where('assignedTo', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(tasks);
      }, error => {
        console.error('Tasks subscription error:', error);
      });

    return unsubscribe;
  },

  // === UPDATE TASK ===
  async update(taskId, data) {
    try {
      await db.collection(this.collection).doc(taskId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    }
  },

  // === MARK AS COMPLETED ===
  async complete(taskId) {
    try {
      await db.collection(this.collection).doc(taskId).update({
        status: 'completed',
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: error.message };
    }
  },

  // === REOPEN TASK ===
  async reopen(taskId) {
    try {
      await db.collection(this.collection).doc(taskId).update({
        status: 'pending',
        completedAt: null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error reopening task:', error);
      return { success: false, error: error.message };
    }
  },

  // === DELETE TASK ===
  async delete(taskId) {
    try {
      await db.collection(this.collection).doc(taskId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  },

  // === GET OVERDUE TASKS ===
  async getOverdue() {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) return [];

      const now = new Date();
      const snapshot = await db.collection(this.collection)
        .where('assignedTo', '==', userId)
        .where('status', 'in', ['pending', 'in_progress'])
        .where('dueDate', '<', now)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      return [];
    }
  },

  // === HELPERS ===
  getPriorityInfo(priority) {
    switch (priority) {
      case 'high': return { label: 'Υψηλή', color: 'error', icon: '🔴' };
      case 'medium': return { label: 'Μεσαία', color: 'warning', icon: '🟡' };
      case 'low': return { label: 'Χαμηλή', color: 'success', icon: '🟢' };
      default: return { label: 'Κανονική', color: 'gray', icon: '⚪' };
    }
  },

  getCategoryInfo(category) {
    switch (category) {
      case 'meeting': return { label: 'Συνάντηση', icon: '📅' };
      case 'deadline': return { label: 'Προθεσμία', icon: '⏰' };
      case 'personal': return { label: 'Προσωπικό', icon: '👤' };
      default: return { label: 'Γενικό', icon: '📋' };
    }
  },

  isOverdue(task) {
    if (!task.dueDate || task.status === 'completed') return false;
    const due = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    return due < new Date();
  },

  getDueDateLabel(task) {
    if (!task.dueDate) return null;

    const due = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
    const now = new Date();
    const diff = due - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: 'Εκπρόθεσμο', class: 'overdue' };
    if (days === 0) return { text: 'Σήμερα', class: 'today' };
    if (days === 1) return { text: 'Αύριο', class: 'tomorrow' };
    if (days <= 7) return { text: `Σε ${days} μέρες`, class: 'soon' };
    return { text: formatDate(due), class: 'normal' };
  }
};

// Export
window.TasksService = TasksService;
