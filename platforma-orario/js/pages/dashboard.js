/* ========================================
   DASHBOARD PAGE
   ======================================== */

const DashboardPage = {
  container: null,

  // === INITIALIZATION ===

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  // === RENDER ===

  render() {
    if (!this.container) return;

    const user = AuthService.currentUserData;

    this.container.innerHTML = `
      <div class="dashboard">
        <!-- School Clock Widget -->
        <div class="dashboard-clock-section">
          <div class="clock-widget" id="school-clock-widget">
            <!-- Clock will be rendered here -->
          </div>
        </div>

        <!-- Welcome Section -->
        <div class="dashboard-welcome">
          <h2>Καλημέρα, ${escapeHtml(user?.displayName?.split(' ')[0] || 'Χρήστη')}!</h2>
          <p class="text-muted">${this.getGreetingMessage()}</p>
        </div>

        <!-- Stats Cards -->
        <div class="dashboard-stats">
          <div class="stat-card" data-action="messages">
            <div class="stat-icon">💬</div>
            <div class="stat-info">
              <div class="stat-value" id="stat-messages">-</div>
              <div class="stat-label">Νέα Μηνύματα</div>
            </div>
          </div>

          <div class="stat-card" data-action="announcements">
            <div class="stat-icon">📢</div>
            <div class="stat-info">
              <div class="stat-value" id="stat-announcements">-</div>
              <div class="stat-label">Ανακοινώσεις</div>
            </div>
          </div>

          <div class="stat-card" data-action="calendar">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <div class="stat-value" id="stat-events">-</div>
              <div class="stat-label">Επόμενα Events</div>
            </div>
          </div>

          <div class="stat-card" data-action="files">
            <div class="stat-icon">📁</div>
            <div class="stat-info">
              <div class="stat-value" id="stat-files">-</div>
              <div class="stat-label">Νέα Αρχεία</div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="dashboard-grid">
          <!-- Recent Messages -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Πρόσφατα Μηνύματα</h3>
              <a href="#messages" class="text-primary">Δες όλα →</a>
            </div>
            <div class="card-body" id="recent-messages">
              <div class="text-center p-md">
                <div class="spinner"></div>
              </div>
            </div>
          </div>

          <!-- Upcoming Events -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Επόμενα Events</h3>
              <a href="#calendar" class="text-primary">Δες όλα →</a>
            </div>
            <div class="card-body" id="upcoming-events">
              <div class="text-center p-md">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="dashboard-actions">
          <h3>Γρήγορες Ενέργειες</h3>
          <div class="action-buttons">
            <button class="btn btn-primary" data-action="new-message">
              ✉️ Νέο Μήνυμα
            </button>
            ${AuthService.can('announceToAll') ? `
            <button class="btn btn-secondary" data-action="new-announcement">
              📢 Νέα Ανακοίνωση
            </button>
            ` : ''}
            <button class="btn btn-secondary" data-action="upload-file">
              📁 Ανέβασμα Αρχείου
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
    this.loadData();
  },

  // === EVENTS ===

  attachEvents() {
    // Stat cards click
    this.container.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        this.handleAction(action);
      });
    });

    // Links
    this.container.querySelectorAll('a[href^="#"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.getAttribute('href').substring(1);
        App.navigateTo(page);
      });
    });
  },

  handleAction(action) {
    switch (action) {
      case 'messages':
      case 'new-message':
        App.navigateTo('messages');
        break;
      case 'announcements':
      case 'new-announcement':
        App.navigateTo('announcements');
        break;
      case 'calendar':
        App.navigateTo('calendar');
        break;
      case 'files':
      case 'upload-file':
        App.navigateTo('files');
        break;
    }
  },

  // === DATA LOADING ===

  async loadData() {
    // Start the school clock
    if (window.SchoolClock) {
      SchoolClock.start('school-clock-widget');
    }

    await Promise.all([
      this.loadMessageStats(),
      this.loadRecentMessages(),
      this.loadAnnouncementStats(),
      this.loadUpcomingEvents(),
      this.loadFileStats()
    ]);
  },

  // Cleanup when leaving dashboard
  destroy() {
    if (window.SchoolClock) {
      SchoolClock.stop();
    }
  },

  async loadMessageStats() {
    const currentUserId = AuthService.currentUser?.uid;
    if (!currentUserId) return;

    const result = await ChatService.getConversations(currentUserId);

    if (result.success) {
      const totalUnread = result.data.reduce((total, conv) => {
        return total + (conv.unreadCount?.[currentUserId] || 0);
      }, 0);

      const statEl = document.getElementById('stat-messages');
      if (statEl) statEl.textContent = totalUnread;
    }
  },

  async loadRecentMessages() {
    const container = document.getElementById('recent-messages');
    if (!container) return;

    const currentUserId = AuthService.currentUser?.uid;
    const result = await ChatService.getConversations(currentUserId);

    if (!result.success || result.data.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted p-md">
          Δεν υπάρχουν μηνύματα
        </div>
      `;
      return;
    }

    const recent = result.data.slice(0, 4);

    container.innerHTML = recent.map(conv => {
      const isGroup = conv.type === CONVERSATION_TYPES.GROUP;
      const name = isGroup
        ? conv.name
        : this.getOtherParticipantName(conv, currentUserId);
      const preview = conv.lastMessage?.text || 'Δεν υπάρχουν μηνύματα';
      const time = conv.lastMessage?.timestamp ? timeAgo(conv.lastMessage.timestamp) : '';
      const unread = conv.unreadCount?.[currentUserId] || 0;

      return `
        <div class="recent-message-item" data-conversation-id="${conv.id}">
          <div class="avatar avatar-sm">
            ${isGroup ? '👥' : getInitials(name)}
          </div>
          <div class="recent-message-content">
            <div class="recent-message-name ${unread > 0 ? 'font-semibold' : ''}">
              ${escapeHtml(name)}
            </div>
            <div class="recent-message-preview">
              ${escapeHtml(truncate(preview, 40))}
            </div>
          </div>
          <div class="recent-message-meta">
            <span class="text-muted text-xs">${time}</span>
            ${unread > 0 ? `<span class="badge badge-primary">${unread}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Click handlers
    container.querySelectorAll('[data-conversation-id]').forEach(el => {
      el.addEventListener('click', () => {
        const convId = el.dataset.conversationId;
        App.navigateTo('messages', { conversationId: convId });
      });
    });
  },

  async loadAnnouncementStats() {
    const result = await AnnouncementsService.getAll();
    const statEl = document.getElementById('stat-announcements');

    if (result.success && statEl) {
      // Count unread announcements (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recent = result.data.filter(a => {
        const created = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        return created >= weekAgo;
      });

      statEl.textContent = recent.length;
    }
  },

  async loadFileStats() {
    const result = await FilesService.getAll();
    const statEl = document.getElementById('stat-files');

    if (result.success && statEl) {
      // Count files from last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recent = result.data.filter(f => {
        const created = f.createdAt?.toDate ? f.createdAt.toDate() : new Date(f.createdAt);
        return created >= weekAgo;
      });

      statEl.textContent = recent.length;
    }
  },

  async loadUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    if (!container) return;

    const result = await CalendarService.getUpcoming(5);
    const statEl = document.getElementById('stat-events');

    if (!result.success || result.data.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted p-md">
          Δεν υπάρχουν επερχόμενα events
        </div>
      `;
      if (statEl) statEl.textContent = '0';
      return;
    }

    if (statEl) statEl.textContent = result.data.length;

    container.innerHTML = result.data.map(event => {
      const icon = CalendarService.getTypeIcon(event.type);
      const dateStr = CalendarService.formatEventDate(event.startDate, event.endDate, event.allDay);
      const color = event.color || CalendarService.getTypeColor(event.type);

      return `
        <div class="upcoming-event-item">
          <div class="event-icon" style="background-color: ${color}">${icon}</div>
          <div class="event-info">
            <div class="event-title">${escapeHtml(event.title)}</div>
            <div class="event-date text-muted">${dateStr}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  // === HELPERS ===

  getGreetingMessage() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Καλή αρχή στη μέρα σας!';
    if (hour < 17) return 'Καλό απόγευμα!';
    return 'Καλό βράδυ!';
  },

  getOtherParticipantName(conversation, currentUserId) {
    const otherUserId = conversation.participants.find(id => id !== currentUserId);
    return conversation.participantNames?.[otherUserId] || 'Χρήστης';
  }
};

// Export
window.DashboardPage = DashboardPage;
