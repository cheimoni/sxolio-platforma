import { useEffect, useRef } from 'react';

export const useExitSound = () => {
  const audioRef = useRef(null);

  useEffect(() => {
    // Preload the audio
    audioRef.current = new Audio('/announcements/Application Closed.wav');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 1.0;

    const handleBeforeUnload = (e) => {
      // Try to play sound
      if (audioRef.current) {
        const sound = audioRef.current.cloneNode();
        sound.play().catch(() => {
          // Silently fail if browser blocks
        });
      }

      // Show browser's native confirmation dialog with Greek message
      const confirmationMessage = 'Έκανες Save τα νέα δεδομένα; Είσαι σίγουρος ότι θέλεις να κλείσεις την εφαρμογή;';
      e.preventDefault();
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
};

export default useExitSound;
