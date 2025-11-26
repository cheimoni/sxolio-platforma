/* ========================================
   DUTIES PAGE - Πρόγραμμα Εφημεριών
   ======================================== */

const DutiesPage = {
  currentWeekStart: null,
  duties: [],
  teachers: [],
  unsubscribe: null,

  render() {
    const canManage = AuthService.can('manageCalendar') || isSuperAdmin(AuthService.currentUserData?.role);

    return `
      <div class="duties-page">
        <div class="page-header">
          <h1>Εφημερίες</h1>
          ${canManage ? `
            <button class="btn btn-primary" onclick="DutiesPage.showAssignModal()">
              + Ανάθεση Εφημερίας
            </button>
          ` : ''}
        </div>

        <!-- Week Navigation -->
        <div class="duties-nav">
          <button class="btn btn-secondary" onclick="DutiesPage.prevWeek()">◀ Προηγούμενη</button>
          <h2 id="duties-week-title"></h2>
          <button class="btn btn-secondary" onclick="DutiesPage.nextWeek()">Επόμενη ▶</button>
          <button class="btn btn-secondary" onclick="DutiesPage.goToCurrentWeek()">Τρέχουσα</button>
        </div>

        <!-- View Toggle -->
        <div class="duties-view-toggle">
          <button class="btn btn-secondary active" data-view="grid" onclick="DutiesPage.setView('grid')">
            Πλέγμα
          </button>
          <button class="btn btn-secondary" data-view="list" onclick="DutiesPage.setView('list')">
            Λίστα
          </button>
        </div>

        <!-- Duties Grid -->
        <div class="duties-container" id="duties-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- Assign Duty Modal -->
      <div class="modal-overlay" id="assign-duty-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Ανάθεση Εφημερίας</h3>
            <button class="modal-close" onclick="DutiesPage.hideAssignModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="duty-form">
              <div class="form-group">
                <label class="form-label">Καθηγητής *</label>
                <select id="duty-teacher" class="form-input" required>
                  <option value="">Επιλέξτε καθηγητή...</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ημερομηνία *</label>
                  <input type="date" id="duty-date" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Τύπος Εφημερίας *</label>
                  <select id="duty-type" class="form-input" required>
                    ${Object.entries(DutiesService.dutyTypes).map(([key, val]) =>
                      `<option value="${key}">${val.icon} ${val.label} (${val.time})</option>`
                    ).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Τοποθεσία</label>
                <input type="text" id="duty-location" class="form-input"
                       placeholder="π.χ. Αυλή, Διάδρομος Α'">
              </div>

              <div class="form-group">
                <label class="form-label">Σημειώσεις</label>
                <textarea id="duty-notes" class="form-input" rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="DutiesPage.hideAssignModal()">Ακύρωση</button>
            <button class="btn btn-primary" onclick="DutiesPage.submitDuty()">Ανάθεση</button>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.currentWeekStart = DutiesService.getWeekStart();
    await this.loadTeachers();
    this.updateWeekTitle();
    this.subscribeToWeek();
  },

  async loadTeachers() {
    const result = await UsersService.getByRole(ROLES.TEACHER);
    if (result.success) {
      this.teachers = result.data;
      this.populateTeacherSelect();
    }
  },

  populateTeacherSelect() {
    const select = document.getElementById('duty-teacher');
    if (!select) return;

    select.innerHTML = '<option value="">Επιλέξτε καθηγητή...</option>' +
      this.teachers.map(t =>
        `<option value="${t.id}">${t.displayName}</option>`
      ).join('');
  },

  subscribeToWeek() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = DutiesService.subscribe(this.currentWeekStart, (duties) => {
      this.duties = duties;
      this.renderDuties();
    });
  },

  updateWeekTitle() {
    const title = document.getElementById('duties-week-title');
    if (!title) return;

    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(endDate.getDate() + 4);

    const startStr = this.currentWeekStart.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });

    title.textContent = `${startStr} - ${endStr}`;
  },

  renderDuties() {
    const container = document.getElementById('duties-container');
    if (!container) return;

    const canManage = AuthService.can('manageCalendar') || isSuperAdmin(AuthService.currentUserData?.role);

    // Create grid
    let html = '<div class="duties-grid">';

    // Header row
    html += '<div class="duties-grid-header">';
    html += '<div class="duties-grid-cell header">Εφημερία</div>';
    DutiesService.weekDays.forEach((day, i) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric' });
      html += `<div class="duties-grid-cell header">${day}<br><small>${dateStr}</small></div>`;
    });
    html += '</div>';

    // Duty type rows
    Object.entries(DutiesService.dutyTypes).forEach(([typeKey, typeInfo]) => {
      html += '<div class="duties-grid-row">';
      html += `<div class="duties-grid-cell type-cell">
        <span class="duty-type-icon">${typeInfo.icon}</span>
        <span class="duty-type-label">${typeInfo.label}</span>
        <span class="duty-type-time">${typeInfo.time}</span>
      </div>`;

      // Each day
      DutiesService.weekDays.forEach((day, i) => {
        const date = new Date(this.currentWeekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Find duties for this slot
        const slotDuties = this.duties.filter(d => {
          const dutyDate = d.date?.toDate ? d.date.toDate() : new Date(d.date);
          return dutyDate.toISOString().split('T')[0] === dateStr && d.dutyType === typeKey;
        });

        html += '<div class="duties-grid-cell duty-cell" data-date="' + dateStr + '" data-type="' + typeKey + '">';

        if (slotDuties.length > 0) {
          slotDuties.forEach(duty => {
            html += `
              <div class="duty-badge" data-id="${duty.id}">
                <span class="duty-teacher-name">${escapeHtml(duty.teacherName)}</span>
                ${duty.location ? `<small class="duty-location">${escapeHtml(duty.location)}</small>` : ''}
                ${canManage ? `
                  <button class="duty-remove-btn" onclick="DutiesPage.removeDuty('${duty.id}', event)">×</button>
                ` : ''}
              </div>
            `;
          });
        } else if (canManage) {
          html += `<button class="duty-add-btn" onclick="DutiesPage.quickAssign('${dateStr}', '${typeKey}')">+</button>`;
        } else {
          html += '<span class="duty-empty">-</span>';
        }

        html += '</div>';
      });

      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  },

  // === NAVIGATION ===

  prevWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeekTitle();
    this.subscribeToWeek();
  },

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeekTitle();
    this.subscribeToWeek();
  },

  goToCurrentWeek() {
    this.currentWeekStart = DutiesService.getWeekStart();
    this.updateWeekTitle();
    this.subscribeToWeek();
  },

  setView(view) {
    document.querySelectorAll('.duties-view-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    // TODO: Implement list view
  },

  // === ASSIGN DUTY ===

  showAssignModal() {
    document.getElementById('duty-form')?.reset();
    document.getElementById('assign-duty-modal')?.classList.add('show');
  },

  hideAssignModal() {
    document.getElementById('assign-duty-modal')?.classList.remove('show');
  },

  quickAssign(dateStr, dutyType) {
    document.getElementById('duty-date').value = dateStr;
    document.getElementById('duty-type').value = dutyType;
    this.showAssignModal();
  },

  async submitDuty() {
    const teacherId = document.getElementById('duty-teacher')?.value;
    const dateStr = document.getElementById('duty-date')?.value;
    const dutyType = document.getElementById('duty-type')?.value;
    const location = document.getElementById('duty-location')?.value;
    const notes = document.getElementById('duty-notes')?.value;

    if (!teacherId || !dateStr || !dutyType) {
      showToast('Συμπληρώστε όλα τα υποχρεωτικά πεδία', 'warning');
      return;
    }

    const teacher = this.teachers.find(t => t.id === teacherId);

    const result = await DutiesService.assign({
      teacherId,
      teacherName: teacher?.displayName || 'Άγνωστος',
      date: new Date(dateStr),
      dutyType,
      location,
      notes
    });

    if (result.success) {
      showToast('Η εφημερία ανατέθηκε', 'success');
      this.hideAssignModal();
    } else {
      showToast('Σφάλμα ανάθεσης', 'error');
    }
  },

  async removeDuty(dutyId, event) {
    event.stopPropagation();

    if (!confirm('Διαγραφή εφημερίας;')) return;

    const result = await DutiesService.delete(dutyId);
    if (result.success) {
      showToast('Η εφημερία διαγράφηκε', 'success');
    } else {
      showToast('Σφάλμα διαγραφής', 'error');
    }
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
window.DutiesPage = DutiesPage;
