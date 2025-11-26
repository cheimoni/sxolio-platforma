/* ========================================
   USER LIST COMPONENT
   ======================================== */

const UserList = {
  container: null,
  users: [],
  filteredUsers: [],
  selectedUserId: null,
  onSelectCallback: null,

  // === INITIALIZATION ===

  init(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelectCallback = onSelect;
  },

  // === RENDER ===

  async render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="user-list-header">
        <input
          type="text"
          class="input"
          placeholder="Αναζήτηση χρήστη..."
          id="user-search-input"
        >
      </div>
      <div class="user-list-items" id="user-list-items">
        <div class="text-center p-md">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    this.attachEvents();
    await this.loadUsers();
  },

  async loadUsers() {
    const result = await UsersService.getAll();

    if (result.success) {
      // Exclude current user
      const currentUserId = AuthService.currentUser?.uid;
      this.users = result.data.filter(u => u.id !== currentUserId);
      this.filteredUsers = [...this.users];
      this.renderUsers();
    } else {
      this.showError('Σφάλμα φόρτωσης χρηστών');
    }
  },

  renderUsers() {
    const container = document.getElementById('user-list-items');
    if (!container) return;

    if (this.filteredUsers.length === 0) {
      container.innerHTML = `
        <div class="text-center p-md text-muted">
          Δεν βρέθηκαν χρήστες
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredUsers.map(user => `
      <div class="user-list-item ${user.id === this.selectedUserId ? 'active' : ''}"
           data-user-id="${user.id}">
        <div class="avatar">
          ${getInitials(user.displayName)}
        </div>
        <div class="user-list-item-info">
          <div class="user-list-item-name">${escapeHtml(user.displayName)}</div>
          <div class="user-list-item-role">${ROLE_NAMES[user.role] || user.role}</div>
          ${user.specialty ? `<div class="user-list-item-specialty">${escapeHtml(user.specialty)}</div>` : ''}
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('[data-user-id]').forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.dataset.userId;
        this.selectUser(userId);
      });
    });
  },

  showError(message) {
    const container = document.getElementById('user-list-items');
    if (container) {
      container.innerHTML = `
        <div class="text-center p-md text-error">
          ${message}
        </div>
      `;
    }
  },

  // === EVENTS ===

  attachEvents() {
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterUsers(e.target.value);
      }, 200));
    }
  },

  // === FILTERING ===

  filterUsers(query) {
    if (!query || query.length < 2) {
      this.filteredUsers = [...this.users];
    } else {
      const queryLower = query.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.displayName?.toLowerCase().includes(queryLower) ||
        user.email?.toLowerCase().includes(queryLower) ||
        user.specialty?.toLowerCase().includes(queryLower) ||
        ROLE_NAMES[user.role]?.toLowerCase().includes(queryLower)
      );
    }

    this.renderUsers();
  },

  // === SELECTION ===

  selectUser(userId) {
    this.selectedUserId = userId;

    // Update UI
    document.querySelectorAll('.user-list-item').forEach(el => {
      el.classList.toggle('active', el.dataset.userId === userId);
    });

    // Callback
    if (this.onSelectCallback) {
      const user = this.users.find(u => u.id === userId);
      this.onSelectCallback(user);
    }
  },

  getSelectedUser() {
    return this.users.find(u => u.id === this.selectedUserId);
  },

  // === HELPERS ===

  clearSelection() {
    this.selectedUserId = null;
    document.querySelectorAll('.user-list-item.active').forEach(el => {
      el.classList.remove('active');
    });
  }
};

// Export
window.UserList = UserList;
