/* ========================================
   EVENTS PROGRAM PAGE - Πρόγραμμα Εκδηλώσεων
   Events Program Integration
   ======================================== */

const EventsProgramPage = {
  // === RENDER ===

  render() {
    return this.renderEventsProgramView();
  },

  async init() {
    this.initEventsProgram();

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

  // === EVENTS PROGRAM VIEW ===

  renderEventsProgramView() {
    return `
      <div class="events-program-page">
        <!-- Hover Zone - Transparent div at top to detect mouse -->
        <div class="hover-detection-zone" id="hover-zone-events"></div>

        <!-- Control Buttons (Netflix Style - Shows on hover) -->
        <div class="hover-controls" id="hover-controls-events">
          <button class="hover-control-btn" id="fullscreen-btn-events" onclick="EventsProgramPage.enterFullscreen()" title="Πλήρης Οθόνη">
            ⛶
          </button>
          <button class="hover-control-btn hidden" id="exit-fullscreen-btn-events" onclick="EventsProgramPage.exitFullscreen()" title="Έξοδος από Πλήρη Οθόνη">
            ⊡
          </button>
          <button class="hover-control-btn" onclick="EventsProgramPage.closeFullscreen()" title="Επιστροφή στο Dashboard (ESC)">
            🏠
          </button>
        </div>

        <!-- Events Program Container - Full Screen -->
        <div class="advanced-app-container" id="events-program-container">
          <iframe
            id="events-program-iframe"
            src="../kia kathikises eprogramma ekdiloseon/5/y/index.html"
            class="anaplirosis-iframe"
            frameborder="0"
            allowfullscreen
            allow="microphone; camera; autoplay; clipboard-write; encrypted-media"
            title="Πρόγραμμα Εκδηλώσεων"
            loading="eager"
          ></iframe>
          <div class="iframe-loading" id="iframe-loading">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Φόρτωση Προγράμματος Εκδηλώσεων...</p>
              <p class="loading-hint">Παρακαλώ περιμένετε...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initEventsProgram() {
    // Setup Netflix-style hover controls
    this.setupHoverControls();

    // Handle iframe load events
    const iframe = document.getElementById('events-program-iframe');
    const loadingDiv = document.getElementById('iframe-loading');

    if (!iframe) {
      console.error('Events Program iframe element not found!');
      return;
    }

    // Log the iframe src for debugging
    console.log('Loading Events Program from:', iframe.src);
    console.log('Current page location:', window.location.href);

    // Show loading initially
    if (loadingDiv) {
      loadingDiv.style.display = 'flex';
    }

    let loadTimeout;
    let hasLoaded = false;

    iframe.onload = () => {
      hasLoaded = true;
      console.log('✅ Events Program loaded successfully');
      if (loadTimeout) clearTimeout(loadTimeout);
      // Hide loading spinner
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
    };

    iframe.onerror = () => {
      console.error('❌ Error loading Events Program');
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div class="iframe-error">
            <div class="error-icon">⚠️</div>
            <h3>Σφάλμα Φόρτωσης</h3>
            <p>Δεν ήταν δυνατή η φόρτωση του Προγράμματος Εκδηλώσεων.</p>
            <p class="error-hint">Παρακαλώ ελέγξτε ότι το αρχείο υπάρχει στο <code>../kia kathikises eprogramma ekdiloseon/5/y/index.html</code></p>
            <button class="btn btn-primary" onclick="location.reload()">Ανανέωση Σελίδας</button>
          </div>
        `;
      }
    };

    // Timeout after 10 seconds
    loadTimeout = setTimeout(() => {
      if (!hasLoaded) {
        console.warn('⚠️ Events Program loading timeout');
        // Try alternative paths
        const altPaths = [
          '../kia kathikises eprogramma ekdiloseon/5/y/index.html',
          '../../kia kathikises eprogramma ekdiloseon/5/y/index.html',
          './kia kathikises eprogramma ekdiloseon/5/y/index.html'
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
                <p>Το Πρόγραμμα Εκδηλώσεων χρειάζεται περισσότερο χρόνο για να φορτώσει.</p>
                <p class="error-hint">Παρακαλώ ελέγξτε ότι το αρχείο υπάρχει:</p>
                <ul class="error-list">
                  <li><code>kia kathikises eprogramma ekdiloseon/5/y/index.html</code></li>
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
    const iframe = document.getElementById('events-program-iframe');
    if (iframe && iframe.src) {
      window.open(iframe.src, '_blank');
    }
  },

  enterFullscreen() {
    const container = document.getElementById('events-program-container');
    if (!container) return;

    container.requestFullscreen().then(() => {
      const enterBtn = document.getElementById('fullscreen-btn-events');
      const exitBtn = document.getElementById('exit-fullscreen-btn-events');
      if (enterBtn) enterBtn.classList.add('hidden');
      if (exitBtn) exitBtn.classList.remove('hidden');
    }).catch(err => {
      console.error('Error entering fullscreen:', err);
    });
  },

  exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        const enterBtn = document.getElementById('fullscreen-btn-events');
        const exitBtn = document.getElementById('exit-fullscreen-btn-events');
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
    const hoverZone = document.getElementById('hover-zone-events');
    const controls = document.getElementById('hover-controls-events');

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
window.EventsProgramPage = EventsProgramPage;
