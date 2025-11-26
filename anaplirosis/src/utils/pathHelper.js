/**
 * Helper function για να προσαρμόζει paths ανάλογα με το protocol
 * Λύνει το CORS πρόβλημα όταν τρέχει από file:// protocol
 */

/**
 * Μετατρέπει ένα path σε σωστό format ανάλογα με το protocol
 * @param {string} path - Το path που θέλουμε (π.χ. '/teachers.json')
 * @returns {string} - Το προσαρμοσμένο path
 */
export const getPublicPath = (path) => {
  if (typeof window === 'undefined') {
    return path;
  }
  
  // Έλεγχος αν τρέχει από file:// protocol
  let isFileProtocol = false;
  
  try {
    const currentProtocol = window.location.protocol;
    const currentHref = window.location.href || '';
    isFileProtocol = currentProtocol === 'file:' || currentHref.startsWith('file://');
    
    // Αν είμαστε σε iframe, ελέγχουμε και το parent
    if (!isFileProtocol && window.parent !== window) {
      try {
        const parentProtocol = window.parent.location.protocol;
        const parentHref = window.parent.location.href || '';
        isFileProtocol = parentProtocol === 'file:' || parentHref.startsWith('file://');
      } catch (e) {
        // Cross-origin iframe, δεν μπορούμε να διαβάσουμε το parent
      }
    }
  } catch (e) {
    // Αν υπάρχει error, υποθέτουμε ότι είναι file:// για safety
    console.warn('Error detecting protocol, assuming file://:', e);
    isFileProtocol = true;
  }
  
  if (isFileProtocol) {
    // Για file:// protocol, χρησιμοποιούμε absolute file path
    // Πρέπει να υπολογίσουμε το base path από το current location
    try {
      const currentHref = window.location.href || '';
      console.log(`🔍 getPublicPath: currentHref = "${currentHref}"`);
      
      // Αν το href περιέχει /build/, χρησιμοποιούμε αυτό ως base
      if (currentHref.includes('/build/') || currentHref.includes('\\build\\')) {
        const buildIndex = currentHref.indexOf('/build/') !== -1 
          ? currentHref.indexOf('/build/') 
          : currentHref.indexOf('\\build\\');
        if (buildIndex !== -1) {
          const baseUrl = currentHref.substring(0, buildIndex + 6); // +6 για "/build"
          // Αν το path ξεκινάει με /, το αφαιρούμε
          const relativePath = path.startsWith('/') ? path.substring(1) : path;
          const fullPath = `${baseUrl}/${relativePath}`.replace(/\\/g, '/');
          console.log(`📁 File path: "${path}" → "${fullPath}"`);
          return fullPath;
        }
      }
      
      // Fallback: προσπαθούμε να βρούμε το directory του current file
      const lastSlash = Math.max(
        currentHref.lastIndexOf('/'),
        currentHref.lastIndexOf('\\')
      );
      if (lastSlash !== -1) {
        const baseUrl = currentHref.substring(0, lastSlash + 1);
        const relativePath = path.startsWith('/') ? path.substring(1) : path;
        const fullPath = `${baseUrl}${relativePath}`.replace(/\\/g, '/');
        console.log(`📁 File path (fallback): "${path}" → "${fullPath}"`);
        return fullPath;
      }
      
      // Last resort: relative path
      console.log(`⚠️ Using relative path for: "${path}"`);
      if (path.startsWith('/')) {
        return `.${path}`;
      }
      if (!path.startsWith('./') && !path.startsWith('../')) {
        return `./${path}`;
      }
      return path;
    } catch (e) {
      console.warn('Error calculating file path, using relative:', e);
      // Fallback: χρησιμοποιούμε relative path
      if (path.startsWith('/')) {
        return `.${path}`;
      }
      if (!path.startsWith('./') && !path.startsWith('../')) {
        return `./${path}`;
      }
      return path;
    }
  }
  
  // Για http/https, χρησιμοποιούμε το path ως έχει
  // React's PUBLIC_URL θα το χειριστεί σωστά
  return path.startsWith('/') ? path : `/${path}`;
};

/**
 * Wrapper για fetch που χρησιμοποιεί το getPublicPath
 * Χρησιμοποιεί XMLHttpRequest για file:// protocol για να αποφύγει CORS errors
 * @param {string} path - Το path του resource
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const fetchPublic = async (path, options = {}) => {
  const adjustedPath = getPublicPath(path);
  console.log(`🔗 fetchPublic: "${path}" → "${adjustedPath}" (protocol: ${typeof window !== 'undefined' ? window.location.protocol : 'unknown'})`);
  
  // Αν είμαστε σε file:// protocol, χρησιμοποιούμε XMLHttpRequest
  const isFileProtocol = typeof window !== 'undefined' && 
    (window.location.protocol === 'file:' || window.location.href.startsWith('file://'));
  
  if (isFileProtocol) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', adjustedPath, true);
      
      // Set headers if provided
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Create a Response-like object
          const response = {
            ok: true,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(),
            text: () => Promise.resolve(xhr.responseText),
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            blob: () => Promise.resolve(new Blob([xhr.response])),
            arrayBuffer: () => Promise.resolve(xhr.response),
            clone: () => response
          };
          resolve(response);
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error'));
      };
      
      xhr.send(options.body || null);
    });
  }
  
  // Για http/https, χρησιμοποιούμε το κανονικό fetch
  return fetch(adjustedPath, options);
};

// Export για χρήση από browser console
if (typeof window !== 'undefined') {
  window.getPublicPath = getPublicPath;
  window.fetchPublic = fetchPublic;
}

