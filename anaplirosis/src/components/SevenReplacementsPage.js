import React, { useEffect, useMemo, useState } from 'react';
import './SevenReplacementsPage.css';
import { saveData, getData, deleteData } from '../firebase/database';
import { ref, get } from 'firebase/database';
import { database, auth } from '../firebase/config';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';

const workDays = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
const periods = [1,2,3,4,5,6,7,8];

// Helper to get Athens date
const getAthensDate = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Athens' }));
};

const SevenReplacementsPage = ({ onClose }) => {
  const [teachers, setTeachers] = useState([]);
  const [bdSet, setBdSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showServerCleanModal, setShowServerCleanModal] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const today = useMemo(() => getAthensDate(), []);
  const [day, setDay] = useState(() => {
    const d = getAthensDate().getDay();
    const names = ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];
    const n = names[d];
    return workDays.includes(n) ? n : 'Δευτέρα';
  });
  const [period, setPeriod] = useState(1);
  const [dateStr, setDateStr] = useState(() => today.toISOString().split('T')[0]);

  // name -> {remaining, entries: [{day, period, date}], weeklyMinimum: number}
  const [quotas, setQuotas] = useState({});

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setShowLoginModal(false);
        console.log('✅ User authenticated:', user.email);
      } else {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        console.log('❌ User not authenticated');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Κρύψε τα 3 draggable παράθυρα όταν ανοίγει το παράθυρο 7 αναπληρώσεων
  useEffect(() => {
    // Αποθήκευση της προηγούμενης κατάστασης
    const teacherScheduleCard = document.querySelector('.schedule-card');
    const newWindow = document.querySelector('.new-window');
    const availabilityCard = document.querySelector('.availability-card');

    const previousStates = {
      teacherSchedule: teacherScheduleCard ? teacherScheduleCard.style.display : '',
      newWindow: newWindow ? newWindow.style.display : '',
      availability: availabilityCard ? availabilityCard.style.display : ''
    };

    // Κρύψε τα παράθυρα
    if (teacherScheduleCard) teacherScheduleCard.style.display = 'none';
    if (newWindow) newWindow.style.display = 'none';
    if (availabilityCard) availabilityCard.style.display = 'none';

    // Όταν κλείσει το component, επανάφερε τα παράθυρα
    return () => {
      if (teacherScheduleCard) teacherScheduleCard.style.display = previousStates.teacherSchedule || 'block';
      if (newWindow) newWindow.style.display = previousStates.newWindow || 'block';
      if (availabilityCard) availabilityCard.style.display = previousStates.availability || 'block';
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, bdRes] = await Promise.all([
          fetch('/teachers.json'),
          fetch('/bd-directors-schedule.json')
        ]);
        const tData = await tRes.json();
        let bdData = {};
        if (bdRes.ok) {
          try { bdData = await bdRes.json(); } catch {}
        }
        const bd = new Set();
        if (bdData && bdData['βοηθοί_διευθυντή']) {
          // Add from βοηθοί_διευθυντή object
          Object.values(bdData['βοηθοί_διευθυντή']).forEach(value => {
            if (Array.isArray(value)) {
              value.forEach(n => {
                if (n && typeof n === 'string') {
                  bd.add(n.trim());
                }
              });
            }
          });
        }
        if (bdData && bdData['ημέρες_εμφάνισης']) {
          // Add from ημέρες_εμφάνισης object
          Object.values(bdData['ημέρες_εμφάνισης']).forEach(daySchedule => {
            if (typeof daySchedule === 'object') {
              Object.values(daySchedule).forEach(nameOrNames => {
                if (typeof nameOrNames === 'string') {
                  // Handle comma-separated names
                  nameOrNames.split(',').forEach(n => {
                    if (n && n.trim()) {
                      bd.add(n.trim());
                    }
                  });
                }
              });
            }
          });
        }
        console.log('BD Set:', Array.from(bd));
        setBdSet(bd);
        setTeachers(Array.isArray(tData) ? tData : []);
        setLoading(false);
      } catch (e) {
        setError('Σφάλμα φόρτωσης δεδομένων');
        setLoading(false);
      }
    };
    load();
  }, []);

  const isExcluded = (name) => {
    if (!name) return true;
    const normalized = name.trim().toUpperCase();

    // Check if in BD set (exact match)
    if (bdSet.has(name)) {
      console.log('Found in bdSet:', name);
      return true;
    }

    // Check specific names with uppercase comparison
    if (normalized.includes('ΕΥΑΓΟΡΟΥ ΕΥΑΓΟΡΑΣ')) {
      console.log('Matched ΕΥΑΓΟΡΟΥ:', name);
      return true;
    }
    if (normalized.includes('ΧΕΙΜΩΝΙΔΗΣ ΓΙΩΡΓΟΣ')) {
      console.log('Matched ΧΕΙΜΩΝΙΔΗΣ:', name);
      return true;
    }
    if (normalized.includes('ΔΗΜΗΤΡΙΑΔΟΥ ΣΑΛΤΕ ΒΑΛΕΝΤΙΝΑ')) {
      console.log('Matched ΔΗΜΗΤΡΙΑΔΟΥ:', name);
      return true;
    }
    if (normalized.includes('ΣΑΛΤΕ ΒΑΛΕΝΤΙΝΑ')) {
      console.log('Matched ΣΑΛΤΕ:', name);
      return true;
    }

    // Check keywords
    const low = name.toLowerCase();
    if (low.includes('γραμματεία')) return true;
    if (low.includes('διευθυντ')) return true;

    return false;
  };

  // Filter out excluded teachers from the display and sort by priority
  const displayTeachers = useMemo(() => {
    const filtered = teachers.filter(t => {
      const name = t.καθηγητής;
      if (!name) return false;
      const excluded = isExcluded(name);
      if (excluded) {
        console.log('Excluding teacher:', name);
      }
      return !excluded;
    });

    // Sort teachers by priority:
    // 1. Teachers with unmet weekly minimum (most urgent)
    // 2. Teachers with weekly minimum set but met
    // 3. All other teachers
    const sorted = filtered.sort((a, b) => {
      const nameA = a.καθηγητής;
      const nameB = b.καθηγητής;
      const qA = quotas[nameA] || { remaining: 7, entries: [], weeklyMinimum: 0 };
      const qB = quotas[nameB] || { remaining: 7, entries: [], weeklyMinimum: 0 };

      const hasMinA = qA.weeklyMinimum > 0;
      const hasMinB = qB.weeklyMinimum > 0;
      const metMinA = qA.entries.length >= qA.weeklyMinimum;
      const metMinB = qB.entries.length >= qB.weeklyMinimum;

      // Priority 1: Unmet minimum comes first
      if (hasMinA && !metMinA && (!hasMinB || metMinB)) return -1;
      if (hasMinB && !metMinB && (!hasMinA || metMinA)) return 1;

      // Priority 2: Has minimum set (but met) comes before no minimum
      if (hasMinA && metMinA && !hasMinB) return -1;
      if (hasMinB && metMinB && !hasMinA) return 1;

      // Otherwise maintain original order
      return 0;
    });

    console.log('Total teachers:', teachers.length, 'Display teachers:', sorted.length);
    return sorted;
  }, [teachers, bdSet, quotas]);

  useEffect(() => {
    // initialize quotas when teachers load
    if (!teachers.length) return;
    
    const loadQuotas = async () => {
      // Try to load from Firebase first
      let existingQuotas = {};
      const today = getAthensDate();
      const formattedDate = today.toISOString().split('T')[0];
      
      try {
        // Check if user is authenticated
        if (!auth.currentUser) {
          console.log('⚠️ User not authenticated, skipping Firebase load');
          throw new Error('Not authenticated');
        }

        const firebasePath = `sevenReplacements/${formattedDate}`;
        const firebaseResult = await getData(firebasePath);
        
        if (firebaseResult.success && firebaseResult.data && firebaseResult.data.teachers) {
          // Convert Firebase data to quotas format
          Object.entries(firebaseResult.data.teachers).forEach(([teacherName, data]) => {
            existingQuotas[teacherName] = {
              remaining: data.remaining || 0,
              entries: data.entries || [],
              weeklyMinimum: data.weeklyMinimum || 0
            };
          });
          console.log('✅ Loaded quotas from Firebase:', formattedDate);
        } else {
          // Fallback to localStorage if Firebase doesn't have data
          try {
            const saved = localStorage.getItem('teacherQuotas');
            if (saved) {
              existingQuotas = JSON.parse(saved);
              console.log('✅ Loaded quotas from localStorage');
            }
          } catch (err) {
            console.error('Error loading quotas from localStorage:', err);
          }
        }
      } catch (err) {
        console.error('Error loading from Firebase, trying localStorage:', err);
        // Fallback to localStorage on error
        try {
          const saved = localStorage.getItem('teacherQuotas');
          if (saved) {
            existingQuotas = JSON.parse(saved);
            console.log('✅ Loaded quotas from localStorage (fallback)');
          }
        } catch (localErr) {
          console.error('Error loading quotas from localStorage:', localErr);
        }
      }
      
      setQuotas(prev => {
        const copy = { ...existingQuotas, ...prev };
        let hasChanges = false;
        
        teachers.forEach(t => {
          const name = t.καθηγητής;
          if (!name) return;
          if (!copy[name]) {
            copy[name] = { remaining: isExcluded(name) ? 0 : 7, entries: [], weeklyMinimum: 0 };
            hasChanges = true;
          } else {
            // adjust remaining if excluded rule changes
            const excluded = isExcluded(name);
            if (excluded && copy[name].remaining !== 0 && copy[name].entries.length === 0) {
              copy[name] = { ...copy[name], remaining: 0 };
              hasChanges = true;
            }
            // Ensure weeklyMinimum exists
            if (copy[name].weeklyMinimum === undefined) {
              copy[name] = { ...copy[name], weeklyMinimum: 0 };
              hasChanges = true;
            }
          }
        });
        
        // Save to localStorage as backup if there were changes
        if (hasChanges) {
          try {
            localStorage.setItem('teacherQuotas', JSON.stringify(copy));
            console.log('✅ Initialized quotas and saved to localStorage');
          } catch (err) {
            console.error('Error saving initial quotas:', err);
          }
        }
        
        return copy;
      });
    };
    
    loadQuotas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, bdSet]);

  const handleAssign = (name) => {
    setQuotas(prev => {
      const q = prev[name] || { remaining: isExcluded(name) ? 0 : 7, entries: [] };
      if (q.remaining <= 0) return prev;
      const entry = { day, period, date: dateStr };
      const next = { ...prev, [name]: { remaining: q.remaining - 1, entries: [entry, ...q.entries] } };
      // Save to localStorage
      try {
        localStorage.setItem('teacherQuotas', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving quotas:', err);
      }
      return next;
    });
  };

  const handleRemove = (name, idx) => {
    setQuotas(prev => {
      const q = prev[name];
      if (!q) return prev;
      const entries = [...q.entries];
      entries.splice(idx, 1);
      const isExc = isExcluded(name);
      const base = isExc ? 0 : 7;
      const used = entries.length;
      const remaining = Math.max(0, base - used);
      const next = { ...prev, [name]: { remaining, entries } };
      // Save to localStorage
      try {
        localStorage.setItem('teacherQuotas', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving quotas:', err);
      }
      return next;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Work with display teachers but update the full teachers list
    const newDisplayTeachers = [...displayTeachers];
    const [draggedTeacher] = newDisplayTeachers.splice(draggedIndex, 1);
    newDisplayTeachers.splice(dropIndex, 0, draggedTeacher);

    // Update the full teachers list by replacing only the non-excluded teachers
    const excludedTeachers = teachers.filter(t => {
      const name = t.καθηγητής;
      return !name || isExcluded(name);
    });

    setTeachers([...newDisplayTeachers, ...excludedTeachers]);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle quota change
  const handleQuotaChange = (name, newQuota) => {
    const quota = parseInt(newQuota);
    if (isNaN(quota) || quota < 0) return;

    setQuotas(prev => {
      const q = prev[name] || { remaining: 7, entries: [], weeklyMinimum: 0 };
      const used = q.entries.length;
      const remaining = Math.max(0, quota - used);
      const next = { ...prev, [name]: { ...q, remaining } };
      // Save to localStorage
      try {
        localStorage.setItem('teacherQuotas', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving quotas:', err);
      }
      return next;
    });
  };

  // Handle weekly minimum change
  const handleWeeklyMinimumChange = (name, newMinimum) => {
    const minimum = parseInt(newMinimum);
    if (isNaN(minimum) || minimum < 0) return;

    setQuotas(prev => {
      const q = prev[name] || { remaining: 7, entries: [], weeklyMinimum: 0 };
      const next = { ...prev, [name]: { ...q, weeklyMinimum: minimum } };
      // Save to localStorage
      try {
        localStorage.setItem('teacherQuotas', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving quotas:', err);
      }
      return next;
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setLoginError('Το email δεν βρέθηκε. Παρακαλώ ελέγξτε το email σας ή δημιουργήστε νέο λογαριασμό.');
      } else if (error.code === 'auth/wrong-password') {
        setLoginError('Λάθος κωδικός. Παρακαλώ δοκιμάστε ξανά.');
      } else if (error.code === 'auth/invalid-email') {
        setLoginError('Μη έγκυρο email. Παρακαλώ ελέγξτε το email σας.');
      } else {
        setLoginError('Σφάλμα σύνδεσης: ' + error.message);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    if (password.length < 6) {
      setRegisterError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return;
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setShowRegister(false);
      console.log('✅ Registration successful');
      alert('✅ Ο λογαριασμός δημιουργήθηκε επιτυχώς!');
    } catch (error) {
      console.error('❌ Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setRegisterError('Αυτό το email χρησιμοποιείται ήδη. Παρακαλώ συνδεθείτε.');
      } else if (error.code === 'auth/invalid-email') {
        setRegisterError('Μη έγκυρο email. Παρακαλώ ελέγξτε το email σας.');
      } else if (error.code === 'auth/weak-password') {
        setRegisterError('Ο κωδικός είναι πολύ αδύναμος. Χρησιμοποιήστε τουλάχιστον 6 χαρακτήρες.');
      } else {
        setRegisterError('Σφάλμα εγγραφής: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setShowLoginModal(true);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="seven-page">
        <div className="seven-header">
          <h2>7 Αναπληρώσεις</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="seven-content">Φόρτωση...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seven-page">
        <div className="seven-header">
          <h2>7 Αναπληρώσεις</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="seven-content error">{error}</div>
      </div>
    );
  }

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="seven-page">
        <div className="seven-header">
          <h2>7 Αναπληρώσεις</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '40px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#333', textAlign: 'center' }}>
              {showRegister ? '📝 Εγγραφή' : '🔐 Σύνδεση'}
            </h3>
            <p style={{ margin: '0 0 30px 0', fontSize: '14px', color: '#666', textAlign: 'center' }}>
              {showRegister 
                ? 'Δημιούργησε νέο λογαριασμό με email και κωδικό'
                : 'Παρακαλώ συνδεθείτε με email και κωδικό για πρόσβαση στις αναπληρώσεις'}
            </p>
            {showRegister ? (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="your@email.com"
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    Κωδικός (τουλάχιστον 6 χαρακτήρες):
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="••••••••"
                  />
                </div>
                {registerError && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    background: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '6px',
                    color: '#c62828',
                    fontSize: '14px'
                  }}>
                    {registerError}
                  </div>
                )}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#007bff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                  onMouseLeave={(e) => e.target.style.background = '#007bff'}
                >
                  ✅ Δημιουργία Λογαριασμού
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false);
                    setRegisterError('');
                    setLoginError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.borderColor = '#999';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  ← Επιστροφή στη Σύνδεση
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.borderColor = '#999';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  ← Επιστροφή στην Αρχική Σελίδα
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="your@email.com"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Κωδικός:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="••••••••"
                />
              </div>
              {loginError && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px',
                  background: '#ffebee',
                  border: '1px solid #f44336',
                  borderRadius: '6px',
                  color: '#c62828',
                  fontSize: '14px'
                }}>
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#28a745',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '10px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#218838'}
                onMouseLeave={(e) => e.target.style.background = '#28a745'}
              >
                🔓 Σύνδεση
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f5f5f5';
                  e.target.style.borderColor = '#999';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = '#ddd';
                }}
              >
                ← Επιστροφή στην Αρχική Σελίδα
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seven-page">
      <div className="seven-header">
        <h2>7 Αναπληρώσεις</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#000', fontWeight: '600' }}>
            👤 {auth.currentUser?.email}
          </span>
          <button 
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              border: '2px solid #dc3545',
              background: '#dc3545',
              color: '#000',
              borderRadius: '6px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Αποσύνδεση"
            onMouseEnter={(e) => {
              e.target.style.background = '#c82333';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#dc3545';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🚪 Αποσύνδεση
          </button>
          <span style={{ fontSize: '12px', color: '#000', fontWeight: 'bold' }}>
            Σύνολο: {Object.values(quotas).reduce((total, q) => total + (q.entries?.length || 0), 0)} καταχωρήσεις
          </span>
          <button 
            onClick={() => setShowClearModal(true)}
            style={{
              padding: '6px 12px',
              border: '2px solid #dc3545',
              background: '#dc3545',
              color: '#000',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#c82333';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#dc3545';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🗑️ Καθαρισμός
          </button>
          <button 
            onClick={() => setShowServerCleanModal(true)}
            style={{
              padding: '6px 12px',
              border: '2px solid #ff6b00',
              background: '#ff6b00',
              color: '#000',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e55a00';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ff6b00';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🔥 Clean Server
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>


      <div className="seven-grid">
        {displayTeachers.map((t, i) => {
          const name = t.καθηγητής;
          if (!name) return null;
          const q = quotas[name] || { remaining: 7, entries: [], weeklyMinimum: 0 };
          const isDragging = draggedIndex === i;
          const isDragOver = dragOverIndex === i;

          return (
            <div
              key={name + i}
              className={`seven-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
            >
              <div className="card-top">
                <div className="card-name">
                  <span className="drag-handle" title="Σύρε για να αλλάξεις τη σειρά">⋮⋮</span>
                  {name}
                  {q.weeklyMinimum > 0 && q.entries.length < q.weeklyMinimum && (
                    <span className="warning-badge" title={`Χρειάζεται τουλάχιστον ${q.weeklyMinimum} αναπληρώσεις`}>
                      ⚠️
                    </span>
                  )}
                </div>
                <div className="card-quota-container">
                  <label className="quota-label">Σύνολο:</label>
                  <input
                    type="number"
                    min="0"
                    className="quota-input"
                    value={q.remaining + q.entries.length}
                    onChange={(e) => handleQuotaChange(name, e.target.value)}
                    title="Αλλαγή συνολικού αριθμού αναπληρώσεων"
                  />
                  <div className={`card-quota ${q.remaining === 0 ? 'zero' : ''}`}>Υπόλοιπο: {q.remaining}</div>
                  {q.weeklyMinimum > 0 && (
                    <div className={`weekly-status ${q.entries.length >= q.weeklyMinimum ? 'met' : 'unmet'}`}>
                      {q.entries.length}/{q.weeklyMinimum} υποχρ.
                    </div>
                  )}
                </div>
              </div>
              <div className="card-actions">
                <button className="assign-btn" disabled={q.remaining === 0} onClick={() => handleAssign(name)}>Καταχώρηση</button>
                <div className="weekly-minimum-container">
                  <label className="weekly-label">Υποχρ/κές Εβδομ:</label>
                  <input
                    type="number"
                    min="0"
                    className="weekly-input"
                    value={q.weeklyMinimum || 0}
                    onChange={(e) => handleWeeklyMinimumChange(name, e.target.value)}
                    title="Υποχρεωτικές αναπληρώσεις την εβδομάδα (για μειωμένο ωράριο)"
                  />
                </div>
              </div>
              <div className="card-tags">
                {q.entries.length === 0 && (
                  <div className="no-tags">Δεν υπάρχουν καταχωρήσεις</div>
                )}
                {q.entries.map((en, idx2) => (
                  <div key={idx2} className="tag-item">
                    <span>{en.date} • {en.day} • {en.period}η</span>
                    <button className="remove-tag" onClick={() => handleRemove(name, idx2)} title="Αφαίρεση">✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear All Modal */}
      {showClearModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
              Διαγραφή όλων των καταχωρήσεων;
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
              Θα διαγραφούν όλες οι καταχωρήσεις από όλους τους καθηγητές. Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  // Clear all entries but keep quotas structure
                  setQuotas(prev => {
                    const cleared = {};
                    Object.keys(prev).forEach(name => {
                      const q = prev[name];
                      const base = isExcluded(name) ? 0 : 7;
                      cleared[name] = {
                        remaining: base,
                        entries: [],
                        weeklyMinimum: q.weeklyMinimum || 0
                      };
                    });
                    try {
                      localStorage.setItem('teacherQuotas', JSON.stringify(cleared));
                    } catch (err) {
                      console.error('Error clearing quotas:', err);
                    }
                    return cleared;
                  });
                  setShowClearModal(false);
                }}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '2px solid #dc3545',
                  background: '#dc3545',
                  color: '#000',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#c82333'}
                onMouseLeave={(e) => e.target.style.background = '#dc3545'}
              >
                ✓ Ναι, Διαγραφή
              </button>
              <button
                onClick={() => setShowClearModal(false)}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '2px solid #6c757d',
                  background: '#6c757d',
                  color: '#000',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                onMouseLeave={(e) => e.target.style.background = '#6c757d'}
              >
                ✕ Όχι
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Clean Modal */}
      {showServerCleanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
              Πλήρης Καθαρισμός Server
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
              Θα γίνει backup όλων των δεδομένων σε JSON file και μετά θα διαγραφούν όλα τα δεδομένα από το Firebase server. Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.
            </p>
            {isBackingUp && (
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#ff6b00', fontWeight: 'bold' }}>
                ⏳ Κάνει backup δεδομένων...
              </p>
            )}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  try {
                    setIsBackingUp(true);
                    
                    // Step 1: Backup all data from Firebase
                    const backupData = {};
                    
                    let backupSuccess = false;
                    
                    try {
                      // Check authentication
                      if (!auth.currentUser) {
                        throw new Error('Πρέπει να είσαι συνδεδεμένος για backup');
                      }

                      console.log('🔄 Starting backup process...');
                      
                      // Get all sevenReplacements data
                      const sevenReplacementsRef = ref(database, 'sevenReplacements');
                      console.log('📡 Connecting to Firebase...');
                      
                      const snapshot = await get(sevenReplacementsRef);
                      
                      if (snapshot.exists()) {
                        backupData.sevenReplacements = snapshot.val();
                        console.log('✅ Data found in Firebase:', Object.keys(backupData.sevenReplacements || {}).length, 'dates');
                      } else {
                        console.log('⚠️ No data found in Firebase - creating empty backup');
                        backupData.sevenReplacements = {};
                      }
                      
                      // Add metadata
                      backupData.metadata = {
                        backupDate: new Date().toISOString(),
                        backupType: 'sevenReplacements',
                        totalDates: Object.keys(backupData.sevenReplacements || {}).length
                      };
                      
                      // Create JSON file and download
                      console.log('💾 Creating JSON file...');
                      const jsonStr = JSON.stringify(backupData, null, 2);
                      
                      if (!jsonStr || jsonStr.length === 0) {
                        throw new Error('Το JSON file είναι άδειο');
                      }
                      
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      
                      if (blob.size === 0) {
                        throw new Error('Το blob είναι άδειο');
                      }
                      
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const fileName = `firebase-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
                      link.download = fileName;
                      link.style.display = 'none';
                      
                      document.body.appendChild(link);
                      
                      console.log('⬇️ Starting download...');
                      link.click();
                      
                      // Wait a bit before cleanup
                      await new Promise(resolve => setTimeout(resolve, 500));
                      
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      
                      console.log('✅ Backup completed and downloaded:', fileName);
                      backupSuccess = true;
                      
                      // Small delay to ensure download completes
                      await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (backupError) {
                      console.error('❌ Error during backup:', backupError);
                      console.error('Error details:', {
                        message: backupError.message,
                        stack: backupError.stack,
                        name: backupError.name,
                        code: backupError.code
                      });
                      
                      setIsBackingUp(false);
                      
                      let errorMessage = 'Άγνωστο σφάλμα';
                      let detailedMessage = '';
                      
                      if (backupError.message && backupError.message.includes('Permission denied')) {
                        errorMessage = 'Permission denied (Δεν έχεις δικαίωμα πρόσβασης)';
                        detailedMessage = '\n\n⚠️ Το πρόβλημα είναι στα Firebase Database Rules!\n\nΓια να το διορθώσεις:\n1. Πήγαινε στο Firebase Console\n2. Database → Realtime Database → Rules\n3. Άλλαξε τα rules σε:\n\n{\n  "rules": {\n    "sevenReplacements": {\n      ".read": true,\n      ".write": true\n    }\n  }\n}\n\n4. Πατήσε "Publish"';
                      } else if (backupError.message) {
                        errorMessage = backupError.message;
                      } else if (backupError.code) {
                        errorMessage = `Firebase error: ${backupError.code}`;
                      }
                      
                      alert('❌ Σφάλμα backup: ' + errorMessage + detailedMessage + '\n\nΟ καθαρισμός ακυρώθηκε για ασφάλεια.');
                      setShowServerCleanModal(false);
                      return; // Stop here if backup fails
                    }
                    
                    // Only proceed with cleaning if backup was successful
                    if (!backupSuccess) {
                      setIsBackingUp(false);
                      setShowServerCleanModal(false);
                      return;
                    }
                    
                    setIsBackingUp(false);
                    
                    // Step 2: Clean all data from Firebase (only if backup succeeded)
                    try {
                      // Check authentication
                      if (!auth.currentUser) {
                        throw new Error('Πρέπει να είσαι συνδεδεμένος για καθαρισμό');
                      }

                      const deleteResult = await deleteData('sevenReplacements');
                      if (deleteResult.success) {
                        alert('✅ Ο server καθαρίστηκε επιτυχώς! Το backup έχει αποθηκευτεί στο αρχείο που κατέβασες.');
                        console.log('✅ Server cleaned successfully');
                      } else {
                        let errorMsg = deleteResult.error?.message || 'Άγνωστο σφάλμα';
                        if (errorMsg.includes('Permission denied') || deleteResult.error?.code === 'PERMISSION_DENIED') {
                          errorMsg += '\n\n⚠️ Το πρόβλημα είναι στα Firebase Database Rules!\n\nΓια να το διορθώσεις:\n1. Πήγαινε στο Firebase Console\n2. Database → Realtime Database → Rules\n3. Άλλαξε τα rules σε:\n\n{\n  "rules": {\n    "sevenReplacements": {\n      ".read": true,\n      ".write": true\n    }\n  }\n}\n\n4. Πατήσε "Publish"';
                        }
                        alert('❌ Σφάλμα καθαρισμού: ' + errorMsg);
                        console.error('❌ Error cleaning server:', deleteResult.error);
                      }
                    } catch (cleanError) {
                      console.error('❌ Error cleaning server:', cleanError);
                      let errorMsg = cleanError.message || 'Άγνωστο σφάλμα';
                      if (cleanError.message && cleanError.message.includes('Permission denied')) {
                        errorMsg += '\n\n⚠️ Το πρόβλημα είναι στα Firebase Database Rules! Δες τις οδηγίες παραπάνω.';
                      }
                      alert('❌ Σφάλμα καθαρισμού: ' + errorMsg);
                    }
                    
                    setShowServerCleanModal(false);
                  } catch (error) {
                    setIsBackingUp(false);
                    console.error('❌ Σφάλμα:', error);
                    alert('❌ Σφάλμα: ' + error.message);
                    setShowServerCleanModal(false);
                  }
                }}
                disabled={isBackingUp}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '2px solid #ff6b00',
                  background: isBackingUp ? '#ccc' : '#ff6b00',
                  color: '#000',
                  borderRadius: '8px',
                  cursor: isBackingUp ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isBackingUp ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isBackingUp) {
                    e.target.style.background = '#e55a00';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isBackingUp) {
                    e.target.style.background = '#ff6b00';
                  }
                }}
              >
                {isBackingUp ? '⏳ Backup...' : '✓ Ναι, Backup & Clean'}
              </button>
              <button
                onClick={() => setShowServerCleanModal(false)}
                disabled={isBackingUp}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '2px solid #6c757d',
                  background: '#6c757d',
                  color: '#000',
                  borderRadius: '8px',
                  cursor: isBackingUp ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isBackingUp ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isBackingUp) {
                    e.target.style.background = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isBackingUp) {
                    e.target.style.background = '#6c757d';
                  }
                }}
              >
                ✕ Όχι
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333' }}>
              Θα γίνει καταχώριση. Είσαι σίγουρος;
            </h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  try {
                    // Check authentication
                    if (!auth.currentUser) {
                      alert('❌ Πρέπει να είσαι συνδεδεμένος για να αποθηκεύσεις. Παρακαλώ συνδέσου ξανά.');
                      setShowConfirmModal(false);
                      return;
                    }

                    // Μετατροπή των quotas σε μορφή για Firebase
                    const replacementsData = {};
                    const today = getAthensDate();
                    const formattedDate = today.toISOString().split('T')[0];
                    
                    // Συλλογή όλων των καταχωρήσεων
                    Object.entries(quotas).forEach(([teacherName, quota]) => {
                      if (quota.entries && quota.entries.length > 0) {
                        replacementsData[teacherName] = {
                          totalCount: quota.entries.length,
                          remaining: quota.remaining,
                          weeklyMinimum: quota.weeklyMinimum || 0,
                          entries: quota.entries.map(entry => ({
                            date: entry.date,
                            day: entry.day,
                            period: entry.period
                          }))
                        };
                      }
                    });
                    
                    // Αποθήκευση στο Firebase
                    const path = `sevenReplacements/${formattedDate}`;
                    const result = await saveData(path, {
                      date: formattedDate,
                      timestamp: Date.now(),
                      teachers: replacementsData,
                      totalEntries: Object.values(quotas).reduce((total, q) => total + (q.entries?.length || 0), 0)
                    });
                    
                    if (result.success) {
                      alert('✅ Οι αναπληρώσεις αποθηκεύτηκαν επιτυχώς στο Firebase!');
                      console.log('✅ Αναπληρώσεις αποθηκεύτηκαν:', replacementsData);
                    } else {
                      alert('❌ Σφάλμα αποθήκευσης: ' + (result.error?.message || 'Άγνωστο σφάλμα'));
                      console.error('❌ Σφάλμα αποθήκευσης:', result.error);
                    }
                    
                    setShowConfirmModal(false);
                  } catch (error) {
                    console.error('❌ Σφάλμα καταχώρισης:', error);
                    alert('❌ Σφάλμα καταχώρισης: ' + error.message);
                    setShowConfirmModal(false);
                  }
                }}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '2px solid #28a745',
                  background: '#28a745',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#218838'}
                onMouseLeave={(e) => e.target.style.background = '#28a745'}
              >
                ✓ Ναι
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '2px solid #dc3545',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#c82333'}
                onMouseLeave={(e) => e.target.style.background = '#dc3545'}
              >
                ✕ Όχι
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SevenReplacementsPage;
