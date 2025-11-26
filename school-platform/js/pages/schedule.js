/* ========================================
   SCHEDULE PAGE - Διαχείριση Ωραρίου
   ======================================== */

const SchedulePage = {
  schedules: null,
  activeTab: 'long', // long or short
  editingIndex: null,

  render() {
    const isAdmin = AuthService.can('manageUsers') || isSuperAdmin(AuthService.currentUserData?.role);

    return `
      <div class="schedule-page">
        <div class="page-header">
          <h1>⏰ Ωράριο Σχολείου</h1>
          ${isAdmin ? `
            <div class="header-actions">
              <button class="btn btn-secondary" onclick="SchedulePage.resetToDefaults()">
                Επαναφορά Αρχικών
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Current Time Info -->
        <div class="schedule-current-info">
          <div id="mini-clock-widget"></div>
        </div>

        <!-- Schedule Tabs -->
        <div class="schedule-tabs">
          <button class="schedule-tab active" data-tab="long" onclick="SchedulePage.switchTab('long')">
            Δευτέρα & Πέμπτη
            <span class="tab-badge">8 περίοδοι</span>
          </button>
          <button class="schedule-tab" data-tab="short" onclick="SchedulePage.switchTab('short')">
            Τρ/Τετ/Παρ
            <span class="tab-badge">7 περίοδοι</span>
          </button>
        </div>

        <!-- Schedule Table -->
        <div class="schedule-content">
          <div id="schedule-table-container">
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
          </div>

          ${isAdmin ? `
            <!-- Add Period/Break Buttons -->
            <div class="schedule-actions">
              <button class="btn btn-primary" onclick="SchedulePage.showAddModal('period')">
                + Προσθήκη Περιόδου
              </button>
              <button class="btn btn-secondary" onclick="SchedulePage.showAddModal('break')">
                + Προσθήκη Διαλείμματος
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Special Schedule Section -->
        ${isAdmin ? `
          <div class="special-schedule-section">
            <h3>Ειδικό Ωράριο (για συγκεκριμένη ημέρα)</h3>
            <div class="special-schedule-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ημερομηνία</label>
                  <input type="date" id="special-date" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Τύπος Ωραρίου</label>
                  <select id="special-type" class="form-input">
                    <option value="long">8 Περιόδων</option>
                    <option value="short">7 Περιόδων</option>
                    <option value="none">Χωρίς Μαθήματα</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Αιτία</label>
                  <input type="text" id="special-reason" class="form-input" placeholder="π.χ. Εκδρομή, Εορτή...">
                </div>
                <div class="form-group">
                  <label class="form-label">&nbsp;</label>
                  <button class="btn btn-primary" onclick="SchedulePage.saveSpecialSchedule()">
                    Αποθήκευση
                  </button>
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Add/Edit Period Modal -->
      <div class="modal-overlay" id="add-period-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="add-modal-title">Προσθήκη</h3>
            <button class="modal-close" onclick="SchedulePage.hideAddModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="period-form">
              <input type="hidden" id="period-type">
              <input type="hidden" id="period-index">

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ώρα Έναρξης *</label>
                  <input type="time" id="period-start" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Ώρα Λήξης *</label>
                  <input type="time" id="period-end" class="form-input" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Μετά από</label>
                <select id="period-after" class="form-input">
                  <option value="-1">Στην αρχή</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="SchedulePage.hideAddModal()">Ακύρωση</button>
            <button class="btn btn-primary" onclick="SchedulePage.saveNewPeriod()">Αποθήκευση</button>
          </div>
        </div>
      </div>

      <!-- Edit Times Modal -->
      <div class="modal-overlay" id="edit-times-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Αλλαγή Ωραρίου</h3>
            <button class="modal-close" onclick="SchedulePage.hideEditModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="edit-times-form">
              <input type="hidden" id="edit-index">

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ώρα Έναρξης</label>
                  <input type="time" id="edit-start" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Ώρα Λήξης</label>
                  <input type="time" id="edit-end" class="form-input" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" onclick="SchedulePage.deletePeriod()">Διαγραφή</button>
            <button class="btn btn-primary" onclick="SchedulePage.saveEditedTimes()">Αποθήκευση</button>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    await this.loadSchedules();
    this.renderScheduleTable();

    // Start mini clock
    if (window.SchoolClock) {
      this.miniClockInterval = setInterval(() => {
        const container = document.getElementById('mini-clock-widget');
        if (container) {
          const current = SchoolClock.getCurrentPeriod();
          container.innerHTML = `
            <div class="mini-clock">
              <span class="mini-clock-time">${SchoolClock.formatTime(new Date())}</span>
              <span class="mini-clock-status">${current.label}</span>
              ${current.remainingStr ? `<span class="mini-clock-remaining">Απομένουν: ${current.remainingStr}</span>` : ''}
            </div>
          `;
        }
      }, 1000);
    }
  },

  async loadSchedules() {
    this.schedules = await ScheduleService.getSchedules();
  },

  switchTab(tab) {
    this.activeTab = tab;

    // Update tab buttons
    document.querySelectorAll('.schedule-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update badge counts
    const tabs = document.querySelectorAll('.schedule-tab');
    tabs.forEach(t => {
      const tabType = t.dataset.tab;
      const periods = this.schedules[tabType]?.periods?.filter(p => p.type === 'period').length || 0;
      const badge = t.querySelector('.tab-badge');
      if (badge) badge.textContent = `${periods} περίοδοι`;
    });

    this.renderScheduleTable();
  },

  renderScheduleTable() {
    const container = document.getElementById('schedule-table-container');
    if (!container) return;

    const schedule = this.schedules[this.activeTab];
    if (!schedule || !schedule.periods) {
      container.innerHTML = '<p class="text-muted text-center">Δεν υπάρχει ωράριο</p>';
      return;
    }

    const isAdmin = AuthService.can('manageUsers') || isSuperAdmin(AuthService.currentUserData?.role);
    const currentPeriod = window.SchoolClock ? SchoolClock.getCurrentPeriod() : null;

    container.innerHTML = `
      <table class="schedule-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Τύπος</th>
            <th>Έναρξη</th>
            <th>Λήξη</th>
            <th>Διάρκεια</th>
            ${isAdmin ? '<th style="width: 100px;">Ενέργειες</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${schedule.periods.map((period, index) => {
            const duration = ScheduleService.calculateDuration(period.start, period.end);
            const isCurrent = currentPeriod?.key === `${period.type}-${period.num}`;
            const rowClass = period.type === 'break' ? 'break-row' : '';
            const currentClass = isCurrent ? 'current' : '';

            return `
              <tr class="${rowClass} ${currentClass}" data-index="${index}">
                <td>${period.type === 'period' ? period.num : '-'}</td>
                <td class="period-cell">
                  <span class="period-type-badge ${period.type}">
                    ${period.type === 'period' ? '📚' : '☕'}
                    ${period.label}
                  </span>
                </td>
                <td class="time-cell">${period.start}</td>
                <td class="time-cell">${period.end}</td>
                <td>${duration} λεπτά</td>
                ${isAdmin ? `
                  <td>
                    <button class="btn btn-icon btn-sm" onclick="SchedulePage.showEditModal(${index})" title="Επεξεργασία">
                      ✏️
                    </button>
                  </td>
                ` : ''}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="schedule-summary">
        <p>
          <strong>Σύνολο:</strong>
          ${schedule.periods.filter(p => p.type === 'period').length} περίοδοι,
          ${schedule.periods.filter(p => p.type === 'break').length} διαλείμματα
        </p>
        <p>
          <strong>Ωράριο:</strong>
          ${schedule.periods[0]?.start} - ${schedule.periods[schedule.periods.length - 1]?.end}
        </p>
      </div>
    `;
  },

  // === ADD MODAL ===
  showAddModal(type) {
    document.getElementById('period-type').value = type;
    document.getElementById('add-modal-title').textContent =
      type === 'period' ? 'Προσθήκη Περιόδου' : 'Προσθήκη Διαλείμματος';

    // Populate "after" dropdown
    const select = document.getElementById('period-after');
    const schedule = this.schedules[this.activeTab];

    select.innerHTML = '<option value="-1">Στην αρχή</option>' +
      schedule.periods.map((p, i) => `
        <option value="${i}">${p.label}</option>
      `).join('');

    // Set default value to last item
    select.value = schedule.periods.length - 1;

    // Calculate suggested times
    const lastPeriod = schedule.periods[schedule.periods.length - 1];
    if (lastPeriod) {
      document.getElementById('period-start').value = lastPeriod.end;
      // Add 45 minutes for period, 15 for break
      const endTime = this.addMinutes(lastPeriod.end, type === 'period' ? 45 : 15);
      document.getElementById('period-end').value = endTime;
    }

    document.getElementById('add-period-modal').classList.add('show');
  },

  hideAddModal() {
    document.getElementById('add-period-modal').classList.remove('show');
  },

  async saveNewPeriod() {
    const type = document.getElementById('period-type').value;
    const start = document.getElementById('period-start').value;
    const end = document.getElementById('period-end').value;
    const afterIndex = parseInt(document.getElementById('period-after').value);

    if (!start || !end) {
      showToast('Συμπληρώστε τις ώρες', 'warning');
      return;
    }

    let newPeriods;
    if (type === 'period') {
      newPeriods = ScheduleService.addPeriod(this.activeTab, afterIndex, { start, end });
    } else {
      newPeriods = ScheduleService.addBreak(this.activeTab, afterIndex, { start, end });
    }

    // Update schedules
    this.schedules[this.activeTab].periods = newPeriods;

    const result = await ScheduleService.saveSchedules(this.schedules);

    if (result.success) {
      showToast('Προστέθηκε επιτυχώς', 'success');
      this.hideAddModal();
      this.renderScheduleTable();
      this.updateTabBadges();
    } else {
      showToast('Σφάλμα αποθήκευσης', 'error');
    }
  },

  // === EDIT MODAL ===
  showEditModal(index) {
    this.editingIndex = index;
    const period = this.schedules[this.activeTab].periods[index];

    document.getElementById('edit-index').value = index;
    document.getElementById('edit-start').value = period.start;
    document.getElementById('edit-end').value = period.end;

    document.getElementById('edit-times-modal').classList.add('show');
  },

  hideEditModal() {
    document.getElementById('edit-times-modal').classList.remove('show');
    this.editingIndex = null;
  },

  async saveEditedTimes() {
    const index = parseInt(document.getElementById('edit-index').value);
    const start = document.getElementById('edit-start').value;
    const end = document.getElementById('edit-end').value;

    if (!start || !end) {
      showToast('Συμπληρώστε τις ώρες', 'warning');
      return;
    }

    const newPeriods = ScheduleService.updateTimes(this.activeTab, index, start, end);
    this.schedules[this.activeTab].periods = newPeriods;

    const result = await ScheduleService.saveSchedules(this.schedules);

    if (result.success) {
      showToast('Ενημερώθηκε επιτυχώς', 'success');
      this.hideEditModal();
      this.renderScheduleTable();
    } else {
      showToast('Σφάλμα αποθήκευσης', 'error');
    }
  },

  async deletePeriod() {
    const index = parseInt(document.getElementById('edit-index').value);
    const period = this.schedules[this.activeTab].periods[index];

    if (!confirm(`Διαγραφή "${period.label}";`)) return;

    const newPeriods = ScheduleService.removePeriod(this.activeTab, index);
    this.schedules[this.activeTab].periods = newPeriods;

    const result = await ScheduleService.saveSchedules(this.schedules);

    if (result.success) {
      showToast('Διαγράφηκε επιτυχώς', 'success');
      this.hideEditModal();
      this.renderScheduleTable();
      this.updateTabBadges();
    } else {
      showToast('Σφάλμα διαγραφής', 'error');
    }
  },

  // === SPECIAL SCHEDULE ===
  async saveSpecialSchedule() {
    const date = document.getElementById('special-date').value;
    const type = document.getElementById('special-type').value;
    const reason = document.getElementById('special-reason').value;

    if (!date) {
      showToast('Επιλέξτε ημερομηνία', 'warning');
      return;
    }

    const result = await ScheduleService.setSpecialSchedule(date, type, reason);

    if (result.success) {
      showToast('Το ειδικό ωράριο αποθηκεύτηκε', 'success');
      document.getElementById('special-date').value = '';
      document.getElementById('special-reason').value = '';
    } else {
      showToast('Σφάλμα αποθήκευσης', 'error');
    }
  },

  // === RESET ===
  async resetToDefaults() {
    if (!confirm('Επαναφορά στο αρχικό ωράριο; Όλες οι αλλαγές θα χαθούν.')) return;

    const result = await ScheduleService.resetToDefaults();

    if (result.success) {
      showToast('Επαναφορά επιτυχής', 'success');
      await this.loadSchedules();
      this.renderScheduleTable();
      this.updateTabBadges();
    } else {
      showToast('Σφάλμα επαναφοράς', 'error');
    }
  },

  // === HELPERS ===
  addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  },

  updateTabBadges() {
    document.querySelectorAll('.schedule-tab').forEach(tab => {
      const tabType = tab.dataset.tab;
      const periods = this.schedules[tabType]?.periods?.filter(p => p.type === 'period').length || 0;
      const badge = tab.querySelector('.tab-badge');
      if (badge) badge.textContent = `${periods} περίοδοι`;
    });
  },

  destroy() {
    if (this.miniClockInterval) {
      clearInterval(this.miniClockInterval);
      this.miniClockInterval = null;
    }
  }
};

// Export
window.SchedulePage = SchedulePage;
