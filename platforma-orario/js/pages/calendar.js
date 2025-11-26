/* ========================================
   CALENDAR PAGE - Ημερολόγιο & Events
   ======================================== */

const CalendarPage = {
  currentDate: new Date(),
  currentView: 'month',
  events: [],
  unsubscribe: null,
  settings: null, // Platform settings for event options

  render() {
    return `
      <div class="calendar-page">
        <div class="page-header">
          <h1>Ημερολόγιο</h1>
          <div id="calendar-add-btn"></div>
        </div>

        <!-- Calendar Navigation -->
        <div class="calendar-nav">
          <button class="btn btn-secondary" onclick="CalendarPage.prevMonth()">◀</button>
          <h2 class="calendar-title" id="calendar-title"></h2>
          <button class="btn btn-secondary" onclick="CalendarPage.nextMonth()">▶</button>
          <button class="btn btn-secondary" onclick="CalendarPage.goToToday()">Σήμερα</button>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-container">
          <div class="calendar-header">
            <div class="calendar-day-name">Δευ</div>
            <div class="calendar-day-name">Τρι</div>
            <div class="calendar-day-name">Τετ</div>
            <div class="calendar-day-name">Πεμ</div>
            <div class="calendar-day-name">Παρ</div>
            <div class="calendar-day-name">Σαβ</div>
            <div class="calendar-day-name">Κυρ</div>
          </div>
          <div class="calendar-grid" id="calendar-grid">
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="upcoming-events">
          <h3>Επερχόμενα Events</h3>
          <div id="upcoming-list" class="upcoming-list">
          </div>
        </div>
      </div>

      <!-- Event Modal (Create/Edit) -->
      <div id="event-modal" class="modal hidden">
        <div class="modal-overlay" onclick="CalendarPage.hideEventModal()"></div>
        <div class="modal-container modal-lg">
          <div class="modal-header">
            <h2 class="modal-title" id="event-modal-title">Νέο Event</h2>
            <button class="modal-close" onclick="CalendarPage.hideEventModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="event-form" onsubmit="CalendarPage.handleEventSubmit(event)">
              <input type="hidden" id="event-id">

              <div class="form-group">
                <label class="form-label">Τίτλος *</label>
                <div class="input-with-dropdown">
                  <input type="text" id="event-title" class="form-input" required
                         placeholder="Τίτλος event" list="title-options">
                  <datalist id="title-options"></datalist>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Τύπος *</label>
                  <select id="event-type" class="form-input" required>
                    <!-- Options loaded dynamically -->
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <input type="checkbox" id="event-allday"> Ολοήμερο
                  </label>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Έναρξη *</label>
                  <input type="datetime-local" id="event-start" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Λήξη</label>
                  <input type="datetime-local" id="event-end" class="form-input">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Τοποθεσία</label>
                <div class="input-with-dropdown">
                  <input type="text" id="event-location" class="form-input"
                         placeholder="π.χ. Αίθουσα Συνεδριάσεων" list="location-options">
                  <datalist id="location-options"></datalist>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Περιγραφή</label>
                <textarea id="event-description" class="form-input" rows="3"
                          placeholder="Λεπτομέρειες του event..."></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="CalendarPage.hideEventModal()">
                  Ακύρωση
                </button>
                <button type="submit" class="btn btn-primary" id="event-submit-btn">
                  Αποθήκευση
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Event View Modal -->
      <div id="event-view-modal" class="modal hidden">
        <div class="modal-overlay" onclick="CalendarPage.hideViewModal()"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title" id="view-event-title">Event</h2>
            <button class="modal-close" onclick="CalendarPage.hideViewModal()">&times;</button>
          </div>
          <div class="modal-body" id="event-view-content">
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    // Load platform settings for event options
    await this.loadSettings();

    this.setupSubscription();
    this.renderCalendar();
    this.populateEventOptions();

    // Wait for user data to load, then update button
    const checkAndUpdate = () => {
      if (AuthService.currentUserData) {
        this.updateAddButton();
      } else {
        setTimeout(checkAndUpdate, 100);
      }
    };
    checkAndUpdate();
  },

  async loadSettings() {
    try {
      const doc = await firebaseDb.collection('settings').doc('platform').get();
      if (doc.exists) {
        this.settings = doc.data();
      } else {
        // Default settings
        this.settings = {
          eventTypes: ['Εκδήλωση', 'Σύσκεψη', 'Προθεσμία', 'Αργία', 'Εξετάσεις', 'Εκδρομή'],
          eventLocations: ['Αίθουσα Συνεδριάσεων', 'Γραφείο Διευθυντή', 'Αίθουσα Εκδηλώσεων', 'Αυλή', 'Γυμναστήριο'],
          eventTitles: ['Σύσκεψη Καθηγητών', 'Συνεδρίαση Συλλόγου', 'Σχολική Γιορτή', 'Ενημέρωση Γονέων']
        };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = {
        eventTypes: ['Εκδήλωση', 'Σύσκεψη', 'Προθεσμία', 'Αργία'],
        eventLocations: ['Αίθουσα Συνεδριάσεων', 'Γραφείο Διευθυντή'],
        eventTitles: ['Σύσκεψη Καθηγητών', 'Σχολική Γιορτή']
      };
    }
  },

  populateEventOptions() {
    // Populate type dropdown
    const typeSelect = document.getElementById('event-type');
    if (typeSelect && this.settings?.eventTypes) {
      typeSelect.innerHTML = this.settings.eventTypes.map(type =>
        `<option value="${type.toLowerCase()}">${type}</option>`
      ).join('');
    }

    // Populate location datalist
    const locationDatalist = document.getElementById('location-options');
    if (locationDatalist && this.settings?.eventLocations) {
      locationDatalist.innerHTML = this.settings.eventLocations.map(loc =>
        `<option value="${loc}">`
      ).join('');
    }

    // Populate title datalist
    const titleDatalist = document.getElementById('title-options');
    if (titleDatalist && this.settings?.eventTitles) {
      titleDatalist.innerHTML = this.settings.eventTitles.map(title =>
        `<option value="${title}">`
      ).join('');
    }
  },

  updateAddButton() {
    const container = document.getElementById('calendar-add-btn');
    if (!container) return;

    if (this.canCreate()) {
      container.innerHTML = `
        <button class="btn btn-primary" onclick="CalendarPage.showEventModal()">
          + Νέο Event
        </button>
      `;
    } else {
      container.innerHTML = '';
    }
  },

  setupSubscription() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = CalendarService.subscribe(events => {
      this.events = events;
      this.renderCalendar();
      this.renderUpcoming();
    });
  },

  // === CALENDAR RENDERING ===

  renderCalendar() {
    this.updateTitle();
    this.renderGrid();
  },

  updateTitle() {
    const months = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
                    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
    const title = document.getElementById('calendar-title');
    if (title) {
      title.textContent = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
  },

  renderGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Day of week for first day (0=Sunday, adjust for Monday start)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday=0

    const today = new Date();
    const todayStr = today.toDateString();

    let html = '';

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const isToday = dateStr === todayStr;
      const dayEvents = CalendarService.getEventsForDate(this.events, date);

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''}" onclick="CalendarPage.showDayEvents(${year}, ${month}, ${day})">
          <span class="day-number">${day}</span>
          ${dayEvents.length > 0 ? `
            <div class="day-events">
              ${dayEvents.slice(0, 3).map(e => `
                <div class="day-event" style="background-color: ${e.color || CalendarService.getTypeColor(e.type)}">
                  ${CalendarService.getTypeIcon(e.type)} ${e.title.substring(0, 10)}${e.title.length > 10 ? '...' : ''}
                </div>
              `).join('')}
              ${dayEvents.length > 3 ? `<div class="day-event-more">+${dayEvents.length - 3} ακόμα</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }

    grid.innerHTML = html;
  },

  renderUpcoming() {
    const list = document.getElementById('upcoming-list');
    if (!list) return;

    const now = new Date();
    const upcoming = this.events
      .filter(e => {
        const eventDate = e.startDate?.toDate ? e.startDate.toDate() : new Date(e.startDate);
        return eventDate >= now;
      })
      .slice(0, 5);

    if (upcoming.length === 0) {
      list.innerHTML = '<p class="no-events">Δεν υπάρχουν επερχόμενα events</p>';
      return;
    }

    list.innerHTML = upcoming.map(event => {
      const icon = CalendarService.getTypeIcon(event.type);
      const dateStr = CalendarService.formatEventDate(event.startDate, event.endDate, event.allDay);

      return `
        <div class="upcoming-event" onclick="CalendarPage.viewEvent('${event.id}')">
          <div class="upcoming-icon" style="background-color: ${event.color || CalendarService.getTypeColor(event.type)}">
            ${icon}
          </div>
          <div class="upcoming-info">
            <div class="upcoming-title">${event.title}</div>
            <div class="upcoming-date">${dateStr}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  // === NAVIGATION ===

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  },

  goToToday() {
    this.currentDate = new Date();
    this.renderCalendar();
  },

  // === PERMISSIONS ===

  canCreate() {
    const user = AuthService.currentUserData;
    if (!user) return false;
    // Super Admin έχει ΟΛΑ τα δικαιώματα
    if (isSuperAdmin(user.role)) return true;
    // Χρήση permission από constants
    if (hasPermission(user.role, 'manageCalendar')) return true;
    return false;
  },

  canEdit(event) {
    const user = AuthService.currentUserData;
    if (!user) return false;
    // Super Admin έχει ΟΛΑ τα δικαιώματα
    if (isSuperAdmin(user.role)) return true;
    // Ο δημιουργός μπορεί να επεξεργαστεί
    if (event.createdBy === AuthService.currentUser?.uid) return true;
    // Διευθυντές μπορούν να επεξεργαστούν
    const role = user.role?.toLowerCase();
    return ['διευθυντής', 'βδα'].includes(role);
  },

  canDelete(event) {
    return this.canEdit(event);
  },

  // === EVENT MODAL ===

  showEventModal(eventId = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');

    form.reset();
    document.getElementById('event-id').value = '';

    if (eventId) {
      const event = this.events.find(e => e.id === eventId);
      if (event) {
        title.textContent = 'Επεξεργασία Event';
        document.getElementById('event-id').value = eventId;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-type').value = event.type;
        document.getElementById('event-allday').checked = event.allDay;
        document.getElementById('event-location').value = event.location || '';
        document.getElementById('event-description').value = event.description || '';

        // Format dates for datetime-local input
        const startDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate);
        document.getElementById('event-start').value = this.formatDateTimeLocal(startDate);

        if (event.endDate) {
          const endDate = event.endDate?.toDate ? event.endDate.toDate() : new Date(event.endDate);
          document.getElementById('event-end').value = this.formatDateTimeLocal(endDate);
        }
      }
    } else {
      title.textContent = 'Νέο Event';
      // Set default start time to now
      const now = new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15); // Round to 15 min
      document.getElementById('event-start').value = this.formatDateTimeLocal(now);
    }

    modal.classList.remove('hidden');
  },

  hideEventModal() {
    document.getElementById('event-modal').classList.add('hidden');
  },

  formatDateTimeLocal(date) {
    const pad = n => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  async handleEventSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('event-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Αποθήκευση...';

    const eventId = document.getElementById('event-id').value;
    const startDate = new Date(document.getElementById('event-start').value);
    const endValue = document.getElementById('event-end').value;
    const endDate = endValue ? new Date(endValue) : startDate;

    const eventData = {
      title: document.getElementById('event-title').value,
      type: document.getElementById('event-type').value,
      allDay: document.getElementById('event-allday').checked,
      startDate: startDate,
      endDate: endDate,
      location: document.getElementById('event-location').value,
      description: document.getElementById('event-description').value
    };

    let result;
    if (eventId) {
      result = await CalendarService.update(eventId, eventData);
    } else {
      result = await CalendarService.create(eventData);
    }

    btn.disabled = false;
    btn.textContent = 'Αποθήκευση';

    if (result.success) {
      this.hideEventModal();
      showToast(eventId ? 'Event ενημερώθηκε!' : 'Event δημιουργήθηκε!', 'success');
      // Refresh button in case permissions changed
      this.updateAddButton();
    } else {
      showToast('Σφάλμα: ' + result.error, 'error');
      console.error('Event save error:', result.error);
    }
  },

  // === VIEW EVENT ===

  viewEvent(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('view-event-title').textContent = event.title;

    const icon = CalendarService.getTypeIcon(event.type);
    const typeLabel = CalendarService.getTypeLabel(event.type);
    const dateStr = CalendarService.formatEventDate(event.startDate, event.endDate, event.allDay);

    const content = document.getElementById('event-view-content');
    content.innerHTML = `
      <div class="event-view-details">
        <div class="event-view-meta">
          <span class="badge" style="background-color: ${event.color || CalendarService.getTypeColor(event.type)}">
            ${icon} ${typeLabel}
          </span>
        </div>

        <div class="event-view-info">
          <div class="info-row">
            <span class="info-label">Ημερομηνία:</span>
            <span class="info-value">${dateStr}</span>
          </div>
          ${event.location ? `
            <div class="info-row">
              <span class="info-label">Τοποθεσία:</span>
              <span class="info-value">${event.location}</span>
            </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Δημιουργός:</span>
            <span class="info-value">${event.creatorName}</span>
          </div>
          ${event.description ? `
            <div class="info-row">
              <span class="info-label">Περιγραφή:</span>
              <span class="info-value">${event.description}</span>
            </div>
          ` : ''}
        </div>

        <div class="event-view-actions">
          ${this.canEdit(event) ? `
            <button class="btn btn-secondary" onclick="CalendarPage.hideViewModal(); CalendarPage.showEventModal('${event.id}')">
              Επεξεργασία
            </button>
          ` : ''}
          ${this.canDelete(event) ? `
            <button class="btn btn-danger" onclick="CalendarPage.deleteEvent('${event.id}')">
              Διαγραφή
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('event-view-modal').classList.remove('hidden');
  },

  hideViewModal() {
    document.getElementById('event-view-modal').classList.add('hidden');
  },

  showDayEvents(year, month, day) {
    const date = new Date(year, month, day);
    const dayEvents = CalendarService.getEventsForDate(this.events, date);

    if (dayEvents.length === 0) {
      if (this.canCreate()) {
        // Set default date and show create modal
        this.currentDate = date;
        this.showEventModal();
      }
      return;
    }

    if (dayEvents.length === 1) {
      this.viewEvent(dayEvents[0].id);
    } else {
      // Show day events list
      const dateStr = date.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });

      document.getElementById('view-event-title').textContent = dateStr;
      const content = document.getElementById('event-view-content');

      content.innerHTML = `
        <div class="day-events-list">
          ${dayEvents.map(event => `
            <div class="day-event-item" onclick="CalendarPage.viewEvent('${event.id}')">
              <div class="day-event-icon" style="background-color: ${event.color || CalendarService.getTypeColor(event.type)}">
                ${CalendarService.getTypeIcon(event.type)}
              </div>
              <div class="day-event-info">
                <div class="day-event-title">${event.title}</div>
                <div class="day-event-time">${CalendarService.formatEventDate(event.startDate, event.endDate, event.allDay)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('event-view-modal').classList.remove('hidden');
    }
  },

  async deleteEvent(eventId) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το event;')) {
      return;
    }

    const result = await CalendarService.delete(eventId);

    if (result.success) {
      this.hideViewModal();
    } else {
      alert('Σφάλμα: ' + result.error);
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
window.CalendarPage = CalendarPage;
