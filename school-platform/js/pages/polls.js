/* ========================================
   POLLS PAGE - Ψηφοφορίες
   ======================================== */

const PollsPage = {
  polls: [],
  filter: 'active', // active, closed, mine
  unsubscribe: null,

  render() {
    const canCreate = AuthService.can('announceToAll') || isSuperAdmin(AuthService.currentUserData?.role);

    return `
      <div class="polls-page">
        <div class="page-header">
          <h1>Ψηφοφορίες</h1>
          ${canCreate ? `
            <button class="btn btn-primary" onclick="PollsPage.showCreateModal()">
              + Νέα Ψηφοφορία
            </button>
          ` : ''}
        </div>

        <!-- Filters -->
        <div class="polls-filters">
          <button class="btn btn-secondary active" data-filter="active" onclick="PollsPage.setFilter('active')">
            Ενεργές
          </button>
          <button class="btn btn-secondary" data-filter="closed" onclick="PollsPage.setFilter('closed')">
            Ολοκληρωμένες
          </button>
          <button class="btn btn-secondary" data-filter="mine" onclick="PollsPage.setFilter('mine')">
            Δικές μου
          </button>
        </div>

        <!-- Polls List -->
        <div class="polls-list" id="polls-list">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
        </div>
      </div>

      <!-- Create Poll Modal -->
      <div class="modal-overlay" id="create-poll-modal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Νέα Ψηφοφορία</h3>
            <button class="modal-close" onclick="PollsPage.hideCreateModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="poll-form">
              <div class="form-group">
                <label class="form-label">Ερώτηση *</label>
                <input type="text" id="poll-question" class="form-input" required
                       placeholder="Τι θέλετε να ρωτήσετε;">
              </div>

              <div class="form-group">
                <label class="form-label">Περιγραφή</label>
                <textarea id="poll-description" class="form-input" rows="2"
                          placeholder="Προαιρετική περιγραφή..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Επιλογές *</label>
                <div id="poll-options-container">
                  <div class="poll-option-input">
                    <input type="text" class="form-input poll-option" placeholder="Επιλογή 1">
                    <button type="button" class="btn btn-icon btn-danger" onclick="PollsPage.removeOption(this)" disabled>×</button>
                  </div>
                  <div class="poll-option-input">
                    <input type="text" class="form-input poll-option" placeholder="Επιλογή 2">
                    <button type="button" class="btn btn-icon btn-danger" onclick="PollsPage.removeOption(this)" disabled>×</button>
                  </div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm mt-sm" onclick="PollsPage.addOption()">
                  + Προσθήκη επιλογής
                </button>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Λήξη</label>
                  <input type="datetime-local" id="poll-expires" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">&nbsp;</label>
                  <div class="checkbox-group">
                    <label>
                      <input type="checkbox" id="poll-multiple"> Πολλαπλές επιλογές
                    </label>
                    <label>
                      <input type="checkbox" id="poll-anonymous"> Ανώνυμη
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="PollsPage.hideCreateModal()">Ακύρωση</button>
            <button class="btn btn-primary" onclick="PollsPage.submitPoll()">Δημιουργία</button>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.setDefaultExpiry();
    this.subscribeToPpolls();
  },

  setDefaultExpiry() {
    const input = document.getElementById('poll-expires');
    if (input) {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      input.value = date.toISOString().slice(0, 16);
    }
  },

  subscribeToPpolls() {
    this.unsubscribe = PollsService.subscribe((polls) => {
      this.polls = polls;
      this.renderPolls();
    });
  },

  setFilter(filter) {
    this.filter = filter;
    document.querySelectorAll('.polls-filters button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderPolls();
  },

  renderPolls() {
    const container = document.getElementById('polls-list');
    if (!container) return;

    const userId = AuthService.currentUser?.uid;
    let filtered = [...this.polls];

    // Apply filter
    switch (this.filter) {
      case 'active':
        filtered = filtered.filter(p => p.status === 'active' && !PollsService.isExpired(p));
        break;
      case 'closed':
        filtered = filtered.filter(p => p.status === 'closed' || PollsService.isExpired(p));
        break;
      case 'mine':
        filtered = filtered.filter(p => p.createdBy === userId);
        break;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>Δεν υπάρχουν ψηφοφορίες</h3>
          <p class="text-muted">Οι ψηφοφορίες θα εμφανιστούν εδώ</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(poll => this.renderPoll(poll)).join('');
  },

  renderPoll(poll) {
    const userId = AuthService.currentUser?.uid;
    const hasVoted = PollsService.hasVoted(poll, userId);
    const isExpired = PollsService.isExpired(poll);
    const isClosed = poll.status === 'closed' || isExpired;
    const isOwner = poll.createdBy === userId;
    const totalVotes = PollsService.getTotalVotes(poll);
    const timeRemaining = PollsService.getTimeRemaining(poll);

    let statusBadge = '';
    if (isClosed) {
      statusBadge = '<span class="badge badge-gray">Ολοκληρώθηκε</span>';
    } else if (hasVoted) {
      statusBadge = '<span class="badge badge-success">Ψήφισες</span>';
    } else {
      statusBadge = '<span class="badge badge-primary">Ενεργή</span>';
    }

    return `
      <div class="poll-card ${isClosed ? 'closed' : ''}" data-id="${poll.id}">
        <div class="poll-header">
          <h3 class="poll-question">${escapeHtml(poll.question)}</h3>
          <div class="poll-meta">
            ${statusBadge}
            <span class="poll-time">
              ${isClosed ? 'Έληξε' : `Λήγει: ${timeRemaining}`}
            </span>
          </div>
        </div>

        ${poll.description ? `<p class="poll-description">${escapeHtml(poll.description)}</p>` : ''}

        <div class="poll-options">
          ${poll.options.map(opt => this.renderOption(poll, opt, hasVoted || isClosed, totalVotes)).join('')}
        </div>

        <div class="poll-footer">
          <span class="poll-stats">
            ${totalVotes} ψήφο${totalVotes !== 1 ? 'ι' : 'ς'}
            ${poll.anonymous ? ' • Ανώνυμη' : ''}
            ${poll.allowMultiple ? ' • Πολλαπλές' : ''}
          </span>
          <span class="poll-author">
            Από: ${escapeHtml(poll.creatorName)}
          </span>
          ${isOwner && !isClosed ? `
            <button class="btn btn-sm btn-warning" onclick="PollsPage.closePoll('${poll.id}')">
              Κλείσιμο
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderOption(poll, option, showResults, totalVotes) {
    const percentage = PollsService.getPercentage(option.votes, totalVotes);
    const userId = AuthService.currentUser?.uid;
    const userVotes = poll.voterChoices?.[userId] || [];
    const isSelected = userVotes.includes(option.id);

    if (showResults) {
      return `
        <div class="poll-option result ${isSelected ? 'selected' : ''}">
          <div class="poll-option-bar" style="width: ${percentage}%"></div>
          <span class="poll-option-text">${escapeHtml(option.text)}</span>
          <span class="poll-option-votes">${option.votes} (${percentage}%)</span>
          ${isSelected ? '<span class="poll-option-check">✓</span>' : ''}
        </div>
      `;
    }

    const inputType = poll.allowMultiple ? 'checkbox' : 'radio';
    return `
      <label class="poll-option votable">
        <input type="${inputType}" name="poll-${poll.id}" value="${option.id}">
        <span class="poll-option-text">${escapeHtml(option.text)}</span>
      </label>
    `;
  },

  // === CREATE POLL ===

  showCreateModal() {
    document.getElementById('poll-form')?.reset();
    this.resetOptions();
    this.setDefaultExpiry();
    document.getElementById('create-poll-modal')?.classList.add('show');
  },

  hideCreateModal() {
    document.getElementById('create-poll-modal')?.classList.remove('show');
  },

  resetOptions() {
    const container = document.getElementById('poll-options-container');
    if (container) {
      container.innerHTML = `
        <div class="poll-option-input">
          <input type="text" class="form-input poll-option" placeholder="Επιλογή 1">
          <button type="button" class="btn btn-icon btn-danger" onclick="PollsPage.removeOption(this)" disabled>×</button>
        </div>
        <div class="poll-option-input">
          <input type="text" class="form-input poll-option" placeholder="Επιλογή 2">
          <button type="button" class="btn btn-icon btn-danger" onclick="PollsPage.removeOption(this)" disabled>×</button>
        </div>
      `;
    }
  },

  addOption() {
    const container = document.getElementById('poll-options-container');
    if (!container) return;

    const count = container.querySelectorAll('.poll-option-input').length;
    const div = document.createElement('div');
    div.className = 'poll-option-input';
    div.innerHTML = `
      <input type="text" class="form-input poll-option" placeholder="Επιλογή ${count + 1}">
      <button type="button" class="btn btn-icon btn-danger" onclick="PollsPage.removeOption(this)">×</button>
    `;
    container.appendChild(div);

    // Enable remove buttons if more than 2 options
    this.updateRemoveButtons();
  },

  removeOption(btn) {
    btn.closest('.poll-option-input')?.remove();
    this.updateRemoveButtons();
  },

  updateRemoveButtons() {
    const container = document.getElementById('poll-options-container');
    if (!container) return;

    const inputs = container.querySelectorAll('.poll-option-input');
    inputs.forEach(input => {
      const btn = input.querySelector('button');
      if (btn) btn.disabled = inputs.length <= 2;
    });
  },

  async submitPoll() {
    const question = document.getElementById('poll-question')?.value.trim();
    const description = document.getElementById('poll-description')?.value.trim();
    const expiresStr = document.getElementById('poll-expires')?.value;
    const allowMultiple = document.getElementById('poll-multiple')?.checked;
    const anonymous = document.getElementById('poll-anonymous')?.checked;

    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs)
      .map(input => input.value.trim())
      .filter(v => v);

    // Validation
    if (!question) {
      showToast('Συμπληρώστε την ερώτηση', 'warning');
      return;
    }

    if (options.length < 2) {
      showToast('Χρειάζονται τουλάχιστον 2 επιλογές', 'warning');
      return;
    }

    const result = await PollsService.create({
      question,
      description,
      options,
      allowMultiple,
      anonymous,
      expiresAt: expiresStr ? new Date(expiresStr) : PollsService.getDefaultExpiry()
    });

    if (result.success) {
      showToast('Η ψηφοφορία δημιουργήθηκε', 'success');
      this.hideCreateModal();
    } else {
      showToast('Σφάλμα δημιουργίας', 'error');
    }
  },

  // === VOTING ===

  async vote(pollId) {
    const poll = this.polls.find(p => p.id === pollId);
    if (!poll) return;

    const inputs = document.querySelectorAll(`input[name="poll-${pollId}"]:checked`);
    const optionIds = Array.from(inputs).map(input => input.value);

    if (optionIds.length === 0) {
      showToast('Επιλέξτε τουλάχιστον μία απάντηση', 'warning');
      return;
    }

    const result = await PollsService.vote(pollId, optionIds);

    if (result.success) {
      showToast('Η ψήφος σας καταχωρήθηκε', 'success');
    } else {
      showToast(result.error || 'Σφάλμα ψηφοφορίας', 'error');
    }
  },

  async closePoll(pollId) {
    if (!confirm('Κλείσιμο ψηφοφορίας;')) return;

    const result = await PollsService.close(pollId);

    if (result.success) {
      showToast('Η ψηφοφορία έκλεισε', 'success');
    } else {
      showToast('Σφάλμα', 'error');
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
window.PollsPage = PollsPage;
