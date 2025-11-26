/* ========================================
   CHAT SERVICE - Συνομιλίες & Μηνύματα
   ======================================== */

const ChatService = {
  // Active listeners (για cleanup)
  activeListeners: [],
  
  // Track if index error has been shown to user
  _indexErrorShown: false,

  // === CONVERSATIONS ===

  // Λήψη συνομιλιών χρήστη
  async getConversations(userId) {
    try {
      const snapshot = await firebaseDb.collection('conversations')
        .where('participants', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const conversations = [];
      snapshot.forEach(doc => {
        conversations.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: conversations };
    } catch (error) {
      // Handle missing index error gracefully
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
        
        // Set flags immediately to prevent race conditions from multiple simultaneous calls
        const shouldShowToast = !this._indexErrorShown;
        const shouldLog = !window._indexErrorLogged;
        
        if (shouldShowToast) {
          this._indexErrorShown = true;
        }
        if (shouldLog) {
          window._indexErrorLogged = true;
        }
        
        // Show user-friendly notification only once
        if (shouldShowToast && typeof showToast !== 'undefined') {
          const toastMessage = indexUrl 
            ? `⚠️ Απαιτείται δημιουργία index στη βάση δεδομένων.<br><a href="${indexUrl}" target="_blank" style="color: inherit; text-decoration: underline; font-weight: 600;">Κάντε κλικ εδώ για δημιουργία</a>`
            : '⚠️ Απαιτείται δημιουργία index στη βάση δεδομένων. Ελέγξτε την κονσόλα για περισσότερες πληροφορίες.';
          
          showToast(
            toastMessage,
            'warning',
            10000,
            { html: true }
          );
        }
        
        // Log to console only once with helpful info
        if (shouldLog) {
          const manualInstructions = indexUrl 
            ? `\nCreate it here: ${indexUrl}\nOr manually in Firebase Console:\n  Collection: conversations\n  Fields: participants (Array-contains), updatedAt (Descending), __name__ (Descending)`
            : '\nCreate the index manually in Firebase Console:\n  Collection: conversations\n  Fields: participants (Array-contains), updatedAt (Descending), __name__ (Descending)';
          
          console.warn(
            '⚠️ Firestore Index Required\n' +
            'The conversations query requires a composite index.' +
            manualInstructions
          );
        }
        
        // Return empty array gracefully so app continues to work
        return { 
          success: true, 
          data: [],
          warning: 'Index not yet created. Conversations will appear after index is created.'
        };
      }
      
      // Other errors
      console.error('Error fetching conversations:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Real-time listener για συνομιλίες
  subscribeToConversations(userId, callback) {
    const unsubscribe = firebaseDb.collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        const conversations = [];
        snapshot.forEach(doc => {
          conversations.push({ id: doc.id, ...doc.data() });
        });
        callback(conversations);
      }, error => {
        // Handle missing index error gracefully
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          // Show notification only once (shared with getConversations)
          if (!this._indexErrorShown && typeof showToast !== 'undefined') {
            this._indexErrorShown = true;
            const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
            const toastMessage = indexUrl 
              ? `⚠️ Απαιτείται δημιουργία index στη βάση δεδομένων.<br><a href="${indexUrl}" target="_blank" style="color: inherit; text-decoration: underline; font-weight: 600;">Κάντε κλικ εδώ για δημιουργία</a>`
              : '⚠️ Απαιτείται δημιουργία index στη βάση δεδομένων. Ελέγξτε την κονσόλα για περισσότερες πληροφορίες.';
            
            showToast(
              toastMessage,
              'warning',
              10000,
              { html: true }
            );
          }
          
          // Return empty array to callback so UI doesn't break
          callback([]);
          return;
        }
        
        // Other errors
        console.error('Conversations subscription error:', error);
        callback([]);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // Δημιουργία/εύρεση private συνομιλίας
  async getOrCreatePrivateChat(userId1, userId2) {
    try {
      // Ψάχνουμε αν υπάρχει ήδη
      const participants = [userId1, userId2].sort();

      const snapshot = await firebaseDb.collection('conversations')
        .where('type', '==', CONVERSATION_TYPES.PRIVATE)
        .where('participants', '==', participants)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { success: true, data: { id: doc.id, ...doc.data() } };
      }

      // Δημιουργία νέας
      const user1 = await UsersService.getById(userId1);
      const user2 = await UsersService.getById(userId2);

      const conversationData = {
        type: CONVERSATION_TYPES.PRIVATE,
        participants: participants,
        participantNames: {
          [userId1]: user1.data?.displayName || 'Χρήστης',
          [userId2]: user2.data?.displayName || 'Χρήστης'
        },
        lastMessage: null,
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('conversations').add(conversationData);

      return { success: true, data: { id: docRef.id, ...conversationData } };
    } catch (error) {
      console.error('Error creating private chat:', error);
      return { success: false, error: error.message };
    }
  },

  // Δημιουργία group συνομιλίας
  async createGroupChat(name, participantIds, createdBy) {
    try {
      // Fetch participant names
      const participantNames = {};
      for (const id of participantIds) {
        const user = await UsersService.getById(id);
        participantNames[id] = user.data?.displayName || 'Χρήστης';
      }

      const conversationData = {
        type: CONVERSATION_TYPES.GROUP,
        name: name,
        participants: participantIds,
        participantNames: participantNames,
        createdBy: createdBy,
        lastMessage: null,
        unreadCount: participantIds.reduce((acc, id) => {
          acc[id] = 0;
          return acc;
        }, {}),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection('conversations').add(conversationData);

      return { success: true, data: { id: docRef.id, ...conversationData } };
    } catch (error) {
      console.error('Error creating group chat:', error);
      return { success: false, error: error.message };
    }
  },

  // === MESSAGES ===

  // Λήψη μηνυμάτων συνομιλίας
  async getMessages(conversationId, limit = 50) {
    try {
      const snapshot = await firebaseDb.collection('messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      // Reverse για σωστή σειρά (παλιότερα πρώτα)
      return { success: true, data: messages.reverse() };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: error.message };
    }
  },

  // Real-time listener για μηνύματα
  subscribeToMessages(conversationId, callback) {
    const unsubscribe = firebaseDb.collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        const messages = [];
        snapshot.forEach(doc => {
          messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
      }, error => {
        console.error('Messages subscription error:', error);
      });

    this.activeListeners.push(unsubscribe);
    return unsubscribe;
  },

  // Αποστολή μηνύματος
  async sendMessage(conversationId, senderId, text, attachments = []) {
    try {
      const sender = await UsersService.getById(senderId);

      const messageData = {
        conversationId: conversationId,
        senderId: senderId,
        senderName: sender.data?.displayName || 'Χρήστης',
        text: text.trim(),
        attachments: attachments,
        readBy: [senderId],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Add message
      const docRef = await firebaseDb.collection('messages').add(messageData);

      // Update conversation
      await this.updateConversationLastMessage(conversationId, senderId, text);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  },

  // Update conversation μετά από νέο μήνυμα
  async updateConversationLastMessage(conversationId, senderId, text) {
    try {
      const convDoc = await firebaseDb.collection('conversations').doc(conversationId).get();
      const convData = convDoc.data();

      // Increment unread for all except sender
      const unreadCount = { ...convData.unreadCount };
      convData.participants.forEach(pid => {
        if (pid !== senderId) {
          unreadCount[pid] = (unreadCount[pid] || 0) + 1;
        }
      });

      await firebaseDb.collection('conversations').doc(conversationId).update({
        lastMessage: {
          text: truncate(text, 50),
          senderId: senderId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        },
        unreadCount: unreadCount,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  },

  // Mark messages as read
  async markAsRead(conversationId, userId) {
    try {
      // Update conversation unread count
      await firebaseDb.collection('conversations').doc(conversationId).update({
        [`unreadCount.${userId}`]: 0
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: error.message };
    }
  },

  // === FILE ATTACHMENTS ===

  // Upload file for chat
  async uploadChatFile(file, conversationId) {
    try {
      const userId = AuthService.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `chat/${conversationId}/${timestamp}_${safeName}`;

      const storageRef = firebase.storage().ref(path);
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();

      return {
        success: true,
        data: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL,
          path: path
        }
      };
    } catch (error) {
      console.error('Error uploading chat file:', error);
      return { success: false, error: error.message };
    }
  },

  // Send message with file
  async sendMessageWithFile(conversationId, senderId, text, file) {
    try {
      // Upload file first
      const uploadResult = await this.uploadChatFile(file, conversationId);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Send message with attachment
      return await this.sendMessage(conversationId, senderId, text || `📎 ${file.name}`, [uploadResult.data]);
    } catch (error) {
      console.error('Error sending message with file:', error);
      return { success: false, error: error.message };
    }
  },

  // Get file icon based on type
  getFileIcon(mimeType) {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦';
    return '📄';
  },

  // Format file size
  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // === CLEANUP ===

  // Unsubscribe all listeners
  unsubscribeAll() {
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];
  }
};

// Export
window.ChatService = ChatService;
