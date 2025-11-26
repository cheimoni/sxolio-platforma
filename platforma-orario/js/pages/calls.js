/* ========================================
   CALLS PAGE - Φωνητικές & Βιντεοκλήσεις
   ======================================== */

const CallsPage = {
  callUsers: [],
  currentCallType: 'voice',

  render() {
    return `
      <div class="calls-page">
        <div class="page-header">
          <h1>📞 Κλήσεις</h1>
        </div>

        <!-- Call Type Selection -->
        <div class="calls-type-selector">
          <button class="call-type-btn voice active" onclick="CallsPage.setCallType('voice')">
            <span class="btn-icon">🎙️</span>
            <span>Φωνητική Κλήση</span>
          </button>
          <button class="call-type-btn video" onclick="CallsPage.setCallType('video')">
            <span class="btn-icon">📹</span>
            <span>Βιντεοκλήση</span>
          </button>
        </div>

        <!-- User Search -->
        <div class="calls-search">
          <input type="text" id="calls-user-search" class="form-input"
                 placeholder="Αναζήτηση χρήστη..."
                 oninput="CallsPage.filterUsers(this.value)">
        </div>

        <!-- Users List -->
        <div class="calls-users-list" id="calls-users-list">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadUsers();
  },

  destroy() {
    // Cleanup if needed
  },

  async loadUsers() {
    try {
      const usersSnapshot = await firebaseDb.collection('users').get();
      this.callUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(u => u.id !== AuthService.currentUser?.uid && u.isActive !== false);

      this.renderUsers(this.callUsers);
    } catch (error) {
      console.error('Error loading users for calls:', error);
      const container = document.getElementById('calls-users-list');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <p>Σφάλμα φόρτωσης χρηστών</p>
          </div>
        `;
      }
    }
  },

  renderUsers(users) {
    const container = document.getElementById('calls-users-list');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Δεν βρέθηκαν χρήστες</p>
        </div>
      `;
      return;
    }

    const callIcon = this.currentCallType === 'voice' ? '📞' : '📹';
    const callText = this.currentCallType === 'voice' ? 'Φωνητική' : 'Βιντεο';

    container.innerHTML = users.map(user => `
      <div class="call-user-card" onclick="CallsPage.initiateCall('${user.id}', '${escapeHtml(user.displayName || user.email)}')">
        <div class="call-user-avatar">
          ${getInitials(user.displayName || user.email)}
        </div>
        <div class="call-user-info">
          <div class="call-user-name">${escapeHtml(user.displayName || 'Άγνωστος')}</div>
          <div class="call-user-role">${ROLE_NAMES[user.role] || user.role || 'Χρήστης'}</div>
          ${user.specialty ? `<div class="call-user-specialty">${escapeHtml(user.specialty)}</div>` : ''}
        </div>
        <div class="call-user-action">
          <button class="btn btn-primary btn-call">
            <span class="btn-icon">${callIcon}</span>
            <span>${callText}</span>
          </button>
        </div>
      </div>
    `).join('');
  },

  filterUsers(query) {
    const filtered = this.callUsers.filter(u =>
      (u.displayName || '').toLowerCase().includes(query.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(query.toLowerCase()) ||
      (u.specialty || '').toLowerCase().includes(query.toLowerCase())
    );
    this.renderUsers(filtered);
  },

  setCallType(type) {
    this.currentCallType = type;
    
    // Update button states
    document.querySelectorAll('.call-type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.call-type-btn.${type}`)?.classList.add('active');
    
    // Re-render users with new call type
    const search = document.getElementById('calls-user-search');
    const query = search ? search.value : '';
    if (query) {
      this.filterUsers(query);
    } else {
      this.renderUsers(this.callUsers);
    }
  },

  async initiateCall(userId, userName) {
    if (!window.VoiceCallUI) {
      showToast('Το σύστημα κλήσεων δεν είναι διαθέσιμο', 'error');
      return;
    }

    if (this.currentCallType === 'video') {
      await VoiceCallUI.startVideoCall(userId, userName);
    } else {
      await VoiceCallUI.startCall(userId, userName, false);
    }
  }
};

// Export
window.CallsPage = CallsPage;

