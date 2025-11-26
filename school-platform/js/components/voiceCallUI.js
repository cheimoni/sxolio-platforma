/* ========================================
   CALL UI - Voice & Video Call Interface
   ======================================== */

const VoiceCallUI = {
  container: null,
  audioElement: null,
  localVideoElement: null,
  remoteVideoElement: null,
  ringtoneContext: null,
  incomingCallListener: null,
  currentIncomingCall: null,
  callDurationInterval: null,
  isVideoCall: false,

  // === INITIALIZATION ===

  init() {
    // Create container for call UI
    this.container = document.createElement('div');
    this.container.id = 'voice-call-container';
    this.container.className = 'voice-call-container hidden';
    document.body.appendChild(this.container);

    // Create audio element for remote audio (voice calls)
    this.audioElement = document.createElement('audio');
    this.audioElement.id = 'remote-audio';
    this.audioElement.autoplay = true;
    document.body.appendChild(this.audioElement);

    // Set up CallService callbacks
    CallService.onRemoteStream = (stream) => {
      if (CallService.isVideoCall) {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
        }
      }
      this.audioElement.srcObject = stream;
    };

    CallService.onLocalStream = (stream) => {
      if (CallService.isVideoCall) {
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
          localVideo.srcObject = stream;
        }
      }
    };

    CallService.onCallStateChange = (state) => {
      this.updateCallState(state);
    };

    CallService.onCallEnded = (reason, duration) => {
      this.showCallEnded(reason, duration);
    };

    CallService.onError = (error) => {
      this.showError(error);
    };

    // Listen for incoming calls
    this.startListeningForCalls();
  },

  // Start listening for incoming calls
  startListeningForCalls() {
    if (this.incomingCallListener) {
      this.incomingCallListener();
    }

    this.incomingCallListener = CallService.listenForIncomingCalls((call) => {
      // Don't show if we're already in a call
      if (CallService.isCallActive) return;

      this.showIncomingCall(call);
    });
  },

  // Stop listening
  stopListening() {
    if (this.incomingCallListener) {
      this.incomingCallListener();
      this.incomingCallListener = null;
    }
  },

  // === INCOMING CALL ===

  showIncomingCall(call) {
    this.currentIncomingCall = call;
    this.isVideoCall = call.callType === 'video';

    const callTypeIcon = this.isVideoCall ? '📹' : '📞';
    const callTypeText = this.isVideoCall ? 'Εισερχόμενη βιντεοκλήση' : 'Εισερχόμενη κλήση';

    this.container.innerHTML = `
      <div class="call-overlay">
        <div class="call-modal incoming-call">
          <div class="call-header">
            <div class="call-status-icon ringing">${callTypeIcon}</div>
            <div class="call-status-text">${callTypeText}</div>
          </div>

          <div class="call-user">
            <div class="call-avatar">
              ${getInitials(call.callerName)}
            </div>
            <div class="call-user-name">${escapeHtml(call.callerName)}</div>
          </div>

          <div class="call-actions incoming">
            <button class="call-btn call-btn-reject" onclick="VoiceCallUI.rejectIncoming()">
              <span class="call-btn-icon">📵</span>
              <span class="call-btn-label">Απόρριψη</span>
            </button>
            <button class="call-btn call-btn-accept" onclick="VoiceCallUI.acceptIncoming()">
              <span class="call-btn-icon">${callTypeIcon}</span>
              <span class="call-btn-label">Απάντηση</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.remove('hidden');
    this.playRingtone();
  },

  async acceptIncoming() {
    if (!this.currentIncomingCall) return;

    this.stopRingtone();
    this.showConnecting();

    const result = await CallService.answerCall(this.currentIncomingCall.callId);

    if (result.success) {
      this.showActiveCall(this.currentIncomingCall.callerName, CallService.isVideoCall);
    } else {
      this.showError(result.error);
    }
  },

  async rejectIncoming() {
    if (!this.currentIncomingCall) return;

    this.stopRingtone();
    await CallService.rejectCall(this.currentIncomingCall.callId);
    this.currentIncomingCall = null;
    this.hide();
  },

  // === OUTGOING CALL ===

  async startCall(userId, userName, withVideo = false) {
    // Check if already in a call
    if (CallService.isCallActive) {
      showToast('Είστε ήδη σε κλήση', 'error');
      return;
    }

    // Check user availability
    const availability = await CallService.checkUserAvailability(userId);
    if (!availability.available) {
      showToast(availability.reason, 'error');
      return;
    }

    this.isVideoCall = withVideo;
    this.showCalling(userName, withVideo);

    const result = await CallService.startCall(userId, userName, withVideo);

    if (!result.success) {
      this.showError(result.error);
    }
  },

  // Start video call (convenience method)
  async startVideoCall(userId, userName) {
    return this.startCall(userId, userName, true);
  },

  showCalling(userName, withVideo = false) {
    const callTypeIcon = withVideo ? '📹' : '📞';
    const callTypeText = withVideo ? 'Βιντεοκλήση...' : 'Καλείται...';

    let videoPreview = '';
    if (withVideo) {
      videoPreview = `
        <div class="video-preview-container">
          <video id="local-video" class="local-video-preview" autoplay muted playsinline></video>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="call-overlay">
        <div class="call-modal outgoing-call ${withVideo ? 'video-call-modal' : ''}">
          ${videoPreview}
          <div class="call-header">
            <div class="call-status-icon calling">${callTypeIcon}</div>
            <div class="call-status-text">${callTypeText}</div>
          </div>

          <div class="call-user">
            <div class="call-avatar calling-animation">
              ${getInitials(userName)}
            </div>
            <div class="call-user-name">${escapeHtml(userName)}</div>
          </div>

          <div class="call-actions">
            <button class="call-btn call-btn-end" onclick="VoiceCallUI.endCall()">
              <span class="call-btn-icon">📵</span>
              <span class="call-btn-label">Τερματισμός</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.remove('hidden');
    this.playDialTone();
  },

  // === ACTIVE CALL ===

  showActiveCall(otherUserName, isVideo = false) {
    this.stopRingtone();
    this.stopDialTone();
    this.isVideoCall = isVideo;

    if (isVideo) {
      this.showActiveVideoCall(otherUserName);
    } else {
      this.showActiveVoiceCall(otherUserName);
    }

    this.startDurationTimer();
    this.playConnectedSound();
  },

  showActiveVoiceCall(otherUserName) {
    this.container.innerHTML = `
      <div class="call-overlay active-call-overlay">
        <div class="call-modal active-call">
          <div class="call-header">
            <div class="call-status-icon connected">🎙️</div>
            <div class="call-status-text">Σε κλήση</div>
          </div>

          <div class="call-user">
            <div class="call-avatar connected">
              ${getInitials(otherUserName)}
            </div>
            <div class="call-user-name">${escapeHtml(otherUserName)}</div>
            <div class="call-duration" id="call-duration">00:00</div>
          </div>

          <div class="call-quality" id="call-quality">
            <span class="quality-indicator good">●</span>
            <span class="quality-text">Καλή σύνδεση</span>
          </div>

          <div class="call-actions active">
            <button class="call-btn call-btn-mute" id="mute-btn" onclick="VoiceCallUI.toggleMute()">
              <span class="call-btn-icon">🎤</span>
              <span class="call-btn-label">Σίγαση</span>
            </button>
            <button class="call-btn call-btn-end" onclick="VoiceCallUI.endCall()">
              <span class="call-btn-icon">📵</span>
              <span class="call-btn-label">Τέλος</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.remove('hidden');
  },

  showActiveVideoCall(otherUserName) {
    this.container.innerHTML = `
      <div class="call-overlay video-call-overlay">
        <div class="video-call-container">
          <!-- Remote video (full screen) -->
          <video id="remote-video" class="remote-video" autoplay playsinline></video>

          <!-- Local video (small preview) -->
          <div class="local-video-wrapper">
            <video id="local-video" class="local-video" autoplay muted playsinline></video>
          </div>

          <!-- Call info overlay -->
          <div class="video-call-info">
            <div class="video-call-user">${escapeHtml(otherUserName)}</div>
            <div class="video-call-duration" id="call-duration">00:00</div>
            <div class="call-quality" id="call-quality">
              <span class="quality-indicator good">●</span>
              <span class="quality-text">HD</span>
            </div>
          </div>

          <!-- Video controls -->
          <div class="video-call-controls">
            <button class="video-ctrl-btn" id="mute-btn" onclick="VoiceCallUI.toggleMute()" title="Σίγαση">
              <span class="ctrl-icon">🎤</span>
            </button>
            <button class="video-ctrl-btn" id="video-btn" onclick="VoiceCallUI.toggleVideo()" title="Κάμερα">
              <span class="ctrl-icon">📹</span>
            </button>
            <button class="video-ctrl-btn end-call-btn" onclick="VoiceCallUI.endCall()" title="Τερματισμός">
              <span class="ctrl-icon">📵</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.classList.remove('hidden');

    // Set local stream to video element
    if (CallService.localStream) {
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.srcObject = CallService.localStream;
      }
    }

    // Set remote stream if already available
    if (CallService.remoteStream) {
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) {
        remoteVideo.srcObject = CallService.remoteStream;
      }
    }
  },

  showConnecting() {
    this.container.innerHTML = `
      <div class="call-overlay">
        <div class="call-modal">
          <div class="call-header">
            <div class="call-status-icon">📡</div>
            <div class="call-status-text">Σύνδεση...</div>
          </div>
          <div class="spinner mt-md"></div>
        </div>
      </div>
    `;
  },

  // === CALL CONTROLS ===

  toggleMute() {
    const isMuted = CallService.toggleMute();
    const btn = document.getElementById('mute-btn');

    if (btn) {
      if (isMuted) {
        btn.classList.add('muted');
        const icon = btn.querySelector('.call-btn-icon') || btn.querySelector('.ctrl-icon');
        const label = btn.querySelector('.call-btn-label');
        if (icon) icon.textContent = '🔇';
        if (label) label.textContent = 'Ενεργοπ.';
      } else {
        btn.classList.remove('muted');
        const icon = btn.querySelector('.call-btn-icon') || btn.querySelector('.ctrl-icon');
        const label = btn.querySelector('.call-btn-label');
        if (icon) icon.textContent = '🎤';
        if (label) label.textContent = 'Σίγαση';
      }
    }
  },

  toggleVideo() {
    const isEnabled = CallService.toggleVideo();
    const btn = document.getElementById('video-btn');
    const localVideo = document.getElementById('local-video');

    if (btn) {
      if (!isEnabled) {
        btn.classList.add('disabled');
        btn.querySelector('.ctrl-icon').textContent = '🚫';
      } else {
        btn.classList.remove('disabled');
        btn.querySelector('.ctrl-icon').textContent = '📹';
      }
    }

    // Show/hide local video
    if (localVideo) {
      localVideo.style.opacity = isEnabled ? '1' : '0.3';
    }
  },

  async endCall() {
    this.stopRingtone();
    this.stopDialTone();
    this.stopDurationTimer();
    await CallService.endCall();
  },

  // === CALL ENDED ===

  showCallEnded(reason, duration) {
    this.stopRingtone();
    this.stopDialTone();
    this.stopDurationTimer();

    const messages = {
      'ended': 'Η κλήση τερματίστηκε',
      'rejected': 'Η κλήση απορρίφθηκε',
      'missed': 'Αναπάντητη κλήση',
      'connection_lost': 'Χάθηκε η σύνδεση'
    };

    const message = messages[reason] || 'Η κλήση τερματίστηκε';
    const durationText = duration > 0 ? CallService.formatCallDuration(duration) : '';

    this.container.innerHTML = `
      <div class="call-overlay">
        <div class="call-modal call-ended">
          <div class="call-header">
            <div class="call-status-icon ended">📴</div>
            <div class="call-status-text">${message}</div>
          </div>
          ${durationText ? `<div class="call-ended-duration">Διάρκεια: ${durationText}</div>` : ''}
        </div>
      </div>
    `;

    // Auto hide after 2 seconds
    setTimeout(() => {
      this.hide();
    }, 2000);
  },

  showError(error) {
    this.stopRingtone();
    this.stopDialTone();

    this.container.innerHTML = `
      <div class="call-overlay">
        <div class="call-modal call-error">
          <div class="call-header">
            <div class="call-status-icon error">❌</div>
            <div class="call-status-text">Σφάλμα κλήσης</div>
          </div>
          <div class="call-error-message">${escapeHtml(error)}</div>
          <button class="btn btn-secondary mt-md" onclick="VoiceCallUI.hide()">Κλείσιμο</button>
        </div>
      </div>
    `;

    this.container.classList.remove('hidden');
  },

  // === STATE UPDATES ===

  updateCallState(state) {
    const qualityEl = document.getElementById('call-quality');
    if (!qualityEl) return;

    const states = {
      'connecting': { class: 'connecting', text: 'Σύνδεση...' },
      'connected': { class: 'good', text: this.isVideoCall ? 'HD' : 'Καλή σύνδεση' },
      'disconnected': { class: 'poor', text: 'Αποσύνδεση...' },
      'failed': { class: 'failed', text: 'Αποτυχία σύνδεσης' }
    };

    const info = states[state];
    if (info) {
      qualityEl.innerHTML = `
        <span class="quality-indicator ${info.class}">●</span>
        <span class="quality-text">${info.text}</span>
      `;
    }
  },

  // === TIMER ===

  startDurationTimer() {
    this.stopDurationTimer();

    this.callDurationInterval = setInterval(() => {
      const durationEl = document.getElementById('call-duration');
      if (durationEl) {
        const duration = CallService.getCallDuration();
        durationEl.textContent = CallService.formatCallDuration(duration);
      }
    }, 1000);
  },

  stopDurationTimer() {
    if (this.callDurationInterval) {
      clearInterval(this.callDurationInterval);
      this.callDurationInterval = null;
    }
  },

  // === SOUNDS ===

  playRingtone() {
    try {
      this.ringtoneContext = new (window.AudioContext || window.webkitAudioContext)();

      const playRing = () => {
        if (!this.ringtoneContext) return;

        const osc = this.ringtoneContext.createOscillator();
        const gain = this.ringtoneContext.createGain();

        osc.connect(gain);
        gain.connect(this.ringtoneContext.destination);

        osc.frequency.value = 440;
        osc.type = 'sine';
        gain.gain.value = 0.3;

        osc.start();

        setTimeout(() => {
          if (osc) osc.stop();
        }, 500);
      };

      playRing();
      this.ringtoneInterval = setInterval(playRing, 1000);

    } catch (e) {
      console.log('Could not play ringtone:', e);
    }
  },

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringtoneContext) {
      this.ringtoneContext.close();
      this.ringtoneContext = null;
    }
  },

  playDialTone() {
    try {
      this.dialContext = new (window.AudioContext || window.webkitAudioContext)();

      const playTone = () => {
        if (!this.dialContext) return;

        const osc = this.dialContext.createOscillator();
        const gain = this.dialContext.createGain();

        osc.connect(gain);
        gain.connect(this.dialContext.destination);

        osc.frequency.value = 480;
        osc.type = 'sine';
        gain.gain.value = 0.2;

        osc.start();

        setTimeout(() => {
          if (osc) osc.stop();
        }, 200);
      };

      this.dialInterval = setInterval(playTone, 3000);
      playTone();

    } catch (e) {
      console.log('Could not play dial tone:', e);
    }
  },

  stopDialTone() {
    if (this.dialInterval) {
      clearInterval(this.dialInterval);
      this.dialInterval = null;
    }
    if (this.dialContext) {
      this.dialContext.close();
      this.dialContext = null;
    }
  },

  playConnectedSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.2;

      osc.start();
      setTimeout(() => {
        osc.frequency.value = 1000;
      }, 100);
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 200);

    } catch (e) {
      console.log('Could not play connected sound:', e);
    }
  },

  // === HELPERS ===

  hide() {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
    this.currentIncomingCall = null;
    this.isVideoCall = false;
    this.stopDurationTimer();
  },

  // Called when user logs out
  destroy() {
    this.stopListening();
    this.stopRingtone();
    this.stopDialTone();
    this.stopDurationTimer();
    CallService.cleanup();

    if (this.container) {
      this.container.remove();
    }
    if (this.audioElement) {
      this.audioElement.remove();
    }
  }
};

// Export
window.VoiceCallUI = VoiceCallUI;
