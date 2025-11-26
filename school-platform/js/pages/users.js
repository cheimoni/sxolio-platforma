/* ========================================
   USERS PAGE - Διαχείριση Χρηστών (Admin)
   ======================================== */

const UsersPage = {
  users: [],
  filteredUsers: [],
  currentFilter: 'all',
  searchQuery: '',

  render() {
    if (!this.canAccess()) {
      return `
        <div class="access-denied">
          <div class="empty-icon">🚫</div>
          <h2>Δεν έχετε πρόσβαση</h2>
          <p>Μόνο διαχειριστές πλατφόρμας, διευθυντές και βοηθοί διευθυντή μπορούν να διαχειριστούν χρήστες.</p>
        </div>
      `;
    }

    return `
      <div class="users-page">
        <div class="page-header">
          <h1>Διαχείριση Χρηστών</h1>
          <button class="btn btn-primary" onclick="UsersPage.showCreateModal()">
            + Νέος Χρήστης
          </button>
        </div>

        <!-- Search & Filters -->
        <div class="users-toolbar">
          <div class="search-box">
            <input type="text" class="form-input" placeholder="Αναζήτηση..."
                   id="user-search" oninput="UsersPage.handleSearch(event)">
          </div>
          <div class="filter-buttons">
            <button class="btn ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-secondary'}"
                    onclick="UsersPage.filterBy('all')">Όλοι</button>
            <button class="btn ${this.currentFilter === 'active' ? 'btn-primary' : 'btn-secondary'}"
                    onclick="UsersPage.filterBy('active')">Ενεργοί</button>
            <button class="btn ${this.currentFilter === 'inactive' ? 'btn-primary' : 'btn-secondary'}"
                    onclick="UsersPage.filterBy('inactive')">Ανενεργοί</button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="users-table-container">
          <table class="users-table" id="users-table">
            <thead>
              <tr>
                <th>Όνομα</th>
                <th>Email</th>
                <th>Ρόλος</th>
                <th>Ειδικότητα</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              <tr><td colspan="6" class="loading-cell">Φόρτωση...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Stats -->
        <div class="users-stats" id="users-stats"></div>
      </div>

      <!-- Create/Edit User Modal -->
      <div id="user-modal" class="modal hidden">
        <div class="modal-overlay" onclick="UsersPage.hideModal()"></div>
        <div class="modal-container modal-lg">
          <div class="modal-header">
            <h2 class="modal-title" id="user-modal-title">Νέος Χρήστης</h2>
            <button class="modal-close" onclick="UsersPage.hideModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="user-form" onsubmit="UsersPage.handleSubmit(event)">
              <input type="hidden" id="user-id">

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Όνομα *</label>
                  <input type="text" id="user-name" class="form-input" required
                         placeholder="Ονοματεπώνυμο">
                </div>
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input type="email" id="user-email" class="form-input" required
                         placeholder="email@school.gr">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ρόλος *</label>
                  <select id="user-role" class="form-input" required>
                    <option value="">Επιλέξτε ρόλο...</option>
                    ${AuthService.currentUserData?.role === 'admin' ? '<option value="admin">Διαχειριστής Πλατφόρμας</option>' : ''}
                    <option value="διευθυντής">Διευθυντής</option>
                    <option value="βδα">Βοηθός Διευθυντή Α'</option>
                    <option value="βδ">Βοηθός Διευθυντή</option>
                    <option value="καθηγητής">Καθηγητής</option>
                    <option value="υτ">Υπεύθυνος Τμήματος</option>
                    <option value="γραμματεία">Γραμματεία</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Ειδικότητα</label>
                  <select id="user-specialty" class="form-input">
                    <option value="">Καμία</option>
                    ${SPECIALTIES.map(s => `<option value="${s}">${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Τηλέφωνο</label>
                  <input type="tel" id="user-phone" class="form-input"
                         placeholder="69XXXXXXXX">
                </div>
                <div class="form-group">
                  <label class="form-label">Τμήματα</label>
                  <input type="text" id="user-departments" class="form-input"
                         placeholder="π.χ. Α1, Α2, Β1">
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="UsersPage.hideModal()">
                  Ακύρωση
                </button>
                <button type="submit" class="btn btn-primary" id="user-submit-btn">
                  Αποθήκευση
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- View User Modal -->
      <div id="user-view-modal" class="modal hidden">
        <div class="modal-overlay" onclick="UsersPage.hideViewModal()"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title" id="view-user-title">Χρήστης</h2>
            <button class="modal-close" onclick="UsersPage.hideViewModal()">&times;</button>
          </div>
          <div class="modal-body" id="user-view-content">
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    if (!this.canAccess()) return;
    await this.loadUsers();
  },

  canAccess() {
    const user = AuthService.currentUserData;
    if (!user) return false;
    // Admin έχει ΟΛΑ τα δικαιώματα
    if (user.role === 'admin') return true;
    return ['διευθυντής', 'βδα'].includes(user.role);
  },

  async loadUsers() {
    const result = await UsersService.getAllAdmin();
    if (result.success) {
      this.users = result.data;
      this.applyFilters();
    }
  },

  applyFilters() {
    let filtered = [...this.users];

    // Apply status filter
    if (this.currentFilter === 'active') {
      filtered = filtered.filter(u => u.isActive !== false);
    } else if (this.currentFilter === 'inactive') {
      filtered = filtered.filter(u => u.isActive === false);
    }

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.specialty?.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
    this.renderTable();
    this.renderStats();
  },

  renderTable() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (this.filteredUsers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-cell">
            Δεν βρέθηκαν χρήστες
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.filteredUsers.map(user => `
      <tr class="${user.isActive === false ? 'inactive-row' : ''}">
        <td>
          <div class="user-cell">
            <div class="avatar avatar-sm">${getInitials(user.displayName)}</div>
            <span>${escapeHtml(user.displayName || '-')}</span>
          </div>
        </td>
        <td>${escapeHtml(user.email || '-')}</td>
        <td>
          <span class="badge badge-${this.getRoleBadgeColor(user.role)}">
            ${ROLE_NAMES[user.role] || user.role || '-'}
          </span>
        </td>
        <td>${escapeHtml(user.specialty || '-')}</td>
        <td>
          <span class="status-badge ${user.isActive === false ? 'status-inactive' : 'status-active'}">
            ${user.isActive === false ? 'Ανενεργός' : 'Ενεργός'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm" onclick="UsersPage.viewUser('${user.id}')" title="Προβολή">
              👁
            </button>
            <button class="btn btn-sm" onclick="UsersPage.editUser('${user.id}')" title="Επεξεργασία">
              ✏️
            </button>
            ${user.isActive === false ? `
              <button class="btn btn-sm btn-success" onclick="UsersPage.reactivateUser('${user.id}')" title="Ενεργοποίηση">
                ✓
              </button>
            ` : `
              <button class="btn btn-sm btn-danger" onclick="UsersPage.deactivateUser('${user.id}')" title="Απενεργοποίηση">
                ✕
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderStats() {
    const stats = document.getElementById('users-stats');
    if (!stats) return;

    const total = this.users.length;
    const active = this.users.filter(u => u.isActive !== false).length;
    const inactive = total - active;

    const roleCounts = {};
    this.users.filter(u => u.isActive !== false).forEach(u => {
      const role = u.role || 'unknown';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    stats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Σύνολο:</span>
        <span class="stat-value">${total}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Ενεργοί:</span>
        <span class="stat-value">${active}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Ανενεργοί:</span>
        <span class="stat-value">${inactive}</span>
      </div>
    `;
  },

  getRoleBadgeColor(role) {
    const colors = {
      'admin': 'error',
      'διευθυντής': 'primary',
      'βδα': 'info',
      'βδ': 'info',
      'καθηγητής': 'success',
      'υτ': 'warning',
      'γραμματεία': 'secondary'
    };
    return colors[role] || 'secondary';
  },

  // === FILTERS & SEARCH ===

  filterBy(filter) {
    this.currentFilter = filter;

    // Update button states
    document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    });
    event.target.classList.remove('btn-secondary');
    event.target.classList.add('btn-primary');

    this.applyFilters();
  },

  handleSearch(event) {
    this.searchQuery = event.target.value;
    this.applyFilters();
  },

  // === CREATE / EDIT ===

  showCreateModal() {
    document.getElementById('user-modal-title').textContent = 'Νέος Χρήστης';
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
    document.getElementById('user-modal').classList.remove('hidden');
  },

  editUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('user-modal-title').textContent = 'Επεξεργασία Χρήστη';
    document.getElementById('user-id').value = userId;
    document.getElementById('user-name').value = user.displayName || '';
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-role').value = user.role || '';
    document.getElementById('user-specialty').value = user.specialty || '';
    document.getElementById('user-phone').value = user.phone || '';
    document.getElementById('user-departments').value = user.departments?.join(', ') || '';

    document.getElementById('user-modal').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('user-modal').classList.add('hidden');
  },

  async handleSubmit(event) {
    event.preventDefault();

    const btn = document.getElementById('user-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Αποθήκευση...';

    const userId = document.getElementById('user-id').value;
    const departments = document.getElementById('user-departments').value
      .split(',')
      .map(d => d.trim())
      .filter(d => d);

    const userData = {
      displayName: document.getElementById('user-name').value.trim(),
      email: document.getElementById('user-email').value.trim(),
      role: document.getElementById('user-role').value,
      specialty: document.getElementById('user-specialty').value || null,
      phone: document.getElementById('user-phone').value.trim() || null,
      departments: departments.length > 0 ? departments : null
    };

    let result;
    if (userId) {
      result = await UsersService.update(userId, userData);
    } else {
      result = await UsersService.create(userData);
    }

    btn.disabled = false;
    btn.textContent = 'Αποθήκευση';

    if (result.success) {
      this.hideModal();
      await this.loadUsers();
    } else {
      alert('Σφάλμα: ' + result.error);
    }
  },

  // === VIEW USER ===

  viewUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('view-user-title').textContent = user.displayName || 'Χρήστης';

    const content = document.getElementById('user-view-content');
    content.innerHTML = `
      <div class="user-view-details">
        <div class="user-view-header">
          <div class="avatar avatar-lg">${getInitials(user.displayName)}</div>
          <div class="user-view-name">
            <h3>${escapeHtml(user.displayName || '-')}</h3>
            <span class="badge badge-${this.getRoleBadgeColor(user.role)}">
              ${ROLE_NAMES[user.role] || user.role || '-'}
            </span>
            <span class="status-badge ${user.isActive === false ? 'status-inactive' : 'status-active'}">
              ${user.isActive === false ? 'Ανενεργός' : 'Ενεργός'}
            </span>
          </div>
        </div>

        <div class="user-view-info">
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${escapeHtml(user.email || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Τηλέφωνο:</span>
            <span class="info-value">${escapeHtml(user.phone || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ειδικότητα:</span>
            <span class="info-value">${escapeHtml(user.specialty || '-')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Τμήματα:</span>
            <span class="info-value">${user.departments?.join(', ') || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Τελευταία σύνδεση:</span>
            <span class="info-value">${user.lastSeen?.toDate ? user.lastSeen.toDate().toLocaleString('el-GR') : '-'}</span>
          </div>
        </div>

        <div class="user-view-actions">
          <button class="btn btn-secondary" onclick="UsersPage.hideViewModal(); UsersPage.editUser('${user.id}')">
            Επεξεργασία
          </button>
          ${user.isActive === false ? `
            <button class="btn btn-success" onclick="UsersPage.reactivateUser('${user.id}'); UsersPage.hideViewModal();">
              Ενεργοποίηση
            </button>
          ` : `
            <button class="btn btn-danger" onclick="UsersPage.deactivateUser('${user.id}'); UsersPage.hideViewModal();">
              Απενεργοποίηση
            </button>
          `}
        </div>
      </div>
    `;

    document.getElementById('user-view-modal').classList.remove('hidden');
  },

  hideViewModal() {
    document.getElementById('user-view-modal').classList.add('hidden');
  },

  // === ACTIVATE / DEACTIVATE ===

  async deactivateUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    // Don't allow deactivating yourself
    if (userId === AuthService.currentUser?.uid) {
      alert('Δεν μπορείτε να απενεργοποιήσετε τον εαυτό σας!');
      return;
    }

    if (!confirm(`Απενεργοποίηση χρήστη "${user.displayName}";`)) {
      return;
    }

    const result = await UsersService.deactivate(userId);

    if (result.success) {
      await this.loadUsers();
    } else {
      alert('Σφάλμα: ' + result.error);
    }
  },

  async reactivateUser(userId) {
    const result = await UsersService.reactivate(userId);

    if (result.success) {
      await this.loadUsers();
    } else {
      alert('Σφάλμα: ' + result.error);
    }
  },

  // === CLEANUP ===

  destroy() {
    // Nothing to cleanup
  }
};

// Export
window.UsersPage = UsersPage;
