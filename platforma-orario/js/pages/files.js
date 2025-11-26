/* ========================================
   FILES PAGE - Διαχείριση Αρχείων
   ======================================== */

const FilesPage = {
  currentCategory: 'all',
  files: [],
  unsubscribe: null,

  render() {
    return `
      <div class="files-page">
        <div class="page-header">
          <h1>Αρχεία</h1>
          ${this.canUpload() ? `
            <button class="btn btn-primary" onclick="FilesPage.showUploadModal()">
              + Νέο Αρχείο
            </button>
          ` : ''}
        </div>

        <!-- Filters -->
        <div class="files-filters">
          <button class="btn ${this.currentCategory === 'all' ? 'btn-primary' : 'btn-secondary'}"
                  onclick="FilesPage.filterByCategory('all')">
            Όλα
          </button>
          ${Object.entries(FILE_CATEGORIES).map(([key, label]) => `
            <button class="btn ${this.currentCategory === key ? 'btn-primary' : 'btn-secondary'}"
                    onclick="FilesPage.filterByCategory('${key}')">
              ${label}
            </button>
          `).join('')}
        </div>

        <!-- Files Grid -->
        <div id="files-container" class="files-grid">
          <div class="loading-spinner">Φόρτωση...</div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div id="upload-modal" class="modal hidden">
        <div class="modal-overlay" onclick="FilesPage.hideUploadModal()"></div>
        <div class="modal-container modal-lg">
          <div class="modal-header">
            <h2 class="modal-title">Ανέβασμα Αρχείου</h2>
            <button class="modal-close" onclick="FilesPage.hideUploadModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="upload-form" onsubmit="FilesPage.handleUpload(event)">
              <div class="form-group">
                <label class="form-label">Αρχείο *</label>
                <div class="file-drop-zone" id="file-drop-zone">
                  <input type="file" id="file-input" class="file-input" onchange="FilesPage.handleFileSelect(event)">
                  <div class="file-drop-content">
                    <span class="file-drop-icon">📁</span>
                    <p>Σύρετε αρχείο εδώ ή κάντε κλικ για επιλογή</p>
                    <p class="file-drop-hint">Μέγιστο μέγεθος: 10MB</p>
                  </div>
                  <div class="file-selected hidden" id="file-selected">
                    <span class="file-selected-icon">📄</span>
                    <span class="file-selected-name" id="file-selected-name"></span>
                    <button type="button" class="btn btn-sm" onclick="FilesPage.clearFileSelection()">✕</button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Κατηγορία *</label>
                <select id="file-category" class="form-input" required>
                  ${Object.entries(FILE_CATEGORIES).map(([key, label]) => `
                    <option value="${key}">${label}</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Περιγραφή</label>
                <textarea id="file-description" class="form-input" rows="3"
                          placeholder="Προαιρετική περιγραφή του αρχείου..."></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="FilesPage.hideUploadModal()">
                  Ακύρωση
                </button>
                <button type="submit" class="btn btn-primary" id="upload-btn">
                  Ανέβασμα
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- File View Modal -->
      <div id="file-view-modal" class="modal hidden">
        <div class="modal-overlay" onclick="FilesPage.hideViewModal()"></div>
        <div class="modal-container modal-lg">
          <div class="modal-header">
            <h2 class="modal-title" id="view-file-title">Αρχείο</h2>
            <button class="modal-close" onclick="FilesPage.hideViewModal()">&times;</button>
          </div>
          <div class="modal-body" id="file-view-content">
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    this.setupSubscription();
    this.setupDragDrop();
  },

  setupSubscription() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = FilesService.subscribe(files => {
      this.files = files;
      this.renderFiles();
    });
  },

  renderFiles() {
    const container = document.getElementById('files-container');
    if (!container) return;

    let filteredFiles = this.files;
    if (this.currentCategory !== 'all') {
      filteredFiles = this.files.filter(f => f.category === this.currentCategory);
    }

    if (filteredFiles.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>Δεν υπάρχουν αρχεία</h3>
          <p>${this.currentCategory === 'all' ? 'Δεν έχουν ανέβει αρχεία ακόμα.' : 'Δεν υπάρχουν αρχεία σε αυτή την κατηγορία.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredFiles.map(file => this.renderFileCard(file)).join('');
  },

  renderFileCard(file) {
    const icon = FilesService.getFileIcon(file.type);
    const size = FilesService.formatSize(file.size);
    const date = file.createdAt?.toDate ?
      file.createdAt.toDate().toLocaleDateString('el-GR') :
      'Άγνωστη';
    const canDelete = this.canDelete(file);

    return `
      <div class="file-card" onclick="FilesPage.viewFile('${file.id}')">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">
            <span class="file-size">${size}</span>
            <span class="file-date">${date}</span>
          </div>
          <div class="file-category-badge">${FILE_CATEGORIES[file.category] || file.category}</div>
        </div>
        <div class="file-actions" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-primary" onclick="FilesPage.downloadFile('${file.id}')" title="Λήψη">
            ⬇
          </button>
          ${canDelete ? `
            <button class="btn btn-sm btn-danger" onclick="FilesPage.deleteFile('${file.id}')" title="Διαγραφή">
              🗑
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  filterByCategory(category) {
    this.currentCategory = category;

    // Update button states
    document.querySelectorAll('.files-filters .btn').forEach(btn => {
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    });
    event.target.classList.remove('btn-secondary');
    event.target.classList.add('btn-primary');

    this.renderFiles();
  },

  // === PERMISSIONS ===

  canUpload() {
    const user = AuthService.currentUserData;
    if (!user) return false;
    // Admin έχει ΟΛΑ τα δικαιώματα
    if (user.role === 'admin') return true;
    return ['διευθυντής', 'βδα', 'βδ', 'γραμματεία', 'υτ'].includes(user.role);
  },

  canDelete(file) {
    const user = AuthService.currentUserData;
    if (!user) return false;
    // Admin έχει ΟΛΑ τα δικαιώματα
    if (user.role === 'admin') return true;
    // Owner can delete
    if (file.uploadedBy === AuthService.currentUser?.uid) return true;
    // Directors can delete any
    return ['διευθυντής', 'βδα'].includes(user.role);
  },

  // === UPLOAD ===

  showUploadModal() {
    document.getElementById('upload-modal').classList.remove('hidden');
    document.getElementById('upload-form').reset();
    this.clearFileSelection();
  },

  hideUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
  },

  setupDragDrop() {
    setTimeout(() => {
      const dropZone = document.getElementById('file-drop-zone');
      if (!dropZone) return;

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.selectFile(files[0]);
        }
      });
    }, 100);
  },

  selectedFile: null,

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.selectFile(file);
    }
  },

  selectFile(file) {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 10MB');
      return;
    }

    this.selectedFile = file;

    document.querySelector('.file-drop-content').classList.add('hidden');
    document.getElementById('file-selected').classList.remove('hidden');
    document.getElementById('file-selected-name').textContent = file.name;
  },

  clearFileSelection() {
    this.selectedFile = null;
    document.getElementById('file-input').value = '';
    document.querySelector('.file-drop-content').classList.remove('hidden');
    document.getElementById('file-selected').classList.add('hidden');
  },

  async handleUpload(event) {
    event.preventDefault();

    if (!this.selectedFile) {
      alert('Παρακαλώ επιλέξτε ένα αρχείο');
      return;
    }

    const btn = document.getElementById('upload-btn');
    btn.disabled = true;
    btn.textContent = 'Ανέβασμα...';

    const metadata = {
      category: document.getElementById('file-category').value,
      description: document.getElementById('file-description').value.trim()
    };

    const result = await FilesService.upload(this.selectedFile, metadata);

    btn.disabled = false;
    btn.textContent = 'Ανέβασμα';

    if (result.success) {
      this.hideUploadModal();
      // Files will update via subscription
    } else {
      alert('Σφάλμα: ' + result.error);
    }
  },

  // === VIEW & DOWNLOAD ===

  viewFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;

    document.getElementById('view-file-title').textContent = file.name;

    const content = document.getElementById('file-view-content');
    const isImage = file.type.includes('image');

    content.innerHTML = `
      <div class="file-view-details">
        ${isImage ? `
          <div class="file-preview">
            <img src="${file.url}" alt="${file.name}" style="max-width: 100%; max-height: 400px;">
          </div>
        ` : `
          <div class="file-preview-icon">${FilesService.getFileIcon(file.type)}</div>
        `}

        <div class="file-view-info">
          <div class="info-row">
            <span class="info-label">Όνομα:</span>
            <span class="info-value">${file.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Μέγεθος:</span>
            <span class="info-value">${FilesService.formatSize(file.size)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Τύπος:</span>
            <span class="info-value">${file.type}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Κατηγορία:</span>
            <span class="info-value">${FILE_CATEGORIES[file.category] || file.category}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ανέβηκε από:</span>
            <span class="info-value">${file.uploaderName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ημερομηνία:</span>
            <span class="info-value">${file.createdAt?.toDate ? file.createdAt.toDate().toLocaleDateString('el-GR') : '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Λήψεις:</span>
            <span class="info-value">${file.downloads || 0}</span>
          </div>
          ${file.description ? `
            <div class="info-row">
              <span class="info-label">Περιγραφή:</span>
              <span class="info-value">${file.description}</span>
            </div>
          ` : ''}
        </div>

        <div class="file-view-actions">
          <button class="btn btn-primary" onclick="FilesPage.downloadFile('${file.id}')">
            ⬇ Λήψη Αρχείου
          </button>
        </div>
      </div>
    `;

    document.getElementById('file-view-modal').classList.remove('hidden');
  },

  hideViewModal() {
    document.getElementById('file-view-modal').classList.add('hidden');
  },

  async downloadFile(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return;

    // Increment download count
    FilesService.incrementDownloads(fileId);

    // Open download in new tab
    window.open(file.url, '_blank');
  },

  async deleteFile(fileId) {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αρχείο;')) {
      return;
    }

    const result = await FilesService.delete(fileId);

    if (!result.success) {
      alert('Σφάλμα: ' + result.error);
    }
    // Files will update via subscription
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
window.FilesPage = FilesPage;
