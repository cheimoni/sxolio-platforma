/* ========================================
   HEADER COMPONENT
   ======================================== */

const Header = {
  container: null,

  // === INITIALIZATION ===

  init(containerId = 'header') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.attachEvents();
  },

  // === RENDER ===

  render() {
    const user = AuthService.currentUserData;

    this.container.innerHTML = `
      <div class="header-left">
        <button class="header-icon-btn" id="mobile-menu-btn" title="Μενού">
          ☰
        </button>
        <h1 class="header-title" id="page-title">Αρχική</h1>
      </div>

      <div class="header-right">
        <!-- Search -->
        <div class="header-search">
          <input type="text" placeholder="Αναζήτηση..." id="header-search-input">
        </div>

        <!-- Notifications -->
        <div class="dropdown">
          <button class="header-icon-btn" id="notifications-btn" title="Ειδοποιήσεις">
            🔔
            <span class="header-notification-badge hidden" id="notification-badge">0</span>
          </button>
          <div class="dropdown-menu" id="notifications-dropdown">
            <div class="p-md text-center text-muted">
              Δεν υπάρχουν ειδοποιήσεις
            </div>
          </div>
        </div>

        <!-- User Menu -->
        <div class="dropdown">
          <div class="header-user" id="user-menu-btn">
            <div class="header-avatar">
              ${user ? getInitials(user.displayName) : '??'}
            </div>
            <span class="header-user-name">${user?.displayName || 'Χρήστης'}</span>
          </div>
          <div class="dropdown-menu" id="user-dropdown">
            <div class="dropdown-item" data-action="profile">
              👤 Προφίλ
            </div>
            <div class="dropdown-item" data-action="settings">
              ⚙️ Ρυθμίσεις
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" data-action="logout">
              🚪 Αποσύνδεση
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // === EVENTS ===

  attachEvents() {
    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      });
    }

    // Search
    const searchInput = document.getElementById('header-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.handleSearch(e.target.value);
      }, 300));
    }

    // Notifications dropdown
    const notifBtn = document.getElementById('notifications-btn');
    const notifDropdown = document.getElementById('notifications-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns();
        notifDropdown.classList.toggle('show');
      });
    }

    // User dropdown
    const userBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns();
        userDropdown.classList.toggle('show');
      });

      // User dropdown actions
      userDropdown.querySelectorAll('[data-action]').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          this.handleUserAction(action);
          userDropdown.classList.remove('show');
        });
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  },

  // === HANDLERS ===

  handleSearch(query) {
    if (query.length < 2) return;

    // Emit search event
    const event = new CustomEvent('app:search', { detail: { query } });
    document.dispatchEvent(event);
  },

  handleUserAction(action) {
    switch (action) {
      case 'profile':
        App.navigateTo('settings');
        break;
      case 'settings':
        App.navigateTo('settings');
        break;
      case 'logout':
        this.handleLogout();
        break;
    }
  },

  async handleLogout() {
    const result = await AuthService.logout();
    if (result.success) {
      window.location.reload();
    } else {
      showToast('Σφάλμα αποσύνδεσης', 'error');
    }
  },

  // === HELPERS ===

  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  },

  setTitle(title) {
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = title;
  },

  // === NOTIFICATIONS ===

  updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  updateNotificationsList(notifications) {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;

    if (!notifications || notifications.length === 0) {
      dropdown.innerHTML = `
        <div class="p-md text-center text-muted">
          Δεν υπάρχουν ειδοποιήσεις
        </div>
      `;
      return;
    }

    dropdown.innerHTML = notifications.slice(0, 5).map(notif => `
      <div class="dropdown-item ${notif.read ? '' : 'font-semibold'}" data-notif-id="${notif.id}">
        <span>${notif.title}</span>
        <span class="text-muted text-xs">${timeAgo(notif.createdAt)}</span>
      </div>
    `).join('') + `
      <div class="dropdown-divider"></div>
      <div class="dropdown-item text-center text-primary">
        Δες όλες τις ειδοποιήσεις
      </div>
    `;
  }
};

// Export
window.Header = Header;
