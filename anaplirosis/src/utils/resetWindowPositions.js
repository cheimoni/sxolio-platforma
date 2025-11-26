/**
 * Utility script για reset των θέσεων παραθύρων στις default τιμές
 * 
 * Χρήση:
 * 1. Import στο component: import { resetAllWindowPositions } from './utils/resetWindowPositions';
 * 2. Καλέστε: resetAllWindowPositions();
 * 
 * Ή από browser console:
 * import('./utils/resetWindowPositions.js').then(m => m.resetAllWindowPositions());
 */

// Default θέσεις παραθύρων (updated 2025-01-27)
const DEFAULT_POSITIONS = {
  mainWindow: { x: 902, y: -1 },
  teacherSchedule: { x: 232, y: 1 },
  teacherAvailability: { x: 557, y: 1 },
  newWindow: { x: 231, y: 431 },
  smartScheduler: { x: 557, y: 431 }
};

/**
 * Καθαρίζει όλες τις αποθηκευμένες θέσεις από localStorage
 * και τις θέτει στις default τιμές
 */
export const resetAllWindowPositions = () => {
  console.log('🔄 Resetting all window positions to defaults...');

  // Mapping από storage keys σε function names
  const functionNameMap = {
    mainWindow: 'resetMainWindowPosition',
    teacherSchedule: 'resetTeacherSchedulePosition',
    teacherAvailability: 'resetAvailabilityPosition', // Special case
    newWindow: 'resetNewWindowPosition',
    smartScheduler: 'resetSmartSchedulerPosition'
  };

  Object.keys(DEFAULT_POSITIONS).forEach(key => {
    // 1. Clear saved position and size from localStorage
    try {
      localStorage.removeItem(`windowPosition_${key}`);
      localStorage.removeItem(`windowSize_${key}`); // Also clear size
      console.log(`🗑️ Cleared saved position and size for: ${key}`);
    } catch (err) {
      console.error(`Error clearing storage for ${key}:`, err);
    }

    // 2. Trigger the reset function on the component itself, if it exists
    const resetFunctionName = functionNameMap[key];
    if (resetFunctionName && typeof window[resetFunctionName] === 'function') {
      try {
        console.log(`🚀 Calling window.${resetFunctionName}()`);
        window[resetFunctionName]();
      } catch (err) {
        console.error(`Error calling ${resetFunctionName}:`, err);
      }
    } else {
      console.warn(`⚠️ Reset function ${resetFunctionName || 'unknown'} not found on window object for key: ${key}`);
    }
  });

  console.log('✅ All window positions reset.');
  console.log('⏳ Waiting for all reset functions to complete...');
  
  // 3. Force a reload after a short delay to ensure all components re-initialize with default state
  // This is a robust way to ensure everything is clean.
  // We wait 500ms to give time for all reset functions to complete and update localStorage
  setTimeout(() => {
    console.log('🔄 Reloading page to ensure clean state...');
    window.location.reload();
  }, 500);
};

/**
 * Καθαρίζει μόνο τις θέσεις (χωρίς να θέτει defaults)
 */
export const clearAllWindowPositions = () => {
  console.log('🗑️ Clearing all window positions from localStorage...');
  
  Object.keys(DEFAULT_POSITIONS).forEach(key => {
    const storageKey = `windowPosition_${key}`;
    try {
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Cleared: ${storageKey}`);
    } catch (err) {
      console.error(`Error clearing ${storageKey}:`, err);
    }
  });
  
  console.log('✅ All window positions cleared!');
};

/**
 * Επιστρέφει τις τρέχουσες θέσεις από localStorage
 */
export const getCurrentPositions = () => {
  const positions = {};
  
  Object.keys(DEFAULT_POSITIONS).forEach(key => {
    const storageKey = `windowPosition_${key}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        positions[key] = JSON.parse(saved);
      } else {
        positions[key] = DEFAULT_POSITIONS[key];
      }
    } catch (err) {
      console.error(`Error reading ${storageKey}:`, err);
      positions[key] = DEFAULT_POSITIONS[key];
    }
  });
  
  return positions;
};

/**
 * Επιστρέφει τις default θέσεις
 */
export const getDefaultPositions = () => {
  return { ...DEFAULT_POSITIONS };
};

// Export για χρήση από browser console
if (typeof window !== 'undefined') {
  window.resetAllWindowPositions = resetAllWindowPositions;
  window.clearAllWindowPositions = clearAllWindowPositions;
  window.getCurrentWindowPositions = getCurrentPositions;
  window.getDefaultWindowPositions = getDefaultPositions;
  
  console.log('📦 Window position utilities loaded!');
  console.log('💡 Use: window.resetAllWindowPositions() to reset all positions');
  console.log('💡 Use: window.getCurrentWindowPositions() to see current positions');
}

