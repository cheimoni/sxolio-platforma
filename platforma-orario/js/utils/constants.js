/* ========================================
   CONSTANTS - Σταθερές τιμές
   ======================================== */

// Ρόλοι χρηστών
const ROLES = {
  ADMIN: 'admin',                // Super Admin - Ιδιοκτήτης Πλατφόρμας
  DIRECTOR: 'διευθυντής',
  VICE_DIRECTOR_A: 'βδα',        // Βοηθός Διευθυντή Α'
  VICE_DIRECTOR: 'βδ',           // Βοηθός Διευθυντή
  TEACHER: 'καθηγητής',
  DEPT_HEAD: 'υτ',               // Υπεύθυνος Τμήματος
  SECRETARY: 'γραμματεία'
};

// Ελληνικά ονόματα ρόλων
const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Διαχειριστής Πλατφόρμας',
  [ROLES.DIRECTOR]: 'Διευθυντής',
  [ROLES.VICE_DIRECTOR_A]: 'Βοηθός Διευθυντή Α\'',
  [ROLES.VICE_DIRECTOR]: 'Βοηθός Διευθυντή',
  [ROLES.TEACHER]: 'Καθηγητής',
  [ROLES.DEPT_HEAD]: 'Υπεύθυνος Τμήματος',
  [ROLES.SECRETARY]: 'Γραμματεία'
};

// Δικαιώματα ανά ρόλο
const PERMISSIONS = {
  [ROLES.ADMIN]: {
    // Super Admin - ΟΛΑ τα δικαιώματα
    manageUsers: true,
    announceToAll: true,
    announceToDept: true,
    manageGroups: true,
    manageFiles: true,
    viewAllMessages: true,
    manageCalendar: true,
    viewReports: true,
    manageSchools: true,      // Διαχείριση σχολείων
    managePlatform: true      // Ρυθμίσεις πλατφόρμας
  },
  [ROLES.DIRECTOR]: {
    manageUsers: true,
    announceToAll: true,
    manageGroups: true,
    manageFiles: true,
    viewAllMessages: true,
    manageCalendar: true,
    viewReports: true
  },
  [ROLES.VICE_DIRECTOR_A]: {
    manageUsers: true,
    announceToAll: true,
    manageGroups: true,
    manageFiles: true,
    viewAllMessages: false,
    manageCalendar: true,
    viewReports: true
  },
  [ROLES.VICE_DIRECTOR]: {
    manageUsers: false,
    announceToAll: true,
    manageGroups: true,
    manageFiles: true,
    viewAllMessages: false,
    manageCalendar: true,
    viewReports: false
  },
  [ROLES.TEACHER]: {
    manageUsers: false,
    announceToAll: false,
    manageGroups: false,
    manageFiles: true,
    viewAllMessages: false,
    manageCalendar: false,
    viewReports: false
  },
  [ROLES.DEPT_HEAD]: {
    manageUsers: false,
    announceToAll: false,
    announceToDept: true,
    manageGroups: false,
    manageFiles: true,
    viewAllMessages: false,
    manageCalendar: false,
    viewReports: false
  },
  [ROLES.SECRETARY]: {
    manageUsers: false,
    announceToAll: true,
    manageGroups: false,
    manageFiles: false,
    viewAllMessages: false,
    manageCalendar: true,
    viewReports: false
  }
};

// Ειδικότητες καθηγητών
const SPECIALTIES = [
  'Φιλόλογος',
  'Μαθηματικός',
  'Φυσικός',
  'Χημικός',
  'Βιολόγος',
  'Πληροφορικής',
  'Αγγλικών',
  'Γερμανικών',
  'Γαλλικών',
  'Γυμναστής',
  'Μουσικός',
  'Καλλιτεχνικών',
  'Οικονομολόγος',
  'Κοινωνιολόγος',
  'Θεολόγος',
  'Νομικός'
];

// Τύποι συνομιλίας
const CONVERSATION_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group',
  ANNOUNCEMENT: 'announcement'
};

// Τύποι events
const EVENT_TYPES = {
  MEETING: 'meeting',
  DEADLINE: 'deadline',
  EVENT: 'event',
  HOLIDAY: 'holiday'
};

// Κατηγορίες αρχείων (key = value για DB, value = Greek label)
const FILE_CATEGORIES = {
  teaching: 'Διδακτικό Υλικό',
  admin: 'Διοικητικά',
  forms: 'Έντυπα',
  circulars: 'Εγκύκλιοι',
  other: 'Άλλα'
};

// Για συμβατότητα
const FILE_CATEGORY_NAMES = FILE_CATEGORIES;

// Export για χρήση
window.ROLES = ROLES;
window.ROLE_NAMES = ROLE_NAMES;
window.PERMISSIONS = PERMISSIONS;
window.SPECIALTIES = SPECIALTIES;
window.CONVERSATION_TYPES = CONVERSATION_TYPES;
window.EVENT_TYPES = EVENT_TYPES;
window.FILE_CATEGORIES = FILE_CATEGORIES;
window.FILE_CATEGORY_NAMES = FILE_CATEGORY_NAMES;
