/* ========================================
   CONVERSATION LIST COMPONENT
   ======================================== */

const ConversationList = {
  container: null,
  conversations: [],
  selectedConversationId: null,
  onSelectCallback: null,
  unsubscribe: null,

  // === INITIALIZATION ===

  init(containerId, onSelect) {
    this.container = document.getElementById(containerId);
    this.onSelectCallback = onSelect;
  },

  // === RENDER ===

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="chat-list-header">
        <input
          type="text"
          class="chat-list-search"
          placeholder="Αναζήτηση συνομιλίας..."
          id="conv-search-input"
        >
      </div>
      <div class="chat-list-items" id="conv-list-items">
        <div class="text-center p-md">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    this.attachEvents();
    this.subscribe();
  },

  // === SUBSCRIPTION ===

  subscribe() {
    const currentUserId = AuthService.currentUser?.uid;
    if (!currentUserId) return;

    this.unsubscribe = ChatService.subscribeToConversations(
      currentUserId,
      (conversations) => {
        this.conversations = conversations;
        this.renderConversations();

        // Update sidebar recent chats
        Sidebar.updateRecentChats(conversations);

        // Update unread badge
        const totalUnread = this.getTotalUnread();
        Sidebar.updateUnreadBadge(totalUnread);
      }
    );
  },

  renderConversations() {
    const container = document.getElementById('conv-list-items');
    if (!container) return;

    const currentUserId = AuthService.currentUser?.uid;

    if (this.conversations.length === 0) {
      container.innerHTML = `
        <div class="text-center p-md text-muted">
          <div class="mb-sm">Δεν υπάρχουν συνομιλίες</div>
          <button class="btn btn-primary btn-sm" id="start-chat-btn">
            + Νέα Συνομιλία
          </button>
        </div>
      `;

      const startBtn = document.getElementById('start-chat-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => this.showNewChatModal());
      }
      return;
    }

    container.innerHTML = this.conversations.map(conv => {
      const isGroup = conv.type === CONVERSATION_TYPES.GROUP;
      const name = isGroup
        ? conv.name
        : this.getOtherParticipantName(conv, currentUserId);
      const unread = conv.unreadCount?.[currentUserId] || 0;
      const lastMessage = conv.lastMessage;
      const time = lastMessage?.timestamp ? timeAgo(lastMessage.timestamp) : '';
      const preview = lastMessage?.text || 'Δεν υπάρχουν μηνύματα';
      const isActive = conv.id === this.selectedConversationId;

      return `
        <div class="chat-list-item ${isActive ? 'active' : ''}"
             data-conversation-id="${conv.id}">
          <div class="chat-list-item-avatar">
            <div class="avatar ${isGroup ? 'bg-info' : ''}">
              ${isGroup ? '👥' : getInitials(name)}
            </div>
          </div>
          <div class="chat-list-item-content">
            <div class="chat-list-item-name ${unread > 0 ? 'font-semibold' : ''}">
              ${escapeHtml(name)}
            </div>
            <div class="chat-list-item-preview ${unread > 0 ? 'font-medium' : ''}">
              ${escapeHtml(truncate(preview, 30))}
            </div>
          </div>
          <div class="chat-list-item-meta">
            <div class="chat-list-item-time">${time}</div>
            ${unread > 0 ? `<div class="chat-list-item-unread">${unread}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('[data-conversation-id]').forEach(el => {
      el.addEventListener('click', () => {
        const convId = el.dataset.conversationId;
        this.selectConversation(convId);
      });
    });
  },

  // === EVENTS ===

  attachEvents() {
    const searchInput = document.getElementById('conv-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.filterConversations(e.target.value);
      }, 200));
    }
  },

  // === FILTERING ===

  filterConversations(query) {
    const container = document.getElementById('conv-list-items');
    if (!container) return;

    const currentUserId = AuthService.currentUser?.uid;
    const queryLower = query.toLowerCase();

    const items = container.querySelectorAll('.chat-list-item');
    items.forEach(item => {
      const convId = item.dataset.conversationId;
      const conv = this.conversations.find(c => c.id === convId);

      if (!conv) return;

      const name = conv.type === CONVERSATION_TYPES.GROUP
        ? conv.name
        : this.getOtherParticipantName(conv, currentUserId);

      const matches = !query || name.toLowerCase().includes(queryLower);
      item.style.display = matches ? '' : 'none';
    });
  },

  // === SELECTION ===

  selectConversation(conversationId) {
    this.selectedConversationId = conversationId;

    // Update UI
    document.querySelectorAll('.chat-list-item').forEach(el => {
      el.classList.toggle('active', el.dataset.conversationId === conversationId);
    });

    // Callback
    if (this.onSelectCallback) {
      const conversation = this.conversations.find(c => c.id === conversationId);
      this.onSelectCallback(conversation);
    }
  },

  // === NEW CHAT ===

  showNewChatModal() {
    // Emit event for Messages page to handle
    const event = new CustomEvent('chat:new');
    document.dispatchEvent(event);
  },

  // === HELPERS ===

  getOtherParticipantName(conversation, currentUserId) {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    return conversation.participantNames?.[otherUserId] || 'Χρήστης';
  },

  getTotalUnread() {
    const currentUserId = AuthService.currentUser?.uid;
    return this.conversations.reduce((total, conv) => {
      return total + (conv.unreadCount?.[currentUserId] || 0);
    }, 0);
  },

  // === CLEANUP ===

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
};

// Export
window.ConversationList = ConversationList;
