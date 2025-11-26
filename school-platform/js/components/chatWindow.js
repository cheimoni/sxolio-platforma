/* ========================================
   CHAT WINDOW COMPONENT
   ======================================== */

const ChatWindow = {
  container: null,
  currentConversation: null,
  messagesUnsubscribe: null,
  typingUnsubscribe: null,
  statusUnsubscribe: null,
  typingTimeout: null,
  pendingFile: null,
  showingEmojiPicker: false,
  showingStickerPicker: false,

  // Emoji categories
  emojis: {
    'Φατσούλες': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Χέρια': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'],
    'Καρδιές': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    'Σύμβολα': ['✅', '❌', '⭐', '🌟', '💫', '✨', '🔥', '💯', '👀', '💬', '💭', '🗯️', '❗', '❓', '‼️', '⁉️', '💢', '💥', '💦', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '📌', '📍', '🔔', '🔕'],
    'Φύση': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌱', '🌲', '🌳', '🌴', '🌵', '🍀', '🍁', '🍂', '🍃', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌈', '🌙', '⭐', '🌊']
  },

  // Stickers (καρτούλες)
  stickers: [
    { id: 'thank-you', emoji: '🙏', label: 'Ευχαριστώ!' },
    { id: 'great-job', emoji: '👏', label: 'Μπράβο!' },
    { id: 'love-it', emoji: '❤️', label: 'Τέλειο!' },
    { id: 'ok', emoji: '👍', label: 'ΟΚ!' },
    { id: 'no', emoji: '👎', label: 'Όχι' },
    { id: 'thinking', emoji: '🤔', label: 'Σκέφτομαι...' },
    { id: 'celebrate', emoji: '🎉', label: 'Γιορτή!' },
    { id: 'fire', emoji: '🔥', label: 'Φωτιά!' },
    { id: 'coffee', emoji: '☕', label: 'Καφεδάκι;' },
    { id: 'hello', emoji: '👋', label: 'Γεια!' },
    { id: 'bye', emoji: '✌️', label: 'Τα λέμε!' },
    { id: 'laugh', emoji: '😂', label: 'Χαχα!' },
    { id: 'love', emoji: '🥰', label: 'Αγάπη!' },
    { id: 'star', emoji: '⭐', label: 'Αστέρι!' },
    { id: 'trophy', emoji: '🏆', label: 'Νικητής!' },
    { id: 'question', emoji: '❓', label: 'Ερώτηση;' },
    { id: 'idea', emoji: '💡', label: 'Ιδέα!' },
    { id: 'music', emoji: '🎵', label: 'Μουσική!' },
    { id: 'book', emoji: '📚', label: 'Διάβασμα!' },
    { id: 'clock', emoji: '⏰', label: 'Ώρα!' }
  ],

  // === INITIALIZATION ===

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  // === RENDER ===

  render(conversation) {
    if (!this.container) return;

    this.currentConversation = conversation;

    if (!conversation) {
      this.renderEmpty();
      return;
    }

    const currentUserId = AuthService.currentUser?.uid;
    const isGroup = conversation.type === CONVERSATION_TYPES.GROUP;
    const name = isGroup ? conversation.name : this.getOtherParticipantName(conversation, currentUserId);

    const otherUserId = !isGroup ? conversation.participants.find(id => id !== currentUserId) : null;

    this.container.innerHTML = `
      <div class="chat-window">
        <!-- Header -->
        <div class="chat-window-header">
          <div class="avatar-container">
            <div class="avatar">
              ${isGroup ? '👥' : getInitials(name)}
            </div>
            ${!isGroup ? '<span class="online-indicator" id="online-indicator"></span>' : ''}
          </div>
          <div class="chat-window-info">
            <div class="chat-window-name">${escapeHtml(name)}</div>
            <div class="chat-window-status" id="chat-status">
              ${isGroup ? `${conversation.participants.length} μέλη` : 'Φόρτωση...'}
            </div>
          </div>
          <div class="chat-window-actions">
            ${!isGroup ? `
            <button class="btn btn-icon btn-primary call-btn" id="voice-call-btn" title="Φωνητική κλήση" data-user-id="${otherUserId}" data-user-name="${escapeHtml(name)}">
              📞
            </button>
            <button class="btn btn-icon video-call-btn" id="video-call-btn" title="Βιντεοκλήση" data-user-id="${otherUserId}" data-user-name="${escapeHtml(name)}">
              📹
            </button>
            ` : ''}
            <button class="btn btn-icon btn-secondary" title="Πληροφορίες">
              ℹ️
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-messages" id="chat-messages">
          <div class="spinner"></div>
        </div>

        <!-- Typing indicator -->
        <div class="typing-indicator hidden" id="typing-indicator">
          <span class="typing-dots"><span></span><span></span><span></span></span>
          <span class="typing-text"></span>
        </div>

        <!-- File preview -->
        <div class="file-preview hidden" id="file-preview">
          <div class="file-preview-content">
            <span class="file-preview-icon">📎</span>
            <span class="file-preview-name"></span>
            <button class="file-preview-remove" onclick="ChatWindow.removeFile()">×</button>
          </div>
        </div>

        <!-- Input -->
        <div class="chat-input-container">
          <!-- Emoji Picker -->
          <div class="emoji-picker hidden" id="emoji-picker">
            <div class="emoji-picker-header">
              <div class="emoji-tabs" id="emoji-tabs"></div>
            </div>
            <div class="emoji-picker-content" id="emoji-content"></div>
          </div>

          <!-- Sticker Picker -->
          <div class="sticker-picker hidden" id="sticker-picker">
            <div class="sticker-picker-header">Καρτούλες</div>
            <div class="sticker-picker-content" id="sticker-content"></div>
          </div>
          <div class="chat-input-wrapper">
            <input type="file" id="file-input" class="hidden" onchange="ChatWindow.handleFileSelect(event)">
            <button class="btn btn-icon btn-secondary" id="attach-btn" title="Επισύναψη">
              📎
            </button>
            <button class="btn btn-icon btn-secondary" id="emoji-btn" title="Φατσούλες">
              😊
            </button>
            <button class="btn btn-icon btn-secondary" id="sticker-btn" title="Καρτούλες">
              🎴
            </button>
            <textarea
              class="chat-input"
              id="message-input"
              placeholder="Γράψε μήνυμα..."
              rows="1"
            ></textarea>
            <button class="chat-send-btn" id="send-btn" title="Αποστολή" disabled>
              ➤
            </button>
          </div>
        </div>
      </div>
    `;

    // Subscribe to online status for private chats
    if (!isGroup && otherUserId) {
      this.subscribeToOnlineStatus(otherUserId);
    }

    // Subscribe to typing indicators
    this.subscribeToTyping();

    this.attachEvents();
    this.loadMessages();
  },

  renderEmpty() {
    this.container.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-text">
          Επίλεξε μια συνομιλία για να ξεκινήσεις
        </div>
      </div>
    `;
  },

  // === EVENTS ===

  attachEvents() {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const attachBtn = document.getElementById('attach-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const stickerBtn = document.getElementById('sticker-btn');
    const callBtn = document.getElementById('voice-call-btn');

    // Voice call button
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        const userId = callBtn.dataset.userId;
        const userName = callBtn.dataset.userName;
        if (userId && userName && window.VoiceCallUI) {
          VoiceCallUI.startCall(userId, userName, false);
        }
      });
    }

    // Video call button
    const videoCallBtn = document.getElementById('video-call-btn');
    if (videoCallBtn) {
      videoCallBtn.addEventListener('click', () => {
        const userId = videoCallBtn.dataset.userId;
        const userName = videoCallBtn.dataset.userName;
        if (userId && userName && window.VoiceCallUI) {
          VoiceCallUI.startVideoCall(userId, userName);
        }
      });
    }

    if (input) {
      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';

        // Enable/disable send button
        sendBtn.disabled = !input.value.trim() && !this.pendingFile;

        // Send typing indicator
        this.sendTypingIndicator();
      });

      // Send on Enter (but Shift+Enter for new line)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Close pickers on input focus
      input.addEventListener('focus', () => {
        this.hideEmojiPicker();
        this.hideStickerPicker();
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (attachBtn) {
      attachBtn.addEventListener('click', () => {
        document.getElementById('file-input')?.click();
      });
    }

    if (emojiBtn) {
      emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
    }

    if (stickerBtn) {
      stickerBtn.addEventListener('click', () => this.toggleStickerPicker());
    }

    // Close pickers when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#emoji-picker') && !e.target.closest('#emoji-btn')) {
        this.hideEmojiPicker();
      }
      if (!e.target.closest('#sticker-picker') && !e.target.closest('#sticker-btn')) {
        this.hideStickerPicker();
      }
    });
  },

  // === ONLINE STATUS ===

  subscribeToOnlineStatus(userId) {
    if (this.statusUnsubscribe) {
      this.statusUnsubscribe();
    }

    if (typeof NotificationsService !== 'undefined') {
      this.statusUnsubscribe = NotificationsService.subscribeToUserStatus(userId, (status) => {
        this.updateOnlineStatus(status);
      });
    }
  },

  updateOnlineStatus(status) {
    const indicator = document.getElementById('online-indicator');
    const statusText = document.getElementById('chat-status');

    if (indicator) {
      indicator.classList.toggle('online', status.isOnline);
    }

    if (statusText) {
      if (status.isOnline) {
        statusText.textContent = 'Online';
        statusText.classList.add('online');
      } else if (status.lastSeen) {
        const lastSeen = status.lastSeen?.toDate ? status.lastSeen.toDate() : new Date(status.lastSeen);
        statusText.textContent = `Τελευταία: ${timeAgo(lastSeen)}`;
        statusText.classList.remove('online');
      } else {
        statusText.textContent = 'Offline';
        statusText.classList.remove('online');
      }
    }
  },

  // === TYPING INDICATORS ===

  subscribeToTyping() {
    if (this.typingUnsubscribe) {
      this.typingUnsubscribe();
    }

    if (!this.currentConversation || typeof NotificationsService === 'undefined') return;

    this.typingUnsubscribe = NotificationsService.subscribeToTyping(
      this.currentConversation.id,
      (typingUsers) => this.showTypingIndicator(typingUsers)
    );
  },

  sendTypingIndicator() {
    if (!this.currentConversation || typeof NotificationsService === 'undefined') return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing = true
    NotificationsService.setTyping(this.currentConversation.id, true);

    // Clear after 3 seconds of no typing
    this.typingTimeout = setTimeout(() => {
      NotificationsService.setTyping(this.currentConversation.id, false);
    }, 3000);
  },

  showTypingIndicator(typingUsers) {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;

    if (typingUsers.length === 0) {
      indicator.classList.add('hidden');
    } else {
      indicator.classList.remove('hidden');
      const text = indicator.querySelector('.typing-text');
      if (text) {
        if (typingUsers.length === 1) {
          text.textContent = `${typingUsers[0]} γράφει...`;
        } else {
          text.textContent = `${typingUsers.length} άτομα γράφουν...`;
        }
      }
    }
  },

  // === MESSAGES ===

  async loadMessages() {
    if (!this.currentConversation) return;

    // Unsubscribe from previous
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
    }

    // Subscribe to messages
    this.messagesUnsubscribe = ChatService.subscribeToMessages(
      this.currentConversation.id,
      (messages) => this.renderMessages(messages)
    );

    // Mark as read
    const currentUserId = AuthService.currentUser?.uid;
    if (currentUserId) {
      await ChatService.markAsRead(this.currentConversation.id, currentUserId);
    }
  },

  renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const currentUserId = AuthService.currentUser?.uid;

    if (!messages || messages.length === 0) {
      container.innerHTML = `
        <div class="chat-empty">
          <div class="chat-empty-text">
            Δεν υπάρχουν μηνύματα. Ξεκίνα τη συνομιλία!
          </div>
        </div>
      `;
      return;
    }

    // Group messages by date
    let lastDate = null;
    let html = '';

    messages.forEach(msg => {
      const msgDate = msg.createdAt?.toDate?.() || new Date();
      const dateStr = msgDate.toDateString();

      // Date separator
      if (dateStr !== lastDate) {
        html += `
          <div class="chat-date-separator">
            <span>${this.formatMessageDate(msgDate)}</span>
          </div>
        `;
        lastDate = dateStr;
      }

      // Message
      const isMine = msg.senderId === currentUserId;
      html += this.renderMessage(msg, isMine);
    });

    container.innerHTML = html;

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  },

  renderMessage(message, isMine) {
    const time = message.createdAt?.toDate?.()
      ? formatDate(message.createdAt, 'time')
      : '';

    return `
      <div class="message ${isMine ? 'message-mine' : 'message-other'}">
        ${!isMine ? `<div class="avatar avatar-sm">${getInitials(message.senderName)}</div>` : ''}
        <div class="message-content">
          ${!isMine ? `<div class="message-sender">${escapeHtml(message.senderName)}</div>` : ''}
          <div class="message-text">${escapeHtml(message.text)}</div>
          ${message.attachments?.length ? this.renderAttachments(message.attachments) : ''}
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;
  },

  renderAttachments(attachments) {
    return `
      <div class="message-attachments">
        ${attachments.map(att => {
          const icon = ChatService.getFileIcon(att.type);
          const size = ChatService.formatFileSize(att.size);
          const isImage = att.type?.startsWith('image/');

          if (isImage) {
            return `
              <a href="${att.url}" target="_blank" class="message-attachment-image">
                <img src="${att.url}" alt="${escapeHtml(att.name)}" loading="lazy">
              </a>
            `;
          }

          return `
            <a href="${att.url}" target="_blank" class="message-attachment">
              <span class="attachment-icon">${icon}</span>
              <span class="attachment-info">
                <span class="attachment-name">${escapeHtml(att.name)}</span>
                <span class="attachment-size">${size}</span>
              </span>
            </a>
          `;
        }).join('')}
      </div>
    `;
  },

  formatMessageDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Σήμερα';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Χθες';
    } else {
      return formatDate(date, 'long');
    }
  },

  // === SEND MESSAGE ===

  async sendMessage() {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    if (!input || !this.currentConversation) return;

    const text = input.value.trim();
    const hasFile = !!this.pendingFile;

    if (!text && !hasFile) return;

    // Disable while sending
    input.disabled = true;
    sendBtn.disabled = true;

    // Clear typing indicator
    if (typeof NotificationsService !== 'undefined') {
      NotificationsService.setTyping(this.currentConversation.id, false);
    }

    const currentUserId = AuthService.currentUser?.uid;
    let result;

    if (hasFile) {
      // Send with file
      result = await ChatService.sendMessageWithFile(
        this.currentConversation.id,
        currentUserId,
        text,
        this.pendingFile
      );
      this.removeFile();
    } else {
      // Send text only
      result = await ChatService.sendMessage(
        this.currentConversation.id,
        currentUserId,
        text
      );
    }

    // Re-enable
    input.disabled = false;
    input.value = '';
    input.style.height = 'auto';
    input.focus();

    if (!result.success) {
      showToast('Σφάλμα αποστολής', 'error');
    }
  },

  // === FILE ATTACHMENTS ===

  handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Το αρχείο είναι πολύ μεγάλο (max 10MB)', 'error');
      return;
    }

    this.pendingFile = file;
    this.showFilePreview(file);

    // Enable send button
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.disabled = false;
  },

  showFilePreview(file) {
    const preview = document.getElementById('file-preview');
    if (!preview) return;

    const icon = ChatService.getFileIcon(file.type);
    const nameSpan = preview.querySelector('.file-preview-name');
    const iconSpan = preview.querySelector('.file-preview-icon');

    if (nameSpan) nameSpan.textContent = `${file.name} (${ChatService.formatFileSize(file.size)})`;
    if (iconSpan) iconSpan.textContent = icon;

    preview.classList.remove('hidden');
  },

  removeFile() {
    this.pendingFile = null;
    const preview = document.getElementById('file-preview');
    if (preview) preview.classList.add('hidden');

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';

    // Update send button state
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn && input) sendBtn.disabled = !input.value.trim();
  },

  // === EMOJI PICKER ===

  toggleEmojiPicker() {
    if (this.showingEmojiPicker) {
      this.hideEmojiPicker();
    } else {
      this.hideStickerPicker();
      this.showEmojiPicker();
    }
  },

  showEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (!picker) return;

    this.showingEmojiPicker = true;
    picker.classList.remove('hidden');
    this.renderEmojiPicker();
  },

  hideEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    if (picker) picker.classList.add('hidden');
    this.showingEmojiPicker = false;
  },

  renderEmojiPicker() {
    const tabsContainer = document.getElementById('emoji-tabs');
    const contentContainer = document.getElementById('emoji-content');
    if (!tabsContainer || !contentContainer) return;

    const categories = Object.keys(this.emojis);

    // Render tabs
    tabsContainer.innerHTML = categories.map((cat, i) => `
      <button class="emoji-tab ${i === 0 ? 'active' : ''}" data-category="${cat}">
        ${this.emojis[cat][0]}
      </button>
    `).join('');

    // Tab click handlers
    tabsContainer.querySelectorAll('.emoji-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderEmojiCategory(tab.dataset.category);
      });
    });

    // Render first category
    this.renderEmojiCategory(categories[0]);
  },

  renderEmojiCategory(category) {
    const contentContainer = document.getElementById('emoji-content');
    if (!contentContainer) return;

    const emojis = this.emojis[category] || [];
    contentContainer.innerHTML = `
      <div class="emoji-grid">
        ${emojis.map(emoji => `
          <button class="emoji-item" data-emoji="${emoji}">${emoji}</button>
        `).join('')}
      </div>
    `;

    // Emoji click handlers
    contentContainer.querySelectorAll('.emoji-item').forEach(item => {
      item.addEventListener('click', () => {
        this.insertEmoji(item.dataset.emoji);
      });
    });
  },

  insertEmoji(emoji) {
    const input = document.getElementById('message-input');
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();

    // Trigger input event to update send button
    input.dispatchEvent(new Event('input'));
  },

  // === STICKER PICKER ===

  toggleStickerPicker() {
    if (this.showingStickerPicker) {
      this.hideStickerPicker();
    } else {
      this.hideEmojiPicker();
      this.showStickerPicker();
    }
  },

  showStickerPicker() {
    const picker = document.getElementById('sticker-picker');
    if (!picker) return;

    this.showingStickerPicker = true;
    picker.classList.remove('hidden');
    this.renderStickerPicker();
  },

  hideStickerPicker() {
    const picker = document.getElementById('sticker-picker');
    if (picker) picker.classList.add('hidden');
    this.showingStickerPicker = false;
  },

  renderStickerPicker() {
    const contentContainer = document.getElementById('sticker-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
      <div class="sticker-grid">
        ${this.stickers.map(sticker => `
          <button class="sticker-item" data-sticker-id="${sticker.id}" data-emoji="${sticker.emoji}" data-label="${sticker.label}">
            <span class="sticker-emoji">${sticker.emoji}</span>
            <span class="sticker-label">${sticker.label}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Sticker click handlers
    contentContainer.querySelectorAll('.sticker-item').forEach(item => {
      item.addEventListener('click', () => {
        this.sendSticker(item.dataset.emoji, item.dataset.label);
      });
    });
  },

  async sendSticker(emoji, label) {
    if (!this.currentConversation) return;

    this.hideStickerPicker();

    const currentUserId = AuthService.currentUser?.uid;
    const stickerText = `${emoji} ${label}`;

    const result = await ChatService.sendMessage(
      this.currentConversation.id,
      currentUserId,
      stickerText
    );

    if (!result.success) {
      showToast('Σφάλμα αποστολής', 'error');
    }
  },

  // === HELPERS ===

  getOtherParticipantName(conversation, currentUserId) {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    return conversation.participantNames?.[otherUserId] || 'Χρήστης';
  },

  // === CLEANUP ===

  destroy() {
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
      this.messagesUnsubscribe = null;
    }
    if (this.typingUnsubscribe) {
      this.typingUnsubscribe();
      this.typingUnsubscribe = null;
    }
    if (this.statusUnsubscribe) {
      this.statusUnsubscribe();
      this.statusUnsubscribe = null;
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    // Clear typing when leaving
    if (this.currentConversation && typeof NotificationsService !== 'undefined') {
      NotificationsService.setTyping(this.currentConversation.id, false);
    }

    this.currentConversation = null;
    this.pendingFile = null;
  }
};

// Export
window.ChatWindow = ChatWindow;
