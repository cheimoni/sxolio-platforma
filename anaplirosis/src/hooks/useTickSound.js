import { useRef, useCallback, useEffect } from 'react';

/**
 * Ανεξάρτητο hook για τα tick sounds του ρολογιού
 * Παίζει ένα απλό tick κάθε δευτερόλεπτο όταν το σχολείο έχει τελειώσει
 */
export const useTickSound = (enabled = true, shouldPlay = false) => {
  const lastTickTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const intervalRef = useRef(null);
  const enabledRef = useRef(enabled);
  const shouldPlayRef = useRef(shouldPlay);
  const audioContextRef = useRef(null);

  // Ενημέρωση refs όταν αλλάζουν τα props
  useEffect(() => {
    enabledRef.current = enabled;
    shouldPlayRef.current = shouldPlay;
  }, [enabled, shouldPlay]);

  // Αρχικοποίηση AudioContext με user interaction (fallback)
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          // Προσπάθησε να το resume για να ενεργοποιηθεί
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          audioContextRef.current = ctx;
        }
      } catch (error) {
        console.log('useTickSound: Could not init AudioContext:', error);
      }
    };

    // Πρόσθεσε event listeners για user interaction
    const handleUserInteraction = async () => {
      await initAudioContext();
      // Αφαίρεσε τους listeners μετά την πρώτη interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Παίξε ένα απλό, καθαρό tick sound
  const playTickSound = useCallback(async () => {
    // Ποτέ μην παίξεις αν ήδη παίζει
    if (isPlayingRef.current) {
      return;
    }

    try {
      isPlayingRef.current = true;
      
      // Χρησιμοποίησε το αρχικοποιημένο AudioContext ή δημιούργησε νέο
      let audioContext = audioContextRef.current;
      
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
      }
      
      // Αν το AudioContext είναι suspended (χρειάζεται user interaction), resume το
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          console.log('useTickSound: AudioContext resumed');
        } catch (resumeError) {
          console.log('useTickSound: Could not resume AudioContext:', resumeError);
          isPlayingRef.current = false;
          return;
        }
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Απλό, σύντομο tick sound
      oscillator.frequency.value = 800;
      oscillator.type = 'square';

      const startTime = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.02);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.02);
      
      console.log('useTickSound: Tick played');

      // Μην κλείνεις το audio context - θα το χρησιμοποιήσουμε ξανά
      // Κράτα το ανοιχτό για καλύτερη απόδοση

      // Reset playing flag μετά το tick
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 50);
    } catch (error) {
      console.error('Σφάλμα στο tick sound:', error);
      isPlayingRef.current = false;
    }
  }, []);

  // Κύριο timing logic - πολύ απλό: ένα tick κάθε 1 δευτερόλεπτο ακριβώς
  useEffect(() => {
    // Καθάρισε οποιοδήποτε υπάρχον interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Αν δεν είναι enabled ή δεν πρέπει να παίζει, σταμάτα
    if (!enabled || !shouldPlay) {
      console.log('useTickSound: Disabled - enabled:', enabled, 'shouldPlay:', shouldPlay);
      isPlayingRef.current = false;
      lastTickTimeRef.current = 0;
      return;
    }

    console.log('useTickSound: Starting interval - enabled:', enabled, 'shouldPlay:', shouldPlay);

    // Απλό setInterval με ακριβώς 1 δευτερόλεπτο (1000ms)
    // Δεν χρειάζεται έλεγχος - παίζει ένα tick κάθε 1 δευτερόλεπτο
    intervalRef.current = setInterval(() => {
      // Έλεγξε refs για την τρέχουσα κατάσταση
      if (!enabledRef.current || !shouldPlayRef.current) {
        isPlayingRef.current = false;
        return;
      }

      // Αν δεν παίζει ήδη, παίξε ένα tick
      if (!isPlayingRef.current) {
        playTickSound();
      }
    }, 1000); // Ακριβώς 1 δευτερόλεπτο

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isPlayingRef.current = false;
    };
  }, [enabled, shouldPlay, playTickSound]);

  // Cleanup όταν unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isPlayingRef.current = false;
      lastTickTimeRef.current = 0;
    };
  }, []);
};

