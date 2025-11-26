/* ========================================
   CALL SERVICE - WebRTC Voice & Video Calls
   High Quality Audio/Video
   ======================================== */

const CallService = {
  // WebRTC Configuration - STUN servers for NAT traversal
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  },

  // Audio constraints for best quality
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    sampleSize: 16,
    channelCount: 1
  },

  // Video constraints for good quality
  videoConstraints: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: 'user'
  },

  // State
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  currentCallId: null,
  currentCallData: null,
  callUnsubscribe: null,
  candidatesUnsubscribe: null,
  isCallActive: false,
  isMuted: false,
  isVideoEnabled: true,
  isVideoCall: false,
  callStartTime: null,
  callTimer: null,

  // Callbacks
  onCallStateChange: null,
  onRemoteStream: null,
  onLocalStream: null,
  onCallEnded: null,
  onError: null,

  // === INITIALIZATION ===

  async init() {
    // Check WebRTC support
    if (!navigator.mediaDevices || !window.RTCPeerConnection) {
      console.error('WebRTC not supported');
      return { success: false, error: 'Ο browser δεν υποστηρίζει κλήσεις' };
    }
    return { success: true };
  },

  // === CALL MANAGEMENT ===

  // Start an outgoing call (voice or video)
  async startCall(targetUserId, targetUserName, withVideo = false) {
    try {
      const currentUser = AuthService.currentUser;
      const currentUserData = AuthService.currentUserData;

      if (!currentUser) {
        throw new Error('Δεν είστε συνδεδεμένος');
      }

      this.isVideoCall = withVideo;

      // Get media stream based on call type
      const constraints = {
        audio: this.audioConstraints,
        video: withVideo ? this.videoConstraints : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Notify UI of local stream (for video preview)
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.config);

      // Add local tracks to connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Set up remote stream
      this.remoteStream = new MediaStream();
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream.addTrack(track);
        });
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Create call document in Firestore
      const callRef = db.collection('calls').doc();
      this.currentCallId = callRef.id;

      // Handle ICE candidates
      const candidatesCollection = callRef.collection('callerCandidates');
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          candidatesCollection.add(event.candidate.toJSON());
        }
      };

      // Create offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: withVideo
      });

      // Modify SDP for better quality
      offer.sdp = this.optimizeSDP(offer.sdp, withVideo);

      await this.peerConnection.setLocalDescription(offer);

      // Save call data to Firestore
      this.currentCallData = {
        callerId: currentUser.uid,
        callerName: currentUserData?.displayName || 'Χρήστης',
        calleeId: targetUserId,
        calleeName: targetUserName,
        callType: withVideo ? 'video' : 'voice',
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        status: 'ringing',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        endedAt: null
      };

      await callRef.set(this.currentCallData);

      // Listen for answer
      this.callUnsubscribe = callRef.onSnapshot(async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        // Handle answer
        if (data.answer && !this.peerConnection.currentRemoteDescription) {
          const answer = new RTCSessionDescription(data.answer);
          await this.peerConnection.setRemoteDescription(answer);
        }

        // Handle status changes
        if (data.status === 'answered' && !this.isCallActive) {
          this.isCallActive = true;
          this.startCallTimer();
          if (this.onCallStateChange) {
            this.onCallStateChange('connected');
          }
        }

        if (data.status === 'ended' || data.status === 'rejected') {
          this.handleCallEnded(data.status);
        }
      });

      // Listen for callee ICE candidates
      this.candidatesUnsubscribe = callRef.collection('calleeCandidates')
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              await this.peerConnection.addIceCandidate(candidate);
            }
          });
        });

      // Monitor connection state
      this.peerConnection.onconnectionstatechange = () => {
        if (this.onCallStateChange) {
          this.onCallStateChange(this.peerConnection.connectionState);
        }

        if (this.peerConnection.connectionState === 'disconnected' ||
            this.peerConnection.connectionState === 'failed') {
          this.endCall('connection_lost');
        }
      };

      // Auto-end after 30 seconds of ringing
      setTimeout(() => {
        if (this.currentCallData?.status === 'ringing') {
          this.endCall('missed');
        }
      }, 30000);

      return { success: true, callId: this.currentCallId };

    } catch (error) {
      console.error('Error starting call:', error);
      this.cleanup();
      if (this.onError) {
        this.onError(error.message);
      }
      return { success: false, error: error.message };
    }
  },

  // Answer an incoming call
  async answerCall(callId) {
    try {
      const callRef = db.collection('calls').doc(callId);
      const callDoc = await callRef.get();

      if (!callDoc.exists) {
        throw new Error('Η κλήση δεν βρέθηκε');
      }

      const callData = callDoc.data();
      this.currentCallId = callId;
      this.currentCallData = callData;
      this.isVideoCall = callData.callType === 'video';

      // Get media stream based on call type
      const constraints = {
        audio: this.audioConstraints,
        video: this.isVideoCall ? this.videoConstraints : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Notify UI of local stream
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.config);

      // Add local tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Set up remote stream
      this.remoteStream = new MediaStream();
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream.addTrack(track);
        });
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Handle ICE candidates
      const candidatesCollection = callRef.collection('calleeCandidates');
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          candidatesCollection.add(event.candidate.toJSON());
        }
      };

      // Set remote description (caller's offer)
      const offer = new RTCSessionDescription(callData.offer);
      await this.peerConnection.setRemoteDescription(offer);

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      answer.sdp = this.optimizeSDP(answer.sdp, this.isVideoCall);
      await this.peerConnection.setLocalDescription(answer);

      // Save answer to Firestore
      await callRef.update({
        answer: {
          type: answer.type,
          sdp: answer.sdp
        },
        status: 'answered',
        answeredAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Listen for caller ICE candidates
      this.candidatesUnsubscribe = callRef.collection('callerCandidates')
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              await this.peerConnection.addIceCandidate(candidate);
            }
          });
        });

      // Listen for call status changes
      this.callUnsubscribe = callRef.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended') {
          this.handleCallEnded('ended');
        }
      });

      // Monitor connection state
      this.peerConnection.onconnectionstatechange = () => {
        if (this.onCallStateChange) {
          this.onCallStateChange(this.peerConnection.connectionState);
        }
      };

      this.isCallActive = true;
      this.startCallTimer();

      return { success: true };

    } catch (error) {
      console.error('Error answering call:', error);
      this.cleanup();
      if (this.onError) {
        this.onError(error.message);
      }
      return { success: false, error: error.message };
    }
  },

  // Reject incoming call
  async rejectCall(callId) {
    try {
      await db.collection('calls').doc(callId).update({
        status: 'rejected',
        endedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error rejecting call:', error);
      return { success: false, error: error.message };
    }
  },

  // End current call
  async endCall(reason = 'ended') {
    try {
      if (this.currentCallId) {
        await db.collection('calls').doc(this.currentCallId).update({
          status: reason === 'rejected' ? 'rejected' : 'ended',
          endedAt: firebase.firestore.FieldValue.serverTimestamp(),
          duration: this.getCallDuration()
        });
      }
      this.handleCallEnded(reason);
      return { success: true };
    } catch (error) {
      console.error('Error ending call:', error);
      this.cleanup();
      return { success: false, error: error.message };
    }
  },

  // === AUDIO/VIDEO CONTROLS ===

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
        return this.isMuted;
      }
    }
    return false;
  },

  setMute(muted) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
        this.isMuted = muted;
      }
    }
  },

  toggleVideo() {
    if (this.localStream && this.isVideoCall) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoEnabled = videoTrack.enabled;
        return this.isVideoEnabled;
      }
    }
    return true;
  },

  setVideo(enabled) {
    if (this.localStream && this.isVideoCall) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        this.isVideoEnabled = enabled;
      }
    }
  },

  // === INCOMING CALLS LISTENER ===

  listenForIncomingCalls(onIncomingCall) {
    const currentUser = AuthService.currentUser;
    if (!currentUser) return null;

    return db.collection('calls')
      .where('calleeId', '==', currentUser.uid)
      .where('status', '==', 'ringing')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const callData = change.doc.data();
            // Only notify for recent calls (within 30 seconds)
            const createdAt = callData.createdAt?.toDate();
            if (createdAt && (Date.now() - createdAt.getTime()) < 30000) {
              onIncomingCall({
                callId: change.doc.id,
                ...callData
              });
            }
          }
        });
      });
  },

  // === HELPERS ===

  // Optimize SDP for better quality
  optimizeSDP(sdp, withVideo) {
    let modifiedSdp = sdp;

    // Opus audio optimization
    const opusParams = 'maxaveragebitrate=128000;stereo=0;useinbandfec=1;usedtx=0';
    modifiedSdp = modifiedSdp.replace(
      /a=fmtp:111 /g,
      `a=fmtp:111 ${opusParams};`
    );

    // VP8/VP9 video optimization for better quality
    if (withVideo) {
      // Increase video bitrate
      modifiedSdp = modifiedSdp.replace(
        /b=AS:\d+/g,
        'b=AS:2500' // 2.5 Mbps max
      );
    }

    return modifiedSdp;
  },

  startCallTimer() {
    this.callStartTime = Date.now();
    this.callTimer = setInterval(() => {
      // Timer tick - UI will read getCallDuration()
    }, 1000);
  },

  getCallDuration() {
    if (!this.callStartTime) return 0;
    return Math.floor((Date.now() - this.callStartTime) / 1000);
  },

  formatCallDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  handleCallEnded(reason) {
    if (this.onCallEnded) {
      this.onCallEnded(reason, this.getCallDuration());
    }
    this.cleanup();
  },

  cleanup() {
    // Stop timer
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Unsubscribe from Firestore listeners
    if (this.callUnsubscribe) {
      this.callUnsubscribe();
      this.callUnsubscribe = null;
    }
    if (this.candidatesUnsubscribe) {
      this.candidatesUnsubscribe();
      this.candidatesUnsubscribe = null;
    }

    // Reset state
    this.remoteStream = null;
    this.currentCallId = null;
    this.currentCallData = null;
    this.isCallActive = false;
    this.isMuted = false;
    this.isVideoEnabled = true;
    this.isVideoCall = false;
    this.callStartTime = null;
  },

  // Check if user is available for calls
  async checkUserAvailability(userId) {
    const activeCalls = await db.collection('calls')
      .where('status', 'in', ['ringing', 'answered'])
      .get();

    for (const doc of activeCalls.docs) {
      const call = doc.data();
      if (call.callerId === userId || call.calleeId === userId) {
        return { available: false, reason: 'Ο χρήστης είναι σε κλήση' };
      }
    }

    return { available: true };
  }
};

// Alias for backward compatibility
const VoiceCallService = CallService;

// Export
window.CallService = CallService;
window.VoiceCallService = VoiceCallService;
