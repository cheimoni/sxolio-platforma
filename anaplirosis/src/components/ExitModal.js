import React, { useEffect, useRef } from 'react';
import './ExitModal.css';

function ExitModal({ onConfirm, onCancel }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // Play the exit sound when modal opens
    audioRef.current = new Audio('/announcements/Application Closed.wav');
    audioRef.current.volume = 1.0; // Full volume
    audioRef.current.play().then(() => {
      console.log('Exit sound playing');
    }).catch(err => {
      console.log('Could not play exit sound:', err);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="exit-modal-overlay">
      <div className="exit-modal">
        <h2>Κλείσιμο Εφαρμογής</h2>
        <p>Είστε σίγουροι ότι θέλετε να κλείσετε την εφαρμογή;</p>
        <div className="warning-text">
          ⚠️ Έκανες Save τα νέα δεδομένα;
        </div>
        <div className="exit-modal-buttons">
          <button className="exit-modal-cancel" onClick={onCancel}>
            Ακύρωση
          </button>
          <button className="exit-modal-confirm" onClick={onConfirm}>
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitModal;
