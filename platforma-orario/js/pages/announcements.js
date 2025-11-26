/* ========================================
   ANNOUNCEMENTS PAGE - Full Implementation
   ======================================== */

const AnnouncementsPage = {
  container: null,
  announcements: [],
  filteredAnnouncements: [],
  currentFilter: 'all',
  unsubscribe: null,

  // === INITIALIZATION ===

  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  // === RENDER ===

  render() {
    if (!this.container) return;

    const canCreate = AuthService.can('announceToAll') || AuthService.can('announceToDept');

    this.container.innerHTML = `
      <div class="announcements-page">
        <!-- Header -->
        <div class="page-header">
          <h2>Ανακοινώσεις</h2>
          ${canCreate ? `
          <button class="btn btn-primary" id="new-announcement-btn">
            + Νέα Ανακοίνωση
          </button>
          ` : ''}
        </div>

        <!-- Filters -->
        <div class="announcements-filters">
          <select class="input" id="announcement-filter" style="width: auto;">
            <option value="all">Όλες</option>
            <option value="unread">Μη αναγνωσμένες</option>
            <option value="mine">Δικές μου</option>
          </select>

          <select class="input" id="announcement-priority-filter" style="width: auto;">
            <option value="all">Όλες οι προτεραιότητες</option>
            <option value="high">Υψηλή</option>
            <option value="normal">Κανονική</option>
            <option value="low">Χαμηλή</option>
          </select>
        </div>

        <!-- List -->
        <div class="announcements-list" id="announcements-list">
          <div class="text-center p-lg">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- New Announcement Modal -->
      <div class="modal-overlay" id="new-announcement-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Νέα Ανακοίνωση</h3>
            <button class="modal-close" id="close-announcement-modal">✕</button>
          </div>
          <div class="modal-body">
            <form id="announcement-form">
              <div class="input-group mb-md">
                <label class="input-label">Τίτλος *</label>
                <input
                  type="text"
                  class="input"
                  id="announcement-title"
                  placeholder="Τίτλος ανακοίνωσης"
                  maxlength="100"
                  required
                >
              </div>

              <div class="input-group mb-md">
                <label class="input-label">Περιεχόμενο *</label>
                <textarea
                  class="input textarea"
                  id="announcement-content"
                  rows="6"
                  placeholder="Γράψτε το περιεχόμενο της ανακοίνωσης..."
                  required
                ></textarea>
              </div>

              <div class="form-row">
                <div class="input-group">
                  <label class="input-label">Προς</label>
                  <select class="input" id="announcement-target">
                    <option value="all">Όλους</option>
                    <option value="teachers">Καθηγητές</option>
                    <option value="admins">Διοίκηση</option>
                  </select>
                </div>

                <div class="input-group">
                  <label class="input-label">Προτεραιότητα</label>
                  <select class="input" id="announcement-priority">
                    <option value="normal">Κανονική</option>
                    <option value="high">Υψηλή</option>
                    <option value="low">Χαμηλή</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-announcement">Ακύρωση</button>
            <button class="btn btn-primary" id="submit-announcement">Δημοσίευση</button>
          </div>
        </div>
      </div>

      <!-- View Announcement Modal -->
      <div class="modal-overlay" id="view-announcement-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="view-announcement-title"></h3>
            <button class="modal-close" id="close-view-modal">✕</button>
          </div>
          <div class="modal-body" id="view-announcement-body">
          </div>
          <div class="modal-footer" id="view-announcement-footer">
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
    this.subscribeToAnnouncements();
  },

  // === EVENTS ===

  attachEvents() {
    // New announcement button
    const newBtn = document.getElementById('new-announcement-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.showCreateModal());
    }

    // Filters
    const filter = document.getElementById('announcement-filter');
    const priorityFilter = document.getElementById('announcement-priority-filter');

    if (filter) {
      filter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.applyFilters();
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', () => this.applyFilters());
    }

    // Create Modal
    this.attachModalEvents('new-announcement-modal', 'close-announcement-modal', 'cancel-announcement');

    // View Modal
    this.attachModalEvents('view-announcement-modal', 'close-view-modal');

    // Submit button
    const submitBtn = document.getElementById('submit-announcement');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitAnnouncement());
    }
  },

  attachModalEvents(modalId, closeId, cancelId) {
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);
    const cancelBtn = cancelId ? document.getElementById(cancelId) : null;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideModal(modalId));
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideModal(modalId));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideModal(modalId);
      });
    }
  },

  // === DATA ===

  subscribeToAnnouncements() {
    const userId = AuthService.currentUser?.uid;
    const userRole = AuthService.currentUserData?.role;

    this.unsubscribe = AnnouncementsService.subscribe((announcements) => {
      // Filter based on user's access
      this.announcements = announcements.filter(ann => {
        if (ann.target === 'all') return true;
        if (ann.target === 'teachers' && userRole === ROLES.TEACHER) return true;
        if (ann.target === 'admins' && isAdmin(userRole)) return true;
        if (ann.authorId === userId) return true; // Show own announcements
        return false;
      });

      this.applyFilters();
    });
  },

  applyFilters() {
    const userId = AuthService.currentUser?.uid;
    const filter = document.getElementById('announcement-filter')?.value || 'all';
    const priorityFilter = document.getElementById('announcement-priority-filter')?.value || 'all';

    let filtered = [...this.announcements];

    // Status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(ann => !AnnouncementsService.isRead(ann, userId));
        break;
      case 'mine':
        filtered = filtered.filter(ann => ann.authorId === userId);
        break;
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ann => ann.priority === priorityFilter);
    }

    this.filteredAnnouncements = filtered;
    this.renderAnnouncements();
  },

  renderAnnouncements() {
    const container = document.getElementById('announcements-list');
    if (!container) return;

    const userId = AuthService.currentUser?.uid;
    const isAdmin = AuthService.currentUserData?.role === 'admin';

    if (this.filteredAnnouncements.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📢</div>
          <h3>Δεν υπάρχουν ανακοινώσεις</h3>
          <p class="text-muted">Οι νέες ανακοινώσεις θα εμφανιστούν εδώ</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredAnnouncements.map(ann => {
      const isRead = AnnouncementsService.isRead(ann, userId);
      const isOwn = ann.authorId === userId;
      const priorityClass = ann.priority === 'high' ? 'priority-high' : '';
      const timeAgoStr = ann.createdAt ? timeAgo(ann.createdAt) : '';

      return `
        <div class="announcement-card ${!isRead ? 'unread' : ''} ${priorityClass}"
             data-id="${ann.id}">
          <div class="announcement-header">
            <div class="announcement-title-row">
              ${ann.priority === 'high' ? '<span class="priority-badge">❗</span>' : ''}
              <h3 class="announcement-title">${escapeHtml(ann.title)}</h3>
              ${!isRead ? '<span class="unread-dot"></span>' : ''}
            </div>
            <span class="announcement-time">${timeAgoStr}</span>
          </div>

          <div class="announcement-content">
            ${escapeHtml(truncate(ann.content, 150))}
          </div>

          <div class="announcement-footer">
            <div class="announcement-meta">
              <span class="announcement-author">
                👤 ${escapeHtml(ann.authorName)}
              </span>
              <span class="badge badge-${this.getTargetBadgeClass(ann.target)}">
                ${AnnouncementsService.getTargetLabel(ann.target)}
              </span>
            </div>
            <div class="announcement-actions">
              <button class="btn btn-sm btn-secondary view-btn" data-id="${ann.id}">
                Προβολή
              </button>
              ${(isOwn || isAdmin) ? `
                <button class="btn btn-sm btn-danger delete-btn" data-id="${ann.id}">
                  Διαγραφή
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach event handlers
    container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewAnnouncement(btn.dataset.id);
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteAnnouncement(btn.dataset.id);
      });
    });

    // Click on card to view
    container.querySelectorAll('.announcement-card').forEach(card => {
      card.addEventListener('click', () => {
        this.viewAnnouncement(card.dataset.id);
      });
    });
  },

  getTargetBadgeClass(target) {
    const classes = {
      all: 'gray',
      teachers: 'primary',
      admins: 'warning'
    };
    return classes[target] || 'gray';
  },

  // === VIEW ANNOUNCEMENT ===

  async viewAnnouncement(announcementId) {
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) return;

    const userId = AuthService.currentUser?.uid;
    const isOwn = announcement.authorId === userId;
    const canDelete = isOwn || AuthService.currentUserData?.role === 'admin';
    const dateStr = announcement.createdAt ? formatDate(announcement.createdAt, 'full') : '';

    // Mark as read
    if (!AnnouncementsService.isRead(announcement, userId)) {
      await AnnouncementsService.markAsRead(announcementId, userId);
    }

    // Update modal content
    document.getElementById('view-announcement-title').textContent = announcement.title;

    document.getElementById('view-announcement-body').innerHTML = `
      <div class="announcement-view">
        <div class="announcement-view-meta mb-md">
          <span class="text-muted">📅 ${dateStr}</span>
          <span class="text-muted">👤 ${escapeHtml(announcement.authorName)}</span>
          <span class="badge badge-${this.getTargetBadgeClass(announcement.target)}">
            ${AnnouncementsService.getTargetLabel(announcement.target)}
          </span>
          ${announcement.priority === 'high' ?
            '<span class="badge badge-error">Υψηλή προτεραιότητα</span>' : ''}
        </div>
        <div class="announcement-view-content">
          ${escapeHtml(announcement.content).replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    document.getElementById('view-announcement-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="AnnouncementsPage.hideModal('view-announcement-modal')">
        Κλείσιμο
      </button>
      ${canDelete ? `
        <button class="btn btn-danger" onclick="AnnouncementsPage.deleteAnnouncement('${announcementId}'); AnnouncementsPage.hideModal('view-announcement-modal');">
          Διαγραφή
        </button>
      ` : ''}
    `;

    this.showModal('view-announcement-modal');
  },

  // === CREATE ANNOUNCEMENT ===

  showCreateModal() {
    document.getElementById('announcement-form')?.reset();
    this.showModal('new-announcement-modal');
  },

  async submitAnnouncement() {
    const title = document.getElementById('announcement-title')?.value.trim();
    const content = document.getElementById('announcement-content')?.value.trim();
    const target = document.getElementById('announcement-target')?.value;
    const priority = document.getElementById('announcement-priority')?.value;
    const submitBtn = document.getElementById('submit-announcement');

    // Validation
    if (!title || title.length < 3) {
      showToast('Ο τίτλος πρέπει να έχει τουλάχιστον 3 χαρακτήρες', 'warning');
      return;
    }

    if (!content || content.length < 10) {
      showToast('Το περιεχόμενο πρέπει να έχει τουλάχιστον 10 χαρακτήρες', 'warning');
      return;
    }

    // Loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>';

    const result = await AnnouncementsService.create({
      title,
      content,
      target,
      priority
    });

    if (result.success) {
      showToast('Η ανακοίνωση δημοσιεύτηκε', 'success');
      this.hideModal('new-announcement-modal');
    } else {
      showToast('Σφάλμα δημοσίευσης', 'error');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Δημοσίευση';
  },

  // === DELETE ANNOUNCEMENT ===

  async deleteAnnouncement(announcementId) {
    if (!confirm('Σίγουρα θέλετε να διαγράψετε αυτή την ανακοίνωση;')) {
      return;
    }

    const result = await AnnouncementsService.delete(announcementId);

    if (result.success) {
      showToast('Η ανακοίνωση διαγράφηκε', 'success');
    } else {
      showToast('Σφάλμα διαγραφής', 'error');
    }
  },

  // === MODAL HELPERS ===

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
  },

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
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
window.AnnouncementsPage = AnnouncementsPage;
