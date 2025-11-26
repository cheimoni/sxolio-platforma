/* ========================================
   GROUPS SERVICE - Διαχείριση Ομάδων
   ======================================== */

const GroupsService = {
  groups: [],
  unsubscribe: null,

  // === CRUD OPERATIONS ===

  // Δημιουργία νέας ομάδας
  async create(groupData) {
    try {
      const docRef = await firebaseDb.collection('groups').add({
        name: groupData.name,
        description: groupData.description || '',
        type: groupData.type || 'custom', // custom, department, committee
        members: groupData.members || [],
        managers: groupData.managers || [], // ΒΔΑ, ΒΔ που διαχειρίζονται την ομάδα
        permissions: groupData.permissions || this.getDefaultPermissions(),
        memberPermissions: groupData.memberPermissions || {}, // userId: {permission: true/false}
        createdBy: AuthService.currentUser?.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating group:', error);
      return { success: false, error: error.message };
    }
  },

  // Ενημέρωση ομάδας
  async update(groupId, data) {
    try {
      await firebaseDb.collection('groups').doc(groupId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating group:', error);
      return { success: false, error: error.message };
    }
  },

  // Διαγραφή ομάδας
  async delete(groupId) {
    try {
      await firebaseDb.collection('groups').doc(groupId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting group:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη όλων των ομάδων
  async getAll() {
    try {
      // Try with orderBy first, fallback if index is missing
      let snapshot;
      try {
        snapshot = await firebaseDb.collection('groups')
          .where('isActive', '==', true)
          .orderBy('name')
          .get();
      } catch (orderByError) {
        // If orderBy fails (missing index), get without ordering
        console.warn('OrderBy failed for groups, fetching without order:', orderByError.message);
        snapshot = await firebaseDb.collection('groups')
          .where('isActive', '==', true)
          .get();
      }

      const groups = [];
      snapshot.forEach(doc => {
        groups.push({ id: doc.id, ...doc.data() });
      });

      // Sort manually if orderBy failed
      groups.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      return { success: true, data: groups };
    } catch (error) {
      console.error('Error fetching groups:', error);
      
      // Handle missing index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
        if (indexUrl && !window._groupsIndexErrorLogged) {
          console.warn('⚠️ Firestore Index Required for Groups');
          console.warn('The groups query requires a composite index.');
          console.warn('Create it here:', indexUrl);
          console.warn('Or manually in Firebase Console:');
          console.warn('  Collection: groups');
          console.warn('  Fields: isActive (Ascending), name (Ascending), __name__ (Ascending)');
          window._groupsIndexErrorLogged = true;
        }
        
        // Return empty array gracefully so app continues to work
        return { 
          success: true, 
          data: [],
          warning: 'Index not yet created. Groups will appear after index is created.'
        };
      }
      
      return { success: false, error: error.message };
    }
  },

  // Λήψη ομάδας με ID
  async getById(groupId) {
    try {
      const doc = await firebaseDb.collection('groups').doc(groupId).get();

      if (!doc.exists) {
        return { success: false, error: 'Η ομάδα δεν βρέθηκε' };
      }

      return { success: true, data: { id: doc.id, ...doc.data() } };
    } catch (error) {
      console.error('Error fetching group:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη ομάδων που ανήκει ο χρήστης
  async getByUser(userId) {
    try {
      const snapshot = await firebaseDb.collection('groups')
        .where('members', 'array-contains', userId)
        .where('isActive', '==', true)
        .get();

      const groups = [];
      snapshot.forEach(doc => {
        groups.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: groups };
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return { success: false, error: error.message };
    }
  },

  // === MEMBER MANAGEMENT ===

  // Προσθήκη μέλους
  async addMember(groupId, userId, permissions = null) {
    try {
      const updateData = {
        members: firebase.firestore.FieldValue.arrayUnion(userId)
      };

      // Αν δόθηκαν συγκεκριμένα δικαιώματα
      if (permissions) {
        updateData[`memberPermissions.${userId}`] = permissions;
      }

      await firebaseDb.collection('groups').doc(groupId).update(updateData);

      return { success: true };
    } catch (error) {
      console.error('Error adding member:', error);
      return { success: false, error: error.message };
    }
  },

  // Αφαίρεση μέλους
  async removeMember(groupId, userId) {
    try {
      await firebaseDb.collection('groups').doc(groupId).update({
        members: firebase.firestore.FieldValue.arrayRemove(userId),
        [`memberPermissions.${userId}`]: firebase.firestore.FieldValue.delete()
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing member:', error);
      return { success: false, error: error.message };
    }
  },

  // Ενημέρωση δικαιωμάτων μέλους
  async updateMemberPermissions(groupId, userId, permissions) {
    try {
      await firebaseDb.collection('groups').doc(groupId).update({
        [`memberPermissions.${userId}`]: permissions
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating member permissions:', error);
      return { success: false, error: error.message };
    }
  },

  // === MANAGER MANAGEMENT ===

  // Προσθήκη υπεύθυνου ομάδας
  async addManager(groupId, userId) {
    try {
      await firebaseDb.collection('groups').doc(groupId).update({
        managers: firebase.firestore.FieldValue.arrayUnion(userId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding manager:', error);
      return { success: false, error: error.message };
    }
  },

  // Αφαίρεση υπεύθυνου
  async removeManager(groupId, userId) {
    try {
      await firebaseDb.collection('groups').doc(groupId).update({
        managers: firebase.firestore.FieldValue.arrayRemove(userId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing manager:', error);
      return { success: false, error: error.message };
    }
  },

  // === PERMISSIONS ===

  // Προεπιλεγμένα δικαιώματα ομάδας
  getDefaultPermissions() {
    return {
      canPost: true,           // Μπορεί να στέλνει μηνύματα
      canUploadFiles: true,    // Μπορεί να ανεβάζει αρχεία
      canCreateEvents: false,  // Μπορεί να δημιουργεί events
      canInviteMembers: false, // Μπορεί να προσκαλεί μέλη
      canEditGroup: false,     // Μπορεί να επεξεργάζεται την ομάδα
      canRemoveMembers: false  // Μπορεί να αφαιρεί μέλη
    };
  },

  // Έλεγχος αν ο χρήστης έχει δικαίωμα στην ομάδα
  hasMemberPermission(group, userId, permission) {
    // Ο admin έχει πάντα όλα τα δικαιώματα
    if (isSuperAdmin(AuthService.currentUserData?.role)) return true;

    // Οι managers έχουν όλα τα δικαιώματα
    if (group.managers?.includes(userId)) return true;

    // Έλεγχος ατομικών δικαιωμάτων μέλους
    const memberPerms = group.memberPermissions?.[userId];
    if (memberPerms && memberPerms[permission] !== undefined) {
      return memberPerms[permission];
    }

    // Επιστροφή στα default δικαιώματα ομάδας
    return group.permissions?.[permission] ?? false;
  },

  // Έλεγχος αν είναι manager
  isManager(group, userId) {
    if (isSuperAdmin(AuthService.currentUserData?.role)) return true;
    return group.managers?.includes(userId);
  },

  // Έλεγχος αν είναι μέλος
  isMember(group, userId) {
    return group.members?.includes(userId);
  },

  // === SUBSCRIPTION ===

  subscribe(callback) {
    this.unsubscribe = firebaseDb.collection('groups')
      .where('isActive', '==', true)
      .orderBy('name')
      .onSnapshot(snapshot => {
        const groups = [];
        snapshot.forEach(doc => {
          groups.push({ id: doc.id, ...doc.data() });
        });
        this.groups = groups;
        callback(groups);
      });

    return this.unsubscribe;
  },

  unsubscribeAll() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  },

  // === HELPERS ===

  // Τύποι ομάδων
  getGroupTypes() {
    return {
      custom: 'Προσαρμοσμένη',
      department: 'Τμήμα/Τομέας',
      committee: 'Επιτροπή',
      project: 'Project/Έργο',
      class: 'Τάξη'
    };
  },

  // Διαθέσιμα δικαιώματα
  getAvailablePermissions() {
    return {
      canPost: 'Αποστολή μηνυμάτων',
      canUploadFiles: 'Ανέβασμα αρχείων',
      canCreateEvents: 'Δημιουργία events',
      canInviteMembers: 'Πρόσκληση μελών',
      canEditGroup: 'Επεξεργασία ομάδας',
      canRemoveMembers: 'Αφαίρεση μελών'
    };
  }
};

// Export
window.GroupsService = GroupsService;
