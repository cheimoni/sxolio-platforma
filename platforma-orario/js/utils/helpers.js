/* ========================================
   HELPERS - Βοηθητικές συναρτήσεις
   ======================================== */

// === DATE HELPERS ===

// Μορφοποίηση ημερομηνίας
function formatDate(date, format = 'short') {
  if (!date) return '';

  const d = date instanceof Date ? date : date.toDate();

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    full: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  return d.toLocaleDateString('el-GR', options[format]);
}

// Σχετική ώρα (πριν 5 λεπτά, χθες κλπ)
function timeAgo(date) {
  if (!date) return '';

  const d = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Τώρα';
  if (minutes < 60) return `${minutes} λεπ`;
  if (hours < 24) return `${hours} ώρ`;
  if (days === 1) return 'Χθες';
  if (days < 7) return `${days} ημ`;

  return formatDate(d, 'short');
}

// === STRING HELPERS ===

// Αρχικά ονόματος (Γιώργος Παπαδόπουλος -> ΓΠ)
function getInitials(name) {
  if (!name) return '??';

  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Truncate κείμενο
function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength) + '...';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === DOM HELPERS ===

// Επιλογή element
function $(selector, parent = document) {
  return parent.querySelector(selector);
}

// Επιλογή πολλών elements
function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

// Δημιουργία element
function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

// Show element
function show(element) {
  if (element) element.classList.remove('hidden');
}

// Hide element
function hide(element) {
  if (element) element.classList.add('hidden');
}

// Toggle element
function toggle(element) {
  if (element) element.classList.toggle('hidden');
}

// === VALIDATION HELPERS ===

// Έλεγχος email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Έλεγχος password (min 6 χαρακτήρες)
function isValidPassword(password) {
  return password && password.length >= 6;
}

// === STORAGE HELPERS ===

// Local storage get
function getFromStorage(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

// Local storage set
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

// Local storage remove
function removeFromStorage(key) {
  localStorage.removeItem(key);
}

// === PERMISSION HELPERS ===

// Έλεγχος αν ο χρήστης έχει δικαίωμα
function hasPermission(userRole, permission) {
  if (!userRole) return false;
  
  // Normalize role to lowercase for comparison
  const normalizedRole = userRole.toLowerCase();
  const adminRoles = ['admin', ROLES.ADMIN?.toLowerCase()].filter(Boolean);
  
  // Super Admin έχει ΟΛΑ τα δικαιώματα
  if (adminRoles.includes(normalizedRole)) return true;
  
  // Check in PERMISSIONS (try both original and normalized)
  const roleKey = PERMISSIONS[userRole] ? userRole : 
                  Object.keys(PERMISSIONS).find(k => k.toLowerCase() === normalizedRole);
  
  if (!roleKey || !PERMISSIONS[roleKey]) return false;
  return PERMISSIONS[roleKey][permission] === true;
}

// Έλεγχος αν είναι super admin (ιδιοκτήτης πλατφόρμας)
function isSuperAdmin(userRole) {
  if (!userRole) return false;
  const normalizedRole = userRole.toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === ROLES.ADMIN?.toLowerCase();
}

// Έλεγχος αν είναι admin (διευθυντής ή βοηθοί)
function isAdmin(userRole) {
  if (!userRole) return false;
  const normalizedRole = userRole.toLowerCase();
  const adminRoles = [
    ROLES.ADMIN?.toLowerCase(), 
    'admin', 
    ROLES.DIRECTOR, 
    ROLES.VICE_DIRECTOR_A, 
    ROLES.VICE_DIRECTOR
  ].filter(Boolean);
  
  return adminRoles.includes(normalizedRole) || 
         [ROLES.DIRECTOR, ROLES.VICE_DIRECTOR_A, ROLES.VICE_DIRECTOR].includes(userRole);
}

// Helper για case-insensitive admin check
function isAdminRole(userRole) {
  if (!userRole) return false;
  const normalizedRole = userRole.toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === ROLES.ADMIN?.toLowerCase();
}

// === NOTIFICATION HELPERS ===

// Show toast notification
function showToast(message, type = 'info', duration = 3000, options = {}) {
  const toast = createElement('div', `toast toast-${type}`);
  
  // Support HTML content or plain text
  if (options.html) {
    toast.innerHTML = message;
  } else {
    toast.textContent = message;
  }

  const container = $('#toast-container') || createToastContainer();
  container.appendChild(toast);

  // Animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const container = createElement('div', 'toast-container');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// === MISC HELPERS ===

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export για χρήση
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.getInitials = getInitials;
window.truncate = truncate;
window.escapeHtml = escapeHtml;
window.$ = $;
window.$$ = $$;
window.createElement = createElement;
window.show = show;
window.hide = hide;
window.toggle = toggle;
window.isValidEmail = isValidEmail;
window.isValidPassword = isValidPassword;
window.getFromStorage = getFromStorage;
window.saveToStorage = saveToStorage;
window.removeFromStorage = removeFromStorage;
window.hasPermission = hasPermission;
window.isSuperAdmin = isSuperAdmin;
window.isAdmin = isAdmin;
window.isAdminRole = isAdminRole;
window.showToast = showToast;
window.generateId = generateId;
window.debounce = debounce;
