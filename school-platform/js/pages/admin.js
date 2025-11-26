/* ========================================
   ADMIN PANEL - Διαχείριση Πλατφόρμας
   Μόνο για Super Admin (Ιδιοκτήτη)
   ======================================== */

const AdminPage = {
  currentTab: 'users',
  users: [],
  pendingUsers: [],
  groups: [],
  platformSettings: null,
  editingGroup: null,

  render() {
    if (!this.canAccess()) {
      return `
        <div class="access-denied">
          <div class="empty-icon">🚫</div>
          <h2>Δεν έχετε πρόσβαση</h2>
          <p>Αυτή η σελίδα είναι μόνο για τον διαχειριστή της πλατφόρμας.</p>
        </div>
      `;
    }

    return `
      <div class="admin-page">
        <div class="page-header">
          <h1>Διαχείριση Πλατφόρμας</h1>
          <span class="admin-badge">Super Admin</span>
        </div>

        <!-- Tabs -->
        <div class="admin-tabs">
          <button class="admin-tab ${this.currentTab === 'users' ? 'active' : ''}"
                  onclick="AdminPage.switchTab('users')">
            👥 Χρήστες
          </button>
          <button class="admin-tab ${this.currentTab === 'pending' ? 'active' : ''}"
                  onclick="AdminPage.switchTab('pending')">
            ⏳ Εκκρεμείς
            <span class="pending-count" id="pending-count"></span>
          </button>
          <button class="admin-tab ${this.currentTab === 'groups' ? 'active' : ''}"
                  onclick="AdminPage.switchTab('groups')">
            👥 Ομάδες
          </button>
          <button class="admin-tab ${this.currentTab === 'appearance' ? 'active' : ''}"
                  onclick="AdminPage.switchTab('appearance')">
            🎨 Εμφάνιση
          </button>
          <button class="admin-tab ${this.currentTab === 'settings' ? 'active' : ''}"
                  onclick="AdminPage.switchTab('settings')">
            ⚙️ Ρυθμίσεις
          </button>
        </div>

        <!-- Tab Content -->
        <div class="admin-content" id="admin-content">
          <!-- Content loads here -->
        </div>
      </div>

      <!-- User Edit Modal -->
      <div id="admin-user-modal" class="modal hidden">
        <div class="modal-overlay" onclick="AdminPage.hideUserModal()"></div>
        <div class="modal-container modal-lg">
          <div class="modal-header">
            <h2 class="modal-title" id="admin-user-modal-title">Επεξεργασία Χρήστη</h2>
            <button class="modal-close" onclick="AdminPage.hideUserModal()">&times;</button>
          </div>
          <div class="modal-body" id="admin-user-modal-body">
          </div>
        </div>
      </div>

      <!-- Group Modal -->
      <div id="admin-group-modal" class="modal hidden">
        <div class="modal-overlay" onclick="AdminPage.hideGroupModal()"></div>
        <div class="modal-container modal-xl">
          <div class="modal-header">
            <h2 class="modal-title" id="admin-group-modal-title">Νέα Ομάδα</h2>
            <button class="modal-close" onclick="AdminPage.hideGroupModal()">&times;</button>
          </div>
          <div class="modal-body" id="admin-group-modal-body">
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    if (!this.canAccess()) return;
    await this.loadPlatformSettings();
    this.renderCurrentTab();
  },

  canAccess() {
    const user = AuthService.currentUserData;
    if (!user || !user.role) return false;
    
    // Case-insensitive check for admin role
    const normalizedRole = user.role.toLowerCase();
    const hasAccess = normalizedRole === 'admin' || normalizedRole === ROLES.ADMIN?.toLowerCase();
    
    // Debug logging
    if (!hasAccess) {
      console.log('Admin access denied. User role:', user.role, 'Normalized:', normalizedRole, 'User data:', user);
    }
    
    return hasAccess;
  },

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab styles
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    this.renderCurrentTab();
  },

  renderCurrentTab() {
    const container = document.getElementById('admin-content');
    if (!container) return;

    switch (this.currentTab) {
      case 'users':
        this.renderUsersTab(container);
        break;
      case 'pending':
        this.renderPendingTab(container);
        break;
      case 'groups':
        this.renderGroupsTab(container);
        break;
      case 'appearance':
        this.renderAppearanceTab(container);
        break;
      case 'settings':
        this.renderSettingsTab(container);
        break;
    }
  },

  // === USERS TAB ===

  usersViewMode: 'table', // 'table' or 'grid'

  async renderUsersTab(container) {
    container.innerHTML = `<div class="loading-spinner">Φόρτωση χρηστών...</div>`;

    const result = await UsersService.getAllAdmin();
    if (!result.success) {
      console.error('Failed to load users:', result.error);
      container.innerHTML = `
        <div class="error-message">
          <p>Σφάλμα φόρτωσης: ${result.error}</p>
          <button class="btn btn-secondary" onclick="AdminPage.renderUsersTab(document.getElementById('admin-content'))">
            🔄 Δοκίμασε ξανά
          </button>
        </div>
      `;
      return;
    }

    this.users = result.data || [];
    console.log(`Loaded ${this.users.length} users for admin panel`);

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-toolbar">
          <input type="text" class="form-input" placeholder="Αναζήτηση χρήστη..."
                 id="admin-user-search" oninput="AdminPage.filterUsers()">

          <div class="view-toggle">
            <button class="btn ${this.usersViewMode === 'table' ? 'btn-primary' : 'btn-secondary'}"
                    onclick="AdminPage.setUsersViewMode('table')">
              📋 Πίνακας
            </button>
            <button class="btn ${this.usersViewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}"
                    onclick="AdminPage.setUsersViewMode('grid')">
              🔲 Ρόλοι Grid
            </button>
          </div>

          <button class="btn btn-primary" onclick="AdminPage.showAddUserModal()">
            + Νέος Χρήστης
          </button>
        </div>

        <div id="users-view-container">
          ${this.usersViewMode === 'grid' ? this.renderRoleGrid() : this.renderUsersTable()}
        </div>

        <div class="admin-stats">
          <span>Σύνολο: <strong>${this.users.length}</strong></span>
          <span>Ενεργοί: <strong>${this.users.filter(u => u.isActive !== false).length}</strong></span>
          <span>Ανενεργοί: <strong>${this.users.filter(u => u.isActive === false).length}</strong></span>
        </div>
      </div>
    `;
  },

  setUsersViewMode(mode) {
    this.usersViewMode = mode;
    const container = document.getElementById('users-view-container');
    if (container) {
      container.innerHTML = mode === 'grid' ? this.renderRoleGrid() : this.renderUsersTable();
    }
    // Update toggle buttons
    document.querySelectorAll('.view-toggle .btn').forEach(btn => {
      btn.classList.remove('btn-primary', 'btn-secondary');
      btn.classList.add(btn.textContent.includes(mode === 'grid' ? 'Grid' : 'Πίνακας') ? 'btn-primary' : 'btn-secondary');
    });
  },

  renderUsersTable() {
    return `
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Χρήστης</th>
              <th>Email</th>
              <th>Ρόλος</th>
              <th>Κατάσταση</th>
              <th>Τελευταία Σύνδεση</th>
              <th>Ενέργειες</th>
            </tr>
          </thead>
          <tbody id="admin-users-tbody">
            ${this.renderUsersRows(this.users)}
          </tbody>
        </table>
      </div>
    `;
  },

  renderRoleGrid() {
    const roles = [
      { key: 'admin', name: 'Admin', icon: '👑' },
      { key: 'διευθυντής', name: 'Διευθυντής', icon: '🎓' },
      { key: 'βδα', name: 'Βοηθός Α\'', icon: '📋' },
      { key: 'βδ', name: 'Βοηθός', icon: '📝' },
      { key: 'καθηγητής', name: 'Καθηγητής', icon: '👨‍🏫' },
      { key: 'υτ', name: 'Υπ. Τμήμ.', icon: '📚' },
      { key: 'γραμματεία', name: 'Γραμματεία', icon: '📞' }
    ];

    if (!this.users || this.users.length === 0) {
      return '<div class="no-users">Δεν υπάρχουν χρήστες</div>';
    }

    return `
      <div class="role-grid-container">
        <table class="role-grid-table">
          <thead>
            <tr>
              <th class="user-column">Χρήστης</th>
              ${roles.map(r => `<th class="role-column" title="${r.name}">${r.icon}<br><span>${r.name}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${this.users.map(user => `
              <tr data-user-id="${user.id}">
                <td class="user-cell-grid">
                  <div class="avatar avatar-sm">${getInitials(user.displayName)}</div>
                  <span class="user-name-grid">${escapeHtml(user.displayName || '-')}</span>
                </td>
                ${roles.map(r => {
                  const isSelected = (r.key === 'admin' && isSuperAdmin(user.role)) ||
                                    (r.key !== 'admin' && user.role?.toLowerCase() === r.key);
                  return `
                    <td class="role-cell ${isSelected ? 'selected' : ''}"
                        onclick="AdminPage.setUserRole('${user.id}', '${r.key}')">
                      <div class="role-checkbox ${isSelected ? 'checked' : ''}">
                        ${isSelected ? '✓' : ''}
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async setUserRole(userId, role) {
    try {
      await UsersService.updateUserAdmin(userId, { role: role });

      // Update local data
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.role = role;
      }

      // Re-render grid
      const container = document.getElementById('users-view-container');
      if (container && this.usersViewMode === 'grid') {
        container.innerHTML = this.renderRoleGrid();
      }

      showToast(`Ο ρόλος ενημερώθηκε`, 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showToast('Σφάλμα ενημέρωσης ρόλου', 'error');
    }
  },

  renderUsersRows(users) {
    if (!users || users.length === 0) {
      return `
        <tr>
          <td colspan="6" class="empty-cell">
            <div style="text-align: center; padding: 2rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
              <h3>Δεν βρέθηκαν χρήστες</h3>
              <p class="text-muted">Δεν υπάρχουν χρήστες στη βάση δεδομένων ακόμα.</p>
              <button class="btn btn-primary" onclick="AdminPage.showAddUserModal()" style="margin-top: 1rem;">
                + Προσθήκη Πρώτου Χρήστη
              </button>
            </div>
          </td>
        </tr>
      `;
    }

    return users.map(user => `
      <tr class="${user.isActive === false ? 'inactive-row' : ''}">
        <td>
          <div class="user-cell">
            <div class="avatar avatar-sm">${getInitials(user.displayName)}</div>
            <span>${escapeHtml(user.displayName || '-')}</span>
          </div>
        </td>
        <td>${escapeHtml(user.email || '-')}</td>
        <td>
          <select class="role-select" onchange="AdminPage.changeUserRole('${user.id}', this.value)">
            <option value="admin" ${isSuperAdmin(user.role) ? 'selected' : ''}>Διαχειριστής</option>
            <option value="διευθυντής" ${user.role === 'διευθυντής' ? 'selected' : ''}>Διευθυντής</option>
            <option value="βδα" ${user.role === 'βδα' ? 'selected' : ''}>Βοηθός Δ/ντή Α'</option>
            <option value="βδ" ${user.role === 'βδ' ? 'selected' : ''}>Βοηθός Δ/ντή</option>
            <option value="καθηγητής" ${user.role === 'καθηγητής' ? 'selected' : ''}>Καθηγητής</option>
            <option value="υτ" ${user.role === 'υτ' ? 'selected' : ''}>Υπ. Τμήματος</option>
            <option value="γραμματεία" ${user.role === 'γραμματεία' ? 'selected' : ''}>Γραμματεία</option>
          </select>
        </td>
        <td>
          <span class="status-toggle ${user.isActive !== false ? 'active' : 'inactive'}"
                onclick="AdminPage.toggleUserStatus('${user.id}', ${user.isActive !== false})">
            ${user.isActive !== false ? '✓ Ενεργός' : '✕ Ανενεργός'}
          </span>
        </td>
        <td class="text-muted">
          ${user.lastSeen?.toDate ? timeAgo(user.lastSeen) : '-'}
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm" onclick="AdminPage.editUser('${user.id}')" title="Επεξεργασία">
              ✏️
            </button>
            <button class="btn btn-sm btn-danger" onclick="AdminPage.deleteUser('${user.id}')" title="Διαγραφή">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  filterUsers() {
    const query = document.getElementById('admin-user-search')?.value.toLowerCase() || '';
    const filtered = this.users.filter(u =>
      u.displayName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );

    const tbody = document.getElementById('admin-users-tbody');
    if (tbody) {
      tbody.innerHTML = this.renderUsersRows(filtered);
    }
  },

  async changeUserRole(userId, newRole) {
    const result = await UsersService.update(userId, { role: newRole });
    if (result.success) {
      showToast('Ο ρόλος ενημερώθηκε', 'success');
      // Update local data
      const user = this.users.find(u => u.id === userId);
      if (user) user.role = newRole;
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async toggleUserStatus(userId, currentlyActive) {
    if (userId === AuthService.currentUser?.uid) {
      showToast('Δεν μπορείτε να απενεργοποιήσετε τον εαυτό σας!', 'warning');
      return;
    }

    const result = currentlyActive
      ? await UsersService.deactivate(userId)
      : await UsersService.reactivate(userId);

    if (result.success) {
      showToast(currentlyActive ? 'Χρήστης απενεργοποιήθηκε' : 'Χρήστης ενεργοποιήθηκε', 'success');
      this.renderUsersTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  // === PENDING USERS TAB ===

  async renderPendingTab(container) {
    container.innerHTML = `<div class="loading-spinner">Φόρτωση εκκρεμών...</div>`;

    // Get pending users (users with isPending = true)
    const result = await UsersService.getPending();

    if (!result.success) {
      console.error('Failed to load pending users:', result.error);
      container.innerHTML = `
        <div class="error-message">
          <p>Σφάλμα φόρτωσης: ${result.error}</p>
          <button class="btn btn-secondary" onclick="AdminPage.renderPendingTab(document.getElementById('admin-content'))">
            🔄 Δοκίμασε ξανά
          </button>
        </div>
      `;
      return;
    }

    this.pendingUsers = result.data || [];
    console.log(`Loaded ${this.pendingUsers.length} pending users`);
    this.updatePendingCount();

    if (this.pendingUsers.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <h3>Δεν υπάρχουν εκκρεμείς αιτήσεις</h3>
          <p class="text-muted">Όλες οι αιτήσεις έχουν εξεταστεί</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="admin-section">
        <h3>Αιτήσεις Εγγραφής (${this.pendingUsers.length})</h3>

        <div class="pending-list">
          ${this.pendingUsers.map(user => `
            <div class="pending-card pending-card-expanded">
              <div class="pending-main">
                <div class="pending-info">
                  <div class="avatar">${getInitials(user.displayName)}</div>
                  <div class="pending-details">
                    <div class="pending-name">${escapeHtml(user.displayName)}</div>
                    <div class="pending-email">${escapeHtml(user.email)}</div>
                    ${user.phone ? `<div class="pending-phone">📞 ${escapeHtml(user.phone)}</div>` : ''}
                    ${user.specialty ? `<div class="pending-specialty">📚 ${escapeHtml(user.specialty)}</div>` : ''}
                    <div class="pending-date">📅 Αίτηση: ${user.createdAt?.toDate ? formatDate(user.createdAt, 'full') : '-'}</div>
                  </div>
                </div>
                <div class="pending-actions">
                  <select class="form-input" id="pending-role-${user.id}">
                    <option value="καθηγητής">Καθηγητής</option>
                    <option value="γραμματεία">Γραμματεία</option>
                    <option value="υτ">Υπ. Τμήματος</option>
                    <option value="βδ">Βοηθός Δ/ντή</option>
                    <option value="βδα">Βοηθός Δ/ντή Α'</option>
                    <option value="διευθυντής">Διευθυντής</option>
                  </select>
                  <button class="btn btn-success" onclick="AdminPage.approveUser('${user.id}')">
                    ✓ Έγκριση
                  </button>
                  <button class="btn btn-danger" onclick="AdminPage.rejectUser('${user.id}')">
                    ✕ Απόρριψη
                  </button>
                </div>
              </div>
              ${user.message ? `
                <div class="pending-message">
                  <strong>Μήνυμα:</strong> ${escapeHtml(user.message)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  updatePendingCount() {
    const countEl = document.getElementById('pending-count');
    if (countEl) {
      if (this.pendingUsers.length > 0) {
        countEl.textContent = this.pendingUsers.length;
        countEl.style.display = 'inline-block';
      } else {
        countEl.style.display = 'none';
      }
    }
  },

  async approveUser(userId) {
    const roleSelect = document.getElementById(`pending-role-${userId}`);
    const role = roleSelect?.value || 'καθηγητής';

    const result = await UsersService.approve(userId, role);
    if (result.success) {
      showToast('Ο χρήστης εγκρίθηκε', 'success');
      this.renderPendingTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async rejectUser(userId) {
    if (!confirm('Σίγουρα θέλετε να απορρίψετε αυτή την αίτηση;')) return;

    const result = await UsersService.reject(userId);
    if (result.success) {
      showToast('Η αίτηση απορρίφθηκε', 'success');
      this.renderPendingTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  // === APPEARANCE TAB ===

  getThemes() {
    // 100+ Παστέλ / Φωτεινά χρώματα
    return {
      // Reds & Pinks (20)
      rose1: { name: 'Ροζ 1', color: '#ffe4e6' },
      rose2: { name: 'Ροζ 2', color: '#fecdd3' },
      rose3: { name: 'Ροζ 3', color: '#fda4af' },
      rose4: { name: 'Ροζ 4', color: '#fb7185' },
      pink1: { name: 'Ροζ Έντονο 1', color: '#fce7f3' },
      pink2: { name: 'Ροζ Έντονο 2', color: '#fbcfe8' },
      pink3: { name: 'Ροζ Έντονο 3', color: '#f9a8d4' },
      pink4: { name: 'Ροζ Έντονο 4', color: '#f472b6' },
      fuchsia1: { name: 'Φούξια 1', color: '#fae8ff' },
      fuchsia2: { name: 'Φούξια 2', color: '#f5d0fe' },
      fuchsia3: { name: 'Φούξια 3', color: '#f0abfc' },
      fuchsia4: { name: 'Φούξια 4', color: '#e879f9' },
      coral1: { name: 'Κοραλί 1', color: '#ffd6cc' },
      coral2: { name: 'Κοραλί 2', color: '#ffb3a6' },
      salmon1: { name: 'Σολομός 1', color: '#ffc4b8' },
      salmon2: { name: 'Σολομός 2', color: '#ffa69e' },
      blush1: { name: 'Ρουζ 1', color: '#ffd9e0' },
      blush2: { name: 'Ρουζ 2', color: '#ffb8c6' },
      peach1: { name: 'Ροδάκινο 1', color: '#ffe5d9' },
      peach2: { name: 'Ροδάκινο 2', color: '#ffd5c2' },

      // Purples & Violets (15)
      purple1: { name: 'Μωβ 1', color: '#faf5ff' },
      purple2: { name: 'Μωβ 2', color: '#f3e8ff' },
      purple3: { name: 'Μωβ 3', color: '#e9d5ff' },
      purple4: { name: 'Μωβ 4', color: '#d8b4fe' },
      purple5: { name: 'Μωβ 5', color: '#c084fc' },
      violet1: { name: 'Βιολετί 1', color: '#ede9fe' },
      violet2: { name: 'Βιολετί 2', color: '#ddd6fe' },
      violet3: { name: 'Βιολετί 3', color: '#c4b5fd' },
      violet4: { name: 'Βιολετί 4', color: '#a78bfa' },
      lavender1: { name: 'Λεβάντα 1', color: '#e8e0f0' },
      lavender2: { name: 'Λεβάντα 2', color: '#d4c4e3' },
      orchid1: { name: 'Ορχιδέα 1', color: '#e6ccf2' },
      orchid2: { name: 'Ορχιδέα 2', color: '#d9b3eb' },
      plum1: { name: 'Δαμάσκηνο 1', color: '#e0c3e8' },
      plum2: { name: 'Δαμάσκηνο 2', color: '#d1a6db' },

      // Blues (20)
      indigo1: { name: 'Λουλακί 1', color: '#e0e7ff' },
      indigo2: { name: 'Λουλακί 2', color: '#c7d2fe' },
      indigo3: { name: 'Λουλακί 3', color: '#a5b4fc' },
      indigo4: { name: 'Λουλακί 4', color: '#818cf8' },
      blue1: { name: 'Μπλε 1', color: '#dbeafe' },
      blue2: { name: 'Μπλε 2', color: '#bfdbfe' },
      blue3: { name: 'Μπλε 3', color: '#93c5fd' },
      blue4: { name: 'Μπλε 4', color: '#60a5fa' },
      sky1: { name: 'Ουρανί 1', color: '#e0f2fe' },
      sky2: { name: 'Ουρανί 2', color: '#bae6fd' },
      sky3: { name: 'Ουρανί 3', color: '#7dd3fc' },
      sky4: { name: 'Ουρανί 4', color: '#38bdf8' },
      cyan1: { name: 'Κυανό 1', color: '#cffafe' },
      cyan2: { name: 'Κυανό 2', color: '#a5f3fc' },
      cyan3: { name: 'Κυανό 3', color: '#67e8f9' },
      cyan4: { name: 'Κυανό 4', color: '#22d3ee' },
      azure1: { name: 'Γαλανό 1', color: '#c9e4f6' },
      azure2: { name: 'Γαλανό 2', color: '#a3d4f5' },
      powder1: { name: 'Παστέλ Μπλε 1', color: '#b8d4e8' },
      powder2: { name: 'Παστέλ Μπλε 2', color: '#9ec5db' },

      // Teals & Greens (20)
      teal1: { name: 'Τιρκουάζ 1', color: '#ccfbf1' },
      teal2: { name: 'Τιρκουάζ 2', color: '#99f6e4' },
      teal3: { name: 'Τιρκουάζ 3', color: '#5eead4' },
      teal4: { name: 'Τιρκουάζ 4', color: '#2dd4bf' },
      emerald1: { name: 'Σμαραγδί 1', color: '#d1fae5' },
      emerald2: { name: 'Σμαραγδί 2', color: '#a7f3d0' },
      emerald3: { name: 'Σμαραγδί 3', color: '#6ee7b7' },
      emerald4: { name: 'Σμαραγδί 4', color: '#34d399' },
      green1: { name: 'Πράσινο 1', color: '#dcfce7' },
      green2: { name: 'Πράσινο 2', color: '#bbf7d0' },
      green3: { name: 'Πράσινο 3', color: '#86efac' },
      green4: { name: 'Πράσινο 4', color: '#4ade80' },
      mint1: { name: 'Μέντα 1', color: '#c6f7e2' },
      mint2: { name: 'Μέντα 2', color: '#9aebcc' },
      seafoam1: { name: 'Θαλασσί 1', color: '#b2f2e8' },
      seafoam2: { name: 'Θαλασσί 2', color: '#8ae8d8' },
      sage1: { name: 'Φασκόμηλο 1', color: '#d4e9d7' },
      sage2: { name: 'Φασκόμηλο 2', color: '#b8dbbe' },
      pistachio1: { name: 'Φιστίκι 1', color: '#d9f5d6' },
      pistachio2: { name: 'Φιστίκι 2', color: '#c2eebb' },

      // Limes & Yellows (15)
      lime1: { name: 'Λάιμ 1', color: '#ecfccb' },
      lime2: { name: 'Λάιμ 2', color: '#d9f99d' },
      lime3: { name: 'Λάιμ 3', color: '#bef264' },
      lime4: { name: 'Λάιμ 4', color: '#a3e635' },
      yellow1: { name: 'Κίτρινο 1', color: '#fef9c3' },
      yellow2: { name: 'Κίτρινο 2', color: '#fef08a' },
      yellow3: { name: 'Κίτρινο 3', color: '#fde047' },
      yellow4: { name: 'Κίτρινο 4', color: '#facc15' },
      lemon1: { name: 'Λεμόνι 1', color: '#fff9c4' },
      lemon2: { name: 'Λεμόνι 2', color: '#fff59d' },
      butter1: { name: 'Βούτυρο 1', color: '#fff5d6' },
      butter2: { name: 'Βούτυρο 2', color: '#ffedb8' },
      cream1: { name: 'Κρεμ 1', color: '#fefce8' },
      cream2: { name: 'Κρεμ 2', color: '#fef3c7' },
      banana1: { name: 'Μπανάνα', color: '#fffacd' },

      // Oranges & Ambers (15)
      amber1: { name: 'Κεχριμπάρι 1', color: '#fef3c7' },
      amber2: { name: 'Κεχριμπάρι 2', color: '#fde68a' },
      amber3: { name: 'Κεχριμπάρι 3', color: '#fcd34d' },
      amber4: { name: 'Κεχριμπάρι 4', color: '#fbbf24' },
      orange1: { name: 'Πορτοκαλί 1', color: '#ffedd5' },
      orange2: { name: 'Πορτοκαλί 2', color: '#fed7aa' },
      orange3: { name: 'Πορτοκαλί 3', color: '#fdba74' },
      orange4: { name: 'Πορτοκαλί 4', color: '#fb923c' },
      apricot1: { name: 'Βερίκοκο 1', color: '#ffe4c9' },
      apricot2: { name: 'Βερίκοκο 2', color: '#ffd4a8' },
      tangerine1: { name: 'Μανταρίνι 1', color: '#ffdab3' },
      tangerine2: { name: 'Μανταρίνι 2', color: '#ffc28c' },
      melon1: { name: 'Πεπόνι 1', color: '#ffe5cc' },
      melon2: { name: 'Πεπόνι 2', color: '#ffd6b0' },
      honey1: { name: 'Μέλι', color: '#fff0c2' },

      // Neutrals (10)
      slate1: { name: 'Γκρι 1', color: '#f1f5f9' },
      slate2: { name: 'Γκρι 2', color: '#e2e8f0' },
      slate3: { name: 'Γκρι 3', color: '#cbd5e1' },
      slate4: { name: 'Γκρι 4', color: '#94a3b8' },
      stone1: { name: 'Πέτρα 1', color: '#f5f5f4' },
      stone2: { name: 'Πέτρα 2', color: '#e7e5e4' },
      warm1: { name: 'Ζεστό Γκρι 1', color: '#faf7f5' },
      warm2: { name: 'Ζεστό Γκρι 2', color: '#f0ebe6' },
      cool1: { name: 'Ψυχρό Γκρι 1', color: '#f8fafc' },
      cool2: { name: 'Ψυχρό Γκρι 2', color: '#e5eaf0' }
    };
  },

  async renderAppearanceTab(container) {
    const settings = this.platformSettings || {};
    const appearance = settings.appearance || {};
    const themes = this.getThemes();
    const currentTheme = appearance.theme || 'blue3';

    // Current values or defaults
    const fontSize = appearance.fontSize || 'medium';
    const borderRadius = appearance.borderRadius || 8;
    const buttonPadding = appearance.buttonPadding || 'normal';

    container.innerHTML = `
      <!-- Theme Selection - Color Circles -->
      <div class="admin-section">
        <h3>Χρώμα Θέματος</h3>
        <p class="form-hint">Επιλέξτε το κύριο χρώμα της πλατφόρμας</p>
        <div class="color-circles">
          ${Object.entries(themes).map(([key, theme]) => `
            <button class="color-circle ${currentTheme === key ? 'selected' : ''}"
                    onclick="AdminPage.applyTheme('${key}')"
                    style="background: ${theme.color};"
                    title="${theme.name}">
              ${currentTheme === key ? '✓' : ''}
            </button>
          `).join('')}
        </div>
        <input type="hidden" id="selected-theme" value="${currentTheme}">
      </div>

      <!-- Font Size -->
      <div class="admin-section">
        <h3>Μέγεθος Γραμματοσειράς</h3>
        <p class="form-hint">Επιλέξτε το μέγεθος κειμένου</p>
        <div class="radio-buttons">
          <label class="radio-btn ${fontSize === 'small' ? 'selected' : ''}">
            <input type="radio" name="fontSize" value="small" ${fontSize === 'small' ? 'checked' : ''}
                   onchange="AdminPage.previewFontSize('small')">
            <span>Μικρό</span>
          </label>
          <label class="radio-btn ${fontSize === 'medium' ? 'selected' : ''}">
            <input type="radio" name="fontSize" value="medium" ${fontSize === 'medium' ? 'checked' : ''}
                   onchange="AdminPage.previewFontSize('medium')">
            <span>Κανονικό</span>
          </label>
          <label class="radio-btn ${fontSize === 'large' ? 'selected' : ''}">
            <input type="radio" name="fontSize" value="large" ${fontSize === 'large' ? 'checked' : ''}
                   onchange="AdminPage.previewFontSize('large')">
            <span>Μεγάλο</span>
          </label>
        </div>
      </div>

      <!-- Border Radius -->
      <div class="admin-section">
        <h3>Στρογγυλοποίηση Γωνιών</h3>
        <p class="form-hint">Πόσο στρογγυλεμένες να είναι οι γωνίες</p>
        <div class="slider-container">
          <input type="range" id="borderRadius" min="0" max="20" value="${borderRadius}"
                 oninput="AdminPage.previewBorderRadius(this.value)">
          <span class="slider-value">${borderRadius}px</span>
        </div>
        <div class="radius-preview" id="radius-preview" style="border-radius: ${borderRadius}px;">
          Προεπισκόπηση
        </div>
      </div>

      <!-- Button Padding -->
      <div class="admin-section">
        <h3>Μέγεθος Κουμπιών</h3>
        <p class="form-hint">Πόσο μεγάλα να είναι τα κουμπιά</p>
        <div class="radio-buttons">
          <label class="radio-btn ${buttonPadding === 'compact' ? 'selected' : ''}">
            <input type="radio" name="buttonPadding" value="compact" ${buttonPadding === 'compact' ? 'checked' : ''}
                   onchange="AdminPage.previewButtonPadding('compact')">
            <span>Συμπαγές</span>
          </label>
          <label class="radio-btn ${buttonPadding === 'normal' ? 'selected' : ''}">
            <input type="radio" name="buttonPadding" value="normal" ${buttonPadding === 'normal' ? 'checked' : ''}
                   onchange="AdminPage.previewButtonPadding('normal')">
            <span>Κανονικό</span>
          </label>
          <label class="radio-btn ${buttonPadding === 'large' ? 'selected' : ''}">
            <input type="radio" name="buttonPadding" value="large" ${buttonPadding === 'large' ? 'checked' : ''}
                   onchange="AdminPage.previewButtonPadding('large')">
            <span>Μεγάλο</span>
          </label>
        </div>
      </div>

      <div class="admin-actions" style="margin-top: var(--space-lg);">
        <button class="btn btn-primary" onclick="AdminPage.saveAppearance()">
          Αποθήκευση Εμφάνισης
        </button>
        <button class="btn btn-secondary" onclick="AdminPage.resetAppearance()">
          Επαναφορά Προεπιλογών
        </button>
      </div>
    `;
  },

  previewFontSize(size) {
    const sizes = {
      small: { base: '13px', h1: '22px', h2: '18px', small: '11px' },
      medium: { base: '15px', h1: '26px', h2: '20px', small: '13px' },
      large: { base: '17px', h1: '30px', h2: '24px', small: '15px' }
    };
    const s = sizes[size] || sizes.medium;
    document.documentElement.style.setProperty('--font-base', s.base);
    document.documentElement.style.setProperty('--font-h1', s.h1);
    document.documentElement.style.setProperty('--font-h2', s.h2);
    document.documentElement.style.setProperty('--font-small', s.small);

    // Update radio button styles
    document.querySelectorAll('input[name="fontSize"]').forEach(radio => {
      radio.closest('.radio-btn').classList.toggle('selected', radio.checked);
    });
  },

  previewBorderRadius(value) {
    document.documentElement.style.setProperty('--border-radius', value + 'px');
    const preview = document.getElementById('radius-preview');
    if (preview) preview.style.borderRadius = value + 'px';
    const sliderValue = document.querySelector('.slider-value');
    if (sliderValue) sliderValue.textContent = value + 'px';
  },

  previewButtonPadding(size) {
    const paddings = {
      compact: { x: '12px', y: '6px' },
      normal: { x: '16px', y: '10px' },
      large: { x: '24px', y: '14px' }
    };
    const p = paddings[size] || paddings.normal;
    document.documentElement.style.setProperty('--btn-padding-x', p.x);
    document.documentElement.style.setProperty('--btn-padding-y', p.y);

    // Update radio button styles
    document.querySelectorAll('input[name="buttonPadding"]').forEach(radio => {
      radio.closest('.radio-btn').classList.toggle('selected', radio.checked);
    });
  },

  resetAppearance() {
    // Reset to defaults
    this.applyTheme('blue3');
    this.previewFontSize('medium');
    this.previewBorderRadius(8);
    this.previewButtonPadding('normal');

    // Update UI
    document.getElementById('selected-theme').value = 'blue3';
    document.getElementById('borderRadius').value = 8;
    document.querySelectorAll('input[name="fontSize"][value="medium"]')[0].checked = true;
    document.querySelectorAll('input[name="buttonPadding"][value="normal"]')[0].checked = true;

    // Update radio styles
    document.querySelectorAll('.radio-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('input[name="fontSize"][value="medium"]')[0].closest('.radio-btn').classList.add('selected');
    document.querySelectorAll('input[name="buttonPadding"][value="normal"]')[0].closest('.radio-btn').classList.add('selected');

    showToast('Επαναφορά στις προεπιλογές', 'info');
  },

  applyTheme(themeKey) {
    const themes = this.getThemes();
    const theme = themes[themeKey];
    if (!theme) return;

    // Apply theme colors to ALL UI elements
    this.applyThemeColors(theme.color);

    // Update selected circle visual
    document.querySelectorAll('.color-circle').forEach(circle => {
      circle.classList.remove('selected');
      circle.textContent = '';
    });
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('selected');
      event.currentTarget.textContent = '✓';
    }

    // Store selected theme
    const themeInput = document.getElementById('selected-theme');
    if (themeInput) themeInput.value = themeKey;

    showToast(`Χρώμα: ${theme.name}`, 'info', 1500);
  },

  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round((num >> 16) + (255 - (num >> 16)) * percent);
    const g = Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent);
    const b = Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent);
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  },

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
  },

  async saveAppearance() {
    const themeKey = document.getElementById('selected-theme')?.value || 'blue3';
    const themes = this.getThemes();
    const theme = themes[themeKey];

    // Get font size
    const fontSizeRadio = document.querySelector('input[name="fontSize"]:checked');
    const fontSize = fontSizeRadio?.value || 'medium';

    // Get border radius
    const borderRadius = parseInt(document.getElementById('borderRadius')?.value || 8);

    // Get button padding
    const buttonPaddingRadio = document.querySelector('input[name="buttonPadding"]:checked');
    const buttonPadding = buttonPaddingRadio?.value || 'normal';

    const settings = {
      theme: themeKey,
      colorPrimary: theme?.color || '#93c5fd',
      fontSize: fontSize,
      borderRadius: borderRadius,
      buttonPadding: buttonPadding
    };

    const result = await this.savePlatformSettings({ appearance: settings });
    if (result.success) {
      this.platformSettings = {
        ...this.platformSettings,
        appearance: settings
      };
      showToast('Οι ρυθμίσεις εμφάνισης αποθηκεύτηκαν', 'success');
    } else {
      showToast('Σφάλμα αποθήκευσης', 'error');
    }
  },

  // === SETTINGS TAB ===

  async renderSettingsTab(container) {
    const settings = this.platformSettings || {};

    container.innerHTML = `
      <div class="admin-section">
        <h3>Γενικές Ρυθμίσεις Πλατφόρμας</h3>

        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">Όνομα Σχολείου</label>
            <input type="text" id="school-name" class="form-input"
                   value="${escapeHtml(settings.schoolName || '')}"
                   placeholder="π.χ. 1ο Γυμνάσιο Αθηνών">
          </div>

          <div class="form-group">
            <label class="form-label">Email Επικοινωνίας</label>
            <input type="email" id="school-email" class="form-input"
                   value="${escapeHtml(settings.schoolEmail || '')}"
                   placeholder="info@school.gr">
          </div>

          <div class="form-group">
            <label class="form-label">Τηλέφωνο</label>
            <input type="tel" id="school-phone" class="form-input"
                   value="${escapeHtml(settings.schoolPhone || '')}"
                   placeholder="210-XXXXXXX">
          </div>

          <div class="form-group">
            <label class="form-label">Διεύθυνση</label>
            <input type="text" id="school-address" class="form-input"
                   value="${escapeHtml(settings.schoolAddress || '')}"
                   placeholder="Οδός, Αριθμός, Πόλη">
          </div>
        </div>
      </div>

      <div class="admin-section">
        <h3>Ρυθμίσεις Εγγραφής</h3>

        <div class="settings-form">
          <div class="form-group">
            <label class="toggle-label">
              <input type="checkbox" id="allow-registration"
                     ${settings.allowRegistration ? 'checked' : ''}>
              <span>Επιτρέπεται η εγγραφή νέων χρηστών</span>
            </label>
          </div>

          <div class="form-group">
            <label class="toggle-label">
              <input type="checkbox" id="require-approval"
                     ${settings.requireApproval !== false ? 'checked' : ''}>
              <span>Απαιτείται έγκριση για νέους χρήστες</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Προεπιλεγμένος Ρόλος Νέων Χρηστών</label>
            <select id="default-role" class="form-input">
              <option value="καθηγητής" ${settings.defaultRole === 'καθηγητής' ? 'selected' : ''}>Καθηγητής</option>
              <option value="γραμματεία" ${settings.defaultRole === 'γραμματεία' ? 'selected' : ''}>Γραμματεία</option>
            </select>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <h3>Ειδοποιήσεις</h3>

        <div class="settings-form">
          <div class="form-group">
            <label class="toggle-label">
              <input type="checkbox" id="email-notifications"
                     ${settings.emailNotifications ? 'checked' : ''}>
              <span>Ειδοποιήσεις Email</span>
            </label>
          </div>

          <div class="form-group">
            <label class="toggle-label">
              <input type="checkbox" id="push-notifications"
                     ${settings.pushNotifications ? 'checked' : ''}>
              <span>Push Notifications</span>
            </label>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <h3>📅 Επιλογές Ημερολογίου</h3>
        <p class="section-description">Διαχειριστείτε τις προκαθορισμένες επιλογές για τα Events</p>

        <div class="event-options-grid">
          <!-- Τύποι Event -->
          <div class="event-options-card">
            <div class="event-options-header">
              <h4>🏷️ Τύποι Event</h4>
              <button class="btn btn-sm btn-primary" onclick="AdminPage.addEventOption('types')">+ Προσθήκη</button>
            </div>
            <div class="event-options-list" id="event-types-list">
              ${this.renderEventOptionsList('types', settings.eventTypes || ['Εκδήλωση', 'Σύσκεψη', 'Προθεσμία', 'Αργία', 'Εξετάσεις', 'Εκδρομή'])}
            </div>
          </div>

          <!-- Τοποθεσίες -->
          <div class="event-options-card">
            <div class="event-options-header">
              <h4>📍 Τοποθεσίες</h4>
              <button class="btn btn-sm btn-primary" onclick="AdminPage.addEventOption('locations')">+ Προσθήκη</button>
            </div>
            <div class="event-options-list" id="event-locations-list">
              ${this.renderEventOptionsList('locations', settings.eventLocations || ['Αίθουσα Συνεδριάσεων', 'Γραφείο Διευθυντή', 'Αίθουσα Εκδηλώσεων', 'Αυλή', 'Γυμναστήριο', 'Εργαστήριο'])}
            </div>
          </div>

          <!-- Τίτλοι Event -->
          <div class="event-options-card">
            <div class="event-options-header">
              <h4>📝 Προκαθορισμένοι Τίτλοι</h4>
              <button class="btn btn-sm btn-primary" onclick="AdminPage.addEventOption('titles')">+ Προσθήκη</button>
            </div>
            <div class="event-options-list" id="event-titles-list">
              ${this.renderEventOptionsList('titles', settings.eventTitles || ['Σύσκεψη Καθηγητών', 'Συνεδρίαση Συλλόγου', 'Σχολική Γιορτή', 'Ενημέρωση Γονέων', 'Εξετάσεις', 'Εκδρομή'])}
            </div>
          </div>
        </div>
      </div>

      <div class="admin-actions">
        <button class="btn btn-primary" onclick="AdminPage.saveSettings()">
          Αποθήκευση Ρυθμίσεων
        </button>
      </div>
    `;
  },

  async saveSettings() {
    // Collect event options from DOM
    const eventTypes = this.collectEventOptions('types');
    const eventLocations = this.collectEventOptions('locations');
    const eventTitles = this.collectEventOptions('titles');

    const settings = {
      schoolName: document.getElementById('school-name')?.value.trim(),
      schoolEmail: document.getElementById('school-email')?.value.trim(),
      schoolPhone: document.getElementById('school-phone')?.value.trim(),
      schoolAddress: document.getElementById('school-address')?.value.trim(),
      allowRegistration: document.getElementById('allow-registration')?.checked,
      requireApproval: document.getElementById('require-approval')?.checked,
      defaultRole: document.getElementById('default-role')?.value,
      emailNotifications: document.getElementById('email-notifications')?.checked,
      pushNotifications: document.getElementById('push-notifications')?.checked,
      eventTypes: eventTypes,
      eventLocations: eventLocations,
      eventTitles: eventTitles
    };

    const result = await this.savePlatformSettings(settings);
    if (result.success) {
      this.platformSettings = { ...this.platformSettings, ...settings };
      showToast('Οι ρυθμίσεις αποθηκεύτηκαν', 'success');
    } else {
      showToast('Σφάλμα αποθήκευσης', 'error');
    }
  },

  // === EVENT OPTIONS MANAGEMENT ===

  renderEventOptionsList(type, options) {
    if (!options || options.length === 0) {
      return '<div class="no-options">Δεν υπάρχουν επιλογές</div>';
    }
    return options.map((opt, index) => `
      <div class="event-option-item" data-type="${type}" data-index="${index}">
        <input type="text" class="event-option-input" value="${escapeHtml(opt)}"
               onchange="AdminPage.updateEventOption('${type}', ${index}, this.value)">
        <button class="btn-icon btn-danger-icon" onclick="AdminPage.removeEventOption('${type}', ${index})" title="Διαγραφή">
          ✕
        </button>
      </div>
    `).join('');
  },

  collectEventOptions(type) {
    const listId = `event-${type}-list`;
    const list = document.getElementById(listId);
    if (!list) return [];

    const inputs = list.querySelectorAll('.event-option-input');
    const options = [];
    inputs.forEach(input => {
      const value = input.value.trim();
      if (value) options.push(value);
    });
    return options;
  },

  addEventOption(type) {
    const listId = `event-${type}-list`;
    const list = document.getElementById(listId);
    if (!list) return;

    // Get current options
    const currentOptions = this.collectEventOptions(type);
    currentOptions.push('');

    // Re-render list
    list.innerHTML = this.renderEventOptionsList(type, currentOptions);

    // Focus on new input
    const inputs = list.querySelectorAll('.event-option-input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  },

  updateEventOption(type, index, value) {
    // Options will be collected on save
    console.log(`Updated ${type}[${index}] = ${value}`);
  },

  removeEventOption(type, index) {
    const listId = `event-${type}-list`;
    const list = document.getElementById(listId);
    if (!list) return;

    // Get current options and remove the one at index
    const currentOptions = this.collectEventOptions(type);
    currentOptions.splice(index, 1);

    // Re-render list
    list.innerHTML = this.renderEventOptionsList(type, currentOptions);
  },

  // === PLATFORM SETTINGS ===

  async loadPlatformSettings() {
    try {
      const doc = await firebaseDb.collection('settings').doc('platform').get();
      if (doc.exists) {
        this.platformSettings = doc.data();
        console.log('Platform settings loaded:', this.platformSettings);
      } else {
        // Initialize with defaults if no settings exist
        console.log('No platform settings found, using defaults');
        this.platformSettings = {
          appearance: {
            theme: 'blue3',
            colorPrimary: '#93c5fd',
            fontSize: 'medium',
            borderRadius: 8,
            buttonPadding: 'normal'
          }
        };
      }
      this.applyAppearanceSettings();
    } catch (error) {
      console.error('Error loading platform settings:', error);
      // Use defaults on error
      this.platformSettings = {
        appearance: {
          theme: 'blue3',
          colorPrimary: '#93c5fd',
          fontSize: 'medium',
          borderRadius: 8,
          buttonPadding: 'normal'
        }
      };
      this.applyAppearanceSettings();
    }
  },

  async savePlatformSettings(newSettings) {
    try {
      await firebaseDb.collection('settings').doc('platform').set(
        { ...this.platformSettings, ...newSettings, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  applyAppearanceSettings() {
    if (!this.platformSettings) return;

    const appearance = this.platformSettings.appearance || {};
    const colorPrimary = appearance.colorPrimary || '#93c5fd';

    console.log('Applying appearance settings:', appearance);

    // Apply theme colors to ALL areas
    this.applyThemeColors(colorPrimary);

    // Apply font size
    const fontSize = appearance.fontSize || 'medium';
    const sizes = {
      small: { base: '13px', h1: '22px', h2: '18px', small: '11px' },
      medium: { base: '15px', h1: '26px', h2: '20px', small: '13px' },
      large: { base: '17px', h1: '30px', h2: '24px', small: '15px' }
    };
    const s = sizes[fontSize] || sizes.medium;
    document.documentElement.style.setProperty('--font-base', s.base);
    document.documentElement.style.setProperty('--font-h1', s.h1);
    document.documentElement.style.setProperty('--font-h2', s.h2);
    document.documentElement.style.setProperty('--font-small', s.small);

    // Apply border radius
    const borderRadius = appearance.borderRadius ?? 8;
    document.documentElement.style.setProperty('--border-radius', borderRadius + 'px');

    // Apply button padding
    const buttonPadding = appearance.buttonPadding || 'normal';
    const paddings = {
      compact: { x: '12px', y: '6px' },
      normal: { x: '16px', y: '10px' },
      large: { x: '24px', y: '14px' }
    };
    const p = paddings[buttonPadding] || paddings.normal;
    document.documentElement.style.setProperty('--btn-padding-x', p.x);
    document.documentElement.style.setProperty('--btn-padding-y', p.y);

    console.log('Applied theme color:', colorPrimary, 'Font:', fontSize, 'Radius:', borderRadius, 'Buttons:', buttonPadding);
  },

  // Apply theme colors to ALL UI elements
  applyThemeColors(colorPrimary) {
    const doc = document.documentElement.style;

    // Generate different shades
    const veryLight = this.lightenColor(colorPrimary, 0.92);  // Almost white with hint of color
    const light = this.lightenColor(colorPrimary, 0.85);       // Light shade
    const medium = this.lightenColor(colorPrimary, 0.7);       // Medium shade
    const dark = this.darkenColor(colorPrimary, 0.2);          // Darker for borders

    // Primary color
    doc.setProperty('--primary', colorPrimary);
    doc.setProperty('--primary-dark', dark);
    doc.setProperty('--primary-light', light);
    doc.setProperty('--primary-rgb', this.hexToRgb(colorPrimary));

    // Backgrounds - ALL use theme color
    doc.setProperty('--bg-primary', veryLight);         // Main content background
    doc.setProperty('--bg-secondary', light);           // Secondary areas

    // Sidebar - theme colored
    doc.setProperty('--sidebar-bg', light);
    doc.setProperty('--sidebar-hover', medium);
    doc.setProperty('--sidebar-active', colorPrimary);

    // Header - theme colored
    doc.setProperty('--header-bg', colorPrimary);

    // Cards - light theme color
    doc.setProperty('--card-bg', veryLight);
    doc.setProperty('--card-border', medium);

    // Borders
    doc.setProperty('--border-color', medium);

    // Chat bubbles - light versions
    doc.setProperty('--chat-mine', colorPrimary);
    doc.setProperty('--chat-other', light);

    // TEXT - ALWAYS BLACK
    doc.setProperty('--text-primary', '#000000');
    doc.setProperty('--text-secondary', '#1a1a1a');
    doc.setProperty('--text-muted', '#333333');
    doc.setProperty('--text-inverse', '#000000');
    doc.setProperty('--sidebar-text', '#000000');
    doc.setProperty('--header-text', '#000000');
    doc.setProperty('--chat-mine-text', '#000000');
    doc.setProperty('--chat-other-text', '#000000');
  },

  // Darken a color
  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round((num >> 16) * (1 - percent));
    const g = Math.round(((num >> 8) & 0x00FF) * (1 - percent));
    const b = Math.round((num & 0x0000FF) * (1 - percent));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  },

  // === USER MODALS ===

  showAddUserModal() {
    document.getElementById('admin-user-modal-title').textContent = 'Νέος Χρήστης';
    document.getElementById('admin-user-modal-body').innerHTML = `
      <form id="admin-add-user-form" onsubmit="AdminPage.handleAddUser(event)">
        <div class="form-group">
          <label class="form-label">Ονοματεπώνυμο *</label>
          <input type="text" id="new-user-name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" id="new-user-email" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Κωδικός *</label>
          <input type="password" id="new-user-password" class="form-input" required minlength="6">
        </div>
        <div class="form-group">
          <label class="form-label">Ρόλος *</label>
          <select id="new-user-role" class="form-input" required>
            <option value="admin">Διαχειριστής Πλατφόρμας</option>
            <option value="διευθυντής">Διευθυντής</option>
            <option value="βδα">Βοηθός Διευθυντή Α'</option>
            <option value="βδ">Βοηθός Διευθυντή</option>
            <option value="καθηγητής" selected>Καθηγητής</option>
            <option value="υτ">Υπεύθυνος Τμήματος</option>
            <option value="γραμματεία">Γραμματεία</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="AdminPage.hideUserModal()">Ακύρωση</button>
          <button type="submit" class="btn btn-primary">Δημιουργία</button>
        </div>
      </form>
    `;
    document.getElementById('admin-user-modal').classList.remove('hidden');
  },

  async handleAddUser(event) {
    event.preventDefault();

    const userData = {
      displayName: document.getElementById('new-user-name').value.trim(),
      email: document.getElementById('new-user-email').value.trim(),
      password: document.getElementById('new-user-password').value,
      role: document.getElementById('new-user-role').value
    };

    const result = await UsersService.create(userData);
    if (result.success) {
      showToast('Ο χρήστης δημιουργήθηκε', 'success');
      this.hideUserModal();
      this.renderUsersTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  editUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('admin-user-modal-title').textContent = 'Επεξεργασία Χρήστη';
    document.getElementById('admin-user-modal-body').innerHTML = `
      <form id="admin-edit-user-form" onsubmit="AdminPage.handleEditUser(event, '${userId}')">
        <div class="form-group">
          <label class="form-label">Ονοματεπώνυμο *</label>
          <input type="text" id="edit-user-name" class="form-input" value="${escapeHtml(user.displayName || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" value="${escapeHtml(user.email || '')}" disabled>
        </div>
        <div class="form-group">
          <label class="form-label">Ειδικότητα</label>
          <select id="edit-user-specialty" class="form-input">
            <option value="">Καμία</option>
            ${SPECIALTIES.map(s => `<option value="${s}" ${user.specialty === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Τηλέφωνο</label>
          <input type="tel" id="edit-user-phone" class="form-input" value="${escapeHtml(user.phone || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Τμήματα (χωρισμένα με κόμμα)</label>
          <input type="text" id="edit-user-departments" class="form-input"
                 value="${user.departments?.join(', ') || ''}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="AdminPage.hideUserModal()">Ακύρωση</button>
          <button type="submit" class="btn btn-primary">Αποθήκευση</button>
        </div>
      </form>
    `;
    document.getElementById('admin-user-modal').classList.remove('hidden');
  },

  async handleEditUser(event, userId) {
    event.preventDefault();

    const departments = document.getElementById('edit-user-departments').value
      .split(',').map(d => d.trim()).filter(d => d);

    const userData = {
      displayName: document.getElementById('edit-user-name').value.trim(),
      specialty: document.getElementById('edit-user-specialty').value || null,
      phone: document.getElementById('edit-user-phone').value.trim() || null,
      departments: departments.length > 0 ? departments : null
    };

    const result = await UsersService.update(userId, userData);
    if (result.success) {
      showToast('Ο χρήστης ενημερώθηκε', 'success');
      this.hideUserModal();
      this.renderUsersTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async deleteUser(userId) {
    if (userId === AuthService.currentUser?.uid) {
      showToast('Δεν μπορείτε να διαγράψετε τον εαυτό σας!', 'warning');
      return;
    }

    if (!confirm('Σίγουρα θέλετε να διαγράψετε αυτόν τον χρήστη;\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί!')) {
      return;
    }

    const result = await UsersService.delete(userId);
    if (result.success) {
      showToast('Ο χρήστης διαγράφηκε', 'success');
      this.renderUsersTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  hideUserModal() {
    document.getElementById('admin-user-modal').classList.add('hidden');
  },

  // === GROUPS TAB ===

  async renderGroupsTab(container) {
    container.innerHTML = `<div class="loading-spinner">Φόρτωση ομάδων...</div>`;

    // Load users for selection
    if (this.users.length === 0) {
      const usersResult = await UsersService.getAllAdmin();
      if (usersResult.success) {
        this.users = (usersResult.data || []).filter(u => u.isActive !== false);
      } else {
        console.warn('Failed to load users for groups tab:', usersResult.error);
      }
    }

    const result = await GroupsService.getAll();
    if (!result.success) {
      console.error('Failed to load groups:', result.error);
      
      // Check if it's an index error
      const isIndexError = result.error && result.error.includes('index');
      const indexUrl = result.error?.match(/https:\/\/[^\s]+/)?.[0];
      
      container.innerHTML = `
        <div class="error-message">
          <p>Σφάλμα φόρτωσης: ${result.error}</p>
          ${isIndexError && indexUrl ? `
          <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 0.5rem 0; color: #92400e;">
              <strong>ℹ️ Απαιτείται Index:</strong> Η βάση δεδομένων χρειάζεται ένα composite index.
            </p>
            <a href="${indexUrl}" target="_blank" class="btn btn-secondary" style="margin-top: 0.5rem;">
              🔗 Δημιούργησε Index
            </a>
          </div>
          ` : ''}
          <button class="btn btn-secondary" onclick="AdminPage.renderGroupsTab(document.getElementById('admin-content'))" style="margin-top: 1rem;">
            🔄 Δοκίμασε ξανά
          </button>
        </div>
      `;
      return;
    }

    this.groups = result.data || [];
    console.log(`Loaded ${this.groups.length} groups for admin panel`);
    
    // Show warning if index is missing but data loaded
    if (result.warning && typeof showToast !== 'undefined') {
      showToast('Οι ομάδες φορτώθηκαν, αλλά απαιτείται index για ταξινόμηση. Ελέγξτε την κονσόλα.', 'warning', 6000);
    }

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-toolbar">
          <input type="text" class="form-input" placeholder="Αναζήτηση ομάδας..."
                 id="admin-group-search" oninput="AdminPage.filterGroups()">
          <button class="btn btn-primary" onclick="AdminPage.showCreateGroupModal()">
            + Νέα Ομάδα
          </button>
        </div>

        <div class="groups-list" id="groups-list">
          ${this.renderGroupsList(this.groups)}
        </div>

        <div class="admin-stats">
          <span>Σύνολο Ομάδων: <strong>${this.groups.length}</strong></span>
        </div>
      </div>
    `;
  },

  renderGroupsList(groups) {
    if (groups.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Δεν υπάρχουν ομάδες</h3>
          <p class="text-muted">Δημιουργήστε την πρώτη ομάδα</p>
        </div>
      `;
    }

    const types = GroupsService.getGroupTypes();

    return groups.map(group => {
      const memberCount = group.members?.length || 0;
      const managerCount = group.managers?.length || 0;
      const managerNames = group.managers?.map(id => {
        const user = this.users.find(u => u.id === id);
        return user?.displayName || 'Άγνωστος';
      }).join(', ') || '-';

      return `
        <div class="group-card" data-id="${group.id}">
          <div class="group-header">
            <div class="group-info">
              <h4 class="group-name">${escapeHtml(group.name)}</h4>
              <span class="group-type">${types[group.type] || group.type}</span>
            </div>
            <div class="group-actions">
              <button class="btn btn-sm" onclick="AdminPage.editGroup('${group.id}')" title="Επεξεργασία">
                ✏️
              </button>
              <button class="btn btn-sm" onclick="AdminPage.manageGroupMembers('${group.id}')" title="Μέλη">
                👥
              </button>
              <button class="btn btn-sm btn-danger" onclick="AdminPage.deleteGroup('${group.id}')" title="Διαγραφή">
                🗑️
              </button>
            </div>
          </div>
          <div class="group-body">
            ${group.description ? `<p class="group-description">${escapeHtml(group.description)}</p>` : ''}
            <div class="group-stats">
              <span>👤 ${memberCount} μέλη</span>
              <span>👔 Υπεύθυνοι: ${managerNames}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterGroups() {
    const query = document.getElementById('admin-group-search')?.value.toLowerCase() || '';
    const filtered = this.groups.filter(g =>
      g.name?.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query)
    );

    const container = document.getElementById('groups-list');
    if (container) {
      container.innerHTML = this.renderGroupsList(filtered);
    }
  },

  showCreateGroupModal() {
    this.editingGroup = null;
    document.getElementById('admin-group-modal-title').textContent = 'Νέα Ομάδα';
    this.renderGroupForm();
    document.getElementById('admin-group-modal').classList.remove('hidden');
  },

  editGroup(groupId) {
    this.editingGroup = this.groups.find(g => g.id === groupId);
    if (!this.editingGroup) return;

    document.getElementById('admin-group-modal-title').textContent = 'Επεξεργασία Ομάδας';
    this.renderGroupForm();
    document.getElementById('admin-group-modal').classList.remove('hidden');
  },

  renderGroupForm() {
    const group = this.editingGroup || {};
    const types = GroupsService.getGroupTypes();
    const permissions = GroupsService.getAvailablePermissions();
    const groupPerms = group.permissions || GroupsService.getDefaultPermissions();

    // Filter managers (ΒΔΑ, ΒΔ, Διευθυντής) - case insensitive
    const eligibleManagers = this.users.filter(u => {
      if (!u.role) return false;
      const role = u.role.toLowerCase();
      return ['βδα', 'βδ', 'διευθυντής', 'vda', 'vd', 'director'].includes(role) ||
             role === 'admin' || role === ROLES.ADMIN?.toLowerCase();
    });

    // All active users for members selection
    const allActiveUsers = this.users.filter(u => u.isActive !== false);

    document.getElementById('admin-group-modal-body').innerHTML = `
      <form id="group-form" onsubmit="AdminPage.handleGroupSubmit(event)">
        <!-- Basic Info -->
        <div class="form-section">
          <h4 class="form-section-title">Βασικές Πληροφορίες</h4>
          
          <div class="form-row">
            <div class="form-group" style="flex: 2">
              <label class="form-label">Όνομα Ομάδας *</label>
              <input type="text" id="group-name" class="form-input" required
                     value="${escapeHtml(group.name || '')}" placeholder="π.χ. Επιτροπή Εκδηλώσεων">
            </div>
            <div class="form-group" style="flex: 1">
              <label class="form-label">Τύπος</label>
              <select id="group-type" class="form-input">
                ${Object.entries(types).map(([key, label]) =>
                  `<option value="${key}" ${group.type === key ? 'selected' : ''}>${label}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Περιγραφή</label>
            <textarea id="group-description" class="form-input" rows="2"
                      placeholder="Σύντομη περιγραφή της ομάδας...">${escapeHtml(group.description || '')}</textarea>
          </div>
        </div>

        <!-- Managers -->
        <div class="form-section">
          <h4 class="form-section-title">Υπεύθυνοι Ομάδας</h4>
          <p class="form-hint">Επιλέξτε Βοηθούς Διευθυντή ή Διευθυντή ως υπεύθυνους</p>
          <div class="checkbox-list" id="group-managers" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--gray-300); padding: 1rem; border-radius: 8px;">
            ${eligibleManagers.length > 0 ? eligibleManagers.map(user => `
              <label class="checkbox-item" style="display: flex; align-items: center; padding: 0.5rem; cursor: pointer;">
                <input type="checkbox" name="managers" value="${user.id}"
                       ${group.managers?.includes(user.id) ? 'checked' : ''}
                       style="margin-right: 0.5rem;">
                <div>
                  <strong>${escapeHtml(user.displayName || user.email || 'Άγνωστος')}</strong>
                  <span class="text-muted" style="margin-left: 0.5rem; font-size: 0.875rem;">
                    (${ROLE_NAMES[user.role] || user.role || 'Χωρίς ρόλο'})
                  </span>
                </div>
              </label>
            `).join('') : '<p class="text-muted">Δεν υπάρχουν διαθέσιμοι υπεύθυνοι (ΒΔΑ / ΒΔ / Διευθυντής)</p>'}
          </div>
        </div>

        <!-- Members -->
        <div class="form-section">
          <h4 class="form-section-title">Μέλη Ομάδας</h4>
          <p class="form-hint">Επιλέξτε τα μέλη που θα ανήκουν στην ομάδα</p>
          
          <div class="form-group" style="margin-bottom: 1rem;">
            <input type="text" id="member-search" class="form-input" 
                   placeholder="Αναζήτηση μελών..." 
                   oninput="AdminPage.filterMembersList(this.value)">
          </div>
          
          <div class="checkbox-list" id="group-members" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--gray-300); padding: 1rem; border-radius: 8px;">
            ${allActiveUsers.map(user => `
              <label class="checkbox-item" style="display: flex; align-items: center; padding: 0.5rem; cursor: pointer;" data-user-name="${(user.displayName || user.email || '').toLowerCase()}">
                <input type="checkbox" name="members" value="${user.id}"
                       ${group.members?.includes(user.id) ? 'checked' : ''}
                       style="margin-right: 0.5rem;">
                <div>
                  <strong>${escapeHtml(user.displayName || user.email || 'Άγνωστος')}</strong>
                  <span class="text-muted" style="margin-left: 0.5rem; font-size: 0.875rem;">
                    ${user.email ? `(${escapeHtml(user.email)})` : ''}
                    ${user.role ? ` - ${ROLE_NAMES[user.role] || user.role}` : ''}
                  </span>
                </div>
              </label>
            `).join('')}
            ${allActiveUsers.length === 0 ? '<p class="text-muted">Δεν υπάρχουν διαθέσιμοι χρήστες</p>' : ''}
          </div>
        </div>

        <!-- Permissions -->
        <div class="form-section">
          <h4 class="form-section-title">Προεπιλεγμένα Δικαιώματα Μελών</h4>
          <div class="permissions-grid">
            ${Object.entries(permissions).map(([key, label]) => `
              <label class="checkbox-item">
                <input type="checkbox" name="permissions" value="${key}"
                       ${groupPerms[key] ? 'checked' : ''}>
                <span>${label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="AdminPage.hideGroupModal()">
            Ακύρωση
          </button>
          <button type="submit" class="btn btn-primary">
            ${this.editingGroup ? 'Αποθήκευση' : 'Δημιουργία'}
          </button>
        </div>
      </form>
    `;
  },

  filterMembersList(searchQuery) {
    const query = searchQuery.toLowerCase();
    const memberItems = document.querySelectorAll('#group-members .checkbox-item');
    
    memberItems.forEach(item => {
      const userName = item.dataset.userName || '';
      if (userName.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  },

  async handleGroupSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('group-name').value.trim();
    const type = document.getElementById('group-type').value;
    const description = document.getElementById('group-description').value.trim();

    // Get selected managers
    const managers = Array.from(document.querySelectorAll('input[name="managers"]:checked'))
      .map(cb => cb.value);

    // Get selected members
    const members = Array.from(document.querySelectorAll('input[name="members"]:checked'))
      .map(cb => cb.value);

    // Get selected permissions
    const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]');
    const permissions = {};
    permissionCheckboxes.forEach(cb => {
      permissions[cb.value] = cb.checked;
    });

    const groupData = { name, type, description, managers, members, permissions };

    let result;
    if (this.editingGroup) {
      result = await GroupsService.update(this.editingGroup.id, groupData);
    } else {
      result = await GroupsService.create(groupData);
    }

    if (result.success) {
      showToast(this.editingGroup ? 'Η ομάδα ενημερώθηκε' : 'Η ομάδα δημιουργήθηκε', 'success');
      this.hideGroupModal();
      this.renderGroupsTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async manageGroupMembers(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    this.editingGroup = group;
    document.getElementById('admin-group-modal-title').textContent = `Μέλη: ${group.name}`;

    const permissions = GroupsService.getAvailablePermissions();
    const groupPerms = group.permissions || GroupsService.getDefaultPermissions();

    document.getElementById('admin-group-modal-body').innerHTML = `
      <div class="members-manager">
        <div class="members-section">
          <h4>Τρέχοντα Μέλη (${group.members?.length || 0})</h4>
          <div class="members-list" id="current-members">
            ${this.renderCurrentMembers(group)}
          </div>
        </div>

        <div class="members-section">
          <h4>Προσθήκη Μελών</h4>
          <input type="text" class="form-input" placeholder="Αναζήτηση χρήστη..."
                 id="member-search" oninput="AdminPage.filterAvailableMembers('${groupId}')">
          <div class="members-list" id="available-members">
            ${this.renderAvailableMembers(group)}
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="AdminPage.hideGroupModal()">
          Κλείσιμο
        </button>
      </div>
    `;

    document.getElementById('admin-group-modal').classList.remove('hidden');
  },

  renderCurrentMembers(group) {
    if (!group.members || group.members.length === 0) {
      return '<p class="text-muted">Δεν υπάρχουν μέλη</p>';
    }

    return group.members.map(memberId => {
      const user = this.users.find(u => u.id === memberId);
      if (!user) return '';

      const isManager = group.managers?.includes(memberId);
      const memberPerms = group.memberPermissions?.[memberId] || {};

      return `
        <div class="member-item">
          <div class="member-info">
            <div class="avatar avatar-sm">${getInitials(user.displayName)}</div>
            <div>
              <span class="member-name">${escapeHtml(user.displayName)}</span>
              ${isManager ? '<span class="manager-badge">Υπεύθυνος</span>' : ''}
              <span class="member-role">${ROLE_NAMES[user.role] || user.role}</span>
            </div>
          </div>
          <div class="member-actions">
            <button class="btn btn-sm" onclick="AdminPage.editMemberPermissions('${group.id}', '${memberId}')"
                    title="Δικαιώματα">⚙️</button>
            <button class="btn btn-sm btn-danger" onclick="AdminPage.removeMemberFromGroup('${group.id}', '${memberId}')"
                    title="Αφαίρεση">✕</button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderAvailableMembers(group) {
    const available = this.users.filter(u =>
      !group.members?.includes(u.id) && u.isActive !== false
    );

    if (available.length === 0) {
      return '<p class="text-muted">Όλοι οι χρήστες είναι ήδη μέλη</p>';
    }

    return available.slice(0, 10).map(user => `
      <div class="member-item available">
        <div class="member-info">
          <div class="avatar avatar-sm">${getInitials(user.displayName)}</div>
          <div>
            <span class="member-name">${escapeHtml(user.displayName)}</span>
            <span class="member-role">${ROLE_NAMES[user.role] || user.role}</span>
          </div>
        </div>
        <button class="btn btn-sm btn-success" onclick="AdminPage.addMemberToGroup('${group.id}', '${user.id}')">
          + Προσθήκη
        </button>
      </div>
    `).join('');
  },

  filterAvailableMembers(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    const query = document.getElementById('member-search')?.value.toLowerCase() || '';
    const available = this.users.filter(u =>
      !group.members?.includes(u.id) &&
      u.isActive !== false &&
      (u.displayName?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query))
    );

    const container = document.getElementById('available-members');
    if (container) {
      if (available.length === 0) {
        container.innerHTML = '<p class="text-muted">Δεν βρέθηκαν χρήστες</p>';
      } else {
        container.innerHTML = available.slice(0, 10).map(user => `
          <div class="member-item available">
            <div class="member-info">
              <div class="avatar avatar-sm">${getInitials(user.displayName)}</div>
              <div>
                <span class="member-name">${escapeHtml(user.displayName)}</span>
                <span class="member-role">${ROLE_NAMES[user.role] || user.role}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-success" onclick="AdminPage.addMemberToGroup('${group.id}', '${user.id}')">
              + Προσθήκη
            </button>
          </div>
        `).join('');
      }
    }
  },

  async addMemberToGroup(groupId, userId) {
    const result = await GroupsService.addMember(groupId, userId);
    if (result.success) {
      // Update local data
      const group = this.groups.find(g => g.id === groupId);
      if (group) {
        if (!group.members) group.members = [];
        group.members.push(userId);
      }
      showToast('Το μέλος προστέθηκε', 'success');
      this.manageGroupMembers(groupId);
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async removeMemberFromGroup(groupId, userId) {
    if (!confirm('Σίγουρα θέλετε να αφαιρέσετε αυτό το μέλος;')) return;

    const result = await GroupsService.removeMember(groupId, userId);
    if (result.success) {
      // Update local data
      const group = this.groups.find(g => g.id === groupId);
      if (group && group.members) {
        group.members = group.members.filter(id => id !== userId);
      }
      showToast('Το μέλος αφαιρέθηκε', 'success');
      this.manageGroupMembers(groupId);
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async editMemberPermissions(groupId, userId) {
    const group = this.groups.find(g => g.id === groupId);
    const user = this.users.find(u => u.id === userId);
    if (!group || !user) return;

    const permissions = GroupsService.getAvailablePermissions();
    const memberPerms = group.memberPermissions?.[userId] || group.permissions || GroupsService.getDefaultPermissions();

    document.getElementById('admin-group-modal-title').textContent = `Δικαιώματα: ${user.displayName}`;
    document.getElementById('admin-group-modal-body').innerHTML = `
      <form id="member-perms-form" onsubmit="AdminPage.saveMemberPermissions(event, '${groupId}', '${userId}')">
        <p class="text-muted mb-md">Ορίστε τα δικαιώματα του μέλους σε αυτή την ομάδα:</p>

        <div class="permissions-grid">
          ${Object.entries(permissions).map(([key, label]) => `
            <label class="checkbox-item">
              <input type="checkbox" name="perms" value="${key}"
                     ${memberPerms[key] ? 'checked' : ''}>
              <span>${label}</span>
            </label>
          `).join('')}
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="AdminPage.manageGroupMembers('${groupId}')">
            Πίσω
          </button>
          <button type="submit" class="btn btn-primary">Αποθήκευση</button>
        </div>
      </form>
    `;
  },

  async saveMemberPermissions(event, groupId, userId) {
    event.preventDefault();

    const permissionCheckboxes = document.querySelectorAll('input[name="perms"]');
    const permissions = {};
    permissionCheckboxes.forEach(cb => {
      permissions[cb.value] = cb.checked;
    });

    const result = await GroupsService.updateMemberPermissions(groupId, userId, permissions);
    if (result.success) {
      // Update local data
      const group = this.groups.find(g => g.id === groupId);
      if (group) {
        if (!group.memberPermissions) group.memberPermissions = {};
        group.memberPermissions[userId] = permissions;
      }
      showToast('Τα δικαιώματα αποθηκεύτηκαν', 'success');
      this.manageGroupMembers(groupId);
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  async deleteGroup(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    if (!confirm(`Σίγουρα θέλετε να διαγράψετε την ομάδα "${group.name}";\nΑυτή η ενέργεια δεν μπορεί να αναιρεθεί!`)) {
      return;
    }

    const result = await GroupsService.delete(groupId);
    if (result.success) {
      showToast('Η ομάδα διαγράφηκε', 'success');
      this.renderGroupsTab(document.getElementById('admin-content'));
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
    }
  },

  hideGroupModal() {
    document.getElementById('admin-group-modal').classList.add('hidden');
    this.editingGroup = null;
  },

  // === CLEANUP ===

  destroy() {
    // Nothing to cleanup
  }
};

// Export
window.AdminPage = AdminPage;
