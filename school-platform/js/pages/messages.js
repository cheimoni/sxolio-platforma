/* ========================================
   MESSAGES PAGE - With Group Support
   ======================================== */

const MessagesPage = {
  container: null,
  showingNewChat: false,

  // === INITIALIZATION ===

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  // === RENDER ===

  render(params = {}) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="chat-container">
        <!-- Left: Conversation List -->
        <div class="chat-list" id="conversation-list-container">
          <!-- ConversationList component will render here -->
        </div>

        <!-- Right: Chat Window -->
        <div class="chat-window-container" id="chat-window-container">
          <!-- ChatWindow component will render here -->
        </div>
      </div>

      <!-- New Chat Modal -->
      <div class="modal-overlay" id="new-chat-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Νέα Συνομιλία</h3>
            <button class="modal-close" id="close-new-chat-modal">✕</button>
          </div>
          <div class="modal-body">
            <!-- Chat Type Tabs -->
            <div class="chat-type-tabs mb-md">
              <button class="chat-type-tab active" data-type="private">
                👤 Προσωπική
              </button>
              <button class="chat-type-tab" data-type="group">
                👥 Ομαδική
              </button>
            </div>

            <!-- Private Chat: User List -->
            <div id="private-chat-section">
              <div id="user-list-container">
                <!-- UserList component will render here -->
              </div>
            </div>

            <!-- Group Chat: Name + Members -->
            <div id="group-chat-section" class="hidden">
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

              <div class="input-group mb-md">
                <label class="input-label">Αναζήτηση μελών</label>
                <input
                  type="text"
                  class="input"
                  id="group-user-search"
                  placeholder="Αναζήτηση..."
                >
              </div>

              <div class="selected-users mb-md" id="selected-users-container">
                <div class="text-muted text-xs">
                  Επίλεξε τουλάχιστον 2 μέλη
                </div>
              </div>

              <div class="user-select-list" id="group-users-list">
                <!-- Users will be loaded here -->
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-new-chat">Ακύρωση</button>
            <button class="btn btn-primary" id="start-new-chat" disabled>Έναρξη Chat</button>
          </div>
        </div>
      </div>
    `;

    this.initComponents();
    this.attachEvents();

    // Auto-open conversation if provided
    if (params.conversationId) {
      setTimeout(() => {
        ConversationList.selectConversation(params.conversationId);
      }, 500);
    }
  },

  // === COMPONENTS ===

  initComponents() {
    // Initialize ConversationList
    ConversationList.init('conversation-list-container', (conversation) => {
      this.onConversationSelect(conversation);
    });
    ConversationList.render();

    // Initialize ChatWindow
    ChatWindow.init('chat-window-container');
    ChatWindow.renderEmpty();

    // Initialize UserList for new chat modal
    UserList.init('user-list-container', (user) => {
      this.onUserSelect(user);
    });
  },

  // === EVENTS ===

  attachEvents() {
    // New chat event from ConversationList
    document.addEventListener('chat:new', () => {
      this.showNewChatModal();
    });

    // Modal events
    const modal = document.getElementById('new-chat-modal');
    const closeBtn = document.getElementById('close-new-chat-modal');
    const cancelBtn = document.getElementById('cancel-new-chat');
    const startBtn = document.getElementById('start-new-chat');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideNewChatModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideNewChatModal());
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => this.startNewChat());
    }

    // Close modal on overlay click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideNewChatModal();
      });
    }

    // Chat type tabs
    document.querySelectorAll('.chat-type-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchChatType(tab.dataset.type));
    });

    // Group search
    const groupSearch = document.getElementById('group-user-search');
    if (groupSearch) {
      groupSearch.addEventListener('input', debounce((e) => {
        this.filterGroupUsers(e.target.value);
      }, 200));
    }

    // Group name input
    const groupNameInput = document.getElementById('group-name-input');
    if (groupNameInput) {
      groupNameInput.addEventListener('input', () => this.validateGroupForm());
    }

    // Add new chat button to list header
    this.addNewChatButton();
  },

  addNewChatButton() {
    const header = document.querySelector('.chat-list-header');
    if (header && !header.querySelector('#new-chat-btn')) {
      const btn = document.createElement('button');
      btn.id = 'new-chat-btn';
      btn.className = 'btn btn-primary btn-sm mt-sm w-full';
      btn.innerHTML = '+ Νέα Συνομιλία';
      btn.addEventListener('click', () => this.showNewChatModal());
      header.appendChild(btn);
    }
  },

  // === CHAT TYPE SWITCHING ===

  currentChatType: 'private',
  groupSelectedUsers: [],
  allUsers: [],

  switchChatType(type) {
    this.currentChatType = type;

    // Update tabs
    document.querySelectorAll('.chat-type-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });

    // Show/hide sections
    const privateSection = document.getElementById('private-chat-section');
    const groupSection = document.getElementById('group-chat-section');

    if (type === 'private') {
      privateSection.classList.remove('hidden');
      groupSection.classList.add('hidden');
    } else {
      privateSection.classList.add('hidden');
      groupSection.classList.remove('hidden');
      this.loadGroupUsers();
    }

    // Update button text
    const startBtn = document.getElementById('start-new-chat');
    if (startBtn) {
      startBtn.textContent = type === 'private' ? 'Έναρξη Chat' : 'Δημιουργία Ομάδας';
      startBtn.disabled = true;
    }
  },

  // === GROUP USERS ===

  async loadGroupUsers() {
    const container = document.getElementById('group-users-list');
    if (!container) return;

    container.innerHTML = '<div class="text-center p-md"><div class="spinner"></div></div>';

    const result = await UsersService.getAll();

    if (result.success) {
      const currentUserId = AuthService.currentUser?.uid;
      this.allUsers = result.data.filter(u => u.id !== currentUserId);
      this.renderGroupUsers(this.allUsers);
    }
  },

  renderGroupUsers(users) {
    const container = document.getElementById('group-users-list');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<div class="text-center p-md text-muted">Δεν βρέθηκαν χρήστες</div>';
      return;
    }

    container.innerHTML = users.map(user => {
      const isSelected = this.groupSelectedUsers.some(u => u.id === user.id);

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

    // Click handlers
    container.querySelectorAll('[data-user-id]').forEach(el => {
      el.addEventListener('click', () => {
        this.toggleGroupUser(el.dataset.userId);
      });
    });
  },

  filterGroupUsers(query) {
    if (!query || query.length < 2) {
      this.renderGroupUsers(this.allUsers);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = this.allUsers.filter(user =>
      user.displayName?.toLowerCase().includes(queryLower) ||
      user.email?.toLowerCase().includes(queryLower)
    );

    this.renderGroupUsers(filtered);
  },

  toggleGroupUser(userId) {
    const user = this.allUsers.find(u => u.id === userId);
    if (!user) return;

    const index = this.groupSelectedUsers.findIndex(u => u.id === userId);

    if (index === -1) {
      this.groupSelectedUsers.push(user);
    } else {
      this.groupSelectedUsers.splice(index, 1);
    }

    this.renderSelectedUsers();
    this.renderGroupUsers(this.allUsers);
    this.validateGroupForm();
  },

  renderSelectedUsers() {
    const container = document.getElementById('selected-users-container');
    if (!container) return;

    if (this.groupSelectedUsers.length === 0) {
      container.innerHTML = '<div class="text-muted text-xs">Επίλεξε τουλάχιστον 2 μέλη</div>';
      return;
    }

    container.innerHTML = this.groupSelectedUsers.map(user => `
      <span class="selected-user-badge" data-user-id="${user.id}">
        ${escapeHtml(user.displayName)}
        <button class="selected-user-remove">✕</button>
      </span>
    `).join('');

    // Remove handlers
    container.querySelectorAll('.selected-user-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const badge = btn.closest('[data-user-id]');
        this.toggleGroupUser(badge.dataset.userId);
      });
    });
  },

  validateGroupForm() {
    const startBtn = document.getElementById('start-new-chat');
    const nameInput = document.getElementById('group-name-input');

    const isValid =
      nameInput?.value.trim().length >= 2 &&
      this.groupSelectedUsers.length >= 2;

    if (startBtn) {
      startBtn.disabled = !isValid;
    }

    return isValid;
  },

  // === HANDLERS ===

  onConversationSelect(conversation) {
    ChatWindow.render(conversation);
  },

  onUserSelect(user) {
    if (this.currentChatType === 'private') {
      const startBtn = document.getElementById('start-new-chat');
      if (startBtn) {
        startBtn.disabled = !user;
      }
    }
  },

  async startNewChat() {
    if (this.currentChatType === 'private') {
      await this.startPrivateChat();
    } else {
      await this.startGroupChat();
    }
  },

  async startPrivateChat() {
    const selectedUser = UserList.getSelectedUser();
    if (!selectedUser) return;

    const currentUserId = AuthService.currentUser?.uid;
    const startBtn = document.getElementById('start-new-chat');

    // Loading
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="spinner"></span>';

    // Create or get existing conversation
    const result = await ChatService.getOrCreatePrivateChat(
      currentUserId,
      selectedUser.id
    );

    if (result.success) {
      this.hideNewChatModal();

      // Select the conversation
      setTimeout(() => {
        ConversationList.selectConversation(result.data.id);
      }, 300);
    } else {
      showToast('Σφάλμα δημιουργίας συνομιλίας', 'error');
      startBtn.disabled = false;
      startBtn.textContent = 'Έναρξη Chat';
    }
  },

  async startGroupChat() {
    if (!this.validateGroupForm()) return;

    const nameInput = document.getElementById('group-name-input');
    const startBtn = document.getElementById('start-new-chat');
    const groupName = nameInput.value.trim();

    // Loading
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="spinner"></span>';

    // Add current user to participants
    const currentUserId = AuthService.currentUser?.uid;
    const participantIds = [
      currentUserId,
      ...this.groupSelectedUsers.map(u => u.id)
    ];

    // Create group
    const result = await ChatService.createGroupChat(
      groupName,
      participantIds,
      currentUserId
    );

    if (result.success) {
      showToast(`Η ομάδα "${groupName}" δημιουργήθηκε`, 'success');
      this.hideNewChatModal();

      // Select the conversation
      setTimeout(() => {
        ConversationList.selectConversation(result.data.id);
      }, 300);
    } else {
      showToast('Σφάλμα δημιουργίας ομάδας', 'error');
      startBtn.disabled = false;
      startBtn.textContent = 'Δημιουργία Ομάδας';
    }
  },

  // === MODAL ===

  showNewChatModal() {
    const modal = document.getElementById('new-chat-modal');
    if (modal) {
      modal.classList.add('show');

      // Reset to private chat
      this.currentChatType = 'private';
      this.groupSelectedUsers = [];
      this.switchChatType('private');

      // Load users for private chat
      UserList.render();
    }
  },

  hideNewChatModal() {
    const modal = document.getElementById('new-chat-modal');
    if (modal) {
      modal.classList.remove('show');
      UserList.clearSelection();
      this.groupSelectedUsers = [];

      // Reset form
      const groupNameInput = document.getElementById('group-name-input');
      if (groupNameInput) groupNameInput.value = '';

      const startBtn = document.getElementById('start-new-chat');
      if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = 'Έναρξη Chat';
      }
    }
  },

  // === CLEANUP ===

  destroy() {
    ConversationList.destroy();
    ChatWindow.destroy();
    document.removeEventListener('chat:new', this.showNewChatModal);
  }
};

// Export
window.MessagesPage = MessagesPage;
