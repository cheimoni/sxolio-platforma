/* ========================================
   AUTH SERVICE - Σύνδεση/Αποσύνδεση
   ======================================== */

const AuthService = {
  // Τρέχων χρήστης
  currentUser: null,
  currentUserData: null,

  // Listeners
  authStateListeners: [],

  // === INITIALIZATION ===

  init() {
    firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        this.currentUser = user;
        await this.fetchUserData(user.uid);
      } else {
        this.currentUser = null;
        this.currentUserData = null;
      }

      // Notify listeners
      this.authStateListeners.forEach(callback => {
        callback(this.currentUser, this.currentUserData);
      });
    });
  },

  // === AUTH METHODS ===

  // Login με email/password
  async login(email, password) {
    try {
      const result = await firebaseAuth.signInWithEmailAndPassword(email, password);

      // Check if user is pending approval
      const userDoc = await firebaseDb.collection('users').doc(result.user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.isPending) {
          // Sign out pending user
          await firebaseAuth.signOut();
          return {
            success: false,
            error: 'Η αίτησή σας αναμένει έγκριση από τον διαχειριστή. Θα ενημερωθείτε με email.',
            isPending: true
          };
        }
        if (userData.isActive === false) {
          await firebaseAuth.signOut();
          return {
            success: false,
            error: 'Ο λογαριασμός σας έχει απενεργοποιηθεί. Επικοινωνήστε με τον διαχειριστή.'
          };
        }
      }

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // Register new user (pending approval)
  async register(userData) {
    try {
      // Create Firebase Auth account
      const result = await firebaseAuth.createUserWithEmailAndPassword(
        userData.email,
        userData.password
      );

      // Create pending user document in Firestore
      await firebaseDb.collection('users').doc(result.user.uid).set({
        displayName: userData.displayName,
        email: userData.email,
        phone: userData.phone || '',
        specialty: userData.specialty || '',
        message: userData.message || '',
        isPending: true,
        isActive: false,
        role: null, // Will be set by admin on approval
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Sign out immediately (user needs approval first)
      await firebaseAuth.signOut();

      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // Logout
  async logout() {
    try {
      await firebaseAuth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await firebaseAuth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  },

  // === USER DATA ===

  // Fetch user data from Firestore
  async fetchUserData(uid) {
    try {
      const doc = await firebaseDb.collection('users').doc(uid).get();

      if (doc.exists) {
        this.currentUserData = { id: doc.id, ...doc.data() };

        // Update last seen
        await firebaseDb.collection('users').doc(uid).update({
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      return this.currentUserData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  },

  // === LISTENERS ===

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);

    // Call immediately with current state
    if (this.currentUser !== undefined) {
      callback(this.currentUser, this.currentUserData);
    }
  },

  // === HELPERS ===

  // Get user-friendly error messages
  getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'Δεν βρέθηκε χρήστης με αυτό το email',
      'auth/wrong-password': 'Λάθος κωδικός πρόσβασης',
      'auth/invalid-email': 'Μη έγκυρο email',
      'auth/user-disabled': 'Ο λογαριασμός είναι απενεργοποιημένος',
      'auth/too-many-requests': 'Πολλές αποτυχημένες προσπάθειες. Δοκιμάστε αργότερα',
      'auth/network-request-failed': 'Πρόβλημα σύνδεσης. Ελέγξτε το internet',
      'auth/email-already-in-use': 'Αυτό το email χρησιμοποιείται ήδη',
      'auth/weak-password': 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες',
      'auth/invalid-credential': 'Λάθος email ή κωδικός πρόσβασης'
    };

    return messages[code] || 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά';
  },

  // Check if logged in
  isLoggedIn() {
    return this.currentUser !== null;
  },

  // Get current user role
  getUserRole() {
    return this.currentUserData?.role || null;
  },

  // Check permission
  can(permission) {
    return hasPermission(this.getUserRole(), permission);
  }
};

// Initialize on load
AuthService.init();

// Export
window.AuthService = AuthService;
