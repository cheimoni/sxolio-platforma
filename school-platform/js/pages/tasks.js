/* ========================================
   TASKS PAGE - Εργασίες/Υπενθυμίσεις
   ======================================== */

const TasksPage = {
  tasks: [],
  filter: 'active', // active, completed, all
  unsubscribe: null,

  render() {
    return `
      <div class="tasks-page">
        <div class="page-header">
          <h1>✅ Οι Εργασίες μου</h1>
          <button class="btn btn-primary" onclick="TasksPage.showCreateModal()">
            + Νέα Εργασία
          </button>
        </div>

        <!-- Stats -->
        <div class="tasks-stats" id="tasks-stats"></div>

        <!-- Filters -->
        <div class="tasks-filters">
          <button class="btn btn-secondary active" data-filter="active" onclick="TasksPage.setFilter('active')">
            Ενεργές
          </button>
          <button class="btn btn-secondary" data-filter="completed" onclick="TasksPage.setFilter('completed')">
            Ολοκληρωμένες
          </button>
          <button class="btn btn-secondary" data-filter="all" onclick="TasksPage.setFilter('all')">
            Όλες
          </button>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list" id="tasks-list">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- Create Task Modal -->
      <div class="modal-overlay" id="create-task-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Νέα Εργασία</h3>
            <button class="modal-close" onclick="TasksPage.hideCreateModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="task-form">
              <div class="form-group">
                <label class="form-label">Τίτλος *</label>
                <input type="text" id="task-title" class="form-input" required
                       placeholder="Τι πρέπει να κάνετε;">
              </div>

              <div class="form-group">
                <label class="form-label">Περιγραφή</label>
                <textarea id="task-description" class="form-input" rows="2"
                          placeholder="Περισσότερες λεπτομέρειες..."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Προτεραιότητα</label>
                  <select id="task-priority" class="form-input">
                    <option value="low">🟢 Χαμηλή</option>
                    <option value="medium" selected>🟡 Μεσαία</option>
                    <option value="high">🔴 Υψηλή</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Κατηγορία</label>
                  <select id="task-category" class="form-input">
                    <option value="general">📋 Γενικό</option>
                    <option value="meeting">📅 Συνάντηση</option>
                    <option value="deadline">⏰ Προθεσμία</option>
                    <option value="personal">👤 Προσωπικό</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Ημ/νία Λήξης</label>
                  <input type="date" id="task-due" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Υπενθύμιση</label>
                  <input type="datetime-local" id="task-reminder" class="form-input">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="TasksPage.hideCreateModal()">Ακύρωση</button>
            <button class="btn btn-primary" onclick="TasksPage.submitTask()">Δημιουργία</button>
          </div>
        </div>
      </div>

      <!-- Edit Task Modal -->
      <div class="modal-overlay" id="edit-task-modal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Επεξεργασία Εργασίας</h3>
            <button class="modal-close" onclick="TasksPage.hideEditModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="edit-task-form">
              <input type="hidden" id="edit-task-id">
              <div class="form-group">
                <label class="form-label">Τίτλος *</label>
                <input type="text" id="edit-task-title" class="form-input" required>
              </div>

              <div class="form-group">
                <label class="form-label">Περιγραφή</label>
                <textarea id="edit-task-description" class="form-input" rows="2"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Προτεραιότητα</label>
                  <select id="edit-task-priority" class="form-input">
                    <option value="low">🟢 Χαμηλή</option>
                    <option value="medium">🟡 Μεσαία</option>
                    <option value="high">🔴 Υψηλή</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Ημ/νία Λήξης</label>
                  <input type="date" id="edit-task-due" class="form-input">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-danger" onclick="TasksPage.deleteTask()">Διαγραφή</button>
            <button class="btn btn-primary" onclick="TasksPage.updateTask()">Αποθήκευση</button>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.subscribeToTasks();
  },

  subscribeToTasks() {
    this.unsubscribe = TasksService.subscribe((tasks) => {
      this.tasks = tasks;
      this.renderTasks();
      this.renderStats();
    });
  },

  setFilter(filter) {
    this.filter = filter;
    document.querySelectorAll('.tasks-filters button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderTasks();
  },

  renderStats() {
    const statsEl = document.getElementById('tasks-stats');
    if (!statsEl) return;

    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const pending = this.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const overdue = this.tasks.filter(t => TasksService.isOverdue(t)).length;

    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-number">${pending}</div>
        <div class="stat-label">Εκκρεμείς</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${completed}</div>
        <div class="stat-label">Ολοκληρωμένες</div>
      </div>
      ${overdue > 0 ? `
        <div class="stat-card stat-warning">
          <div class="stat-number">${overdue}</div>
          <div class="stat-label">Εκπρόθεσμες</div>
        </div>
      ` : ''}
    `;
  },

  renderTasks() {
    const container = document.getElementById('tasks-list');
    if (!container) return;

    let filtered = [...this.tasks];

    switch (this.filter) {
      case 'active':
        filtered = filtered.filter(t => t.status !== 'completed');
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'completed');
        break;
    }

    // Sort: overdue first, then by priority, then by due date
    filtered.sort((a, b) => {
      const aOverdue = TasksService.isOverdue(a);
      const bOverdue = TasksService.isOverdue(b);
      if (aOverdue !== bOverdue) return bOverdue ? 1 : -1;

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPri = priorityOrder[a.priority] ?? 1;
      const bPri = priorityOrder[b.priority] ?? 1;
      if (aPri !== bPri) return aPri - bPri;

      return 0;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>${this.filter === 'completed' ? 'Δεν έχετε ολοκληρωμένες εργασίες' : 'Δεν έχετε εκκρεμείς εργασίες'}</h3>
          <p class="text-muted">${this.filter === 'active' ? 'Μπράβο! Είστε ενήμεροι!' : 'Οι εργασίες θα εμφανιστούν εδώ'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(task => this.renderTask(task)).join('');
  },

  renderTask(task) {
    const priorityInfo = TasksService.getPriorityInfo(task.priority);
    const categoryInfo = TasksService.getCategoryInfo(task.category);
    const dueDateLabel = TasksService.getDueDateLabel(task);
    const isCompleted = task.status === 'completed';
    const isOverdue = TasksService.isOverdue(task);

    return `
      <div class="task-card task-priority-${task.priority} ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}"
           data-id="${task.id}">
        <div class="task-checkbox">
          <input type="checkbox" ${isCompleted ? 'checked' : ''}
                 onchange="TasksPage.toggleComplete('${task.id}', ${!isCompleted})">
        </div>
        <div class="task-content">
          <div class="task-title ${isCompleted ? 'completed' : ''}">
            ${escapeHtml(task.title)}
          </div>
          ${task.description ? `
            <div class="task-description">${escapeHtml(task.description)}</div>
          ` : ''}
          <div class="task-meta">
            <span class="task-category">${categoryInfo.icon} ${categoryInfo.label}</span>
            <span class="task-priority-label" style="color: var(--${priorityInfo.color})">
              ${priorityInfo.icon} ${priorityInfo.label}
            </span>
            ${dueDateLabel ? `
              <span class="task-due ${dueDateLabel.class}">
                📅 ${dueDateLabel.text}
              </span>
            ` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-icon btn-sm" onclick="TasksPage.showEditModal('${task.id}')" title="Επεξεργασία">
            ✏️
          </button>
        </div>
      </div>
    `;
  },

  // === CREATE TASK ===
  showCreateModal() {
    document.getElementById('task-form')?.reset();
    document.getElementById('create-task-modal')?.classList.add('show');
  },

  hideCreateModal() {
    document.getElementById('create-task-modal')?.classList.remove('show');
  },

  async submitTask() {
    const title = document.getElementById('task-title')?.value.trim();
    const description = document.getElementById('task-description')?.value.trim();
    const priority = document.getElementById('task-priority')?.value;
    const category = document.getElementById('task-category')?.value;
    const dueStr = document.getElementById('task-due')?.value;
    const reminderStr = document.getElementById('task-reminder')?.value;

    if (!title) {
      showToast('Συμπληρώστε τον τίτλο', 'warning');
      return;
    }

    const result = await TasksService.create({
      title,
      description,
      priority,
      category,
      dueDate: dueStr ? new Date(dueStr) : null,
      reminderAt: reminderStr ? new Date(reminderStr) : null
    });

    if (result.success) {
      showToast('Η εργασία δημιουργήθηκε', 'success');
      this.hideCreateModal();
    } else {
      showToast('Σφάλμα δημιουργίας', 'error');
    }
  },

  // === EDIT TASK ===
  showEditModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('edit-task-id').value = taskId;
    document.getElementById('edit-task-title').value = task.title || '';
    document.getElementById('edit-task-description').value = task.description || '';
    document.getElementById('edit-task-priority').value = task.priority || 'medium';

    if (task.dueDate) {
      const due = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
      document.getElementById('edit-task-due').value = due.toISOString().split('T')[0];
    } else {
      document.getElementById('edit-task-due').value = '';
    }

    document.getElementById('edit-task-modal')?.classList.add('show');
  },

  hideEditModal() {
    document.getElementById('edit-task-modal')?.classList.remove('show');
  },

  async updateTask() {
    const taskId = document.getElementById('edit-task-id')?.value;
    const title = document.getElementById('edit-task-title')?.value.trim();
    const description = document.getElementById('edit-task-description')?.value.trim();
    const priority = document.getElementById('edit-task-priority')?.value;
    const dueStr = document.getElementById('edit-task-due')?.value;

    if (!title) {
      showToast('Συμπληρώστε τον τίτλο', 'warning');
      return;
    }

    const result = await TasksService.update(taskId, {
      title,
      description,
      priority,
      dueDate: dueStr ? new Date(dueStr) : null
    });

    if (result.success) {
      showToast('Η εργασία ενημερώθηκε', 'success');
      this.hideEditModal();
    } else {
      showToast('Σφάλμα ενημέρωσης', 'error');
    }
  },

  async deleteTask() {
    const taskId = document.getElementById('edit-task-id')?.value;

    if (!confirm('Διαγραφή εργασίας;')) return;

    const result = await TasksService.delete(taskId);

    if (result.success) {
      showToast('Η εργασία διαγράφηκε', 'success');
      this.hideEditModal();
    } else {
      showToast('Σφάλμα διαγραφής', 'error');
    }
  },

  // === TOGGLE COMPLETE ===
  async toggleComplete(taskId, complete) {
    if (complete) {
      await TasksService.complete(taskId);
      showToast('Η εργασία ολοκληρώθηκε! 🎉', 'success');
    } else {
      await TasksService.reopen(taskId);
      showToast('Η εργασία επαναφέρθηκε', 'info');
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
window.TasksPage = TasksPage;
