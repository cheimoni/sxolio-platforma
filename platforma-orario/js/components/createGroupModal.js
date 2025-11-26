/* ========================================
   CREATE GROUP MODAL COMPONENT
   ======================================== */

const CreateGroupModal = {
  container: null,
  selectedUsers: [],
  allUsers: [],
  onCreateCallback: null,

  // === INITIALIZATION ===

  init(onCreateCallback) {
    this.onCreateCallback = onCreateCallback;
    this.createModalElement();
  },

  createModalElement() {
    // Remove existing if any
    const existing = document.getElementById('create-group-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'create-group-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">Νέα Ομαδική Συνομιλία</h3>
          <button class="modal-close" id="close-group-modal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Group Name -->
          <div class="input-group mb-md">
            <label class="input-label">Όνομα Ομάδας *</label>
            <input
              type="text"
              class="input"
              id="group-name-input"
              placeholder="π.χ. Φιλόλογοι, Α' Λυκείου..."
              maxlength="50"
            >
          </div>

          <!-- Search Users -->
          <div class="input-group mb-md">
            <label class="input-label">Προσθήκη Μελών</label>
            <input
              type="text"
              class="input"
              id="group-user-search"
              placeholder="Αναζήτηση χρηστών..."
            >
          </div>

          <!-- Selected Users -->
          <div class="selected-users mb-md" id="selected-users-container">
            <!-- Selected users badges will appear here -->
          </div>

          <!-- Available Users List -->
          <div class="user-select-list" id="group-users-list">
            <div class="text-center p-md">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-group-btn">Ακύρωση</button>
          <button class="btn btn-primary" id="create-group-btn" disabled>
            Δημιουργία Ομάδας
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.container = modal;
    this.attachEvents();
  },

  // === EVENTS ===

  attachEvents() {
    const closeBtn = document.getElementById('close-group-modal');
    const cancelBtn = document.getElementById('cancel-group-btn');
    const createBtn = document.getElementById('create-group-btn');
    const searchInput = document.getElementById('group-user-search');
    const nameInput = document.getElementById('group-name-input');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hide());
    }

    if (createBtn) {
      createBtn.addEventListener('click', () => this.createGroup());
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterUsers(e.target.value);
      }, 200));
    }

    if (nameInput) {
      nameInput.addEventListener('input', () => this.validateForm());
    }

    // Close on overlay click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  },

  // === SHOW / HIDE ===

  async show() {
    this.selectedUsers = [];
    this.container.classList.add('show');

    // Reset form
    document.getElementById('group-name-input').value = '';
    document.getElementById('group-user-search').value = '';
    this.renderSelectedUsers();
    this.validateForm();

    // Load users
    await this.loadUsers();
  },

  hide() {
    this.container.classList.remove('show');
    this.selectedUsers = [];
  },

  // === USERS ===

  async loadUsers() {
    const result = await UsersService.getAll();

    if (result.success) {
      const currentUserId = AuthService.currentUser?.uid;
      this.allUsers = result.data.filter(u => u.id !== currentUserId);
      this.renderUsers(this.allUsers);
    } else {
      this.showError('Σφάλμα φόρτωσης χρηστών');
    }
  },

  renderUsers(users) {
    const container = document.getElementById('group-users-list');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = `
        <div class="text-center p-md text-muted">
          Δεν βρέθηκαν χρήστες
        </div>
      `;
      return;
    }

    container.innerHTML = users.map(user => {
      const isSelected = this.selectedUsers.some(u => u.id === user.id);

      return `
        <div class="user-select-item ${isSelected ? 'selected' : ''}"
             data-user-id="${user.id}">
          <div class="user-select-checkbox">
            ${isSelected ? '☑' : '☐'}
          </div>
          <div class="avatar avatar-sm">
            ${getInitials(user.displayName)}
          </div>
          <div class="user-select-info">
            <div class="user-select-name">${escapeHtml(user.displayName)}</div>
            <div class="user-select-role">${ROLE_NAMES[user.role] || user.role}</div>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('[data-user-id]').forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.dataset.userId;
        this.toggleUser(userId);
      });
    });
  },

  filterUsers(query) {
    if (!query || query.length < 2) {
      this.renderUsers(this.allUsers);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = this.allUsers.filter(user =>
      user.displayName?.toLowerCase().includes(queryLower) ||
      user.email?.toLowerCase().includes(queryLower) ||
      user.specialty?.toLowerCase().includes(queryLower)
    );

    this.renderUsers(filtered);
  },

  toggleUser(userId) {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) return;

    const index = this.selectedUsers.findIndex(u => u.id === userId);

    if (index === -1) {
      this.selectedUsers.push(user);
    } else {
      this.selectedUsers.splice(index, 1);
    }

    this.renderSelectedUsers();
    this.renderUsers(this.allUsers); // Re-render to update checkboxes
    this.filterUsers(document.getElementById('group-user-search')?.value || '');
    this.validateForm();
  },

  renderSelectedUsers() {
    const container = document.getElementById('selected-users-container');
    if (!container) return;

    if (this.selectedUsers.length === 0) {
      container.innerHTML = `
        <div class="text-muted text-xs">
          Επίλεξε τουλάχιστον 2 μέλη για την ομάδα
        </div>
      `;
      return;
    }

    container.innerHTML = this.selectedUsers.map(user => `
      <span class="selected-user-badge" data-user-id="${user.id}">
        ${escapeHtml(user.displayName)}
        <button class="selected-user-remove" title="Αφαίρεση">✕</button>
      </span>
    `).join('');

    // Remove handlers
    container.querySelectorAll('.selected-user-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const badge = btn.closest('[data-user-id]');
        const userId = badge.dataset.userId;
        this.toggleUser(userId);
      });
    });
  },

  // === VALIDATION ===

  validateForm() {
    const createBtn = document.getElementById('create-group-btn');
    const nameInput = document.getElementById('group-name-input');

    const isValid =
      nameInput?.value.trim().length >= 2 &&
      this.selectedUsers.length >= 2;

    if (createBtn) {
      createBtn.disabled = !isValid;
    }

    return isValid;
  },

  // === CREATE GROUP ===

  async createGroup() {
    if (!this.validateForm()) return;

    const nameInput = document.getElementById('group-name-input');
    const createBtn = document.getElementById('create-group-btn');
    const groupName = nameInput.value.trim();

    // Loading state
    createBtn.disabled = true;
    createBtn.innerHTML = '<span class="spinner"></span>';

    // Add current user to participants
    const currentUserId = AuthService.currentUser?.uid;
    const participantIds = [
      currentUserId,
      ...this.selectedUsers.map(u => u.id)
    ];

    // Create group
    const result = await ChatService.createGroupChat(
      groupName,
      participantIds,
      currentUserId
    );

    if (result.success) {
      showToast(`Η ομάδα "${groupName}" δημιουργήθηκε`, 'success');
      this.hide();

      // Callback to open the new conversation
      if (this.onCreateCallback) {
        this.onCreateCallback(result.data);
      }
    } else {
      showToast('Σφάλμα δημιουργίας ομάδας', 'error');
      createBtn.disabled = false;
      createBtn.textContent = 'Δημιουργία Ομάδας';
    }
  },

  showError(message) {
    const container = document.getElementById('group-users-list');
    if (container) {
      container.innerHTML = `
        <div class="text-center p-md text-error">
          ${message}
        </div>
      `;
    }
  }
};

// Export
window.CreateGroupModal = CreateGroupModal;
