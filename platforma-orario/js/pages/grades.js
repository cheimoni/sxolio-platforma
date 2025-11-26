/* ========================================
   GRADES PAGE - Βαθμολογία
   Batholokio React App Integration
   ======================================== */

const GradesPage = {
  // === RENDER ===
  
  render() {
    // Always render Batholokio (React app)
    return this.renderBatholokioView();
  },

  async init() {
    // Always initialize Batholokio
    this.initBatholokio();
  },

  destroy() {
    // Cleanup if needed
  },

  // === BATHOLOKIO VIEW (React App) ===

  renderBatholokioView() {
    return `
      <div class="grades-page">
        <!-- Header Bar -->
        <div class="advanced-header">
          <div class="advanced-header-left">
            <div class="header-title-group">
              <h2>📊 Σύστημα Βαθμολογίας</h2>
              <span class="advanced-header-subtitle">Πλήρες σύστημα διαχείρισης βαθμών μαθητών με προβολή, επεξεργασία και αναφορές</span>
            </div>
          </div>
          <div class="advanced-header-right">
            <button class="btn btn-icon" onclick="GradesPage.openInNewWindow()" title="Άνοιγμα σε νέο παράθυρο">
              <span class="btn-icon-text">↗️</span>
              <span class="btn-tooltip">Νέο Παράθυρο</span>
            </button>
            <button class="btn btn-icon" onclick="GradesPage.toggleFullscreen()" title="Πλήρης οθόνη">
              <span class="btn-icon-text">⛶</span>
              <span class="btn-tooltip">Πλήρης Οθόνη</span>
            </button>
          </div>
        </div>

        <!-- React App Container -->
        <div class="advanced-app-container" id="batholokio-container">
          <iframe
            id="batholokio-iframe"
            src="../batholokio/build/index.html"
            class="anaplirosis-iframe"
            frameborder="0"
            allowfullscreen
            allow="microphone; camera; autoplay; clipboard-write; encrypted-media"
            title="Σύστημα Βαθμολογίας - Batholokio"
            loading="eager"
          ></iframe>
          <div class="iframe-loading" id="iframe-loading">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Φόρτωση Συστήματος Βαθμολογίας...</p>
              <p class="loading-hint">Παρακαλώ περιμένετε...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initBatholokio() {
    // Handle iframe load events
    const iframe = document.getElementById('batholokio-iframe');
    const loadingDiv = document.getElementById('iframe-loading');
    
    if (!iframe) {
      console.error('Iframe element not found!');
      return;
    }

    // Log the iframe src for debugging
    console.log('Loading Batholokio from:', iframe.src);
    console.log('Current page location:', window.location.href);

    // Show loading initially
    if (loadingDiv) {
      loadingDiv.style.display = 'flex';
    }

    let loadTimeout;
    let hasLoaded = false;

    iframe.onload = () => {
      hasLoaded = true;
      console.log('✅ Batholokio app loaded successfully');
      if (loadTimeout) clearTimeout(loadTimeout);
      // Hide loading spinner
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
    };

    iframe.onerror = () => {
      console.error('❌ Error loading Batholokio app');
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div class="iframe-error">
            <div class="error-icon">⚠️</div>
            <h3>Σφάλμα Φόρτωσης</h3>
            <p>Δεν ήταν δυνατή η φόρτωση του Συστήματος Βαθμολογίας.</p>
            <p class="error-hint">Παρακαλώ ελέγξτε ότι το build του Batholokio υπάρχει στο <code>../batholokio/build/</code></p>
            <button class="btn btn-primary" onclick="location.reload()">Ανανέωση Σελίδας</button>
          </div>
        `;
      }
    };

    // Timeout after 10 seconds
    loadTimeout = setTimeout(() => {
      if (!hasLoaded) {
        console.warn('⚠️ Batholokio app loading timeout');
        // Try alternative paths
        const currentSrc = iframe.src;
        const altPaths = [
          '../batholokio/build/index.html',
          '../../batholokio/build/index.html',
          './batholokio/build/index.html'
        ];
        
        const currentIndex = altPaths.indexOf(currentSrc);
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
                <p>Το Σύστημα Βαθμολογίας χρειάζεται περισσότερο χρόνο για να φορτώσει.</p>
                <p class="error-hint">Παρακαλώ ελέγξτε:</p>
                <ul class="error-list">
                  <li>Ότι το build υπάρχει: <code>batholokio/build/index.html</code></li>
                  <li>Ότι το build έχει γίνει με <code>npm run build</code></li>
                  <li>Ότι το <code>package.json</code> έχει <code>"homepage": "."</code></li>
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
    const iframe = document.getElementById('batholokio-iframe');
    if (iframe && iframe.src) {
      window.open(iframe.src, '_blank');
    }
  },

  toggleFullscreen() {
    const container = document.getElementById('batholokio-container');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
};

// Export
window.GradesPage = GradesPage;

