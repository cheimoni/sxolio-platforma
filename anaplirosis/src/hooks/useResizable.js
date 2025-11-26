import { useState, useEffect, useRef, useCallback } from 'react';

export const useResizable = (initialWidth, initialHeight, minWidth = 200, minHeight = 150, storageKey = null) => {
  // Load saved size from localStorage if storageKey is provided
  const loadSavedSize = () => {
    if (!storageKey) return { width: initialWidth, height: initialHeight };
    try {
      const saved = localStorage.getItem(`windowSize_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { width: parsed.width ?? initialWidth, height: parsed.height ?? initialHeight };
      }
    } catch (err) {
      console.error(`Error loading size for ${storageKey}:`, err);
    }
    return { width: initialWidth, height: initialHeight };
  };

  const [size, setSize] = useState(loadSavedSize);
  const [isResizing, setIsResizing] = useState(false);
  const [positionDelta, setPositionDelta] = useState({ x: 0, y: 0 });
  const resizeRef = useRef(null);
  const resizeDirection = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startRect = useRef({ x: 0, y: 0 });
  
  // Save size to localStorage when it changes (but not while resizing)
  useEffect(() => {
    if (!isResizing && storageKey) {
      try {
        localStorage.setItem(`windowSize_${storageKey}`, JSON.stringify(size));
      } catch (err) {
        console.error(`Error saving size for ${storageKey}:`, err);
      }
    }
  }, [size, isResizing, storageKey]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizeDirection.current) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;
      let posX = 0;
      let posY = 0;

      const dir = resizeDirection.current;

      // Handle horizontal resizing
      if (dir.includes('e')) {
        newWidth = Math.max(minWidth, startSize.current.width + deltaX);
      }
      if (dir.includes('w')) {
        const targetWidth = Math.max(minWidth, startSize.current.width - deltaX);
        const widthChange = targetWidth - startSize.current.width;
        newWidth = targetWidth;
        posX = -widthChange; // Move left by the amount the width changed
      }

      // Handle vertical resizing
      if (dir.includes('s')) {
        newHeight = Math.max(minHeight, startSize.current.height + deltaY);
      }
      if (dir.includes('n')) {
        const targetHeight = Math.max(minHeight, startSize.current.height - deltaY);
        const heightChange = targetHeight - startSize.current.height;
        newHeight = targetHeight;
        posY = -heightChange; // Move up by the amount the height changed
      }

      setSize({ width: newWidth, height: newHeight });
      setPositionDelta({ x: posX, y: posY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeDirection.current = null;
      // Don't reset positionDelta here - let the component handle it
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, minHeight]);

  const handleResizeStart = useCallback((direction, e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    resizeDirection.current = direction;

    if (resizeRef.current) {
      const rect = resizeRef.current.getBoundingClientRect();
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = { width: rect.width, height: rect.height };
      startRect.current = { x: rect.left, y: rect.top };
    }
  }, []);

  const resetSize = useCallback(() => {
    const resetSz = { width: initialWidth, height: initialHeight };
    console.log('🔄 Resetting size to:', resetSz);
    setSize(resetSz);
    // Clear saved size from localStorage so it uses the default next time
    if (storageKey) {
      try {
        localStorage.removeItem(`windowSize_${storageKey}`);
        console.log('🗑️ Cleared saved size from localStorage for:', storageKey);
      } catch (err) {
        console.error(`Error clearing size for ${storageKey}:`, err);
      }
    }
  }, [initialWidth, initialHeight, storageKey]);

  const resetPositionDelta = useCallback(() => {
    setPositionDelta({ x: 0, y: 0 });
  }, []);

  return {
    size,
    isResizing,
    positionDelta,
    resizeRef,
    handleResizeStart,
    resetSize,
    resetPositionDelta
  };
};

