/* ========================================
   SCHEDULE ADJUSTER PAGE - Αλλαγή Προγράμματος
   Schedule Adjuster Integration
   ======================================== */

const ScheduleAdjusterPage = {
  // === RENDER ===

  render() {
    return this.renderScheduleAdjusterView();
  },

  async init() {
    this.initScheduleAdjuster();

    // Add ESC key listener to close fullscreen
    this.escKeyListener = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.closeFullscreen();
      }
    };
    document.addEventListener('keydown', this.escKeyListener);
  },

  destroy() {
    // Remove ESC key listener
    if (this.escKeyListener) {
      document.removeEventListener('keydown', this.escKeyListener);
    }
  },

  // === SCHEDULE ADJUSTER VIEW ===

  renderScheduleAdjusterView() {
    return `
      <div class="schedule-adjuster-page">
        <!-- Hover Zone - Transparent div at top to detect mouse -->
        <div class="hover-detection-zone" id="hover-zone-schedule"></div>

        <!-- Control Buttons (Netflix Style - Shows on hover) -->
        <div class="hover-controls" id="hover-controls-schedule">
          <button class="hover-control-btn" id="fullscreen-btn-schedule" onclick="ScheduleAdjusterPage.enterFullscreen()" title="Πλήρης Οθόνη">
            ⛶
          </button>
          <button class="hover-control-btn hidden" id="exit-fullscreen-btn-schedule" onclick="ScheduleAdjusterPage.exitFullscreen()" title="Έξοδος από Πλήρη Οθόνη">
            ⊡
          </button>
          <button class="hover-control-btn" onclick="ScheduleAdjusterPage.closeFullscreen()" title="Επιστροφή στο Dashboard (ESC)">
            🏠
          </button>
        </div>

        <!-- Schedule Adjuster Container - Full Screen -->
        <div class="advanced-app-container" id="schedule-adjuster-container">
          <iframe
            id="schedule-adjuster-iframe"
            src="../school-platform/alaki prokramatos.html"
            class="anaplirosis-iframe"
            frameborder="0"
            allowfullscreen
            allow="microphone; camera; autoplay; clipboard-write; encrypted-media"
            title="Προσαρμογή Ωραρίου"
            loading="eager"
          ></iframe>
          <div class="iframe-loading" id="iframe-loading">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Φόρτωση Προσαρμογής Ωραρίου...</p>
              <p class="loading-hint">Παρακαλώ περιμένετε...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initScheduleAdjuster() {
    // Setup Netflix-style hover controls
    this.setupHoverControls();

    // Handle iframe load events
    const iframe = document.getElementById('schedule-adjuster-iframe');
    const loadingDiv = document.getElementById('iframe-loading');

    if (!iframe) {
      console.error('Schedule Adjuster iframe element not found!');
      return;
    }

    // Log the iframe src for debugging
    console.log('Loading Schedule Adjuster from:', iframe.src);
    console.log('Current page location:', window.location.href);

    // Show loading initially
    if (loadingDiv) {
      loadingDiv.style.display = 'flex';
    }

    let loadTimeout;
    let hasLoaded = false;

    iframe.onload = () => {
      hasLoaded = true;
      console.log('✅ Schedule Adjuster loaded successfully');
      if (loadTimeout) clearTimeout(loadTimeout);
      // Hide loading spinner
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
    };

    iframe.onerror = () => {
      console.error('❌ Error loading Schedule Adjuster');
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div class="iframe-error">
            <div class="error-icon">⚠️</div>
            <h3>Σφάλμα Φόρτωσης</h3>
            <p>Δεν ήταν δυνατή η φόρτωση της Προσαρμογής Ωραρίου.</p>
            <p class="error-hint">Παρακαλώ ελέγξτε ότι το αρχείο υπάρχει στο <code>../school-platform/alaki prokramatos.html</code></p>
            <button class="btn btn-primary" onclick="location.reload()">Ανανέωση Σελίδας</button>
          </div>
        `;
      }
    };

    // Timeout after 10 seconds
    loadTimeout = setTimeout(() => {
      if (!hasLoaded) {
        console.warn('⚠️ Schedule Adjuster loading timeout');
        // Try alternative paths
        const altPaths = [
          '../school-platform/alaki prokramatos.html',
          './alaki prokramatos.html',
          'alaki prokramatos.html'
        ];

        const currentIndex = altPaths.indexOf(iframe.src);
        if (currentIndex < altPaths.length - 1) {
          console.log('Trying alternative path:', altPaths[currentIndex + 1]);
          iframe.src = altPaths[currentIndex + 1];
        } else {
          // All paths tried, show error
          if (loadingDiv) {
            loadingDiv.innerHTML = `
              <div class="iframe-error">
                <div class="error-icon">⏱️</div>
                <h3>Χρονικό Όριο Φόρτωσης</h3>
                <p>Η Προσαρμογή Ωραρίου χρειάζεται περισσότερο χρόνο για να φορτώσει.</p>
                <p class="error-hint">Παρακαλώ ελέγξτε ότι το αρχείο υπάρχει:</p>
                <ul class="error-list">
                  <li><code>school-platform/alaki prokramatos.html</code></li>
                </ul>
                <button class="btn btn-primary" onclick="location.reload()">Ανανέωση Σελίδας</button>
              </div>
            `;
          }
        }
      }
    }, 10000);
  },

  // === UTILITY FUNCTIONS ===

  openInNewWindow() {
    const iframe = document.getElementById('schedule-adjuster-iframe');
    if (iframe && iframe.src) {
      window.open(iframe.src, '_blank');
    }
  },

  enterFullscreen() {
    const container = document.getElementById('schedule-adjuster-container');
    if (!container) return;

    container.requestFullscreen().then(() => {
      const enterBtn = document.getElementById('fullscreen-btn-schedule');
      const exitBtn = document.getElementById('exit-fullscreen-btn-schedule');
      if (enterBtn) enterBtn.classList.add('hidden');
      if (exitBtn) exitBtn.classList.remove('hidden');
    }).catch(err => {
      console.error('Error entering fullscreen:', err);
    });
  },

  exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        const enterBtn = document.getElementById('fullscreen-btn-schedule');
        const exitBtn = document.getElementById('exit-fullscreen-btn-schedule');
        if (enterBtn) enterBtn.classList.remove('hidden');
        if (exitBtn) exitBtn.classList.add('hidden');
      });
    }
  },

  toggleFullscreen() {
    if (document.fullscreenElement) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  },

  closeFullscreen() {
    // Navigate back to dashboard
    if (window.App && window.App.navigateTo) {
      window.App.navigateTo('dashboard');
    }
  },

  setupHoverControls() {
    // Netflix-style hover controls: show buttons when mouse enters hover zone
    const hoverZone = document.getElementById('hover-zone-schedule');
    const controls = document.getElementById('hover-controls-schedule');

    if (!hoverZone || !controls) {
      console.warn('⚠️ Hover zone or controls not found');
      return;
    }

    let hideTimeout;

    const showControls = () => {
      controls.classList.add('show');
      clearTimeout(hideTimeout);
    };

    const hideControls = () => {
      hideTimeout = setTimeout(() => {
        controls.classList.remove('show');
      }, 500);
    };

    // Show when mouse enters hover zone
    hoverZone.addEventListener('mouseenter', showControls);
    hoverZone.addEventListener('mouseleave', hideControls);

    // Keep visible when hovering the controls themselves
    controls.addEventListener('mouseenter', () => {
      showControls();
    });

    controls.addEventListener('mouseleave', hideControls);

    console.log('✅ Hover controls setup complete');
  }
};

// Export
window.ScheduleAdjusterPage = ScheduleAdjusterPage;
