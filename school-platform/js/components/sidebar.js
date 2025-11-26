/* ========================================
   SIDEBAR COMPONENT
   ======================================== */

const Sidebar = {
  // Container element
  container: null,

  // === INITIALIZATION ===

  init(containerId = 'sidebar') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.attachEvents();
    
    // Re-render when user data loads (in case it wasn't ready initially)
    if (AuthService.currentUserData) {
      // User data already loaded, but re-render to be sure
      setTimeout(() => this.render(), 100);
    }
  },
  
  // Method to refresh sidebar (can be called externally)
  refresh() {
    if (this.container) {
      const currentActive = this.container.querySelector('.sidebar-item.active');
      const activePage = currentActive?.dataset.page;
      
      this.render();
      this.attachEvents();
      
      // Restore active state
      if (activePage) {
        this.setActive(activePage);
      }
    }
  },

  // === RENDER ===

  render() {
    const user = AuthService.currentUserData;
    const role = user?.role;
    
    // Debug logging
    console.log('Sidebar render - User:', user?.displayName, 'Role:', role);
    console.log('Has manageUsers permission:', hasPermission(role, 'manageUsers'));
    console.log('Is super admin:', isSuperAdmin(role));

    this.container.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">🏫 Σχολείο</div>
      </div>

      <nav class="sidebar-nav">
        <!-- Κύριο Μενού -->
        <div class="sidebar-section">
          <div class="sidebar-menu">
            <a href="#dashboard" class="sidebar-item active" data-page="dashboard">
              <span class="sidebar-item-icon">🏠</span>
              <span>Αρχική</span>
            </a>

            <a href="#messages" class="sidebar-item" data-page="messages">
              <span class="sidebar-item-icon">💬</span>
              <span>Μηνύματα</span>
              <span class="sidebar-item-badge hidden" id="unread-messages-badge">0</span>
            </a>

            <a href="#calendar" class="sidebar-item" data-page="calendar">
              <span class="sidebar-item-icon">📅</span>
              <span>Ημερολόγιο</span>
            </a>

            ${hasPermission(role, 'announceToAll') || hasPermission(role, 'announceToDept') ? `
            <a href="#announcements" class="sidebar-item" data-page="announcements">
              <span class="sidebar-item-icon">📢</span>
              <span>Ανακοινώσεις</span>
            </a>
            ` : `
            <a href="#announcements" class="sidebar-item" data-page="announcements">
              <span class="sidebar-item-icon">📢</span>
              <span>Ανακοινώσεις</span>
            </a>
            `}

            <a href="#tasks" class="sidebar-item" data-page="tasks">
              <span class="sidebar-item-icon">✅</span>
              <span>Εργασίες</span>
            </a>

            <a href="#grades" class="sidebar-item" data-page="grades">
              <span class="sidebar-item-icon">📊</span>
              <span>Βαθμολογία</span>
            </a>

            <a href="#files" class="sidebar-item" data-page="files">
              <span class="sidebar-item-icon">📁</span>
              <span>Αρχεία</span>
            </a>

            <a href="#polls" class="sidebar-item" data-page="polls">
              <span class="sidebar-item-icon">🗳️</span>
              <span>Ψηφοφορίες</span>
            </a>

            <a href="#calls" class="sidebar-item" data-page="calls">
              <span class="sidebar-item-icon">📞</span>
              <span>Κλήσεις</span>
            </a>

            <a href="#photo-editor" class="sidebar-item" data-page="photo-editor">
              <span class="sidebar-item-icon">🖼️</span>
              <span>Επεξεργασία Φωτογραφίας</span>
            </a>

            <a href="#events-program" class="sidebar-item" data-page="events-program">
              <span class="sidebar-item-icon">🎉</span>
              <span>Πρόγραμμα Εκδηλώσεων</span>
            </a>
          </div>
        </div>

        <!-- Alerts Section -->
        <div class="sidebar-section">
          <div class="sidebar-section-title">Ειδοποιήσεις</div>
          <div class="sidebar-menu">
            <a href="#alerts" class="sidebar-item" data-page="alerts">
              <span class="sidebar-item-icon">🚨</span>
              <span>Έκτακτα</span>
              <span class="sidebar-item-badge hidden" id="alerts-badge">0</span>
            </a>
          </div>
        </div>

        ${role === 'teacher' || hasPermission(role, 'manageUsers') || isSuperAdmin(role) ? `
        <!-- Teacher Section -->
        <div class="sidebar-section">
          <div class="sidebar-section-title">Εκπαιδευτικοί</div>
          <div class="sidebar-menu">
            <a href="#duties" class="sidebar-item" data-page="duties">
              <span class="sidebar-item-icon">📋</span>
              <span>Εφημερίες</span>
            </a>
            <a href="#substitutions" class="sidebar-item" data-page="substitutions">
              <span class="sidebar-item-icon">🔄</span>
              <span>Αντικαταστάσεις</span>
            </a>
            <a href="#schedule-adjuster" class="sidebar-item" data-page="schedule-adjuster">
              <span class="sidebar-item-icon">🔧</span>
              <span>Προσαρμογή Ωραρίου</span>
            </a>
          </div>
        </div>
        ` : ''}

        <!-- Πρόσφατες Συνομιλίες -->
        <div class="sidebar-section">
          <div class="sidebar-section-title">Συνομιλίες</div>
          <div class="sidebar-menu" id="recent-chats">
            <!-- Θα γεμίσει δυναμικά -->
          </div>
        </div>

        <!-- Admin Menu -->
        ${hasPermission(role, 'manageUsers') || (role && role.toLowerCase() === 'admin') || (role && role.toLowerCase() === ROLES.ADMIN?.toLowerCase()) ? `
        <div class="sidebar-section">
          <div class="sidebar-section-title">${isSuperAdmin(role) ? 'Πλατφόρμα' : 'Διαχείριση'}</div>
          <div class="sidebar-menu">
            ${isSuperAdmin(role) ? `
            <a href="#admin" class="sidebar-item" data-page="admin">
              <span class="sidebar-item-icon">🛠️</span>
              <span>Πίνακας Ελέγχου</span>
            </a>
            ` : ''}
            <a href="#users" class="sidebar-item" data-page="users">
              <span class="sidebar-item-icon">👥</span>
              <span>Χρήστες</span>
            </a>
          </div>
        </div>
        ` : ''}
      </nav>

      <div class="sidebar-footer">
        <a href="#settings" class="sidebar-item" data-page="settings">
          <span class="sidebar-item-icon">⚙️</span>
          <span>Ρυθμίσεις</span>
        </a>
      </div>
    `;
  },

  // === EVENTS ===

  attachEvents() {
    // Menu item clicks
    this.container.addEventListener('click', (e) => {
      const item = e.target.closest('.sidebar-item');
      if (!item) return;

      const page = item.dataset.page;
      if (page) {
        this.setActive(page);
        App.navigateTo(page);
      }
    });
  },

  // Set active menu item
  setActive(page) {
    const items = this.container.querySelectorAll('.sidebar-item');
    items.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });
  },

  // === RECENT CHATS ===

  updateRecentChats(conversations) {
    const container = document.getElementById('recent-chats');
    if (!container) return;

    const currentUserId = AuthService.currentUser?.uid;

    if (!conversations || conversations.length === 0) {
      container.innerHTML = `
        <div class="text-muted text-xs p-sm">
          Δεν υπάρχουν συνομιλίες
        </div>
      `;
      return;
    }

    // Show max 5 recent
    const recent = conversations.slice(0, 5);

    container.innerHTML = recent.map(conv => {
      const isGroup = conv.type === CONVERSATION_TYPES.GROUP;
      const name = isGroup ? conv.name : this.getOtherParticipantName(conv, currentUserId);
      const unread = conv.unreadCount?.[currentUserId] || 0;
      const icon = isGroup ? '👥' : '👤';

      return `
        <a href="#" class="sidebar-item" data-conversation-id="${conv.id}">
          <span class="sidebar-item-icon">${icon}</span>
          <span class="truncate">${escapeHtml(name)}</span>
          ${unread > 0 ? `<span class="sidebar-item-badge">${unread}</span>` : ''}
        </a>
      `;
    }).join('');

    // Click handlers for conversations
    container.querySelectorAll('[data-conversation-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const convId = el.dataset.conversationId;
        App.navigateTo('messages', { conversationId: convId });
      });
    });
  },

  // Get other participant name for private chats
  getOtherParticipantName(conversation, currentUserId) {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    return conversation.participantNames?.[otherUserId] || 'Χρήστης';
  },

  // === BADGE UPDATES ===

  updateUnreadBadge(count) {
    const badge = document.getElementById('unread-messages-badge');
    if (!badge) return;

    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
};

// Export
window.Sidebar = Sidebar;
