import { useState, useEffect, useRef, useCallback } from 'react';

export const useDraggable = (initialX, initialY, storageKey = null) => {
  const initialPosition = useRef({ x: initialX, y: initialY });
  const skipNextSave = useRef(false); // Flag to skip saving after resize
  
  // Load saved position from localStorage if storageKey is provided
  const loadSavedPosition = () => {
    if (!storageKey) return { x: initialX, y: initialY };
    try {
      const saved = localStorage.getItem(`windowPosition_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { x: parsed.x ?? initialX, y: parsed.y ?? initialY };
      }
    } catch (err) {
      console.error(`Error loading position for ${storageKey}:`, err);
    }
    return { x: initialX, y: initialY };
  };
  
  const [position, setPosition] = useState(loadSavedPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Save position to localStorage when it changes (but not while dragging or right after resize)
  useEffect(() => {
    if (!isDragging && storageKey && !skipNextSave.current) {
      try {
        localStorage.setItem(`windowPosition_${storageKey}`, JSON.stringify(position));
      } catch (err) {
        console.error(`Error saving position for ${storageKey}:`, err);
      }
    }
    // Reset the flag after checking it
    if (skipNextSave.current) {
      skipNextSave.current = false;
    }
  }, [position, isDragging, storageKey]);
  
  // Expose function to skip next save (for use after resize)
  const skipNextPositionSave = useCallback(() => {
    skipNextSave.current = true;
  }, []);
  
  // Update initial position when props change
  useEffect(() => {
    initialPosition.current = { x: initialX, y: initialY };
  }, [initialX, initialY]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    // Only allow dragging if clicking on the header
    if (!e.target.closest('.draggable-header')) return;
    
    setIsDragging(true);
    
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const resetPosition = useCallback(() => {
    // Always use current initialX/initialY values (from props), not the ref
    const resetPos = { x: initialX, y: initialY };
    console.log('🔄 Resetting position to:', resetPos, 'from initialX:', initialX, 'initialY:', initialY);
    
    // Clear saved position from localStorage FIRST, before setting position
    // This ensures the useEffect won't save the old position
    if (storageKey) {
      try {
        localStorage.removeItem(`windowPosition_${storageKey}`);
        console.log('🗑️ Cleared saved position from localStorage for:', storageKey);
      } catch (err) {
        console.error(`Error clearing position for ${storageKey}:`, err);
      }
    }
    
    // Update the ref first
    initialPosition.current = resetPos;
    
    // Then set the position - this will trigger the useEffect to save the new default position
    setPosition(resetPos);
  }, [storageKey, initialX, initialY, setPosition]);

  return {
    position,
    setPosition,
    dragRef,
    handleMouseDown,
    resetPosition,
    isDragging,
    skipNextPositionSave
  };
};

