/* ========================================
   APP - Main Application Controller
   ======================================== */

const App = {
  currentPage: null,
  params: {},

  // === INITIALIZATION ===

  init() {
    // Listen for auth state changes
    AuthService.onAuthStateChange((user, userData) => {
      if (user && userData) {
        this.showApp();
        // Refresh sidebar after user data loads to show correct menu items
        setTimeout(() => {
          if (window.Sidebar && window.Sidebar.refresh) {
            window.Sidebar.refresh();
          }
        }, 200);
      } else {
        this.showLogin();
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state?.page) {
        this.navigateTo(e.state.page, e.state.params, false);
      }
    });
  },

  // === AUTH VIEWS ===

  showLogin() {
    document.body.innerHTML = `
      <div id="login-container"></div>
    `;

    LoginPage.init('login-container');
    LoginPage.render();
    this.hideLoadingScreen();
  },

  showApp() {
    document.body.innerHTML = `
      <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar"></aside>

        <!-- Main -->
        <main class="main-wrapper">
          <header class="header" id="header"></header>
          <div class="main-content" id="main-content"></div>
        </main>
      </div>

      <!-- Toast Container -->
      <div id="toast-container" class="toast-container"></div>
    `;

    // Initialize components
    Sidebar.init('sidebar');
    Header.init('header');

    // Initialize Voice Call UI for incoming calls
    if (window.VoiceCallUI) {
      VoiceCallUI.init();
    }

    // Navigate to initial page - always start at dashboard
    this.navigateTo('dashboard');
    this.hideLoadingScreen();
  },

  // === NAVIGATION ===

  navigateTo(page, params = {}, pushState = true) {
    this.currentPage = page;
    this.params = params;

    // Update URL
    if (pushState) {
      const url = `#${page}`;
      history.pushState({ page, params }, '', url);
    }

    // Update sidebar active state
    Sidebar.setActive(page);

    // Update header title
    Header.setTitle(this.getPageTitle(page));

    // Render page
    this.renderPage(page, params);
  },

  renderPage(page, params) {
    const container = document.getElementById('main-content');
    if (!container) return;

    // Cleanup previous page
    this.cleanupCurrentPage();

    // Render new page
    switch (page) {
      case 'dashboard':
        DashboardPage.init('main-content');
        DashboardPage.render();
        break;

      case 'messages':
        MessagesPage.init('main-content');
        MessagesPage.render(params);
        break;

      case 'announcements':
        AnnouncementsPage.init('main-content');
        AnnouncementsPage.render();
        break;

      case 'files':
        container.innerHTML = FilesPage.render();
        FilesPage.init();
        break;

      case 'calendar':
        container.innerHTML = CalendarPage.render();
        CalendarPage.init();
        break;

      case 'settings':
        this.renderSettings();
        break;

      case 'users':
        container.innerHTML = UsersPage.render();
        UsersPage.init();
        break;

      case 'admin':
        container.innerHTML = AdminPage.render();
        AdminPage.init();
        break;

      case 'duties':
        container.innerHTML = DutiesPage.render();
        DutiesPage.init();
        break;

      case 'polls':
        container.innerHTML = PollsPage.render();
        PollsPage.init();
        break;

      case 'alerts':
        container.innerHTML = AlertsPage.render();
        AlertsPage.init();
        break;

      case 'substitutions':
        container.innerHTML = SubstitutionsPage.render();
        SubstitutionsPage.init();
        break;

      case 'tasks':
        container.innerHTML = TasksPage.render();
        TasksPage.init();
        break;

      case 'calls':
        container.innerHTML = CallsPage.render();
        CallsPage.init();
        break;

      case 'grades':
        container.innerHTML = GradesPage.render();
        GradesPage.init();
        break;

      case 'photo-editor':
        container.innerHTML = PhotoEditorPage.render();
        PhotoEditorPage.init();
        break;

      case 'events-program':
        container.innerHTML = EventsProgramPage.render();
        EventsProgramPage.init();
        break;

      case 'schedule-adjuster':
        container.innerHTML = ScheduleAdjusterPage.render();
        ScheduleAdjusterPage.init();
        break;

      default:
        this.render404();
    }
  },

  cleanupCurrentPage() {
    // Cleanup subscriptions
    if (this.currentPage === 'dashboard') {
      DashboardPage.destroy?.();
    }
    if (this.currentPage === 'messages') {
      MessagesPage.destroy?.();
    }
    if (this.currentPage === 'files') {
      FilesPage.destroy?.();
    }
    if (this.currentPage === 'calendar') {
      CalendarPage.destroy?.();
    }
    if (this.currentPage === 'users') {
      UsersPage.destroy?.();
    }
    if (this.currentPage === 'admin') {
      AdminPage.destroy?.();
    }
    if (this.currentPage === 'duties') {
      DutiesPage.destroy?.();
    }
    if (this.currentPage === 'polls') {
      PollsPage.destroy?.();
    }
    if (this.currentPage === 'alerts') {
      AlertsPage.destroy?.();
    }
    if (this.currentPage === 'substitutions') {
      SubstitutionsPage.destroy?.();
    }
    if (this.currentPage === 'tasks') {
      TasksPage.destroy?.();
    }
    if (this.currentPage === 'calls') {
      CallsPage.destroy?.();
    }
    if (this.currentPage === 'grades') {
      GradesPage.destroy?.();
    }
    ChatService.unsubscribeAll();
    FilesService.unsubscribeAll?.();
    CalendarService.unsubscribeAll?.();
  },

  // === PAGE HELPERS ===

  getPageTitle(page) {
    const titles = {
      dashboard: 'Αρχική',
      messages: 'Μηνύματα',
      announcements: 'Ανακοινώσεις',
      files: 'Αρχεία',
      calendar: 'Ημερολόγιο',
      settings: 'Ρυθμίσεις',
      users: 'Διαχείριση Χρηστών',
      admin: 'Πίνακας Ελέγχου',
      duties: 'Εφημερίες',
      polls: 'Ψηφοφορίες',
      alerts: 'Έκτακτες Ειδοποιήσεις',
      substitutions: 'Αντικαταστάσεις',
      tasks: 'Εργασίες',
      calls: 'Κλήσεις',
      grades: 'Βαθμολογία',
      'photo-editor': 'Επεξεργασία Φωτογραφίας',
      'events-program': 'Πρόγραμμα Εκδηλώσεων',
      'schedule-adjuster': 'Προσαρμογή Ωραρίου'
    };
    return titles[page] || 'Σελίδα';
  },

  renderPlaceholder(page, title, message) {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="placeholder-page">
        <div class="placeholder-icon">${title.split(' ')[0]}</div>
        <h2>${title}</h2>
        <p class="text-muted">${message}</p>
      </div>
    `;
  },

  renderSettings() {
    const container = document.getElementById('main-content');
    if (!container) return;

    const user = AuthService.currentUserData;

    container.innerHTML = `
      <div class="settings-page">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Προφίλ</h3>
          </div>
          <div class="card-body">
            <div class="settings-profile">
              <div class="avatar avatar-lg">
                ${getInitials(user?.displayName)}
              </div>
              <div class="settings-profile-info">
                <h3>${escapeHtml(user?.displayName || '')}</h3>
                <p class="text-muted">${escapeHtml(user?.email || '')}</p>
                <span class="badge badge-primary">${ROLE_NAMES[user?.role] || user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card mt-lg">
          <div class="card-header">
            <h3 class="card-title">Πληροφορίες</h3>
          </div>
          <div class="card-body">
            <div class="settings-info">
              <div class="settings-row">
                <span class="settings-label">Ειδικότητα:</span>
                <span>${escapeHtml(user?.specialty || '-')}</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">Τηλέφωνο:</span>
                <span>${escapeHtml(user?.phone || '-')}</span>
              </div>
              <div class="settings-row">
                <span class="settings-label">Τμήματα:</span>
                <span>${user?.departments?.join(', ') || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  render404() {
    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="placeholder-page">
        <div class="placeholder-icon">🔍</div>
        <h2>Σελίδα δεν βρέθηκε</h2>
        <p class="text-muted">Η σελίδα που ψάχνεις δεν υπάρχει</p>
        <button class="btn btn-primary mt-md" onclick="App.navigateTo('dashboard')">
          Πίσω στην Αρχική
        </button>
      </div>
    `;
  },

  // === LOADING SCREEN ===

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 300);
    }
  }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Export
window.App = App;
