/* ========================================
   USERS SERVICE - Διαχείριση χρηστών
   ======================================== */

const UsersService = {
  // Cache χρηστών
  usersCache: new Map(),

  // === FETCH METHODS ===

  // Λήψη όλων των ενεργών χρηστών
  async getAll() {
    try {
      const snapshot = await firebaseDb.collection('users')
        .where('isActive', '==', true)
        .orderBy('displayName')
        .get();

      const users = [];
      snapshot.forEach(doc => {
        const user = { id: doc.id, ...doc.data() };
        users.push(user);
        this.usersCache.set(doc.id, user);
      });

      return { success: true, data: users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη ΟΛΩΝ των χρηστών (και ανενεργών) - για admin
  async getAllAdmin() {
    try {
      // Try with orderBy first, but fallback to simple query if index is missing
      let snapshot;
      try {
        snapshot = await firebaseDb.collection('users')
          .orderBy('displayName')
          .get();
      } catch (orderByError) {
        // If orderBy fails (missing index), get all without ordering
        console.warn('OrderBy failed, fetching without order:', orderByError.message);
        snapshot = await firebaseDb.collection('users').get();
      }

      const users = [];
      snapshot.forEach(doc => {
        const user = { id: doc.id, ...doc.data() };
        users.push(user);
        this.usersCache.set(doc.id, user);
      });

      // Sort manually if orderBy failed
      users.sort((a, b) => {
        const nameA = (a.displayName || a.email || '').toLowerCase();
        const nameB = (b.displayName || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      return { success: true, data: users };
    } catch (error) {
      console.error('Error fetching all users:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη χρήστη με ID
  async getById(userId) {
    // Check cache first
    if (this.usersCache.has(userId)) {
      return { success: true, data: this.usersCache.get(userId) };
    }

    try {
      const doc = await firebaseDb.collection('users').doc(userId).get();

      if (!doc.exists) {
        return { success: false, error: 'Ο χρήστης δεν βρέθηκε' };
      }

      const user = { id: doc.id, ...doc.data() };
      this.usersCache.set(userId, user);

      return { success: true, data: user };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη χρηστών με ρόλο
  async getByRole(role) {
    try {
      const snapshot = await firebaseDb.collection('users')
        .where('role', '==', role)
        .where('isActive', '==', true)
        .orderBy('displayName')
        .get();

      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: users };
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return { success: false, error: error.message };
    }
  },

  // Αναζήτηση χρηστών
  async search(query) {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const queryLower = query.toLowerCase();

    try {
      // Fetch all and filter (Firestore doesn't support full-text search)
      const result = await this.getAll();

      if (!result.success) return result;

      const filtered = result.data.filter(user =>
        user.displayName?.toLowerCase().includes(queryLower) ||
        user.email?.toLowerCase().includes(queryLower) ||
        user.specialty?.toLowerCase().includes(queryLower)
      );

      return { success: true, data: filtered };
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, error: error.message };
    }
  },

  // === CREATE / UPDATE ===

  // Δημιουργία χρήστη (μόνο για admin)
  async create(userData) {
    try {
      const docRef = await firebaseDb.collection('users').add({
        ...userData,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: null
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Ενημέρωση χρήστη
  async update(userId, data) {
    try {
      await firebaseDb.collection('users').doc(userId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update cache
      if (this.usersCache.has(userId)) {
        const cached = this.usersCache.get(userId);
        this.usersCache.set(userId, { ...cached, ...data });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Απενεργοποίηση χρήστη (soft delete)
  async deactivate(userId) {
    return this.update(userId, { isActive: false });
  },

  // Επανενεργοποίηση χρήστη
  async reactivate(userId) {
    return this.update(userId, { isActive: true });
  },

  // Αλλαγή ρόλου χρήστη
  async changeRole(userId, newRole) {
    return this.update(userId, { role: newRole });
  },

  // === PENDING USERS (Admin) ===

  // Λήψη εκκρεμών αιτήσεων εγγραφής
  async getPending() {
    try {
      // Try with orderBy first, fallback if index missing
      let snapshot;
      try {
        snapshot = await firebaseDb.collection('users')
          .where('isPending', '==', true)
          .orderBy('createdAt', 'desc')
          .get();
      } catch (orderByError) {
        // If orderBy fails, get without ordering
        console.warn('OrderBy failed for pending users, fetching without order:', orderByError.message);
        snapshot = await firebaseDb.collection('users')
          .where('isPending', '==', true)
          .get();
      }

      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Sort manually if orderBy failed
      users.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA; // Descending
      });

      return { success: true, data: users };
    } catch (error) {
      console.error('Error fetching pending users:', error);
      
      // Handle missing index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
        console.warn('Index required for pending users query. URL:', indexUrl);
      }
      
      return { success: false, error: error.message };
    }
  },

  // Έγκριση χρήστη
  async approve(userId, role) {
    try {
      await firebaseDb.collection('users').doc(userId).update({
        isPending: false,
        isActive: true,
        role: role,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        approvedBy: AuthService.currentUser?.uid
      });

      return { success: true };
    } catch (error) {
      console.error('Error approving user:', error);
      return { success: false, error: error.message };
    }
  },

  // Απόρριψη χρήστη
  async reject(userId) {
    try {
      await firebaseDb.collection('users').doc(userId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error rejecting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Οριστική διαγραφή χρήστη
  async delete(userId) {
    try {
      await firebaseDb.collection('users').doc(userId).delete();
      this.usersCache.delete(userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  },

  // === HELPERS ===

  // Clear cache
  clearCache() {
    this.usersCache.clear();
  },

  // Get from cache
  getFromCache(userId) {
    return this.usersCache.get(userId);
  },

  // Get display name from cache
  getDisplayName(userId) {
    const user = this.usersCache.get(userId);
    return user?.displayName || 'Άγνωστος';
  }
};

// Export
window.UsersService = UsersService;
