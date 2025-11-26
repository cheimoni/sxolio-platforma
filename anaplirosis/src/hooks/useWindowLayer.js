import { useState, useEffect, useCallback } from 'react';

// Global state for window layering
let globalZIndex = 5000;
const windowLayers = {};

export const useWindowLayer = (windowId, customBaseZIndex) => {
  // Initialize with a base z-index based on window type
  const baseZIndex = customBaseZIndex ? customBaseZIndex :
                     windowId === 'teacherSchedule' ? 5000 :
                     windowId === 'newWindow' ? 5001 :
                     windowId === 'availability' ? 5002 :
                     windowId === 'mainWindow' ? 5003 :
                     windowId === 'quotaDisplay' ? 5004 :
                     windowId === 'allClasses' ? 6000 :
                     windowId && windowId.startsWith('replacementBadge_') ? 5005 : 5000;

  const [zIndex, setZIndex] = useState(baseZIndex);

  useEffect(() => {
    // Initialize this window's z-index if not already set
    if (!windowLayers[windowId]) {
      windowLayers[windowId] = baseZIndex;
      globalZIndex = Math.max(globalZIndex, baseZIndex + 1);
    }
    setZIndex(windowLayers[windowId]);
  }, [windowId, baseZIndex]);

  const bringToFront = useCallback(() => {
    // Find the maximum z-index among all windows
    const maxZ = Math.max(...Object.values(windowLayers), globalZIndex);
    // Set this window's z-index higher than all others
    const newZIndex = maxZ + 1;
    windowLayers[windowId] = newZIndex;
    globalZIndex = newZIndex;
    setZIndex(newZIndex);
  }, [windowId]);

  return { zIndex, bringToFront };
};

