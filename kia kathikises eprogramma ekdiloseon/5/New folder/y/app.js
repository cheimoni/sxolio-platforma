// @FILE-INFO: app.js | ./
// TYPE: Main Application Logic
// LAYER: Business (Logic)
// SIZE: 700 lines (Large)
// PROVIDES: Firebase initialization, data handling, UI rendering, event listeners

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, writeBatch, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// === ΔΕΔΟΜΕΝΑ ===
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const allTeachers = [
    "Αλεξάνδρου Χριστίνα", "Αντωνίου Νίκη", "Αντωνίου Στέλλα", "Αντωνοούση Άννα", 
    "Βασιλείου Ηλίας", "Γαβριήλ Αφρούλα", "Γεωργίου Μαρία", "Γιαννάκου Άντρη", 
    "Γροσοπούλου Κωνσταντίνα", "Ευαγγέλου Χρίστου Χριστιάνα", "Ευαγόρου Ευαγόρας",
    "Ευμήδου Άντρη", "Ευριπίδου Μιχαήλ", "Ευσταθίου Τάσος", "Ζαντή Αιμιλία", 
    "Ζαχαριάδη Μύρω", "Ηρακλέους Στυλιανή", "Θεοφάνους Σάββας", "Ιωακείμ Ιωακείμ", 
    "Ιωάννου Ξένια", "Ιωάννου Ανθούλα", "Καγιά Ευγενία", "Κονή Λίζα", "Κουαλή Έλενα",
    "Κουντούρης Κυριάκος", "Κουσούλου Γεωργία", "Κρασίδου Περσεφόνη", "Κυπριανού Μ. Μαρία", 
    "Κυριάκου Νέδη", "Κωνσταντινίδης Παναγιώτης", "Κωνσταντίνου Δέσπω", "Λοϊζιά Λευκή", 
    "Λουκαΐδης Γιώργος", "Μακρή Αμαλία", "Μαρκίδου Στέφανη", "Μαρκούλη Άντρη", 
    "Μιχαήλ Παναγιώτα", "Νεοφύτου Γεωργίου Θεονίτσα", "Νικηφόρου Μαρία", "Νίκου Χριστάκης", 
    "Ξενοφώντος Μαρία", "Οδυσσέως Ευριδίκη", "Οικονομίδου Μυρία", "Ορφανίδου Δώρα", 
    "Παναγιώτου Αδελίνα", "Παναγιώτου Δημήτριος", "Παναγιώτου Ελένη", "Παπαδόπουλος Γεώργιος", 
    "Παπαδοπούλου Μαρίνα", "Περικλέους Γιούλα", "Πέτρου Άγγελα", "Πιτσίλλος Χρίστος", 
    "Ποιητάρης Ευαγόρας", "Σβανά Καλιάνα", "Σολομωνίδου Ευτυχία", "Σπυρίδωνος Μαρία", 
    "Στασούλλη Χαρίκλεια", "Συκοπετρίτης Ιωακείμ", "Σωτηριάδου Κινή Μαρία", "Τέρζη Άννα", 
    "Τρυγωνάκη Μαρία", "Φελλά Ορφέας", "Χαραλάμπους Θάσος", "Χατζηνικολάου Γεωργία",
    "Χειλιμίνδρη Αυγή", "Χειμωνίδης Γιώργος", "Χουβαρτά Χρύση", "Χρίστου Γιάννης", 
    "Χρίστου Ευδοκία", "Χρίστου Πρόδρομος", "Χριστοφή Ανθή"
];

const teachingHours = {
    'Αντωνίου Νίκη': { 'A11': 4, 'A31': 2, 'A21': 2 }, 
    'Αντωνοούση Άννα': { 'B1': 5, 'A32': 2, 'A24': 2, 'B51': 5, 'A11': 3 },
    'Βασιλείου Ηλίας': { 'B52': 4, 'B41': 4, 'A41': 3 }, 
    'Γαβριήλ Αφρούλα': { 'Γ51': 6, 'B1': 5, 'B32': 2, 'B52': 2 },
    'Γεωργίου Μαρία': { 'B33': 6, 'B52': 2, 'A23': 6 }, 
    'Γιαννάκου Άντρη': { 'A24': 6, 'B51': 3, 'A41': 4 },
    'Γροσοπούλου Κωνσταντίνα': { 'A11': 5, 'B41': 2, 'B32': 1 }, 
    'Ευαγγέλου Χρίστου Χριστιάνα': { 'A42': 1, 'A23': 1, 'A41': 1, 'A31': 1, 'A11': 1, 'A32': 1, 'A22': 1, 'A21': 1 },
    'Ευαγόρου Ευαγόρας': { 'Γ32': 6, 'A11': 3 }, 
    'Ευσταθίου Τάσος': { 'A32': 2, 'A23': 2, 'A21': 4, 'A41': 4, 'A31': 2 },
    'Ζαντή Αιμιλία': { 'A22': 6, 'Γ31': 7, 'Γ53': 3 }, 
    'Ζαχαριάδη Μύρω': { 'B41': 5, 'Γ52': 3, 'B31': 5 },
    'Ηρακλέους Στυλιανή': { 'A31': 1, 'A41': 1, 'A21': 1, 'A24': 1, 'A42': 1 }, 
    'Θεοφάνους Σάββας': { 'B41': 6, 'A43': 4, 'A21': 6 },
    'Ιωακείμ Ιωακείμ': { 'A23': 2, 'A22': 4, 'A42': 2 }, 
    'Ιωάννου Ξένια': { 'A21': 2, 'A32': 2, 'A42': 2 }, 
    'Ιωάννου Ανθούλα': { 'Γ41': 4, 'Γ51': 4 },
    'Καγιά Ευγενία': { 'B51': 1, 'A41': 5, 'A22': 6, 'A21': 2, 'B31': 2, 'A42': 2 }, 
    'Κουαλή Έλενα': { 'A41': 2, 'A43': 2, 'A32': 6, 'A42': 6, 'A23': 2, 'A22': 2, 'B52': 1 },
    'Κουντούρης Κυριάκος': { 'A23': 1, 'A24': 2, 'A43': 2, 'A42': 2 }, 
    'Κουσούλου Γεωργία': { 'Γ53': 1, 'A21': 4, 'A32': 2, 'Γ52': 1, 'Γ41': 1 },
    'Κρασίδου Περσεφόνη': { 'A42': 1, 'A21': 1, 'A41': 1, 'A22': 1 }, 
    'Κυπριανού Μ. Μαρία': { 'Γ53': 6, 'Γ1': 5 },
    'Κυριάκου Νέδη': { 'B52': 5, 'A23': 2, 'B33': 5, 'A24': 2, 'A11': 3 }, 
    'Κωνσταντινίδης Παναγιώτης': { 'Γ52': 2, 'Γ32': 2, 'Γ51': 2, 'A41': 2, 'B33': 2, 'B52': 2, 'Γ53': 2, 'A42': 2, 'Γ41': 2, 'Γ1': 2, 'Γ31': 2 },
    'Κωνσταντίνου Δέσπω': { 'A41': 2, 'A32': 2 }, 
    'Μαρκίδου Στέφανη': { 'Γ51': 6, 'Γ1': 2 }, 
    'Μαρκούλη Άντρη': { 'A23': 6, 'A43': 2, 'A24': 6, 'A31': 2, 'A41': 2 },
    'Νεοφύτου Γεωργίου Θεονίτσα': { 'Γ52': 3, 'B31': 6, 'A32': 6 }, 
    'Νικηφόρου Μαρία': { 'Γ52': 5, 'B31': 2, 'Γ32': 3, 'Γ41': 3 }, 
    'Νίκου Χριστάκης': { 'B41': 1, 'B33': 5, 'A42': 2, 'Γ51': 1, 'Γ1': 1 },
    'Ξενοφώντος Μαρία': { 'A22': 3, 'A41': 3, 'A31': 2, 'A32': 2, 'A11': 3, 'A21': 2, 'A23': 2 }, 
    'Οικονομίδου Μυρία': { 'Γ41': 6, 'Γ31': 3, 'Γ53': 3 },
    'Ορφανίδου Δώρα': { 'A31': 2, 'B32': 5, 'Γ32': 5, 'A41': 3 }, 
    'Παναγιώτου Αδελίνα': { 'A22': 2, 'B32': 5 },
    'Παναγιώτου Ελένη': { 'A31': 3, 'Γ53': 4, 'B41': 4, 'A24': 1, 'Γ52': 4, 'A42': 3, 'A23': 1, 'A22': 1 }, 
    'Παπαδόπουλος Γεώργιος': { 'A11': 2, 'A23': 2, 'Γ32': 2, 'A42': 2, 'A22': 2, 'A21': 2 },
    'Παπαδοπούλου Μαρίνα': { 'Γ51': 3, 'Γ31': 5, 'A42': 4, 'A41': 4, 'A32': 2, 'A24': 2 }, 
    'Περικλέους Γιούλα': { 'A22': 2, 'B52': 6, 'Γ53': 6 },
    'Πέτρου Άγγελα': { 'B51': 6, 'A21': 2, 'A11': 2 }, 
    'Ποιητάρης Ευαγόρας': { 'A42': 4, 'B1': 4 }, 
    'Σβανά Καλιάνα': { 'A22': 1, 'A23': 1, 'A11': 1 },
    'Σολομωνίδου Ευτυχία': { 'B41': 2, 'B32': 2, 'B51': 2, 'B31': 2, 'B52': 2, 'Γ52': 2, 'Γ53': 2 }, 
    'Σπυρίδωνος Μαρία': { 'Γ31': 5, 'B1': 1, 'A11': 3, 'A22': 4, 'A43': 2 },
    'Στασούλλη Χαρίκλεια': { 'A43': 6, 'B33': 2, 'B51': 2, 'A31': 5, 'B41': 2 }, 
    'Συκοπετρίτης Ιωακείμ': { 'A41': 4, 'A43': 2 },
    'Σωτηριάδου Κινή Μαρία': { 'Γ52': 6, 'A31': 2 }, 
    'Χαραλάμπους Θάσος': { 'A24': 2, 'A32': 2, 'A21': 2 }, 
    'Χειλιμίνδρη Αυγή': { 'A21': 7 },
    'Χειμωνίδης Γιώργος': {}, 
    'Χουβαρτά Χρύση': { 'Γ32': 6, 'Γ1': 6, 'A31': 2 }, 
    'Χρίστου Γιάννης': { 'Γ1': 3, 'Γ41': 7 }, 
    'Χρίστου Ευδοκία': { 'A23': 5, 'B31': 5, 'B51': 1, 'B52': 1, 'A24': 4 },
    'Χριστοφή Ανθή': { 'A31': 6, 'B32': 7, 'Γ51': 3 }
};

const initialDepartments = [
    { id: 'A11', responsible: 'Δροσοπούλου Κωνσταντίνα', director: 'Κουμή Αναστασία', assistants: [] },
    { id: 'A21', responsible: 'Παπαδόπουλος Γεώργιος', director: 'Σωτηριάδου Κινή Μαρία', assistants: [] },
    { id: 'A22', responsible: 'Καγιά Ευγενία', director: 'Νίκου Χριστάκης', assistants: [] },
    { id: 'A23', responsible: 'Σβανά Καλιάνα', director: 'Κυπριανού Μ. Μαρία', assistants: [] },
    { id: 'A24', responsible: 'Χαραλάμπους Θάσος', director: 'Λοϊζιά Λευκή', assistants: [] },
    { id: 'A31', responsible: 'Χριστοφή Ανθή', director: 'Σωτηριάδου Κινή Μαρία', assistants: [] },
    { id: 'A32', responsible: 'Νεοφύτου Γεωργίου Θεονίτσα', director: 'Κονή Λίζα', assistants: [] },
    { id: 'A41', responsible: 'Ευσταθίου Τάσος', director: 'Λοϊζιά Λευκή', assistants: [] },
    { id: 'A42', responsible: 'Κρασίδου Περσεφόνη', director: 'Νίκου Χριστάκης', assistants: [] },
    { id: 'A43', responsible: 'Θεοφάνους Σάββας', director: 'Κονή Λίζα', assistants: [] },
    { id: 'B1', responsible: 'Παναγιώτου Αδελίνα', director: 'Σωτηριάδου Κινή Μαρία', assistants: [] },
    { id: 'B31', responsible: 'Χρίστου Ευδοκία', director: 'Κονή Λίζα', assistants: [] },
    { id: 'B32', responsible: 'Ορφανίδου Δώρα', director: 'Λοϊζιά Λευκή', assistants: [] },
    { id: 'B33', responsible: 'Γεωργίου Μαρία', director: 'Νίκου Χριστάκης', assistants: [] },
    { id: 'B41', responsible: 'Παναγιώτου Ελένη', director: 'Ευαγόρου Ευαγόρας', assistants: [] },
    { id: 'B51', responsible: 'Στασούλλη Χαρίκλεια', director: 'Κουμή Αναστασία', assistants: [] },
    { id: 'B52', responsible: 'Κωνσταντινίδης Παναγιώτης', director: 'Ευαγόρου Ευαγόρας', assistants: [] },
    { id: 'Γ1', responsible: 'Μαρκίδου Στέφανη', director: 'Κυπριανού Μ. Μαρία', assistants: [] },
    { id: 'Γ31', responsible: 'Ζαντή Αιμιλία', director: 'Κονή Λίζα', assistants: [] },
    { id: 'Γ32', responsible: 'Χουβαρτά Χρύση', director: 'Ευαγόρου Ευαγόρας', assistants: [] },
    { id: 'Γ41', responsible: 'Οικονομίδου Μυρία', director: 'Κουμή Αναστασία', assistants: [] },
    { id: 'Γ51', responsible: 'Ιωάννου Ανθούλα', director: 'Νίκου Χριστάκης', assistants: [] },
    { id: 'Γ52', responsible: 'Νικηφόρου Μαρία', director: 'Σωτηριάδου Κινή Μαρία', assistants: [] },
    { id: 'Γ53', responsible: 'Περικλέους Γιούλα', director: 'Λοϊζιά Λευκή', assistants: [] }
];

const managementAndInitialHeads = [
    "Κουμή Αναστασία", "Ευαγόρου Ευαγόρας", "Κονή Λίζα", "Κυπριανού Μ. Μαρία",
    "Λοϊζιά Λευκή", "Νίκου Χριστάκης", "Σωτηριάδου Κινή Μαρία",
    "Αντωνίου Νίκη", "Παπαδοπούλου Μαρίνα", "Χειμωνίδης Γιώργος",
    "Δροσοπούλου Κωνσταντίνα", "Παπαδόπουλος Γεώργιος", "Καγιά Ευγενία",
    "Σβανά Καλιάνα", "Χαραλάμπους Θάσος", "Χριστοφή Ανθή",
    "Νεοφύτου Γεωργίου Θεονίτσα", "Ευσταθίου Τάσος", "Κρασίδου Περσεφόνη",
    "Θεοφάνους Σάββας", "Παναγιώτου Αδελίνα", "Χρίστου Ευδοκία",
    "Ορφανίδου Δώρα", "Γεωργίου Μαρία", "Παναγιώτου Ελένη",
    "Στασούλλη Χαρίκλεια", "Κωνσταντινίδης Παναγιώτης", "Μαρκίδου Στέφανη",
    "Ζαντή Αιμιλία", "Χουβαρτά Χρύση", "Οικονομίδου Μυρία",
    "Ιωάννου Ανθούλα", "Νικηφόρου Μαρία", "Περικλέους Γιούλα"
];

// === STATE ===
let db, auth;
let departmentsData = [];
let activityData = { name: '', goal: '', substitutes: [] };
let unsubscribeHeader, unsubscribeDepartments, unsubscribeActivity;
let currentUser = null;

// === DOM ELEMENT VARIABLES ===
let schoolNameInput, schoolYearInput, periodInput, departmentsTbody, availableTeachersList, 
    resetBtn, activityNameDisplay, activityGoalInput, substitutesList, resetSubstitutesBtn, 
    loginModal, loginBtn, showLoginBtn, closeModalBtn, logoutBtn, loginEmailInput, 
    loginPasswordInput, loginError, userStatus;

// === INITIALIZATION ===
function initializeDOMElements() {
    schoolNameInput = document.getElementById('school-name');
    schoolYearInput = document.getElementById('school-year');
    periodInput = document.getElementById('period');
    departmentsTbody = document.getElementById('departments-tbody');
    availableTeachersList = document.getElementById('available-teachers-list');
    resetBtn = document.getElementById('reset-btn');
    activityNameDisplay = document.getElementById('activity-name-display');
    activityGoalInput = document.getElementById('activity-goal');
    substitutesList = document.getElementById('substitutes-list');
    resetSubstitutesBtn = document.getElementById('reset-substitutes-btn');
    loginModal = document.getElementById('login-modal');
    loginBtn = document.getElementById('login-btn');
    showLoginBtn = document.getElementById('show-login-btn');
    closeModalBtn = document.getElementById('close-modal-btn');
    logoutBtn = document.getElementById('logout-btn');
    loginEmailInput = document.getElementById('login-email');
    loginPasswordInput = document.getElementById('login-password');
    loginError = document.getElementById('login-error');
    userStatus = document.getElementById('user-status');
}

function initializeEventListeners() {
    schoolNameInput.addEventListener('input', saveHeader);
    schoolYearInput.addEventListener('input', saveHeader);
    periodInput.addEventListener('input', saveHeader);

    activityGoalInput.addEventListener('input', () => {
        autoResizeTextarea(activityGoalInput);
        saveActivity();
    });

    resetBtn.addEventListener('click', handleReset);
    resetSubstitutesBtn.addEventListener('click', handleResetSubstitutes);
    substitutesList.addEventListener('change', handleSubstituteChange);

    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-assistant-btn')) {
            const { deptId, assistantName } = e.target.dataset;
            removeAssistant(deptId, assistantName);
        }
    });

    showLoginBtn.addEventListener('click', () => loginModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
}

// === FIREBASE ===
async function initializeFirebase() {
    initializeDOMElements();
    initializeEventListeners();
    
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        await setPersistence(auth, browserLocalPersistence);

        onAuthStateChanged(auth, user => {
            currentUser = user;
            if (user) {
                console.log("User signed in:", user.email);
                updateUIForLoggedInUser(user);
                loadInitialData();
            } else {
                console.log("User signed out.");
                updateUIForLoggedOutUser();
                loadInitialData();
            }
        });
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}

async function loadInitialData() {
    if (unsubscribeDepartments) unsubscribeDepartments();
    if (unsubscribeHeader) unsubscribeHeader();
    if (unsubscribeActivity) unsubscribeActivity();

    const headerRef = doc(db, `artifacts/${appId}/public/data/header/config`);
    const headerSnap = await getDoc(headerRef);
    
    if (!headerSnap.exists() && currentUser) {
        await seedInitialData();
    }
    
    setupListeners();
    document.getElementById('app-container').classList.remove('opacity-0');
}

async function seedInitialData() {
    const batch = writeBatch(db);
    const headerRef = doc(db, `artifacts/${appId}/public/data/header/config`);
    batch.set(headerRef, {
        schoolName: "ΛΥΚΕΙΟ ΑΓΙΟΥ ΣΠΥΡΙΔΩΝΑ", 
        schoolYear: "ΣΧΟΛΙΚΗ ΧΡΟΝΙΑ 2025-2026", 
        period: "ΠΕΡΙΟΔΟΣ: ΣΕΠΤΕΜΒΡΙΟΣ 2025",
    });
    initialDepartments.forEach(dept => {
        const deptRef = doc(db, `artifacts/${appId}/public/data/departments`, dept.id);
        batch.set(deptRef, { responsible: dept.responsible, director: dept.director, assistants: [] });
    });
    const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
    batch.set(activityRef, { name: '', goal: '', substitutes: [] });
    await batch.commit();
}

function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function setupListeners() {
    const headerRef = doc(db, `artifacts/${appId}/public/data/header/config`);
    unsubscribeHeader = onSnapshot(headerRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            schoolNameInput.value = data.schoolName || '';
            schoolYearInput.value = data.schoolYear || '';
            periodInput.value = data.period || '';
        }
    });

    const departmentsCol = collection(db, `artifacts/${appId}/public/data/departments`);
    unsubscribeDepartments = onSnapshot(departmentsCol, (snapshot) => {
        const fetchedDepts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        departmentsData = fetchedDepts.sort((a, b) => a.id.localeCompare(b.id));
        render();
    });

    const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
    unsubscribeActivity = onSnapshot(activityRef, (docSnap) => {
        if (docSnap.exists()) {
            activityData = docSnap.data();
            activityGoalInput.value = activityData.goal || '';
            autoResizeTextarea(activityGoalInput); // Set initial size
            render();
        }
    });
}

const debounce = (func, timeout = 500) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
};

const saveHeader = debounce(() => {
    if (!currentUser) return;
    const headerRef = doc(db, `artifacts/${appId}/public/data/header/config`);
    setDoc(headerRef, {
        schoolName: schoolNameInput.value, 
        schoolYear: schoolYearInput.value, 
        period: periodInput.value,
    }, { merge: true }).catch(err => console.error("Error saving header:", err));
});

const saveActivity = debounce(() => {
    if (!currentUser) return;
    const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
    setDoc(activityRef, {
        goal: activityGoalInput.value,
    }, { merge: true }).catch(err => console.error("Error saving activity:", err));
});

function getTeacherUsageCount(teacherName) {
    let count = 0;
    
    const isResponsible = departmentsData.some(d => d.responsible === teacherName);
    if (isResponsible) count++;
    
    const isAssistant = departmentsData.some(d => (d.assistants || []).includes(teacherName));
    if (isAssistant) count++;
    
    const isSubstitute = (activityData.substitutes || []).includes(teacherName);
    if (isSubstitute) count++;
    
    return count;
}

function getUsageColorStyle(count) {
    if (count === 0) {
        return { color: 'green', fontWeight: 'bold', backgroundColor: '#e8f5e8' };
    } else if (count === 1) {
        return { color: 'black', fontWeight: 'normal', backgroundColor: 'white' };
    } else {
        return { color: 'red', fontWeight: 'bold', backgroundColor: '#ffe8e8' };
    }
}

function render() {
    const isEditable = !!currentUser;
    
    const currentResponsibles = new Set(departmentsData.map(d => d.responsible).filter(r => r));
    const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []));
    const assignedSubstitutes = new Set(activityData.substitutes || []);

    const completelyAvailableTeachers = allTeachers.filter(t => 
        !managementAndInitialHeads.includes(t) &&
        !currentResponsibles.has(t) &&
        !assignedAssistants.has(t) &&
        !assignedSubstitutes.has(t)
    );

    renderAvailableTeachers(completelyAvailableTeachers);
    renderDepartments(isEditable);
    renderSubstitutes(isEditable);
    renderSubstitutesDisplay();
}

function renderAvailableTeachers(teachers) {
    availableTeachersList.innerHTML = teachers.length === 0 
        ? `<div class="p-4 text-center text-gray-500">Δεν υπάρχουν διαθέσιμοι καθηγητές.</div>`
        : teachers.map(teacher => `<div class="available-teacher-item">${teacher}</div>`).join('');
}

function renderDepartments(isEditable) {
    departmentsTbody.innerHTML = '';

    departmentsData.forEach(dept => {
        const tr = document.createElement('tr');
        
        const gradeLevel = dept.id.charAt(0);
        if (gradeLevel === 'A') {
            tr.style.backgroundColor = '#e8f5e8'; 
        } else if (gradeLevel === 'B') {
            tr.style.backgroundColor = '#e3f2fd'; 
        } else if (gradeLevel === 'Γ') {
            tr.style.backgroundColor = '#ffebee'; 
        }
        
        const gradeTd = document.createElement('td');
        gradeTd.className = 'font-semibold';
        gradeTd.textContent = dept.id;

        const responsibleTd = document.createElement('td');
        const responsibleSelect = document.createElement('select');
        responsibleSelect.className = 'header-input text-sm p-1 w-full';
        responsibleSelect.disabled = !isEditable;
        
        const currentResponsibles = new Set(departmentsData.map(d => d.responsible).filter(r => r));
        const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []));
        const assignedSubstitutes = new Set(activityData.substitutes || []);
        
        responsibleSelect.innerHTML = '<option value="">Επιλέξτε υπεύθυνο...</option>';
        
        allTeachers.forEach(teacher => {
            const isAlreadyResponsible = currentResponsibles.has(teacher) && teacher !== dept.responsible;
            const isAssistant = assignedAssistants.has(teacher);
            const isSubstitute = assignedSubstitutes.has(teacher);
            
            const isAvailable = !isAlreadyResponsible && !isAssistant && !isSubstitute;
            const isCurrentResponsible = teacher === dept.responsible;
            
            if (isAvailable || isCurrentResponsible) {
                const isSelected = teacher === dept.responsible ? 'selected' : '';
                const hours = teachingHours[teacher]?.[dept.id] || 0;
                const displayText = hours > 0 ? `${teacher} (${hours})` : teacher;
                
                const usageCount = getTeacherUsageCount(teacher);
                const option = document.createElement('option');
                option.value = teacher;
                option.textContent = displayText;
                option.selected = !!isSelected;
                
                const colorStyle = getUsageColorStyle(usageCount);
                option.style.color = colorStyle.color;
                option.style.fontWeight = colorStyle.fontWeight;
                option.style.backgroundColor = colorStyle.backgroundColor;
                
                responsibleSelect.appendChild(option);
            }
        });
        
        responsibleSelect.addEventListener('change', (e) => updateResponsible(dept.id, e.target.value));
        responsibleTd.appendChild(responsibleSelect);

        const assistantsTd = document.createElement('td');
        assistantsTd.id = `assistants-cell-${dept.id}`;

        const directorTd = document.createElement('td');
        directorTd.textContent = dept.director;

        tr.appendChild(gradeTd);
        tr.appendChild(responsibleTd);
        tr.appendChild(assistantsTd);
        tr.appendChild(directorTd);
        
        departmentsTbody.appendChild(tr);
        
        renderAssistantsCell(dept, isEditable);
    });
}

function renderAssistantsCell(dept, isEditable) {
    const cell = document.getElementById(`assistants-cell-${dept.id}`);
    if (!cell) return;
    cell.innerHTML = '';

    const assistantsContainer = document.createElement('div');
    assistantsContainer.className = 'flex flex-col items-start gap-2 mb-2';
    (dept.assistants || []).forEach(assistant => {
        const assistantHours = teachingHours[assistant]?.[dept.id] || 0;
        const assistantText = assistantHours > 0 ? `${assistant} (${assistantHours})` : assistant;
        const span = document.createElement('span');
        span.className = 'bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center';
        
        const usageCount = getTeacherUsageCount(assistant);
        const colorStyle = getUsageColorStyle(usageCount);
        span.style.color = colorStyle.color;
        span.style.backgroundColor = colorStyle.backgroundColor;
        span.style.fontWeight = colorStyle.fontWeight;
        
        span.innerHTML = `${assistantText} ${isEditable ? `<button data-dept-id="${dept.id}" data-assistant-name="${assistant}" class="btn-danger-small remove-assistant-btn">x</button>` : ''}`;
        assistantsContainer.appendChild(span);
    });
    cell.appendChild(assistantsContainer);

    if (isEditable && (dept.assistants || []).length < 2) {
        const select = document.createElement('select');
        select.className = 'header-input text-sm p-1 w-full';
        
        const currentResponsibles = new Set(departmentsData.map(d => d.responsible).filter(r => r));
        const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []));
        const assignedSubstitutes = new Set(activityData.substitutes || []);
        
        const availableForAssistant = allTeachers.filter(teacher => 
            !managementAndInitialHeads.includes(teacher) &&
            !currentResponsibles.has(teacher) &&
            !assignedAssistants.has(teacher) &&
            !assignedSubstitutes.has(teacher)
        );

        select.innerHTML = `<option value="">Επιλέξτε βοηθό...</option>`;
        availableForAssistant.forEach(teacher => {
            const hours = teachingHours[teacher]?.[dept.id] || 0;
            const displayText = hours > 0 ? `${teacher} (${hours})` : teacher;
            
            const usageCount = getTeacherUsageCount(teacher);
            const option = document.createElement('option');
            option.value = teacher;
            option.textContent = displayText;
            
            const colorStyle = getUsageColorStyle(usageCount);
            option.style.color = colorStyle.color;
            option.style.fontWeight = colorStyle.fontWeight;
            option.style.backgroundColor = colorStyle.backgroundColor;
            
            select.appendChild(option);
        });

        select.addEventListener('change', async (e) => {
            if (e.target.value) {
                select.disabled = true;
                await addAssistant(dept.id, e.target.value);
                select.disabled = false;
            }
        });
        
        cell.appendChild(select);
    }
}

function renderSubstitutes(isEditable) {
    const selectedSubstitutes = new Set(activityData.substitutes || []);
    const currentResponsibles = new Set(departmentsData.map(d => d.responsible).filter(r => r));
    const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []));
    
    const potentialSubstitutes = allTeachers.filter(t => 
        !managementAndInitialHeads.includes(t) &&
        !currentResponsibles.has(t) &&
        !assignedAssistants.has(t)
    );
    
    substitutesList.innerHTML = '';
    potentialSubstitutes.forEach(teacher => {
        const isChecked = selectedSubstitutes.has(teacher);
        const label = document.createElement('label');
        label.className = 'substitute-item cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" value="${teacher}" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" ${isChecked ? 'checked' : ''} ${!isEditable ? 'disabled' : ''}>
            <span>${teacher}</span>
        `;
        substitutesList.appendChild(label);
    });
}

function renderSubstitutesDisplay() {
    const substitutes = activityData.substitutes || [];
    if (substitutes.length > 0) {
        activityNameDisplay.innerHTML = substitutes
            .map((name, index) => `<div>${index + 1}. ${name}</div>`)
            .join('');
    } else {
        activityNameDisplay.innerHTML = `<div class="text-gray-400">Δεν έχουν επιλεγεί αναπληρωτές.</div>`;
    }
}

function updateUIForLoggedInUser(user) {
    userStatus.textContent = user.email;
    userStatus.classList.remove('hidden');
    showLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    loginModal.classList.add('hidden');
    document.querySelectorAll('.editable-control').forEach(el => el.disabled = false);
    render();
}

function updateUIForLoggedOutUser() {
    userStatus.textContent = '';
    userStatus.classList.add('hidden');
    showLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    document.querySelectorAll('.editable-control').forEach(el => el.disabled = true);
    render();
}

async function handleLogin() {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    loginError.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login failed:", error.message);
        loginError.textContent = "Λάθος email ή κωδικός.";
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
}

async function updateResponsible(deptId, teacherName) {
    if (!currentUser) return;
    const deptRef = doc(db, `artifacts/${appId}/public/data/departments`, deptId);
    await setDoc(deptRef, { responsible: teacherName }, { merge: true });
}

async function addAssistant(deptId, teacherName) {
    if (!currentUser || !teacherName) return;
    const deptRef = doc(db, `artifacts/${appId}/public/data/departments`, deptId);
    try {
        await runTransaction(db, async (transaction) => {
            const deptDoc = await transaction.get(deptRef);
            if (!deptDoc.exists()) throw "Document does not exist!";
            const newAssistants = deptDoc.data().assistants || [];
            if (!newAssistants.includes(teacherName) && newAssistants.length < 2) {
                newAssistants.push(teacherName);
                transaction.update(deptRef, { assistants: newAssistants });
            }
        });
    } catch (e) { 
        console.error("Transaction failed: ", e); 
    }
}

async function removeAssistant(deptId, teacherName) {
    if (!currentUser) return;
    const deptRef = doc(db, `artifacts/${appId}/public/data/departments`, deptId);
    try {
        await runTransaction(db, async (transaction) => {
            const deptDoc = await transaction.get(deptRef);
            if (!deptDoc.exists()) throw "Document does not exist!";
            const assistants = deptDoc.data().assistants || [];
            const newAssistants = assistants.filter(a => a !== teacherName);
            transaction.update(deptRef, { assistants: newAssistants });
        });
    } catch (e) { 
        console.error("Transaction failed: ", e); 
    }
}

async function handleReset() {
    if (!currentUser || !confirm("Είστε σίγουροι; Όλες οι αναθέσεις θα διαγραφούν.")) return;
    await seedInitialData();
}

async function handleResetSubstitutes() {
    if (!currentUser) return;
    const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
    await setDoc(activityRef, { substitutes: [] }, { merge: true });
}

function handleSubstituteChange(e) {
    if (!currentUser || e.target.type !== 'checkbox') return;
    const teacher = e.target.value;
    const isChecked = e.target.checked;
    const currentSubstitutes = activityData.substitutes || [];
    let newSubstitutes = isChecked 
        ? [...new Set([...currentSubstitutes, teacher])] 
        : currentSubstitutes.filter(t => t !== teacher);
    const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
    setDoc(activityRef, { substitutes: newSubstitutes }, { merge: true });
}

document.addEventListener('DOMContentLoaded', initializeFirebase);

