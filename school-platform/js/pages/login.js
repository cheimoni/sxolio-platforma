/* ========================================
   LOGIN PAGE - Σύνδεση & Εγγραφή
   ======================================== */

const LoginPage = {
  container: null,
  currentView: 'login', // 'login' | 'register' | 'success'

  // === INITIALIZATION ===

  init(containerId) {
    this.container = document.getElementById(containerId);
    this.currentView = 'login';
  },

  // === RENDER ===

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="login-page">
        <div class="login-card ${this.currentView === 'register' ? 'register-mode' : ''}">
          <div class="login-header">
            <div class="login-logo">🏫</div>
            <h1 class="login-title">Σχολική Πλατφόρμα</h1>
            <p class="login-subtitle" id="login-subtitle">
              ${this.currentView === 'login' ? 'Συνδεθείτε στο λογαριασμό σας' : 'Αίτηση Εγγραφής'}
            </p>
          </div>

          <!-- Login/Register Tabs -->
          <div class="auth-tabs">
            <button class="auth-tab ${this.currentView === 'login' ? 'active' : ''}"
                    onclick="LoginPage.switchView('login')">
              Σύνδεση
            </button>
            <button class="auth-tab ${this.currentView === 'register' ? 'active' : ''}"
                    onclick="LoginPage.switchView('register')">
              Εγγραφή
            </button>
          </div>

          <!-- Forms Container -->
          <div class="auth-forms">
            ${this.currentView === 'login' ? this.renderLoginForm() : ''}
            ${this.currentView === 'register' ? this.renderRegisterForm() : ''}
            ${this.currentView === 'success' ? this.renderSuccessMessage() : ''}
          </div>

          ${this.currentView === 'login' ? `
            <div class="login-footer">
              <a href="#" class="login-link" id="forgot-password-link">
                Ξεχάσατε τον κωδικό;
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.attachEvents();
  },

  renderLoginForm() {
    return `
      <form class="login-form" id="login-form">
        <div class="input-group">
          <label class="input-label" for="login-email">Email</label>
          <input
            type="email"
            class="input"
            id="login-email"
            placeholder="email@school.gr"
            required
          >
        </div>

        <div class="input-group">
          <label class="input-label" for="login-password">Κωδικός</label>
          <input
            type="password"
            class="input"
            id="login-password"
            placeholder="••••••••"
            required
          >
        </div>

        <div class="login-error hidden" id="login-error"></div>

        <button type="submit" class="btn btn-primary w-full" id="login-btn">
          Σύνδεση
        </button>
      </form>
    `;
  },

  renderRegisterForm() {
    return `
      <form class="login-form register-form" id="register-form">
        <div class="register-info">
          <p>Συμπληρώστε τα στοιχεία σας για να υποβάλετε αίτηση πρόσβασης.
          Ο διαχειριστής θα εξετάσει την αίτησή σας και θα σας ενημερώσει.</p>
        </div>

        <div class="input-group">
          <label class="input-label" for="reg-name">Ονοματεπώνυμο *</label>
          <input
            type="text"
            class="input"
            id="reg-name"
            placeholder="π.χ. Γιάννης Παπαδόπουλος"
            required
          >
        </div>

        <div class="input-group">
          <label class="input-label" for="reg-email">Email *</label>
          <input
            type="email"
            class="input"
            id="reg-email"
            placeholder="email@school.gr"
            required
          >
        </div>

        <div class="form-row">
          <div class="input-group">
            <label class="input-label" for="reg-password">Κωδικός *</label>
            <input
              type="password"
              class="input"
              id="reg-password"
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              minlength="6"
              required
            >
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-password-confirm">Επιβεβαίωση *</label>
            <input
              type="password"
              class="input"
              id="reg-password-confirm"
              placeholder="Επαναλάβετε τον κωδικό"
              required
            >
          </div>
        </div>

        <div class="form-row">
          <div class="input-group">
            <label class="input-label" for="reg-phone">Τηλέφωνο</label>
            <input
              type="tel"
              class="input"
              id="reg-phone"
              placeholder="69xxxxxxxx"
            >
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-specialty">Ειδικότητα</label>
            <input
              type="text"
              class="input"
              id="reg-specialty"
              placeholder="π.χ. ΠΕ02 Φιλόλογος"
            >
          </div>
        </div>

        <div class="input-group">
          <label class="input-label" for="reg-message">Μήνυμα προς διαχειριστή</label>
          <textarea
            class="input"
            id="reg-message"
            rows="2"
            placeholder="Προαιρετικό μήνυμα..."
          ></textarea>
        </div>

        <div class="login-error hidden" id="register-error"></div>

        <button type="submit" class="btn btn-primary w-full" id="register-btn">
          Υποβολή Αίτησης
        </button>
      </form>
    `;
  },

  renderSuccessMessage() {
    return `
      <div class="register-success">
        <div class="success-icon">✅</div>
        <h2>Η αίτησή σας υποβλήθηκε!</h2>
        <p>Ο διαχειριστής θα εξετάσει την αίτησή σας και θα σας αποδώσει ρόλο στην πλατφόρμα.</p>
        <p>Θα λάβετε ειδοποίηση μόλις εγκριθεί η πρόσβασή σας.</p>
        <button class="btn btn-secondary" onclick="LoginPage.switchView('login')">
          Επιστροφή στη Σύνδεση
        </button>
      </div>
    `;
  },

  // === VIEW SWITCHING ===

  switchView(view) {
    this.currentView = view;
    this.render();
  },

  // === EVENTS ===

  attachEvents() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotLink = document.getElementById('forgot-password-link');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleForgotPassword();
      });
    }
  },

  // === HANDLERS ===

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-btn');

    // Validation
    if (!email || !password) {
      this.showError('login-error', 'Συμπληρώστε όλα τα πεδία');
      return;
    }

    if (!isValidEmail(email)) {
      this.showError('login-error', 'Μη έγκυρο email');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Σύνδεση...';
    this.hideError('login-error');

    // Attempt login
    const result = await AuthService.login(email, password);

    if (result.success) {
      // App will handle navigation via auth state change
    } else {
      this.showError('login-error', result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Σύνδεση';
    }
  },

  async handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    const phone = document.getElementById('reg-phone').value.trim();
    const specialty = document.getElementById('reg-specialty').value.trim();
    const message = document.getElementById('reg-message').value.trim();
    const submitBtn = document.getElementById('register-btn');

    // Validation
    if (!name || !email || !password || !passwordConfirm) {
      this.showError('register-error', 'Συμπληρώστε όλα τα υποχρεωτικά πεδία');
      return;
    }

    if (!isValidEmail(email)) {
      this.showError('register-error', 'Μη έγκυρο email');
      return;
    }

    if (password.length < 6) {
      this.showError('register-error', 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }

    if (password !== passwordConfirm) {
      this.showError('register-error', 'Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Υποβολή...';
    this.hideError('register-error');

    // Attempt registration
    const result = await AuthService.register({
      displayName: name,
      email: email,
      password: password,
      phone: phone,
      specialty: specialty,
      message: message
    });

    if (result.success) {
      this.switchView('success');
    } else {
      this.showError('register-error', result.error);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Υποβολή Αίτησης';
    }
  },

  async handleForgotPassword() {
    const email = document.getElementById('login-email').value.trim();

    if (!email) {
      this.showError('login-error', 'Εισάγετε το email σας πρώτα');
      return;
    }

    if (!isValidEmail(email)) {
      this.showError('login-error', 'Μη έγκυρο email');
      return;
    }

    const result = await AuthService.resetPassword(email);

    if (result.success) {
      showToast('Ελέγξτε το email σας για οδηγίες', 'success');
    } else {
      this.showError('login-error', result.error);
    }
  },

  // === HELPERS ===

  showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  },

  hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }
};

// Export
window.LoginPage = LoginPage;
