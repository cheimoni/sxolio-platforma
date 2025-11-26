/* ========================================
   FILES SERVICE - Upload/Download αρχείων
   ======================================== */

const FilesService = {
  // Active listeners
  activeListeners: [],

  // === FETCH METHODS ===

  // Λήψη όλων των αρχείων
  async getAll() {
    try {
      const snapshot = await firebaseDb.collection('files')
        .orderBy('createdAt', 'desc')
        .get();

      const files = [];
      snapshot.forEach(doc => {
        files.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: files };
    } catch (error) {
      console.error('Error fetching files:', error);
      return { success: false, error: error.message };
    }
  },

  // Λήψη αρχείων ανά κατηγορία
  async getByCategory(category) {
    try {
      const snapshot = await firebaseDb.collection('files')
        .where('category', '==', category)
        .orderBy('createdAt', 'desc')
        .get();

      const files = [];
      snapshot.forEach(doc => {
        files.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: files };
    } catch (error) {
      console.error('Error fetching files by category:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener
  subscribe(callback) {
    const unsubscribe = firebaseDb.collection('files')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const files = [];
        snapshot.forEach(doc => {
          files.push({ id: doc.id, ...doc.data() });
        });
        callback(files);
      }, error => {
        console.error('Files subscription error:', error);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // === UPLOAD ===

  // Upload αρχείου
  async upload(file, metadata) {
    try {
      const currentUser = AuthService.currentUserData;
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `files/${metadata.category}/${fileName}`;

      // Upload to Storage
      const storageRef = firebaseStorage.ref(filePath);
      const uploadTask = await storageRef.put(file);
      const downloadUrl = await uploadTask.ref.getDownloadURL();

      // Save metadata to Firestore
      const fileData = {
        name: file.name,
        fileName: fileName,
        path: filePath,
        url: downloadUrl,
        size: file.size,
        type: file.type,
        category: metadata.category || 'other',
        subcategory: metadata.subcategory || '',
        description: metadata.description || '',
        tags: metadata.tags || [],
        sharedWith: metadata.sharedWith || ['all'],
        uploadedBy: AuthService.currentUser.uid,
        uploaderName: currentUser?.displayName || 'Άγνωστος',
        downloads: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('files').add(fileData);

      return { success: true, id: docRef.id, url: downloadUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  },

  // === DELETE ===

  async delete(fileId) {
    try {
      // Get file data first
      const doc = await firebaseDb.collection('files').doc(fileId).get();
      if (!doc.exists) {
        return { success: false, error: 'Το αρχείο δεν βρέθηκε' };
      }

      const fileData = doc.data();

      // Delete from Storage
      if (fileData.path) {
        try {
          const storageRef = firebaseStorage.ref(fileData.path);
          await storageRef.delete();
        } catch (storageError) {
          console.warn('Storage delete error:', storageError);
        }
      }

      // Delete from Firestore
      await firebaseDb.collection('files').doc(fileId).delete();

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  },

  // === UPDATE ===

  async update(fileId, data) {
    try {
      await firebaseDb.collection('files').doc(fileId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating file:', error);
      return { success: false, error: error.message };
    }
  },

  // Increment download count
  async incrementDownloads(fileId) {
    try {
      await firebaseDb.collection('files').doc(fileId).update({
        downloads: firebase.firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error('Error incrementing downloads:', error);
    }
  },

  // === HELPERS ===

  // Format file size
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Get file icon based on type
  getFileIcon(type) {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('video')) return '🎬';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  },

  // Get category name
  getCategoryName(category) {
    return FILE_CATEGORY_NAMES[category] || category;
  },

  // === CLEANUP ===

  unsubscribeAll() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
  }
};

// Export
window.FilesService = FilesService;
