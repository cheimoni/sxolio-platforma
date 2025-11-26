/* ========================================
   SUBSTITUTIONS PAGE - Αντικαταστάσεις
   Anaplirosis React App Integration
   ======================================== */

const SubstitutionsPage = {
  // === RENDER ===
  
  render() {
    // Always render Anaplirosis (advanced view)
    return this.renderAnaplirosisView();
  },

  async init() {
    // Always initialize Anaplirosis
    this.initAnaplirosis();

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

  // === ANAPLIROSIS VIEW (React App) ===

  renderAnaplirosisView() {
    // Calculate correct path dynamically
    const anaplirosisPath = this.getAnaplirosisPath();

    return `
      <div class="substitutions-advanced-page">
        <!-- Hover Zone - Transparent div at top to detect mouse -->
        <div class="hover-detection-zone" id="hover-zone"></div>

        <!-- Control Buttons (Netflix Style - Shows on hover) -->
        <div class="hover-controls" id="hover-controls">
          <button class="hover-control-btn" id="fullscreen-btn" onclick="SubstitutionsPage.enterFullscreen()" title="Πλήρης Οθόνη">
            ⛶
          </button>
          <button class="hover-control-btn hidden" id="exit-fullscreen-btn" onclick="SubstitutionsPage.exitFullscreen()" title="Πατήστε ESC για έξοδο από πλήρη οθόνη">
            ⊡
          </button>
          <button class="hover-control-btn" onclick="SubstitutionsPage.closeFullscreen()" title="Πατήστε ESC για επιστροφή στο Dashboard">
            🏠
          </button>
        </div>

        <!-- React App Container - Full Screen -->
        <div class="advanced-app-container" id="anaplirosis-container">
          <iframe
            id="anaplirosis-iframe"
            src="${anaplirosisPath}"
            class="anaplirosis-iframe"
            frameborder="0"
            allowfullscreen
            allow="microphone; camera; autoplay; clipboard-write; encrypted-media"
            title="Σύστημα Αναπληρώσεων - Anaplirosis"
            loading="eager"
          ></iframe>
          <div class="iframe-loading" id="iframe-loading">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Φόρτωση Συστήματος Αναπληρώσεων...</p>
              <p class="loading-hint">Παρακαλώ περιμένετε...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getAnaplirosisPath() {
    // Always use relative path to the build folder
    return '../anaplirosis/build/index.html';
  },

  initAnaplirosis() {
    // Setup Netflix-style hover controls
    this.setupHoverControls();

    // Handle iframe load events
    const iframe = document.getElementById('anaplirosis-iframe');
    const loadingDiv = document.getElementById('iframe-loading');

    if (!iframe) {
      console.error('Iframe element not found!');
      return;
    }

    // Log the iframe src for debugging
    console.log('🎯 Anaplirosis Init');
    console.log('  📁 Iframe src:', iframe.src);
    console.log('  📍 Current location:', window.location.href);
    console.log('  🌐 Current pathname:', window.location.pathname);
    console.log('  🖥️  Hostname:', window.location.hostname || '(file mode)');

    // Show loading initially
    if (loadingDiv) {
      loadingDiv.style.display = 'flex';
    }

    let loadTimeout;
    let hasLoaded = false;

    iframe.onload = () => {
      hasLoaded = true;
      console.log('✅ Anaplirosis app loaded successfully');
      if (loadTimeout) clearTimeout(loadTimeout);
      // Hide loading spinner
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
    };

    iframe.onerror = (error) => {
      console.error('❌ Failed to load anaplirosis app:', error);
      if (loadTimeout) clearTimeout(loadTimeout);
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
      // Don't show error immediately - the iframe might still load
      console.log('ℹ️ Iframe error event triggered, but waiting for timeout...');
    };

    // Check if iframe loads after a delay
    loadTimeout = setTimeout(() => {
      if (!hasLoaded && loadingDiv && loadingDiv.style.display !== 'none') {
        console.warn('⚠️ Iframe loading timeout - checking status');
        // Simply hide loading - iframe might have loaded but cross-origin prevents detection
        console.log('ℹ️ Hiding loading screen and assuming iframe loaded (cross-origin)');
        if (loadingDiv) {
          loadingDiv.style.display = 'none';
        }
        // Don't show error - iframe typically loads fine but we can't detect it due to cross-origin
      }
    }, 3000); // Shorter timeout - just hide loading spinner
  },

  showIframeError() {
    const container = document.getElementById('anaplirosis-container');
    if (container) {
      container.innerHTML = `
        <div class="iframe-error">
          <div class="error-icon">⚠️</div>
          <h3>Δεν ήταν δυνατή η φόρτωση του Συστήματος Αναπληρώσεων</h3>
          <p>Το σύστημα αναπληρώσεων (Anaplirosis) δεν μπόρεσε να φορτωθεί.</p>
          <div class="error-details">
            <p><strong>Πιθανές αιτίες:</strong></p>
            <ul>
              <li>Το build folder δεν υπάρχει: <code>anaplirosis/build/index.html</code></li>
              <li>Χρειάζεται να τρέξεις <code>npm run build</code> στο anaplirosis folder</li>
              <li>Πρόβλημα με το path του iframe</li>
              <li>Πρόβλημα CORS ή network</li>
            </ul>
            <p class="error-help">
              <strong>Λύση:</strong> Βεβαιωθείτε ότι έχετε τρέξει <code>npm run build</code> 
              στο <code>anaplirosis</code> folder και ότι το build folder περιέχει το <code>index.html</code>.
            </p>
          </div>
          <div class="error-actions">
            <button class="btn btn-primary" onclick="SubstitutionsPage.retryIframe()">
              🔄 Δοκιμή ξανά
            </button>
            <button class="btn btn-secondary" onclick="location.reload()">
              🔃 Ανανέωση Σελίδας
            </button>
          </div>
        </div>
      `;
    }
  },

  retryIframe() {
    const container = document.getElementById('anaplirosis-container');
    if (container) {
      // Try different paths
      const paths = [
        './anaplirosis/build/index.html',
        '../anaplirosis/build/index.html',
        '../../anaplirosis/build/index.html'
      ];
      
      let currentPathIndex = 0;
      const tryNextPath = () => {
        if (currentPathIndex >= paths.length) {
          this.showIframeError();
          return;
        }
        
        const path = paths[currentPathIndex];
        console.log('Trying path:', path);
        
        container.innerHTML = `
          <iframe
            id="anaplirosis-iframe"
            src="${path}"
            class="anaplirosis-iframe"
            frameborder="0"
            allowfullscreen
            allow="microphone; camera; autoplay; clipboard-write; encrypted-media"
            loading="eager"
            title="Προηγμένο Σύστημα Αναπληρώσεων - Anaplirosis"
          ></iframe>
          <div class="iframe-loading" id="iframe-loading">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Φόρτωση Προηγμένου Συστήματος...</p>
              <p class="loading-hint">Δοκιμάζοντας path: ${path}</p>
            </div>
          </div>
        `;
        
        const iframe = document.getElementById('anaplirosis-iframe');
        if (iframe) {
          iframe.onload = () => {
            console.log('✅ Successfully loaded with path:', path);
            const loadingDiv = document.getElementById('iframe-loading');
            if (loadingDiv) {
              loadingDiv.style.display = 'none';
            }
          };
          
          iframe.onerror = () => {
            console.warn('❌ Failed with path:', path);
            currentPathIndex++;
            setTimeout(tryNextPath, 1000);
          };
        }
        
        this.initAnaplirosis();
      };
      
      tryNextPath();
    }
  },

  openInNewWindow() {
    // Calculate correct path based on current location
    const currentPath = window.location.pathname;
    const currentProtocol = window.location.protocol;
    let anaplirosisPath;
    
    if (currentProtocol === 'file:') {
      // File mode - Use localhost server to avoid CORS issues
      anaplirosisPath = 'http://localhost:3000';
    } else if (currentPath.includes('/school-platform/')) {
      anaplirosisPath = '../anaplirosis/build/index.html';
    } else if (currentPath.endsWith('/') || currentPath.endsWith('/index.html')) {
      anaplirosisPath = './anaplirosis/build/index.html';
    } else {
      anaplirosisPath = '../anaplirosis/build/index.html';
    }
    
    console.log('Opening Anaplirosis in new window from:', anaplirosisPath);
    const newWindow = window.open(anaplirosisPath, '_blank', 'width=1400,height=900');
    
    if (!newWindow) {
      showToast('Το popup μπλοκαρίστηκε. Επιτρέψτε popups για αυτόν τον ιστότοπο.', 'warning');
    }
  },

  enterFullscreen() {
    const container = document.getElementById('anaplirosis-container');
    if (!container) return;

    container.requestFullscreen().then(() => {
      // Show exit fullscreen button, hide enter fullscreen button
      const enterBtn = document.getElementById('fullscreen-btn');
      const exitBtn = document.getElementById('exit-fullscreen-btn');
      if (enterBtn) enterBtn.classList.add('hidden');
      if (exitBtn) exitBtn.classList.remove('hidden');
    }).catch(err => {
      console.error('Error entering fullscreen:', err);
    });
  },

  exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        // Show enter fullscreen button, hide exit fullscreen button
        const enterBtn = document.getElementById('fullscreen-btn');
        const exitBtn = document.getElementById('exit-fullscreen-btn');
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
    const hoverZone = document.getElementById('hover-zone');
    const controls = document.getElementById('hover-controls');

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
  },

};

// Export
window.SubstitutionsPage = SubstitutionsPage;
