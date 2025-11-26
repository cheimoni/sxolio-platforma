/* ========================================
   POLLS SERVICE - Ψηφοφορίες
   ======================================== */

const PollsService = {
  activeListeners: [],

  // === FETCH METHODS ===

  async getAll() {
    try {
      const snapshot = await firebaseDb.collection('polls')
        .orderBy('createdAt', 'desc')
        .get();

      const polls = [];
      snapshot.forEach(doc => {
        polls.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: polls };
    } catch (error) {
      console.error('Error fetching polls:', error);
      return { success: false, error: error.message };
    }
  },

  async getActive() {
    try {
      const now = new Date();
      const snapshot = await firebaseDb.collection('polls')
        .where('status', '==', 'active')
        .where('expiresAt', '>', now)
        .orderBy('expiresAt', 'asc')
        .get();

      const polls = [];
      snapshot.forEach(doc => {
        polls.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: polls };
    } catch (error) {
      console.error('Error fetching active polls:', error);
      return { success: false, error: error.message };
    }
  },

  subscribe(callback) {
    const unsubscribe = firebaseDb.collection('polls')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const polls = [];
        snapshot.forEach(doc => {
          polls.push({ id: doc.id, ...doc.data() });
        });
        callback(polls);
      }, error => {
        console.error('Polls subscription error:', error);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // === CREATE / UPDATE / DELETE ===

  async create(data) {
    try {
      const currentUser = AuthService.currentUserData;

      const poll = {
        question: data.question.trim(),
        description: data.description?.trim() || '',
        options: data.options.map(opt => ({
          id: this.generateId(),
          text: opt.trim(),
          votes: 0
        })),
        allowMultiple: data.allowMultiple || false,
        anonymous: data.anonymous || false,
        status: 'active',
        voters: [],
        voterChoices: {}, // userId: [optionIds]
        targetRoles: data.targetRoles || ['all'],
        expiresAt: data.expiresAt || this.getDefaultExpiry(),
        createdBy: AuthService.currentUser.uid,
        creatorName: currentUser?.displayName || 'Άγνωστος',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('polls').add(poll);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating poll:', error);
      return { success: false, error: error.message };
    }
  },

  async vote(pollId, optionIds) {
    try {
      const userId = AuthService.currentUser.uid;
      const pollRef = firebaseDb.collection('polls').doc(pollId);

      await firebaseDb.runTransaction(async (transaction) => {
        const pollDoc = await transaction.get(pollRef);
        if (!pollDoc.exists) throw new Error('Poll not found');

        const poll = pollDoc.data();

        // Check if already voted
        if (poll.voters.includes(userId)) {
          throw new Error('Already voted');
        }

        // Check if expired
        const expiresAt = poll.expiresAt?.toDate ? poll.expiresAt.toDate() : new Date(poll.expiresAt);
        if (new Date() > expiresAt) {
          throw new Error('Poll expired');
        }

        // Update votes
        const options = poll.options.map(opt => {
          if (optionIds.includes(opt.id)) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });

        transaction.update(pollRef, {
          options,
          voters: firebase.firestore.FieldValue.arrayUnion(userId),
          [`voterChoices.${userId}`]: optionIds
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Error voting:', error);
      return { success: false, error: error.message };
    }
  },

  async close(pollId) {
    try {
      await firebaseDb.collection('polls').doc(pollId).update({
        status: 'closed',
        closedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error closing poll:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(pollId) {
    try {
      await firebaseDb.collection('polls').doc(pollId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting poll:', error);
      return { success: false, error: error.message };
    }
  },

  // === HELPERS ===

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },

  getDefaultExpiry() {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default: 1 week
    return date;
  },

  hasVoted(poll, userId) {
    return poll.voters?.includes(userId) || false;
  },

  isExpired(poll) {
    const expiresAt = poll.expiresAt?.toDate ? poll.expiresAt.toDate() : new Date(poll.expiresAt);
    return new Date() > expiresAt;
  },

  getTotalVotes(poll) {
    return poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
  },

  getPercentage(votes, total) {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  },

  getTimeRemaining(poll) {
    const expiresAt = poll.expiresAt?.toDate ? poll.expiresAt.toDate() : new Date(poll.expiresAt);
    const now = new Date();
    const diff = expiresAt - now;

    if (diff <= 0) return 'Έληξε';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}η ${hours}ω`;
    if (hours > 0) return `${hours}ω`;

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}λ`;
  },

  unsubscribeAll() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
  }
};

// Export
window.PollsService = PollsService;
