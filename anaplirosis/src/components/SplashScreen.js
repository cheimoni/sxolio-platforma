import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

function SplashScreen({ onFinish, videoTimeout = 8000 }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const handleStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      // Start video
      if (videoRef.current) {
        videoRef.current.play();
        videoRef.current.muted = false;
      }
      // Start audio
      if (audioRef.current) {
        audioRef.current.play();
        setAudioPlaying(true);
      }
    }
  };

  useEffect(() => {
    if (hasStarted) {
      // Start fade out timer after video/audio starts
      timerRef.current = setTimeout(() => {
        console.log(`Splash: Timer ended (${videoTimeout}ms), fading out`);
        // Stop audio when timer ends
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setFadeOut(true);
        setTimeout(onFinish, 1000);
      }, videoTimeout);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [hasStarted, onFinish, videoTimeout]);


  const handleVideoEnd = () => {
    console.log('Splash: Video ended');
    // Stop audio when video ends
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setFadeOut(true);
    setTimeout(onFinish, 1000);
  };

  const handleVideoError = (e) => {
    console.error('Splash: Video error:', e);
    setVideoError(true);
    // Still fade out after error
    setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 1000);
    }, 2000);
  };

  const handleVideoLoaded = () => {
    console.log('Splash: Video loaded successfully');
  };

  const handleVideoPlay = () => {
    console.log('Splash: Video started playing');
  };

  return (
    <>
      <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
        <div className="splash-content">
          <audio
            ref={audioRef}
            preload="auto"
            loop={false}
            onPlay={() => {
              console.log('Splash: Audio started playing');
              setAudioPlaying(true);
            }}
          >
            <source src="/announcements/enarxis .mp3" type="audio/mpeg" />
          </audio>
          <video
            ref={videoRef}
            muted
            playsInline
            onPlay={handleVideoPlay}
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            className="splash-video"
          >
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {!hasStarted && (
            <div className="splash-buttons-container">
              {/* Call Options Toggle */}
              <button
                className="call-toggle-button"
                onClick={() => setShowCallOptions(!showCallOptions)}
                title="Επιλογές Κλήσης"
              >
                <span className="call-icon">📞</span>
                <span className="call-text">ΚΛΗΣΕΙΣ</span>
              </button>

              {/* Main Entry Button */}
              <button
                className="start-entry-button"
                onClick={handleStart}
              >
                ΕΙΣΟΔΟΣ
              </button>

              {/* Call Options Panel */}
              {showCallOptions && (
                <div className="call-options-panel">
                  <h3 className="call-options-title">Γρήγορες Κλήσεις</h3>
                  <div className="call-options-buttons">
                    <button
                      className="call-option-btn voice-call"
                      onClick={() => {
                        localStorage.setItem('pendingCallType', 'voice');
                        handleStart();
                      }}
                    >
                      <span className="btn-icon">🎙️</span>
                      <span className="btn-label">Φωνητική Κλήση</span>
                    </button>
                    <button
                      className="call-option-btn video-call"
                      onClick={() => {
                        localStorage.setItem('pendingCallType', 'video');
                        handleStart();
                      }}
                    >
                      <span className="btn-icon">📹</span>
                      <span className="btn-label">Βιντεοκλήση</span>
                    </button>
                  </div>
                  <p className="call-options-hint">Επιλέξτε τύπο κλήσης και θα μεταφερθείτε στη λίστα χρηστών</p>
                </div>
              )}
            </div>
          )}
          
          {videoError && (
            <div className="video-error-message">
              <p>Video file not found or cannot be played</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>
                Please copy the video to:<br />
                public/video.mov
              </p>
            </div>
          )}
        </div>
      </div>
      <div className={`splash-footer ${fadeOut ? 'hidden' : ''}`}>
        <p className="copyright preserve-color" style={{ color: '#FFFFFF' }}>© Georgios Cheimonides - Όλα τα δικαιώματα κατοχυρωμένα - Απαγορεύεται η χρήση χωρίς άδεια</p>
      </div>
    </>
  );
}

export default SplashScreen;
