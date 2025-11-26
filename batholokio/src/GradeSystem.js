// @FILE-INFO: GradeSystem.js | src/GradeSystem.js
// FINAL CLEAN VERSION - No syntax errors

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { classes as initialClasses } from './data.js';

import LoginScreen from './LoginScreen.js';
import TeacherDashboard from './TeacherDashboard.js';
import CodeManager from './CodeManager.js';
import GradingView from './GradingView.js';
import StudentView from './StudentView.js';
import PhotoGallery from './PhotoGallery.js';

// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCWV69hfrcRS2-7XJnCvNt8U_6miB6e6pI",
    authDomain: "gradesystem-4ca8b.firebaseapp.com",
    databaseURL: "https://gradesystem-4ca8b-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "gradesystem-4ca8b",
    storageBucket: "gradesystem-4ca8b.firebasestorage.app",
    messagingSenderId: "418391986080",
    appId: "1:418391986080:web:207dbc428459bd3d2f5ec5"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

// TEACHER CREDENTIALS
const TEACHER_EMAIL = "cheimoni1961@gmail.com";
const TEACHER_PASSWORD = "cheimoni";
const TEACHER_UID = "J4BseJJ7plVNivK3QV3JfzDM52k2";

// UTILITY FUNCTIONS
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const messageTemplates = [
    { id: 'kanena', text: "Χωρίς μήνυμα" },
    { id: 'mpravo_teleia', text: "Μπράβο, {}! Εξαιρετική πρόοδος." },
    { id: 'mpravo_synechise', text: "Πολύ καλή προσπάθεια, {}! Συνέχισε έτσι." },
    { id: 'veltiosi', text: "Η απόδοσή σου, {}, βελτιώνεται συνεχώς." },
    { id: 'prospathia', text: "Χρειάζεται περισσότερη προσπάθεια, {}." },
    { id: 'perimeno_perissotera', text: "Περιμένω περισσότερα από εσένα, {}." },
    { id: 'prosochi', text: "Να προσέχουμε περισσότερο στην τάξη." },
    { id: 'ylika', text: "Μην ξεχνάς να φέρνεις τα υλικά σου." },
    { id: 'adiavastos', text: "Να μην ερχόμαστε αδιάβαστοι στο μάθημα." },
    { id: 'apodosi_kaliteri', text: "Η απόδοσή σου μπορεί να γίνει καλύτερη, {}! Έχεις δυνατότητες." },
    { id: 'oxi_kathisterisi', text: "Να μην καθυστερούμε στο μάθημα." },
    { id: 'oxi_omilia', text: "Να μην μιλούμε στο μάθημα." },
    { id: 'ergasies_dinatotites', text: "Οι εργασίες σου, {}, δείχνουν ότι έχεις πολλές δυνατότητες." },
    { id: 'iperoxi_fantasia', text: "Τι υπέροχη φαντασία που έχεις, {}!" },
    { id: 'pragmatikos_kallitechnis', text: "Είσαι πραγματικός καλλιτέχνης, {}!" },
    { id: 'omorfa_xromata', text: "Τι όμορφα χρώματα που χρησιμοποιείς!" },
    { id: 'omorfa_sxedia', text: "Τα σχέδιά σου είναι πανέμορφα!" },
    { id: 'katapliktiki_fantasia', text: "Έχεις καταπληκτική φαντασία." },
    { id: 'sikose_xeri', text: "Αφού το ξέρεις, {}! Μην ντρέπεσαι, σήκωσε το χέρι σου." },
    { id: 'xairomai_gia_esena', text: "Χαίρομαι πολύ που σε έχω στην τάξη μου, {}." },
    { id: 'dynamismos_sxedia', text: "Τα σχέδιά σου, {}, έχουν πολύ δυναμισμό." },
    { id: 'xara_parakolouthisi', text: "Μου δίνεις χαρά όταν παρακολουθείς το μάθημα, {}." }
];

const getVocative = (name) => {
    if (!name) return '';
    if (name.endsWith('ός') && !name.endsWith('ιος')) return name.slice(0, -1) + 'έ';
    if (name.endsWith('ης')) return name.slice(0, -1);
    if (name.endsWith('ας')) return name.slice(0, -1);
    return name;
};

const GradeSystem = () => {
    const [view, setView] = useState('loading');
    const [isRenderReady, setIsRenderReady] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [studentsByClass, setStudentsByClass] = useState({});
    const [allStudents, setAllStudents] = useState([]);
    const [grades, setGrades] = useState({});
    const [config, setConfig] = useState({ numAssignments: 8, numOrals: 8 });
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // STATE FOR TEACHER LOGIN LOCKOUT
    const [teacherLoginAttempts, setTeacherLoginAttempts] = useState(0);
    const [teacherLockoutTime, setTeacherLockoutTime] = useState(null);
    const MAX_TEACHER_ATTEMPTS = 5;
    const TEACHER_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 λεπτά

    // STATE FOR STUDENT LOGIN LOCKOUT
    const [studentLoginAttempts, setStudentLoginAttempts] = useState(0);
    const [studentLockoutTime, setStudentLockoutTime] = useState(null);
    const MAX_STUDENT_ATTEMPTS = 5;
    const [isExporting, setIsExporting] = useState(false);
    const [loginError, setLoginError] = useState('');
    const STUDENT_LOCKOUT_DURATION = 5 * 60 * 1000; // 5 λεπτά
    
    // AUTHENTICATION STATE
    const [authUser, setAuthUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isTeacherMode, setIsTeacherMode] = useState(false);
    
    // CONNECTION MANAGEMENT
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [savingOperations, setSavingOperations] = useState(new Set());
    
    const unsubscribersRef = useRef([]);
    const saveTimeoutsRef = useRef({});

    // AUTH STATE LISTENER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {            
            setAuthUser(user);
            setAuthLoading(false);
            
            if (user && user.uid === TEACHER_UID) {
                console.log('Teacher authenticated successfully');
                setIsTeacherMode(true);
            } else {
                setIsTeacherMode(false);
                if (user) {
                    signOut(auth);
                }
            }
        });
        
        return () => unsubscribe();
    }, []);

    // TEACHER AUTHENTICATION
    const authenticateTeacher = async () => {
        setConnectionStatus('connecting');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, TEACHER_EMAIL, TEACHER_PASSWORD);
            
            if (userCredential.user.uid !== TEACHER_UID) {
                throw new Error('Unauthorized access');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            setLoginError('Αποτυχία σύνδεσης καθηγητή. Δοκιμάστε ξανά.');
            setConnectionStatus('disconnected');
            return false;
        }
    };

    // LOCAL GRADE UPDATE FUNCTION
    const handleLocalGradeUpdate = useCallback((student, type, index, value) => {
        const key = `${student.id}-${type}-${index}`;
        const gradePath = `grades/${student.class}/${key}`;
        setGrades(prev => ({ ...prev, [gradePath]: value }));
    }, []);

    // GRADE SAVE FUNCTION
    const handleGradeChangeWithRetry = useCallback(async (student, type, index, value, maxRetries = 3) => {
        const key = `${student.id}-${type}-${index}`;
        const gradePath = `grades/${student.class}/${key}`;
        const valueToSave = (value === '' || value === null) ? null : parseFloat(value);
        
        if (!isTeacherMode || !authUser || authUser.uid !== TEACHER_UID) {
            alert('Δεν έχετε δικαίωμα αποθήκευσης. Συνδεθείτε ως καθηγητής.');
            return;
        }
        
        setSavingOperations(prev => new Set([...prev, key]));
        
        if (saveTimeoutsRef.current[key]) {
            clearTimeout(saveTimeoutsRef.current[key]);
        }
        
        saveTimeoutsRef.current[key] = setTimeout(async () => {
            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    await set(ref(database, gradePath), valueToSave);
                    
                    setSavingOperations(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(key);
                        return newSet;
                    });
                    return;
                    
                } catch (error) {
                    attempt++;
                    console.error(`Grade save attempt ${attempt}/${maxRetries} failed:`, error);
                    
                    if (error.code === 'PERMISSION_DENIED') {
                        setSavingOperations(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(key);
                            return newSet;
                        });
                        alert('Δεν έχετε δικαίωμα αποθήκευσης.');
                        return;
                    }
                    
                    if (attempt < maxRetries) {
                        const currentAttempt = attempt;
                        await new Promise(resolve => setTimeout(resolve, 1000 + (500 * currentAttempt)));
                    } else {
                        setSavingOperations(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(key);
                            return newSet;
                        });
                        alert(`Αποτυχία αποθήκευσης βαθμού για ${student.firstName}`);
                    }
                }
            }
            delete saveTimeoutsRef.current[key];
        }, 150); // Very fast response
        
    }, [isTeacherMode, authUser]);

    // MESSAGE SAVE FUNCTION
    const handleMessageChangeWithRetry = useCallback(async (student, messageId, maxRetries = 3) => {
        const messagePath = `students/${student.class}/${student.id}/message`;
        const key = `message-${student.id}`;
        
        if (!isTeacherMode || !authUser || authUser.uid !== TEACHER_UID) {
            alert('Δεν έχετε δικαίωμα αποθήκευσης μηνύματος.');
            return;
        }
        
        setSavingOperations(prev => new Set([...prev, key]));
        
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                await set(ref(database, messagePath), messageId);
                
                setSavingOperations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(key);
                    return newSet;
                });
                return;
                
            } catch (error) {
                attempt++;
                console.error(`Message save attempt ${attempt}/${maxRetries} failed:`, error);
                
                if (error.code === 'PERMISSION_DENIED') {
                    setSavingOperations(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(key);
                        return newSet;
                    });
                    alert('Δεν έχετε δικαίωμα αποθήκευσης μηνύματος.');
                    return;
                }
                
                if (attempt < maxRetries) {
                    const currentAttempt = attempt;
                    await new Promise(resolve => setTimeout(resolve, 1000 + (500 * currentAttempt)));
                } else {
                    setSavingOperations(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(key);
                        return newSet;
                    });
                    alert(`Αποτυχία αποθήκευσης μηνύματος για ${student.firstName}`);
                }
            }
        }
    }, [isTeacherMode, authUser]);

    // THEME EFFECT
    useEffect(() => {
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(`${theme}-mode`);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // MAIN FIREBASE SETUP
    useEffect(() => {
        if (authLoading) return;
        
        // CONNECTION STATUS
        const connectedRef = ref(database, '.info/connected');
        const connectedUnsubscribe = onValue(connectedRef, (snapshot) => {
            if (snapshot.val()) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('disconnected');
            }
        });
        unsubscribersRef.current.push(connectedUnsubscribe);

        // STUDENTS LISTENER
        const studentsRef = ref(database, 'students');
        const studentsUnsubscribe = onValue(studentsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setStudentsByClass(data);
                const flattenedStudents = Object.values(data).flatMap(classObj => Object.values(classObj));
                setAllStudents(flattenedStudents);
                
                if (view === 'loading') {
                    setTimeout(() => {
                        setIsRenderReady(true);
                        setView('login');
                    }, 500);
                }
            } else {
                if (isTeacherMode) {
                    initializeStudentsData();
                }
            }
        });
        unsubscribersRef.current.push(studentsUnsubscribe);

        // CONFIG AND GRADES FOR TEACHERS
        if (isTeacherMode && authUser) {
            const configRef = ref(database, 'config');
            const configUnsubscribe = onValue(configRef, (snap) => {
                const configData = snap.val() || { numAssignments: 8, numOrals: 8 };
                setConfig(configData);
            });
            unsubscribersRef.current.push(configUnsubscribe);

        }

        // CLEANUP
        return () => {
            unsubscribersRef.current.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                }
            });
            unsubscribersRef.current = [];
            
            const currentTimeouts = saveTimeoutsRef.current;
            Object.values(currentTimeouts).forEach(timeout => {
                clearTimeout(timeout);
            });
        };
    }, [authLoading, isTeacherMode, authUser, view]);

    // INITIALIZE STUDENTS DATA
    const initializeStudentsData = async () => {
        try {
            // Get current students with their codes and messages
            const currentStudents = {};
            Object.keys(studentsByClass).forEach(className => {
                currentStudents[className] = {};
                Object.values(studentsByClass[className]).forEach(student => {
                    currentStudents[className][student.id] = {
                        ...student,
                        accessCode: student.accessCode || generateCode(),
                        message: student.message || "kanena"
                    };
                });
            });

            // Update with new data from data.js
            const studentsWithCodes = {};
            const generatedCodes = new Set();
            
            Object.keys(initialClasses).forEach(className => {
                studentsWithCodes[className] = {};
                initialClasses[className].forEach(student => {
                    // Try to preserve existing access code and message
                    const existingStudent = currentStudents[className]?.[student.id];
                    let accessCode = existingStudent?.accessCode;
                    let message = existingStudent?.message || "kanena";
                    
                    // Generate new code if none exists
                    if (!accessCode) {
                        do { 
                            accessCode = generateCode(); 
                        } while (generatedCodes.has(accessCode));
                        generatedCodes.add(accessCode);
                    }
                    
                    const studentWithCode = { 
                        ...student, 
                        accessCode: accessCode, 
                        message: message 
                    };
                    studentsWithCodes[className][student.id] = studentWithCode;
                });
            });

            await set(ref(database, 'students'), studentsWithCodes);
        } catch (error) {
            console.error('Failed to auto-update students:', error);
        }
    };

    // UTILITY FUNCTIONS
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // EMERGENCY RESTORE FUNCTION
    const emergencyRestore = async () => {
        try {
            console.log('Emergency restore: Recreating all classes from data.js...');
            
            // Force recreate all classes from data.js
            const studentsWithCodes = {};
            const generatedCodes = new Set();
            
            Object.keys(initialClasses).forEach(className => {
                studentsWithCodes[className] = {};
                initialClasses[className].forEach(student => {
                    let accessCode;
                    do { 
                        accessCode = generateCode(); 
                    } while (generatedCodes.has(accessCode));
                    generatedCodes.add(accessCode);
                    
                    const studentWithCode = { 
                        ...student, 
                        accessCode: accessCode, 
                        message: "kanena" 
                    };
                    studentsWithCodes[className][student.id] = studentWithCode;
                });
            });

            // Restore students
            await set(ref(database, 'students'), studentsWithCodes);
            
            // Clear grades to start fresh
            await set(ref(database, 'grades'), {});
            
            console.log('Emergency restore completed');
            alert('ΕΠΕΙΓΟΥΣΑ ΕΠΑΝΑΦΟΡΑ ΟΛΟΚΛΗΡΩΘΗΚΕ! Όλα τα τμήματα επαναφέρθηκαν από το data.js');
        } catch (error) {
            console.error('Emergency restore failed:', error);
            alert('ΣΦΑΛΜΑ στην επείγουσα επαναφορά: ' + error.message);
        }
    };

    // DATA EXPORT/IMPORT FUNCTIONS
    const handleExportData = async () => {
        if (!window.confirm('Θέλετε να δημιουργήσετε ένα πλήρες αντίγραφο ασφαλείας (μαθητές, βαθμοί, gallery, ρυθμίσεις);')) return;
        setIsExporting(true);
        
        try {
            // Step 1: Fetch the most up-to-date data directly from Firebase
            const studentsRef = ref(database, 'students');
            const gradesRef = ref(database, 'grades');
            const configRef = ref(database, 'config');
            const galleryRef = ref(database, 'gallery');

            const studentsSnapshot = await get(studentsRef);
            const gradesSnapshot = await get(gradesRef);
            const configSnapshot = await get(configRef);
            const gallerySnapshot = await get(galleryRef);

            // Step 2: Assemble the complete backup object
            const backupData = {
                students: studentsSnapshot.val() || {},
                grades: gradesSnapshot.val() || {},
                gallery: gallerySnapshot.val() || {},
                config: configSnapshot.val() || { numAssignments: 8, numOrals: 8 },
                exportDate: new Date().toISOString(),
                version: "1.0"
            };

            // Step 3: Create and download the JSON file
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateString = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            a.download = `bathmologio_backup_${dateString}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Η εξαγωγή ολοκληρώθηκε με επιτυχία!');
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Σφάλμα κατά την εξαγωγή των δεδομένων: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm('ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα αντικαταστήσει ΟΛΑ τα υπάρχοντα δεδομένα. Είστε σίγουροι;')) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.students && data.grades && data.config && data.gallery) {
                    await set(ref(database, 'students'), data.students);
                    await set(ref(database, 'grades'), data.grades);
                    await set(ref(database, 'config'), data.config);
                    await set(ref(database, 'gallery'), data.gallery);
                    alert('Η εισαγωγή ολοκληρώθηκε με επιτυχία! Η σελίδα θα ανανεωθεί.');
                    window.location.reload();
                } else { throw new Error('Invalid backup file format.'); }
            } catch (error) { alert(`Σφάλμα κατά την εισαγωγή: ${error.message}`); }
        };
        reader.readAsText(file);
    };

    // LOGIN HANDLER
    const handleLogin = async (loginCode) => {
        setLoginError(''); // Clear previous errors
        if (loginCode === 'cheimoni') {
            // 1. Έλεγχος αν ο λογαριασμός είναι κλειδωμένος τοπικά
            if (teacherLockoutTime && Date.now() < teacherLockoutTime) {
                const remainingTime = Math.ceil((teacherLockoutTime - Date.now()) / 60000);
                setLoginError(`Έχουν γίνει πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά σε ${remainingTime} λεπτά.`);
                return;
            }

            const authSuccess = await authenticateTeacher();

            if (authSuccess) {
                // 2. Επιτυχής σύνδεση: Μηδενισμός μετρητή και κλειδώματος
                setTeacherLoginAttempts(0);
                setTeacherLockoutTime(null);
                setTimeout(() => {
                    setView('teacher_dash');
                }, 1000);
                return;
            } else {
                // 3. Αποτυχημένη σύνδεση: Αύξηση μετρητή
                const newAttempts = teacherLoginAttempts + 1;
                setTeacherLoginAttempts(newAttempts);
                const remaining = MAX_TEACHER_ATTEMPTS - newAttempts;

                if (newAttempts >= MAX_TEACHER_ATTEMPTS) {
                    // 4. Κλείδωμα λογαριασμού μετά από πολλές προσπάθειες
                    const lockoutUntil = Date.now() + TEACHER_LOCKOUT_DURATION;
                    setTeacherLockoutTime(lockoutUntil);
                    setLoginError(`Ο λογαριασμός κλειδώθηκε προσωρινά για 15 λεπτά.`);
                } else {
                    setLoginError(`Λάθος κωδικός καθηγητή. Απομένουν ${remaining} προσπάθειες.`);
                }
            }
        } else if (loginCode === '000000') {
            if (window.confirm('Είστε σίγουρος ότι θέλετε να κάνετε ΕΠΕΙΓΟΥΣΑ ΕΠΑΝΑΦΟΡΑ; Θα διαγραφούν ΟΛΟΙ οι βαθμοί και θα δημιουργηθούν νέοι κωδικοί.')) {
                emergencyRestore();
            }
        } else {
            // Student Login Logic
            // 1. Check if the user is currently locked out
            if (studentLockoutTime && Date.now() < studentLockoutTime) {
                const remainingTime = Math.ceil((studentLockoutTime - Date.now()) / 60000);
                setLoginError(`Έχετε κάνει πολλές αποτυχημένες προσπάθειες. Δοκιμάστε ξανά σε ${remainingTime} λεπτά.`);
                return;
            }

            if (allStudents.length === 0) {
                setLoginError("Τα δεδομένα των μαθητών δεν έχουν φορτωθεί ακόμα. Δοκιμάστε ξανά.");
                return;
            }
            
            const student = allStudents.find(s => s.accessCode === loginCode);
            if (student) {
                // 2. On successful login, reset attempts and lockout
                setStudentLoginAttempts(0);
                setStudentLockoutTime(null);
                setCurrentUser(student);
                setView('student_view');
            } else {
                // 3. On failed login, increment attempts
                const newAttempts = studentLoginAttempts + 1;
                setStudentLoginAttempts(newAttempts);
                const remaining = MAX_STUDENT_ATTEMPTS - newAttempts;

                if (newAttempts >= MAX_STUDENT_ATTEMPTS) {
                    setStudentLockoutTime(Date.now() + STUDENT_LOCKOUT_DURATION);
                    setLoginError('Η πρόσβαση κλειδώθηκε προσωρινά για 5 λεπτά.');
                } else {
                    setLoginError(`Λάθος κωδικός μαθητή! Απομένουν ${remaining} προσπάθειες.`);
                }
            }
        }
    };

    const handleLogout = async () => {
        if (authUser && isTeacherMode) {
            await signOut(auth);
            setIsTeacherMode(false);
        }
        setCurrentUser(null);
        setView('login');
    };

    const handleUpdateCols = async (type, newCount) => {
        if (!isTeacherMode || !authUser) {
            alert('Δεν έχετε δικαίωμα αλλαγής ρυθμίσεων.');
            return;
        }
        
        const path = type === 'assignments' ? 'config/numAssignments' : 'config/numOrals';
        try {
            await set(ref(database, path), newCount);
        } catch (error) {
            console.error('Failed to update columns:', error);
            alert('Σφάλμα κατά την ενημέρωση των στηλών');
        }
    };

    const calculateFinal = (student, studentClass) => {
        const classGrades = grades[studentClass] || {};
        const examGrade = parseFloat(classGrades[`${student.id}-exam-0`] || 0);
        let totalAP = 0;
        let countAP = 0;
        
        for (let i = 0; i < config.numAssignments; i++) {
            const gradeKey = `${student.id}-assignment-${i}`;
            if (classGrades[gradeKey] != null) {
                totalAP += parseFloat(classGrades[gradeKey]);
                countAP++;
            }
        }
        
        for (let i = 0; i < config.numOrals; i++) {
            const gradeKey = `${student.id}-oral-${i}`;
            if (classGrades[gradeKey] != null) {
                totalAP += parseFloat(classGrades[gradeKey]);
                countAP++;
            }
        }
        
        const avgAP = countAP > 0 ? totalAP / countAP : 0;
        const finalGrade100 = (avgAP * 0.6) + (examGrade * 0.4);
        const finalGrade20 = finalGrade100 / 5;
        
        return finalGrade20.toFixed(1);
    };

    // LOADING SCREEN
    if (authLoading || !isRenderReady) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundColor: '#667eea', 
                color: 'white', 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '2em' 
            }}>
                <div>Φόρτωση Συστήματος...</div>
                <div style={{ fontSize: '0.5em', marginTop: '20px' }}>
                    {authLoading ? 'Έλεγχος ταυτότητας...' :
                     connectionStatus === 'connecting' ? 'Συνδέεται...' : 
                     connectionStatus === 'connected' ? 'Συνδεδεμένο' : 'Αποσυνδεδεμένο'}
                </div>
            </div>
        );
    }

    // RENDER VIEWS
    let currentRenderView;
    switch (view) {
        case 'login': 
            currentRenderView = <LoginScreen onLogin={handleLogin} error={loginError} />; 
            break;
        case 'student_view': 
            currentRenderView = (
                <StudentView 
                    student={currentUser} 
                    grades={grades[currentUser.class] || {}} 
                    config={config} 
                    onLogout={handleLogout} 
                    calculateFinal={() => calculateFinal(currentUser, currentUser.class)} 
                    messageTemplates={messageTemplates} 
                    getVocative={getVocative} 
                    onShowGallery={() => setView('gallery')} 
                />
            ); 
            break;
        case 'teacher_dash': 
            currentRenderView = (
                <TeacherDashboard 
                    teacherName="Καθηγητής (Verified)" 
                    onShowGrades={() => setView('grading')} 
                    onShowCodes={() => setView('codes')} 
                    onShowGallery={() => setView('gallery')} 
                    onExport={handleExportData}
                    isExporting={isExporting}
                    onImport={handleImportData}
                    onLogout={handleLogout}
                />
            ); 
            break;
        case 'grading': 
            currentRenderView = (
                <GradingView 
                    studentsByClass={studentsByClass} 
                    grades={grades} 
                    config={config} 
                    onLocalGradeUpdate={handleLocalGradeUpdate}
                    onGradeChange={handleGradeChangeWithRetry} 
                    onMessageChange={handleMessageChangeWithRetry} 
                    onUpdateCols={handleUpdateCols} 
                    calculateFinal={calculateFinal} 
                    onBack={() => setView('teacher_dash')} 
                    messageTemplates={messageTemplates} 
                />
            ); 
            break;
        case 'codes': 
            currentRenderView = (
                <CodeManager 
                    studentsByClass={studentsByClass} 
                    onBack={() => setView('teacher_dash')} 
                    database={database} 
                />
            ); 
            break;
        case 'gallery': 
            currentRenderView = (
                <PhotoGallery 
                    user={currentUser || { type: 'teacher', name: 'Καθηγητής' }} 
                    students={allStudents} 
                    onBack={() => setView(currentUser?.type === 'teacher' || isTeacherMode ? 'teacher_dash' : 'student_view')} 
                    database={database} 
                    storage={storage} 
                />
            ); 
            break;
        default: 
            currentRenderView = <div>Κάτι πήγε στραβά.</div>;
    }

    return (
        <div className="app-container">
            {connectionStatus !== 'connected' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    zIndex: 9999,
                    fontSize: '14px'
                }}>
                    Χωρίς σύνδεση - Οι αλλαγές δεν αποθηκεύονται
                </div>
            )}

            {currentRenderView}
            
            <button 
                onClick={toggleTheme} 
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '50px',
                    height: '50px',
                    border: 'none',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    zIndex: 1000
                }}
            >
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
    );
};

export default GradeSystem;