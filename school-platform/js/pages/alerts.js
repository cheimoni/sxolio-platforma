/* ========================================
   ALERTS PAGE - Έκτακτες Ειδοποιήσεις
   ======================================== */

const AlertsPage = {
  alerts: [],
  filter: 'active', // active, all
  unsubscribe: null,

  render() {
    const canCreate = AuthService.can('announceToAll') || isSuperAdmin(AuthService.currentUserData?.role);

    return `
      <div class="alerts-page">
        <div class="page-header">
          <h1>🚨 Έκτακτες Ειδοποιήσεις</h1>
          ${canCreate ? `
            <button class="btn btn-danger" onclick="AlertsPage.showCreateModal()">
              + Νέα Ειδοποίηση
            </button>
          ` : ''}
        </div>

        <!-- Active Urgent Alerts Banner -->
        <div id="urgent-alerts-banner"></div>

        <!-- Filters -->
        <div class="alerts-filters">
          <button class="btn btn-secondary active" data-filter="active" onclick="AlertsPage.setFilter('active')">
            Ενεργές
          </button>
          <button class="btn btn-secondary" data-filter="all" onclick="AlertsPage.setFilter('all')">
            Όλες
          </button>
        </div>

        <!-- Alerts List -->
        <div class="alerts-list" id="alerts-list">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- Create Alert Modal -->
      <div class="modal-overlay" id="create-alert-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Νέα Έκτακτη Ειδοποίηση</h3>
            <button class="modal-close" onclick="AlertsPage.hideCreateModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="alert-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Τύπος *</label>
                  <select id="alert-type" class="form-input" required>
                    <option value="emergency">🚨 Έκτακτη Ανάγκη</option>
                    <option value="weather">⛈️ Καιρός</option>
                    <option value="schedule">📅 Αλλαγή Προγράμματος</option>
                    <option value="health">🏥 Υγεία</option>
                    <option value="security">🔒 Ασφάλεια</option>
                    <option value="general">📢 Γενική</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Προτεραιότητα *</label>
                  <select id="alert-priority" class="form-input" required>
                    <option value="low">Χαμηλή</option>
                    <option value="normal" selected>Κανονική</option>
                    <option value="high">Υψηλή</option>
                    <option value="critical">Κρίσιμη</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Τίτλος *</label>
                <input type="text" id="alert-title" class="form-input" required
                       placeholder="Σύντομος τίτλος ειδοποίησης">
              </div>

              <div class="form-group">
                <label class="form-label">Μήνυμα *</label>
                <textarea id="alert-message" class="form-input" rows="4" required
                          placeholder="Αναλυτικό μήνυμα της ειδοποίησης..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Λήξη (προαιρετικό)</label>
                  <input type="datetime-local" id="alert-expires" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Για ρόλους</label>
                  <select id="alert-roles" class="form-input" multiple>
                    <option value="">Όλοι</option>
                    <option value="teacher">Εκπαιδευτικοί</option>
                    <option value="student">Μαθητές</option>
                    <option value="parent">Γονείς</option>
                    <option value="admin">Διαχειριστές</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="alert-acknowledge">
                  Απαιτείται επιβεβαίωση ανάγνωσης
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="AlertsPage.hideCreateModal()">Ακύρωση</button>
            <button class="btn btn-danger" onclick="AlertsPage.submitAlert()">Αποστολή</button>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadAlerts();
    this.subscribeToAlerts();
  },

  async loadAlerts() {
    if (this.filter === 'active') {
      this.alerts = await AlertsService.getActive();
    } else {
      this.alerts = await AlertsService.getAll();
    }
    this.renderAlerts();
  },

  subscribeToAlerts() {
    this.unsubscribe = AlertsService.subscribe((alerts) => {
      if (this.filter === 'active') {
        const userRole = AuthService.currentUserData?.role;
        this.alerts = alerts.filter(alert => {
          if (alert.targetRoles && alert.targetRoles.length > 0) {
            return alert.targetRoles.includes(userRole);
          }
          return true;
        });
      }
      this.renderAlerts();
      this.renderUrgentBanner();
    });
  },

  setFilter(filter) {
    this.filter = filter;
    document.querySelectorAll('.alerts-filters button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.loadAlerts();
  },

  renderAlerts() {
    const container = document.getElementById('alerts-list');
    if (!container) return;

    if (this.alerts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>Δεν υπάρχουν ειδοποιήσεις</h3>
          <p class="text-muted">Όλα είναι ήρεμα</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.alerts.map(alert => this.renderAlert(alert)).join('');
  },

  renderAlert(alert) {
    const typeInfo = AlertsService.getTypeInfo(alert.type);
    const priorityClass = AlertsService.getPriorityClass(alert.priority);
    const userId = AuthService.currentUser?.uid;
    const isRead = AlertsService.isRead(alert, userId);
    const isAcknowledged = AlertsService.isAcknowledged(alert, userId);
    const isOwner = alert.createdBy === userId;
    const createdAt = alert.createdAt?.toDate ? alert.createdAt.toDate() : new Date();

    return `
      <div class="alert-card ${priorityClass} ${isRead ? 'read' : 'unread'}" data-id="${alert.id}">
        <div class="alert-card-header">
          <div class="alert-type-badge" style="background: ${typeInfo.color}">
            <span class="alert-type-icon">${typeInfo.icon}</span>
            <span class="alert-type-label">${typeInfo.label}</span>
          </div>
          <div class="alert-meta">
            <span class="alert-priority badge badge-${alert.priority === 'critical' ? 'error' : alert.priority === 'high' ? 'warning' : 'gray'}">
              ${alert.priority === 'critical' ? 'ΚΡΙΣΙΜΟ' : alert.priority === 'high' ? 'ΥΨΗΛΗ' : alert.priority === 'low' ? 'ΧΑΜΗΛΗ' : 'ΚΑΝΟΝΙΚΗ'}
            </span>
            <span class="alert-time">${formatRelativeTime(createdAt)}</span>
          </div>
        </div>

        <h3 class="alert-title">${escapeHtml(alert.title)}</h3>
        <p class="alert-message">${escapeHtml(alert.message)}</p>

        <div class="alert-footer">
          <span class="alert-author">Από: ${escapeHtml(alert.creatorName)}</span>

          <div class="alert-actions">
            ${alert.requiresAcknowledge && !isAcknowledged ? `
              <button class="btn btn-sm btn-primary" onclick="AlertsPage.acknowledge('${alert.id}')">
                ✓ Το διάβασα
              </button>
            ` : isAcknowledged ? `
              <span class="badge badge-success">✓ Επιβεβαιώθηκε</span>
            ` : ''}

            ${isOwner && alert.status === 'active' ? `
              <button class="btn btn-sm btn-secondary" onclick="AlertsPage.closeAlert('${alert.id}')">
                Κλείσιμο
              </button>
            ` : ''}

            ${alert.status === 'closed' ? `
              <span class="badge badge-gray">Έκλεισε</span>
            ` : ''}
          </div>
        </div>

        ${alert.requiresAcknowledge ? `
          <div class="alert-stats">
            <small>Επιβεβαίωσαν: ${alert.acknowledgedBy?.length || 0}</small>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderUrgentBanner() {
    const banner = document.getElementById('urgent-alerts-banner');
    if (!banner) return;

    const urgentAlerts = this.alerts.filter(a =>
      a.priority === 'critical' && a.status === 'active'
    );

    if (urgentAlerts.length === 0) {
      banner.innerHTML = '';
      return;
    }

    banner.innerHTML = urgentAlerts.map(alert => `
      <div class="alert-urgent">
        <span class="alert-urgent-icon">🚨</span>
        <strong>${escapeHtml(alert.title)}</strong>: ${escapeHtml(alert.message)}
      </div>
    `).join('');
  },

  // === CREATE ALERT ===
  showCreateModal() {
    document.getElementById('alert-form')?.reset();
    document.getElementById('create-alert-modal')?.classList.add('show');
  },

  hideCreateModal() {
    document.getElementById('create-alert-modal')?.classList.remove('show');
  },

  async submitAlert() {
    const type = document.getElementById('alert-type')?.value;
    const priority = document.getElementById('alert-priority')?.value;
    const title = document.getElementById('alert-title')?.value.trim();
    const message = document.getElementById('alert-message')?.value.trim();
    const expiresStr = document.getElementById('alert-expires')?.value;
    const rolesSelect = document.getElementById('alert-roles');
    const requiresAcknowledge = document.getElementById('alert-acknowledge')?.checked;

    const targetRoles = rolesSelect ?
      Array.from(rolesSelect.selectedOptions).map(o => o.value).filter(v => v) : [];

    if (!title || !message) {
      showToast('Συμπληρώστε τίτλο και μήνυμα', 'warning');
      return;
    }

    const result = await AlertsService.create({
      type,
      priority,
      title,
      message,
      targetRoles,
      expiresAt: expiresStr ? new Date(expiresStr) : null,
      requiresAcknowledge
    });

    if (result.success) {
      showToast('Η ειδοποίηση στάλθηκε', 'success');
      this.hideCreateModal();
    } else {
      showToast('Σφάλμα αποστολής', 'error');
    }
  },

  async acknowledge(alertId) {
    const result = await AlertsService.acknowledge(alertId);
    if (result.success) {
      showToast('Επιβεβαιώθηκε', 'success');
      await AlertsService.markRead(alertId);
      this.loadAlerts();
    }
  },

  async closeAlert(alertId) {
    if (!confirm('Κλείσιμο ειδοποίησης;')) return;

    const result = await AlertsService.close(alertId);
    if (result.success) {
      showToast('Η ειδοποίηση έκλεισε', 'success');
    }
  },

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
};

// Export
window.AlertsPage = AlertsPage;
