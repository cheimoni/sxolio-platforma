import { database } from './config';
import { ref, set, get, update, remove, onValue, push } from 'firebase/database';

// Helper functions για τη βάση δεδομένων

/**
 * Αποθήκευση δεδομένων
 * @param {string} path - Το path στη βάση (π.χ. 'absences/2025-01-15')
 * @param {object} data - Τα δεδομένα προς αποθήκευση
 */
export const saveData = async (path, data) => {
  try {
    const dbRef = ref(database, path);
    await set(dbRef, data);
    console.log('✅ Δεδομένα αποθηκεύτηκαν:', path);
    return { success: true };
  } catch (error) {
    console.error('❌ Σφάλμα αποθήκευσης:', error);
    return { success: false, error };
  }
};

/**
 * Ανάγνωση δεδομένων
 * @param {string} path - Το path στη βάση
 */
export const getData = async (path) => {
  try {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      console.log('✅ Δεδομένα βρέθηκαν:', path);
      return { success: true, data: snapshot.val() };
    } else {
      console.log('ℹ️ Δεν υπάρχουν δεδομένα:', path);
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('❌ Σφάλμα ανάγνωσης:', error);
    return { success: false, error };
  }
};

/**
 * Ενημέρωση δεδομένων
 * @param {string} path - Το path στη βάση
 * @param {object} updates - Τα πεδία προς ενημέρωση
 */
export const updateData = async (path, updates) => {
  try {
    const dbRef = ref(database, path);
    await update(dbRef, updates);
    console.log('✅ Δεδομένα ενημερώθηκαν:', path);
    return { success: true };
  } catch (error) {
    console.error('❌ Σφάλμα ενημέρωσης:', error);
    return { success: false, error };
  }
};

/**
 * Διαγραφή δεδομένων
 * @param {string} path - Το path στη βάση
 */
export const deleteData = async (path) => {
  try {
    const dbRef = ref(database, path);
    await remove(dbRef);
    console.log('✅ Δεδομένα διαγράφηκαν:', path);
    return { success: true };
  } catch (error) {
    console.error('❌ Σφάλμα διαγραφής:', error);
    return { success: false, error };
  }
};

/**
 * Real-time listener για δεδομένα
 * @param {string} path - Το path στη βάση
 * @param {function} callback - Η συνάρτηση που θα καλείται όταν αλλάζουν τα δεδομένα
 */
export const listenToData = (path, callback) => {
  const dbRef = ref(database, path);
  return onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

/**
 * Προσθήκη νέου αντικειμένου με auto-generated ID
 * @param {string} path - Το path στη βάση
 * @param {object} data - Τα δεδομένα
 */
export const pushData = async (path, data) => {
  try {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, data);
    console.log('✅ Νέα εγγραφή με ID:', newRef.key);
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('❌ Σφάλμα προσθήκης:', error);
    return { success: false, error };
  }
};

// Εξειδικευμένες συναρτήσεις για την εφαρμογή

/**
 * Αποθήκευση αναφοράς απουσιών
 */
export const saveAbsenceReport = async (date, reportData) => {
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return await saveData(`absences/${formattedDate}`, reportData);
};

/**
 * Ανάκτηση αναφοράς απουσιών
 */
export const getAbsenceReport = async (date) => {
  const formattedDate = date.toISOString().split('T')[0];
  return await getData(`absences/${formattedDate}`);
};

/**
 * Αποθήκευση αναπληρώσεων
 */
export const saveReplacements = async (date, replacements) => {
  const formattedDate = date.toISOString().split('T')[0];
  return await saveData(`replacements/${formattedDate}`, replacements);
};

/**
 * Ανάκτηση αναπληρώσεων
 */
export const getReplacements = async (date) => {
  const formattedDate = date.toISOString().split('T')[0];
  return await getData(`replacements/${formattedDate}`);
};

export default {
  saveData,
  getData,
  updateData,
  deleteData,
  listenToData,
  pushData,
  saveAbsenceReport,
  getAbsenceReport,
  saveReplacements,
  getReplacements
};

