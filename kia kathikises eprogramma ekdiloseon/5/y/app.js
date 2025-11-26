// @FILE-INFO: app.js | ./
// TYPE: Main Application Logic
// LAYER: Business (Logic)
// SIZE: 1300 lines (Very Large)
// PROVIDES: Firebase initialization, data handling, UI rendering, event listeners, schedule viewer logic

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, writeBatch, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // === HELPER FUNCTIONS ===
    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formatScheduleEntry = (entry) => {
        if (!entry) return '';
        return entry
            .replace(/Bkat_(\d)/g, 'Κατ. Β$1: ')
            .replace(/Γkat_(\d)/g, 'Κατ. Γ$1: ')
            .replace(/_/g, ' ');
    };

    // === ΔΕΔΟΜΕΝΑ ===
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const allTeachers = [
        "Αλεξάνδρου Χριστίνα", "Αντωνίου Νίκη", "Αντωνίου Στέλλα", "Αντωνούρη Άννα",
        "Βασιλείου Ηλίας", "Γαβριήλ Αφρούλα", "Γεωργίου Μαρία", "Γιαννάκου Άντρη",
        "Δροσοπούλου Κωνσταντίνα", "Ευαγγέλου Χρίστου Χριστιάνα", "Ευαγόρου Ευαγόρας",
        "Ευμήδου Άντρη", "Ευριπίδου Μιχαήλ", "Ευσταθίου Τάσος", "Ζαντή Αιμιλία",
        "Ζαχαριάδη Μύρω", "Ηρακλέους Στυλιανή", "Θεοφάνους Σάββας", "Ιωακείμ Ιωακείμ",
        "Ιωάννου Ξένια", "Ιωάννου Ανθούλα", "Καγιά Ευγενία", "Κονή Λίζα", "Κουαλή Έλενα",
        "Κουντούρης Κυριάκος", "Κουσούλου Γεωργία", "Κρασίδου Περσεφόνη", "Κυπριανού Μ. Μαρία",
        "Κυριάκου Νέδη", "Κωνσταντινίδης Παναγιώτης", "Κωνσταντίνου Δέσπω", "Λοϊζιά Λευκή",
        "Λουκαΐδης Γιώργος", "Μακρή Αμαλία", "Μαρκίδου Στέφανη", "Μαρκούλη Άντρη",
        "Μιχαήλ Παναγιώτα", "Νεοφύτου Γεωργίου Θεονίτσα", "Νικηφόρου Μαρία", "Νίκου Χριστάκης",
        "Ξενοφώντος Μαρία", "Οδυσσέως Ευριδίκη", "Οικονομίδου Μυρία", "Ορφανίδου Δώρα",
        "Παναγιώτου Αδελίνα", "Παναγιώτου Δημήτριος", "Παναγιώτου Ελένη", "Παπαδόπουλος Γεώργιος",
        "Παπαδοπούλου Μαρίνα", "Περικλέους Γιώργουλα", "Πέτρου Άγγελα", "Πιτσίλλος Χρίστος",
        "Ποιητάρης Ευαγόρας", "Σβανά Καλιάνα", "Σολομωνίδου Ευτυχία", "Σπυρίδωνος Μαρία",
        "Στασούλλη Χαρίκλεια", "Συκοπετρίτης Ιωακείμ", "Σωτηριάδου Κίννη Μαρία", "Τέρζη Άννα",
        "Τρυγωνάκη Μαρία", "Φελλά Ορφέας", "Χαραλάμπους Θάσος", "Χατζηνικολάου Γεωργία",
        "Χειλιμίνδρη Αυγή", "Χειμωνίδης Γιώργος", "Χουβαρτά Χρύση", "Χρίστου Γιάννης",
        "Χρίστου Ευδοκία", "Χρίστου Πρόδρομος", "Χριστοφή Ανθή",
        "Γεωργίου Ευθυμία", "Οδυσσέως Ευριδίκη",
        "Παναγιώτου Δημήτριος", "Τέρζη Άννα", "Κουμή Αναστασία"
    ];

    const teachingHours = {
        'Αντωνίου Νίκη': { 'A11': 4, 'A31': 2, 'A21': 2 },
        'Αντωνούρη Άννα': { 'B1': 6, 'A32': 2, 'A24': 2, 'B51': 5, 'A11': 4 },
        'Βασιλείου Ηλίας': { 'B52': 4, 'B41': 4, 'A41': 3 },
        'Γαβριήλ Αφρούλα': { 'Γ51': 6, 'B1': 6, 'B32': 2, 'B52': 2 },
        'Γεωργίου Μαρία': { 'B33': 6, 'B52': 2, 'A23': 6 },
        'Γιαννάκου Άντρη': { 'A24': 7, 'B51': 4, 'A41': 4 },
        'Δροσοπούλου Κωνσταντίνα': { 'A11': 6, 'B41': 2, 'B32': 1 },
        'Ευαγγέλου Χρίστου Χριστιάνα': { 'A42': 1, 'A23': 1, 'A41': 1, 'A31': 1, 'A11': 1, 'A32': 1, 'A22': 1, 'A21': 1 },
        'Ευαγόρου Ευαγόρας': { 'Γ32': 7, 'A11': 3 },
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
        'Κυπριανού Μ. Μαρία': { 'Γ53': 6, 'Γ1': 6 },
        'Κυριάκου Νέδη': { 'B52': 5, 'A23': 2, 'B33': 5, 'A24': 2, 'A11': 4 },
        'Κωνσταντινίδης Παναγιώτης': { 'Γ52': 2, 'Γ32': 2, 'Γ51': 2, 'A41': 2, 'B33': 2, 'B52': 2, 'Γ53': 2, 'A42': 2, 'Γ41': 2, 'Γ1': 2, 'Γ31': 2 },
        'Κωνσταντίνου Δέσπω': { 'A41': 2, 'A32': 2 },
        'Μαρκίδου Στέφανη': { 'Γ51': 6, 'Γ1': 2 },
        'Μαρκούλη Άντρη': { 'A23': 7, 'A43': 2, 'A24': 6, 'A31': 2, 'A41': 2 },
        'Νεοφύτου Γεωργίου Θεονίτσα': { 'Γ52': 3, 'B31': 6, 'A32': 6 },
        'Νικηφόρου Μαρία': { 'Γ52': 5, 'B31': 2, 'Γ32': 3, 'Γ41': 3 },
        'Νίκου Χριστάκης': { 'B41': 1, 'B33': 5, 'A42': 2, 'Γ51': 1, 'Γ1': 1 },
        'Ξενοφώντος Μαρία': { 'A22': 3, 'A41': 3, 'A31': 2, 'A32': 2, 'A11': 3, 'A21': 2, 'A23': 2 },
        'Οικονομίδου Μυρία': { 'Γ41': 6, 'Γ31': 3, 'Γ53': 3 },
        'Ορφανίδου Δώρα': { 'A31': 2, 'B32': 5, 'Γ32': 5, 'A41': 3 },
        'Παναγιώτου Αδελίνα': { 'A22': 2, 'B32': 5 },
        'Παναγιώτου Ελένη': { 'A31': 3, 'Γ53': 4, 'B41': 4, 'A24': 1, 'Γ52': 4, 'A42': 3, 'A23': 1, 'A22': 1 },
        'Παπαδόπουλος Γεώργιος': { 'A11': 2, 'A23': 2, 'Γ32': 2, 'A42': 2, 'A22': 2, 'A21': 2 },
        'Παπαδοπούλου Μαρίνα': { 'Γ51': 3, 'Γ31': 5, 'A42': 5, 'A41': 4, 'A32': 2, 'A24': 2 },
        'Περικλέους Γιώργουλα': { 'A22': 2, 'B52': 7, 'Γ53': 7 },
        'Πέτρου Άγγελα': { 'B51': 7, 'A21': 2, 'A11': 2 },
        'Ποιητάρης Ευαγόρας': { 'A42': 4, 'B1': 4 },
        'Σβανά Καλιάνα': { 'A22': 1, 'A23': 1, 'A11': 1 },
        'Σολομωνίδου Ευτυχία': { 'B41': 2, 'B32': 2, 'B51': 2, 'B31': 2, 'B52': 2, 'Γ52': 2, 'Γ53': 2 },
        'Σπυρίδωνος Μαρία': { 'Γ31': 6, 'B1': 1, 'A11': 3, 'A22': 4, 'A43': 2 },
        'Στασούλλη Χαρίκλεια': { 'A43': 6, 'B33': 2, 'B51': 2, 'A31': 6, 'B41': 2 },
        'Συκοπετρίτης Ιωακείμ': { 'A41': 4, 'A43': 2 },
        'Σωτηριάδου Κίννη Μαρία': { 'Γ52': 7, 'A31': 2 },
        'Χαραλάμπους Θάσος': { 'A24': 2, 'A32': 2, 'A21': 2 },
        'Χειλιμίνδρη Αυγή': { 'A21': 7 },
        'Χειμωνίδης Γιώργος': { 'A24': 1, 'A11': 1 },
        'Χουβαρτά Χρύση': { 'Γ32': 6, 'Γ1': 6, 'A31': 2 },
        'Χρίστου Γιάννης': { 'Γ1': 3, 'Γ41': 7 },
        'Χρίστου Ευδοκία': { 'A23': 5, 'B31': 5, 'B51': 1, 'B52': 1, 'A24': 4 },
        'Χριστοφή Ανθή': { 'A31': 6, 'B32': 7, 'Γ51': 3 },
        'Γεωργίου Ευθυμία': {},
        'Οδυσσέως Ευριδίκη': {},
        'Παναγιώτου Δημήτριος': {},
        'Τέρζη Άννα': {},
        'Κουμή Αναστασία': {}
    };

    const initialDepartments = [
        { id: 'A11', responsible: 'Δροσοπούλου Κωνσταντίνα', director: 'Κουμή Αναστασία', assistants: [] },
        { id: 'A21', responsible: 'Παπαδόπουλος Γεώργιος', director: 'Σωτηριάδου Κίννη Μαρία', assistants: [] },
        { id: 'A22', responsible: 'Καγιά Ευγενία', director: 'Νίκου Χριστάκης', assistants: [] },
        { id: 'A23', responsible: 'Σβανά Καλιάνα', director: 'Κυπριανού Μ. Μαρία', assistants: [] },
        { id: 'A24', responsible: 'Χαραλάμπους Θάσος', director: 'Λοϊζιά Λευκή', assistants: [] },
        { id: 'A31', responsible: 'Χριστοφή Ανθή', director: 'Σωτηριάδου Κίννη Μαρία', assistants: [] },
        { id: 'A32', responsible: 'Νεοφύτου Γεωργίου Θεονίτσα', director: 'Κονή Λίζα', assistants: [] },
        { id: 'A41', responsible: 'Ευσταθίου Τάσος', director: 'Λοϊζιά Λευκή', assistants: [] },
        { id: 'A42', responsible: 'Κρασίδου Περσεφόνη', director: 'Νίκου Χριστάκης', assistants: [] },
        { id: 'A43', responsible: 'Θεοφάνους Σάββας', director: 'Κονή Λίζα', assistants: [] },
        { id: 'B1', responsible: 'Παναγιώτου Αδελίνα', director: 'Σωτηριάδου Κίννη Μαρία', assistants: [] },
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
        { id: 'Γ52', responsible: 'Νικηφόρου Μαρία', director: 'Σωτηριάδου Κίννη Μαρία', assistants: [] },
        { id: 'Γ53', responsible: 'Περικλέους Γιώργουλα', director: 'Λοϊζιά Λευκή', assistants: [] }
    ];

    const managementAndInitialHeads = [
        "Κουμή Αναστασία", "Ευαγόρου Ευαγόρας", "Κονή Λίζα", "Κυπριανού Μ. Μαρία",
        "Λοϊζιά Λευκή", "Νίκου Χριστάκης", "Σωτηριάδου Κίννη Μαρία",
        "Αντωνίου Νίκη", "Παπαδοπούλου Μαρίνα", "Χειμωνίδης Γιώργος",
        "Δροσοπούλου Κωνσταντίνα", "Παπαδόπουλος Γεώργιος", "Καγιά Ευγενία",
        "Σβανά Καλιάνα", "Χαραλάμπους Θάσος", "Χριστοφή Ανθή",
        "Νεοφύτου Γεωργίου Θεονίτσα", "Ευσταθίου Τάσος", "Κρασίδου Περσεφόνη",
        "Θεοφάνους Σάββας", "Παναγιώτου Αδελίνα", "Χρίστου Ευδοκία",
        "Ορφανίδου Δώρα", "Γεωργίου Μαρία", "Παναγιώτου Ελένη",
        "Στασούλλη Χαρίκλεια", "Κωνσταντινίδης Παναγιώτης", "Μαρκίδου Στέφανη",
        "Ζαντή Αιμιλία", "Χουβαρτά Χρύση", "Οικονομίδου Μυρία",
        "Ιωάννου Ανθούλα", "Νικηφόρου Μαρία", "Περικλέους Γιώργουλα"
    ];

    const teacherSchedules = {
        'Αλεξάνδρου Χριστίνα': { 'Δευτέρα': { 3: 'Γ52+Γ53', 4: 'Β11+Β32', 5: 'Α31+Α32', 8: 'Γ41+Γ51' }, 'Τρίτη': { 1: 'Γ1+Γ31+Γ32', 2: 'Γ1+Γ31+Γ32', 5: 'Α11+Α43', 6: 'Β33+Β51+B52' }, 'Τετάρτη': { 4: 'Α21+A22', 5: 'Α41+Α42', 6: 'Α31+Α32' }, 'Πέμπτη': { 3: 'Β33+Β51+B52', 4: 'Γ41+Γ51', 8: 'Γ52+Γ53' }, 'Παρασκευή': { 3: 'Α23+Α24', 4: 'Α21+A22', 5: 'Β31+Β41', 6: 'Β11+Β32' } },
        'Αντωνίου Νίκη': { 'Δευτέρα': { 5: 'A11', 6: 'A21' }, 'Τρίτη': { 7: 'A31' }, 'Τετάρτη': { 1: 'A11', 2: 'A31' }, 'Πέμπτη': { 3: 'A11' }, 'Παρασκευή': { 4: 'A11', 5: 'A21' } },
        'Αντωνίου Στέλλα': { 'Τρίτη': { 1: 'Γ1+Γ31+Γ32', 2: 'Γ1+Γ31+Γ32' } },
        'Αντωνούρη Άννα': { 'Δευτέρα': { 1: 'A32', 3: 'B51', 4: 'B51' }, 'Τρίτη': { 1: 'B1', 4: 'A11', 6: 'A11', 7: 'A32' }, 'Τετάρτη': { 2: 'B1', 4: 'B1', 5: 'A11' }, 'Πέμπτη': { 2: 'B1', 6: 'A11' }, 'Παρασκευή': { 2: 'A24', 3: 'A24', 4: 'B51', 7: 'B51' } },
        'Βασιλείου Ηλίας': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2', 6: 'A41' }, 'Τρίτη': { 1: 'B52', 2: 'B41', 5: 'A41' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': { 1: 'Γkat_1', 2: 'Γkat_1', 6: 'Γkat_1', 7: 'Γkat_1' }, 'Παρασκευή': { 3: 'B41', 4: 'B41', 6: 'B52' } },
        'Γαβριήλ Αφρούλα': { 'Δευτέρα': { 4: 'Γ51', 5: 'B1', 6: 'Γ51' }, 'Τρίτη': { 1: 'Γ51', 5: 'B32', 6: 'B1', 7: 'B1' }, 'Τετάρτη': { 1: 'B1', 3: 'B1', 6: 'Γ51' }, 'Πέμπτη': { 4: 'B52', 5: 'B32', 6: 'B1' }, 'Παρασκευή': { 2: 'Γ51', 4: 'B1', 5: 'B1' } },
        'Γεωργίου Μαρία': { 'Δευτέρα': { 5: 'B33', 6: 'A23' }, 'Τρίτη': { 2: 'B52', 3: 'A23', 7: 'B33' }, 'Τετάρτη': { 1: 'B33', 2: 'B33', 3: 'A23', 4: 'A23' }, 'Πέμπτη': { 2: 'B33', 5: 'B33', 7: 'B33' }, 'Παρασκευή': { 2: 'A23', 4: 'A23', 6: 'B52' } },
        'Γιαννάκου Άντρη': { 'Δευτέρα': { 3: 'B51', 8: 'A41' }, 'Τρίτη': { 1: 'A24', 2: 'A41', 3: 'B51', 5: 'A24', 6: 'A41' }, 'Τετάρτη': { 1: 'A24', 3: 'B51', 5: 'A24', 6: 'A24', 7: 'A41' }, 'Πέμπτη': { 3: 'A24', 5: 'A41' }, 'Παρασκευή': { 3: 'A24', 6: 'B51' } },
        'Δροσοπούλου Κωνσταντίνα': { 'Δευτέρα': { 1: 'A11', 2: 'A11', 4: 'Bkat_1', 5: 'Bkat_1' }, 'Τρίτη': { 3: 'A11', 5: 'Γkat_1', 6: 'Γkat_1' }, 'Τετάρτη': { 2: 'A11', 5: 'A11', 6: 'B41' }, 'Πέμπτη': { 1: 'Γkat_1', 2: 'Γkat_1', 5: 'B32', 6: 'B41' }, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 6: 'A11' } },
        'Ευαγγέλου Χρίστου Χριστιάνα': { 'Δευτέρα': { 3: 'A43', 8: 'A32' }, 'Τρίτη': { 1: 'A42', 5: 'Bkat_3', 7: 'A11' }, 'Τετάρτη': { 1: 'A23', 5: 'Bkat_3' }, 'Πέμπτη': { 1: 'A24', 3: 'A31', 5: 'Bkat_3', 6: 'Bkat_3' }, 'Παρασκευή': { 1: 'A41', 6: 'A22', 7: 'A21' } },
        'Ευαγόρου Ευαγόρας': { 'Δευτέρα': { 2: 'A11', 3: 'Γ32', 5: 'A11' }, 'Τρίτη': { 3: 'Γ32', 6: 'Γ32' }, 'Τετάρτη': {}, 'Πέμπτη': { 3: 'Γ32', 4: 'Γ32', 6: 'Γ32' }, 'Παρασκευή': { 1: 'Γ32', 8: 'A11' } },
        'Ευμήδου Άντρη': { 'Δευτέρα': { 2: 'Γkat_3', 3: 'Γkat_3', 7: 'Bkat_1', 8: 'Bkat_1' }, 'Τρίτη': {}, 'Τετάρτη': {}, 'Πέμπτη': {}, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 4: 'Γkat_3', 5: 'Γkat_3', 6: 'Γkat_3', 8: 'B1' } },
        'Ευριπίδου Μιχαήλ': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2', 7: 'Bkat_1', 8: 'Bkat_1' }, 'Τρίτη': {}, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': {}, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 6: 'Γkat_2', 7: 'Γkat_2' } },
        'Ευσταθίου Τάσος': { 'Δευτέρα': { 1: 'A32', 2: 'A21', 4: 'A41', 5: 'A41' }, 'Τρίτη': { 1: 'A23', 6: 'A41', 7: 'A41' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 5: 'A31' }, 'Πέμπτη': { 2: 'A21', 4: 'A21', 6: 'A31', 8: 'A23' }, 'Παρασκευή': { 2: 'A32', 5: 'A21', 6: 'Γkat_2', 7: 'Γkat_2' } },
        'Ζαντή Αιμιλία': { 'Δευτέρα': { 3: 'Γ53', 4: 'Γ31', 5: 'Γ31' }, 'Τρίτη': { 1: 'A22', 2: 'A22', 4: 'Γ31', 7: 'A22' }, 'Τετάρτη': { 2: 'A22', 4: 'Γ31', 6: 'A22' }, 'Πέμπτη': { 2: 'A22', 4: 'Γ31', 8: 'Γ31' }, 'Παρασκευή': { 4: 'Γ31' } },
        'Ζαχαριάδη Μύρω': { 'Δευτέρα': { 2: 'B41', 4: 'Γ52', 5: 'B31' }, 'Τρίτη': { 2: 'Γ52', 6: 'B31', 7: 'B31' }, 'Τετάρτη': { 1: 'B31', 2: 'B41', 4: 'B31' }, 'Πέμπτη': { 1: 'B41', 7: 'B31' }, 'Παρασκευή': { 1: 'Γ52', 5: 'B31', 8: 'B41' } },
        'Ηρακλέους Στυλιανή': { 'Δευτέρα': { 2: 'A31', 3: 'A41', 4: 'A21', 5: 'A24' }, 'Τρίτη': {}, 'Τετάρτη': { 2: 'A24', 3: 'A42' }, 'Πέμπτη': {}, 'Παρασκευή': {} },
        'Θεοφάνους Σάββας': { 'Δευτέρα': { 1: 'B41', 4: 'A21', 5: 'A43', 6: 'A21', 7: 'A21' }, 'Τρίτη': { 3: 'Γ41', 6: 'B41' }, 'Τετάρτη': { 1: 'A43', 3: 'B41', 5: 'B41', 6: 'A21' }, 'Πέμπτη': { 2: 'B41', 5: 'Γ41' }, 'Παρασκευή': { 1: 'A21', 5: 'B41', 6: 'A21', 7: 'A43' } },
        'Ιωακείμ Ιωακείμ': { 'Τρίτη': { 2: 'A23', 3: 'A22' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2' }, 'Πέμπτη': { 4: 'A22', 5: 'A22', 8: 'A42' }, 'Παρασκευή': { 6: 'Γkat_2', 7: 'Γkat_2', 8: 'A22' } },
        'Ιωάννου Ξένια': { 'Τρίτη': { 1: 'A21', 2: 'A32', 3: 'A42' }, 'Τετάρτη': {}, 'Πέμπτη': { 1: 'A21', 3: 'A32', 4: 'A42' }, 'Παρασκευή': {} },
        'Ιωάννου Ανθούλα': { 'Δευτέρα': { 2: 'Γ51', 3: 'Γ51', 7: 'Bkat_1', 8: 'Bkat_1' }, 'Τρίτη': { 4: 'Γ51', 6: 'Γkat_1' }, 'Τετάρτη': { 1: 'Γkat_2', 4: 'Γ41', 6: 'Γ51' }, 'Πέμπτη': { 1: 'Γkat_1', 4: 'Γ41' }, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 4: 'Γ41', 6: 'Γkat_2' } },
        'Καγιά Ευγενία': { 'Δευτέρα': { 2: 'A41', 4: 'A22' }, 'Τρίτη': { 1: 'B51', 5: 'B31' }, 'Τετάρτη': { 2: 'A22', 5: 'B31', 7: 'A42' }, 'Πέμπτη': { 1: 'A22', 2: 'A41', 5: 'A22' }, 'Παρασκευή': { 1: 'A22', 2: 'A21', 3: 'A21', 5: 'A41', 6: 'A41', 7: 'A42' } },
        'Κονή Λίζα': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2' }, 'Τρίτη': { 3: 'Γkat_1', 4: 'Γkat_1' }, 'Τετάρτη': { 4: 'Bkat_2', 5: 'Bkat_2' }, 'Πέμπτη': { 1: 'Γkat_1' }, 'Παρασκευή': { 5: 'A32', 6: 'A43' } },
        'Κουαλή Έλενα': { 'Δευτέρα': { 1: 'A41', 4: 'A32', 5: 'A32', 8: 'A22' }, 'Τρίτη': { 2: 'A43', 5: 'A23', 6: 'A32' }, 'Τετάρτη': { 1: 'A32', 3: 'A32', 5: 'A22', 6: 'A42' }, 'Πέμπτη': { 4: 'B_Αρχ', 5: 'B52' }, 'Παρασκευή': { 1: 'A42', 2: 'A42', 3: 'A41', 6: 'A32', 7: 'A42' } },
        'Κουντούρης Κυριάκος': { 'Τρίτη': { 1: 'A23', 4: 'A24', 6: 'A42', 7: 'A43' }, 'Τετάρτη': {}, 'Πέμπτη': { 4: 'A43', 6: 'A42', 7: 'A24', 8: 'A24' }, 'Παρασκευή': {} },
        'Κουσούλου Γεωργία': { 'Δευτέρα': { 3: 'A21', 4: 'A21', 7: 'A32', 8: 'A21' }, 'Τρίτη': {}, 'Τετάρτη': {}, 'Πέμπτη': { 5: 'A21', 6: 'A32', 7: 'Γ52' }, 'Παρασκευή': { 2: 'Γ53', 5: 'A21', 8: 'Γ41' } },
        'Κρασίδου Περσεφόνη': { 'Δευτέρα': { 1: 'A42', 3: 'A41', 7: 'Bkat_1', 8: 'Bkat_1' }, 'Τρίτη': { 2: 'A21', 5: 'Γkat_1', 6: 'Γkat_1' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 6: 'A22' }, 'Πέμπτη': { 1: 'Γkat_1', 2: 'Γkat_1' }, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 6: 'Γkat_2', 7: 'Γkat_2' } },
        'Κυπριανού Μ. Μαρία': { 'Δευτέρα': { 1: 'Γ53', 6: 'Γ1', 7: 'Γ1' }, 'Τρίτη': { 1: 'Γ53', 3: 'Γ1' }, 'Τετάρτη': { 4: 'Γ53', 6: 'Γ1' }, 'Πέμπτη': { 5: 'Γ53', 6: 'Γ1', 7: 'Γ1' }, 'Παρασκευή': { 2: 'Γ1', 4: 'Γ53', 5: 'Γ53' } },
        'Κυριάκου Νέδη': { 'Δευτέρα': { 3: 'B33', 4: 'B33', 7: 'A11' }, 'Τρίτη': { 1: 'A11', 5: 'B33' }, 'Τετάρτη': { 1: 'B52', 7: 'A11' }, 'Πέμπτη': { 1: 'B52', 5: 'B52', 7: 'B33' }, 'Παρασκευή': { 1: 'A23', 2: 'A23', 5: 'B52', 8: 'A24' } },
        'Κωνσταντινίδης Παναγιώτης': { 'Δευτέρα': { 6: 'A42', 7: 'A41', 8: 'Γ31' }, 'Τρίτη': { 1: 'Γ52', 2: 'Γ51', 3: 'Γ53' }, 'Τετάρτη': { 3: 'A41', 4: 'A42', 6: 'Γ1' }, 'Πέμπτη': { 1: 'Γ32', 3: 'B33', 4: 'Γ52', 6: 'Γ41' }, 'Παρασκευή': { 3: 'B52', 4: 'Γ51', 5: 'Γ32', 6: 'B33' } },
        'Κωνσταντίνου Δέσπω': { 'Τρίτη': { 2: 'A41', 3: 'Γ_Γαλ', 4: 'Γ_Γαλ' }, 'Τετάρτη': {}, 'Πέμπτη': { 2: 'A32', 3: 'A41', 4: 'A32' }, 'Παρασκευή': {} },
        'Λοϊζιά Λευκή': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2' }, 'Τρίτη': { 6: 'Γkat_1', 7: 'Γkat_1' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': { 1: 'Γkat_1', 2: 'Γkat_1' }, 'Παρασκευή': { 6: 'Γkat_2', 7: 'Γkat_2' } },
        'Λουκαΐδης Γιώργος': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2' }, 'Τρίτη': {}, 'Τετάρτη': { 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': {}, 'Παρασκευή': {} },
        'Μακρή Αμαλία': { 'Δευτέρα': { 1: 'A23', 4: 'A43', 7: 'Γkat_1', 8: 'Bkat_1' }, 'Τρίτη': { 4: 'Β_Αγγ', 7: 'A43' }, 'Τετάρτη': { 1: 'Γkat_1', 2: 'Γkat_1', 6: 'A43', 7: 'A23' }, 'Πέμπτη': { 1: 'Bkat_1', 2: 'Bkat_1', 4: 'A43' }, 'Παρασκευή': { 6: 'B1' } },
        'Μαρκίδου Στέφανη': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2', 7: 'Γ51' }, 'Τρίτη': { 1: 'Γkat_2', 2: 'Γkat_2', 5: 'Bkat_2' }, 'Τετάρτη': { 3: 'Γ51', 6: 'Γ1' }, 'Πέμπτη': { 3: 'Γ1', 5: 'Γ51', 7: 'Γ51' }, 'Παρασκευή': { 5: 'Γkat_2', 7: 'Γkat_2', 8: 'Γ51' } },
        'Μαρκούλη Άντρη': { 'Δευτέρα': { 2: 'A24', 3: 'A24', 4: 'A43', 6: 'A24' }, 'Τρίτη': { 1: 'A24', 4: 'A23' }, 'Τετάρτη': { 1: 'A23', 2: 'A23', 4: 'A24', 6: 'A24', 7: 'A41' }, 'Πέμπτη': { 1: 'A23', 4: 'A31', 6: 'A23' }, 'Παρασκευή': { 1: 'A43', 2: 'A31', 3: 'A24', 4: 'A24', 6: 'A23', 8: 'A23' } },
        'Μιχαήλ Παναγιώτα': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2' }, 'Τρίτη': {}, 'Τετάρτη': { 1: 'Γkat_1', 2: 'Γkat_1', 6: 'Γkat_1', 7: 'Γkat_1' }, 'Πέμπτη': {}, 'Παρασκευή': {} },
        'Νεοφύτου Γεωργίου Θεονίτσα': { 'Δευτέρα': { 1: 'Γ52', 3: 'B31', 6: 'B31' }, 'Τρίτη': { 2: 'B31', 3: 'A32' }, 'Τετάρτη': { 2: 'B31', 4: 'B31', 6: 'Γ52' }, 'Πέμπτη': { 5: 'A32', 7: 'A32' }, 'Παρασκευή': { 3: 'B31', 6: 'A32', 8: 'B31' } },
        'Νικηφόρου Μαρία': { 'Δευτέρα': { 1: 'Γ52', 7: 'Γ41' }, 'Τρίτη': { 2: 'Γ52', 3: 'Γ41', 4: 'Γ32' }, 'Τετάρτη': { 2: 'B31', 3: 'Γ41', 4: 'Γ52', 7: 'Γ52' }, 'Πέμπτη': { 3: 'Γ52', 7: 'Γ32' }, 'Παρασκευή': { 5: 'Γ52', 7: 'B31' } },
        'Νίκου Χριστάκης': { 'Δευτέρα': { 2: 'B41' }, 'Τρίτη': { 3: 'B33' }, 'Τετάρτη': { 3: 'A42' }, 'Πέμπτη': { 3: 'Γ51' }, 'Παρασκευή': { 3: 'A42', 4: 'B33', 5: 'B33', 6: 'B33' } },
        'Ξενοφώντος Μαρία': { 'Δευτέρα': { 3: 'A11', 4: 'A21', 8: 'A11' }, 'Τρίτη': { 1: 'A22', 5: 'A41', 6: 'A22' }, 'Τετάρτη': { 2: 'A31', 3: 'A11', 7: 'A23' }, 'Πέμπτη': { 1: 'A41', 2: 'A32', 5: 'A41', 6: 'A22' }, 'Παρασκευή': { 3: 'A31', 5: 'A21', 6: 'A32', 7: 'A23' } },
        'Οδυσσέως Ευριδίκη': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2' }, 'Τρίτη': {}, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': { 1: 'A32', 2: 'A11', 3: 'A32', 5: 'A32', 6: 'A21' }, 'Παρασκευή': {} },
        'Οικονομίδου Μυρία': { 'Δευτέρα': { 1: 'Γ41', 6: 'Γ53', 7: 'Γ41' }, 'Τρίτη': { 1: 'Γ52', 5: 'Γ41' }, 'Τετάρτη': { 3: 'Γ31', 6: 'Γ41', 7: 'Γ41' }, 'Πέμπτη': { 3: 'Γ53', 5: 'Γ41' }, 'Παρασκευή': { 2: 'Γ31', 3: 'Γ53', 4: 'Γ41' } },
        'Ορφανίδου Δώρα': { 'Δευτέρα': { 1: 'A31', 2: 'Γ32' }, 'Τρίτη': { 2: 'B32', 6: 'B32' }, 'Τετάρτη': { 2: 'B32', 7: 'Γ32' }, 'Πέμπτη': { 5: 'A31', 6: 'A41' }, 'Παρασκευή': { 5: 'B32', 7: 'Γ32', 8: 'Γ32' } },
        'Παναγιώτου Αδελίνα': { 'Δευτέρα': { 1: 'A22', 2: 'Γkat_3', 3: 'Γkat_3', 4: 'B32' }, 'Τρίτη': { 1: 'B41', 4: 'Bkat_3' }, 'Τετάρτη': { 4: 'B32', 5: 'Bkat_3' }, 'Πέμπτη': { 4: 'Bkat_3', 6: 'Bkat_3' }, 'Παρασκευή': { 4: 'B32', 5: 'Γkat_3', 6: 'Γkat_3', 8: 'B32' } },
        'Παναγιώτου Δημήτριος': { 'Δευτέρα': { 2: 'A24', 5: 'B41', 6: 'A22', 7: 'A43', 8: 'A23' }, 'Τρίτη': { 2: 'B1', 3: 'A43', 4: 'A32' }, 'Τετάρτη': { 2: 'B32', 3: 'B1', 5: 'B31', 7: 'A31' }, 'Πέμπτη': { 2: 'A11', 3: 'B32', 5: 'B51' }, 'Παρασκευή': { 2: 'B51', 5: 'A24', 6: 'B31', 7: 'B41' } },
        'Παναγιώτου Ελένη': { 'Δευτέρα': { 2: 'A31', 8: 'Γ53' }, 'Τρίτη': { 2: 'Γ53', 3: 'A31' }, 'Τετάρτη': { 1: 'B41', 4: 'Γ53', 6: 'B41' }, 'Πέμπτη': { 2: 'A24', 5: 'A42', 7: 'A42' }, 'Παρασκευή': { 1: 'Γ52', 2: 'Γ52', 4: 'A31', 6: 'B41' } },
        'Παπαδόπουλος Γεώργιος': { 'Δευτέρα': { 1: 'A11', 2: 'A23' }, 'Τρίτη': { 3: 'Γ_Γαλ', 5: 'Γ_Γαλ' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2', 7: 'A23' }, 'Πέμπτη': { 3: 'Γ32', 5: 'A21' }, 'Παρασκευή': { 1: 'A11', 2: 'A42', 5: 'Γkat_2', 6: 'A21', 8: 'Γkat_2' } },
        'Παπαδοπούλου Μαρίνα': { 'Δευτέρα': { 1: 'Γ51' }, 'Τρίτη': { 2: 'Γ31' }, 'Τετάρτη': { 5: 'Γ31', 6: 'Γ31' }, 'Πέμπτη': { 1: 'A32', 2: 'A41', 4: 'Γ31', 6: 'A42', 7: 'A41' }, 'Παρασκευή': { 1: 'Γ31', 3: 'Γ51', 4: 'A24', 5: 'Γ51' } },
        'Περικλέους Γιώργουλα': { 'Δευτέρα': { 5: 'Γ_Αγγ', 6: 'Γ_Αγγ' }, 'Τρίτη': { 2: 'B52', 3: 'Β_Αγγ', 5: 'B52' }, 'Τετάρτη': { 2: 'A22', 6: 'Γ53', 7: 'Γ53' }, 'Πέμπτη': { 2: 'B52', 4: 'Γ53', 5: 'Γ53' }, 'Παρασκευή': { 2: 'Γ53', 6: 'A22' } },
        'Πέτρου Άγγελα': { 'Δευτέρα': { 3: 'Β_Αγγ', 4: 'B51', 6: 'A11', 7: 'B51' }, 'Τρίτη': { 2: 'B51', 3: 'A21', 7: 'A11', 8: 'B51' }, 'Τετάρτη': { 2: 'A21' }, 'Πέμπτη': { 4: 'Β_Αγγ' }, 'Παρασκευή': { 5: 'B51', 7: 'B51' } },
        'Πιτσίλλος Χρίστος': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2', 5: 'A23', 6: 'A31' }, 'Τρίτη': {}, 'Τετάρτη': { 3: 'A43', 4: 'A32', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': {}, 'Παρασκευή': {} },
        'Ποιητάρης Ευαγόρας': { 'Δευτέρα': { 1: 'A42', 2: 'A42', 3: 'B1', 6: 'B1', 8: 'A42' }, 'Τρίτη': {}, 'Τετάρτη': { 2: 'A42' }, 'Πέμπτη': { 2: 'B1', 4: 'B1' }, 'Παρασκευή': { 2: 'A43', 3: 'B1' } },
        'Σβανά Καλιάνα': { 'Δευτέρα': { 1: 'Γkat_2', 2: 'Γkat_2', 3: 'A22', 4: 'A23', 6: 'Γkat_1' }, 'Τρίτη': { 1: 'Γkat_1', 2: 'Γkat_1', 7: 'Bkat_1', 8: 'Bkat_1' }, 'Τετάρτη': { 5: 'B31' }, 'Πέμπτη': { 5: 'A11' }, 'Παρασκευή': { 6: 'Γkat_2', 7: 'Γkat_2' } },
        'Σολομωνίδου Ευτυχία': { 'Δευτέρα': { 2: 'B32', 4: 'B41', 5: 'B51' }, 'Τρίτη': { 1: 'B41', 3: 'Γ_Γαλ', 7: 'B31' }, 'Τετάρτη': { 3: 'B51', 4: 'B52', 5: 'Bkat_3' }, 'Πέμπτη': { 1: 'Γ53', 3: 'B32', 5: 'Bkat_3', 6: 'Bkat_3' }, 'Παρασκευή': { 3: 'Γ52', 5: 'Β_Γαλ' } },
        'Σπυρίδωνος Μαρία': { 'Δευτέρα': { 1: 'Γ31', 3: 'A11', 4: 'A22', 7: 'Γ31' }, 'Τρίτη': { 1: 'B1', 4: 'A22' }, 'Τετάρτη': { 4: 'A11', 6: 'A43', 7: 'Γ31' }, 'Πέμπτη': { 4: 'A22', 5: 'A22', 6: 'Γ31' }, 'Παρασκευή': { 2: 'A11', 5: 'Γ31' } },
        'Στασούλλη Χαρίκλεια': { 'Δευτέρα': { 1: 'A43', 2: 'A43' }, 'Τρίτη': { 1: 'B33', 4: 'A31', 6: 'B41', 7: 'B41' }, 'Τετάρτη': { 2: 'A43', 3: 'A43', 4: 'A31' }, 'Πέμπτη': { 1: 'B51', 7: 'A31' }, 'Παρασκευή': { 5: 'B51', 7: 'A31', 8: 'A31' } },
        'Συκοπετρίτης Ιωακείμ': { 'Δευτέρα': { 4: 'A41' }, 'Τρίτη': { 6: 'A41', 7: 'A41' }, 'Τετάρτη': { 5: 'A43' }, 'Πέμπτη': {}, 'Παρασκευή': {} },
        'Σωτηριάδου Κίννη Μαρία': { 'Τρίτη': { 1: 'Γ52', 5: 'Γ52' }, 'Τετάρτη': { 2: 'A31', 3: 'Γ52' }, 'Πέμπτη': {}, 'Παρασκευή': { 1: 'Γ52', 4: 'Γ52', 5: 'Γ52', 8: 'A31' } },
        'Τέρζη Άννα': { 'Τρίτη': { 1: 'A43', 2: 'B51', 3: 'B51', 5: 'B51' }, 'Τετάρτη': {}, 'Πέμπτη': { 3: 'A43', 4: 'B51', 6: 'A43' }, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1' } },
        'Τρυγωνάκη Μαρία': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2' }, 'Τρίτη': {}, 'Τετάρτη': { 1: 'Γkat_1', 2: 'Γkat_1', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': {}, 'Παρασκευή': {} },
        'Φελλά Ορφέας': { 'Δευτέρα': { 3: 'Γ52+Γ53', 4: 'Β11+Β32', 5: 'Α31+Α32', 8: 'Γ41+Γ51' }, 'Τρίτη': { 1: 'Γ1+Γ31+Γ32', 2: 'Γ1+Γ31+Γ32', 5: 'Α11+Α43', 6: 'Β33+Β51+B52' }, 'Τετάρτη': { 4: 'Α21+A22', 5: 'Α41+Α42', 6: 'Α31+Α32' }, 'Πέμπτη': { 3: 'Β33+Β51+B52', 4: 'Γ41+Γ51', 8: 'Γ52+Γ53' }, 'Παρασκευή': { 3: 'Α23+Α24', 4: 'Α21+A22', 5: 'Β31+Β41', 6: 'Β11+Β32' } },
        'Χαραλάμπους Θάσος': { 'Δευτέρα': { 1: 'A24', 5: 'A21', 7: 'Bkat_1', 8: 'Bkat_1' }, 'Τρίτη': { 1: 'A32', 2: 'A24' }, 'Τετάρτη': { 1: 'Γkat_2', 2: 'Γkat_2' }, 'Πέμπτη': { 4: 'A21' }, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 5: 'Γkat_2', 6: 'Γkat_2', 8: 'A32' } },
        'Χατζηνικολάου Γεωργία': { 'Τρίτη': { 1: 'A24', 3: 'Γ_Γαλ', 4: 'Γ_Γαλ', 6: 'A43' }, 'Τετάρτη': {}, 'Πέμπτη': { 1: 'A31', 3: 'Β_Γαλ', 5: 'Β_Γαλ', 6: 'A24' }, 'Παρασκευή': { 2: 'A43', 5: 'A31' } },
        'Χειλιμίνδρη Αυγή': { 'Δευτέρα': { 1: 'A21', 2: 'A21' }, 'Τρίτη': {}, 'Τετάρτη': { 1: 'A21', 2: 'A21' }, 'Πέμπτη': { 5: 'A21', 7: 'A21' }, 'Παρασκευή': { 8: 'A21' } },
        'Χειμωνίδης Γιώργος': { 'Δευτέρα': { 2: 'A24' }, 'Τρίτη': { 1: 'Γ1', 6: 'Γkat_1', 7: 'Γkat_1' }, 'Τετάρτη': {}, 'Πέμπτη': { 1: 'Γkat_1', 2: 'Γkat_1', 4: 'B1' }, 'Παρασκευή': { 6: 'A11' } },
        'Χουβαρτά Χρύση': { 'Δευτέρα': { 1: 'Γ32', 3: 'Γ32', 4: 'Γ1', 5: 'Γ1' }, 'Τρίτη': { 5: 'A31' }, 'Τετάρτη': { 3: 'Γ1', 6: 'Γ32' }, 'Πέμπτη': { 3: 'Γ1', 4: 'Γ32', 6: 'Γ32' }, 'Παρασκευή': { 2: 'Γ32', 6: 'Γ32', 8: 'A31' } },
        'Χρίστου Γιάννης': { 'Δευτέρα': { 1: 'Γ1', 2: 'Γ41', 3: 'Γ41' }, 'Τρίτη': { 2: 'Γ41', 3: 'Γ41' }, 'Τετάρτη': { 3: 'Γ41', 4: 'Γ1' }, 'Πέμπτη': { 1: 'Γ41', 4: 'Γ41' }, 'Παρασκευή': { 2: 'Γ41' } },
        'Χρίστου Ευδοκία': { 'Δευτέρα': { 1: 'A23', 2: 'B31' }, 'Τρίτη': { 2: 'B31', 3: 'B52', 4: 'A23' }, 'Τετάρτη': { 2: 'B31', 6: 'A23' }, 'Πέμπτη': { 1: 'B31', 4: 'B51', 5: 'A24', 6: 'B31' }, 'Παρασκευή': { 4: 'A24', 5: 'A23', 6: 'A24', 7: 'A23', 8: 'A24' } },
        'Χρίστου Πρόδρομος': { 'Δευτέρα': { 1: 'Bkat_2', 2: 'Bkat_2', 5: 'A11' }, 'Τρίτη': { 4: 'A22', 6: 'A22' }, 'Τετάρτη': { 2: 'A11', 3: 'A42', 6: 'Bkat_2', 7: 'Bkat_2' }, 'Πέμπτη': { 1: 'A24', 3: 'A22', 5: 'A42', 7: 'A43' }, 'Παρασκευή': { 1: 'Bkat_1', 2: 'Bkat_1', 3: 'A11', 4: 'A11' } },
        'Χριστοφή Ανθή': { 'Δευτέρα': { 3: 'A31', 4: 'A31', 5: 'Γ51' }, 'Τρίτη': { 1: 'A31', 2: 'B32', 5: 'B32' }, 'Τετάρτη': { 4: 'B32', 5: 'B32', 6: 'Γ51' }, 'Πέμπτη': { 1: 'A31', 4: 'B32', 6: 'B32' }, 'Παρασκευή': { 5: 'A31', 6: 'B32', 7: 'A31' } }
    };
    
    // === STATE ===
    let db, auth;
    let departmentsData = [];
    let activityData = { name: '', goal: '', substitutes: [] };
    let unsubscribeHeader, unsubscribeDepartments, unsubscribeActivity;
    let currentUser = null;

    // === DOM ELEMENTS ===
    const schoolNameInput = document.getElementById('school-name');
    const schoolYearInput = document.getElementById('school-year');
    const periodInput = document.getElementById('period');
    const departmentsTbody = document.getElementById('departments-tbody');
    const availableTeachersList = document.getElementById('available-teachers-list');
    const resetBtn = document.getElementById('reset-btn');
    const activityNameDisplay = document.getElementById('activity-name-display');
    const activityGoalInput = document.getElementById('activity-goal');
    const substitutesList = document.getElementById('substitutes-list');
    const resetSubstitutesBtn = document.getElementById('reset-substitutes-btn');
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const userStatus = document.getElementById('user-status');
    const autoAssignBtn = document.getElementById('auto-assign-btn');
    const printProgramBtn = document.getElementById('print-program-btn');
    const externalPageViewer = document.getElementById('external-page-viewer');
    const openExternalBtn = document.getElementById('open-external-btn');
    const printProgramArea = document.getElementById('print-program-area');


    if (activityGoalInput) {
        activityGoalInput.placeholder = 'Οδηγίες προς τους καθηγητές';
    }

    if (autoAssignBtn) {
        autoAssignBtn.style.display = 'none';
    }

    // === FUNCTIONS ===

    function generatePrintContent() {
        if (!printProgramArea) return;
        
        const schoolName = schoolNameInput ? schoolNameInput.value : '';
        const schoolYear = schoolYearInput ? schoolYearInput.value : '';
        const period = periodInput ? periodInput.value : '';
        const activityGoal = activityGoalInput ? activityGoalInput.value : '';
        const substitutes = (activityData.substitutes || []).map(s => toTitleCase(s));
        
        // Ultra compact header
        let html = `
            <div class="print-header">
                <h1>${schoolName}</h1>
                <h2>${schoolYear} - ${period}</h2>
            </div>
            
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="width: 10%;">Τμήμα</th>
                        <th style="width: 40%;">Υπεύθυνος</th>
                        <th style="width: 30%;">Βοηθοί</th>
                        <th style="width: 20%;">Βοηθ. Διευθ.</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Sort all departments and display in one table
        const sortedDepts = departmentsData.sort((a, b) => a.id.localeCompare(b.id));
        
        sortedDepts.forEach(dept => {
            const assistants = (dept.assistants || []).map(a => toTitleCase(a)).join(', ');
            html += `
                <tr>
                    <td>${dept.id}</td>
                    <td>${toTitleCase(dept.responsible)}</td>
                    <td>${assistants || '-'}</td>
                    <td>${toTitleCase(dept.director)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <div class="print-activity">
                <h3>Δραστηριότητα</h3>
                <p><strong>Σκοπός:</strong> ${activityGoal || 'Δεν έχει οριστεί σκοπός'}</p>
                <p><strong>Αναπληρωτές:</strong> ${substitutes.length > 0 ? substitutes.join(', ') : 'Δεν έχουν επιλεγεί'}</p>
            </div>
        `;
        
        printProgramArea.innerHTML = html;
    }

    function handlePrintProgram() {
        generatePrintContent();
        window.print();
    }



    async function initializeAppAndAuth() {
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
            batch.set(deptRef, { responsible: toTitleCase(dept.responsible), director: toTitleCase(dept.director), assistants: [] });
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
                if(schoolNameInput) schoolNameInput.value = data.schoolName || '';
                if(schoolYearInput) schoolYearInput.value = data.schoolYear || '';
                if(periodInput) periodInput.value = data.period || '';
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
                if (activityGoalInput) {
                    activityGoalInput.value = activityData.goal || '';
                    autoResizeTextarea(activityGoalInput);
                }
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
        if (!currentUser || !schoolNameInput || !schoolYearInput || !periodInput) return;
        const headerRef = doc(db, `artifacts/${appId}/public/data/header/config`);
        setDoc(headerRef, {
            schoolName: schoolNameInput.value, 
            schoolYear: schoolYearInput.value, 
            period: periodInput.value,
        }, { merge: true }).catch(err => console.error("Error saving header:", err));
    });

    const saveActivity = debounce(() => {
        if (!currentUser || !activityGoalInput) return;
        const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
        setDoc(activityRef, {
            goal: activityGoalInput.value,
        }, { merge: true }).catch(err => console.error("Error saving activity:", err));
    });

    function getTeacherUsageCount(teacherName) {
        let count = 0;
        const teacherTitleCase = toTitleCase(teacherName);
        
        const isResponsible = departmentsData.some(d => d.responsible === teacherTitleCase);
        if (isResponsible) count++;
        
        const isAssistant = departmentsData.some(d => (d.assistants || []).includes(teacherTitleCase));
        if (isAssistant) count++;
        
        const isSubstitute = (activityData.substitutes || []).includes(teacherTitleCase);
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
        
        const currentResponsibles = new Set(departmentsData.map(d => toTitleCase(d.responsible)).filter(r => r));
        const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []).map(a => toTitleCase(a)));
        const assignedSubstitutes = new Set((activityData.substitutes || []).map(s => toTitleCase(s)));

        const completelyAvailableTeachers = allTeachers.map(name => toTitleCase(name)).filter(t => 
            !managementAndInitialHeads.map(name => toTitleCase(name)).includes(t) &&
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
        if(availableTeachersList) {
            availableTeachersList.innerHTML = teachers.length === 0 
                ? `<div class="p-4 text-center text-gray-500">Δεν υπάρχουν διαθέσιμοι καθηγητές.</div>`
                : teachers.map(teacher => `<div class="available-teacher-item">${teacher}</div>`).join('');
        }
    }

    function renderDepartments(isEditable) {
        if (!departmentsTbody) return;
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
            
            const currentResponsibles = new Set(departmentsData.map(d => toTitleCase(d.responsible)).filter(r => r));
            const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []).map(a => toTitleCase(a)));
            const assignedSubstitutes = new Set((activityData.substitutes || []).map(s => toTitleCase(s)));
            
            responsibleSelect.innerHTML = '<option value="">Επιλέξτε υπεύθυνο...</option>';
            
            allTeachers.forEach(teacher => {
                const teacherTitleCase = toTitleCase(teacher);
                const isAlreadyResponsible = currentResponsibles.has(teacherTitleCase) && teacherTitleCase !== toTitleCase(dept.responsible);
                const isAssistant = assignedAssistants.has(teacherTitleCase);
                const isSubstitute = assignedSubstitutes.has(teacherTitleCase);
                
                const isAvailable = !isAlreadyResponsible && !isAssistant && !isSubstitute;
                const isCurrentResponsible = teacherTitleCase === toTitleCase(dept.responsible);
                
                if (isAvailable || isCurrentResponsible) {
                    const isSelected = isCurrentResponsible ? 'selected' : '';
                    const hours = (teachingHours[teacher] || teachingHours[teacherTitleCase])?.[dept.id] || 0;
                    const displayText = hours > 0 ? `${teacherTitleCase} (${hours})` : teacherTitleCase;
                    
                    const usageCount = getTeacherUsageCount(teacherTitleCase);
                    const option = document.createElement('option');
                    option.value = teacherTitleCase;
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
            directorTd.textContent = toTitleCase(dept.director);

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
            const assistantTitleCase = toTitleCase(assistant);
            const hours = (teachingHours[assistant] || teachingHours[assistantTitleCase])?.[dept.id] || 0;
            const assistantText = hours > 0 ? `${assistantTitleCase} (${hours})` : assistantTitleCase;
            const span = document.createElement('span');
            span.className = 'bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center';
            
            const usageCount = getTeacherUsageCount(assistantTitleCase);
            const colorStyle = getUsageColorStyle(usageCount);
            span.style.color = colorStyle.color;
            span.style.backgroundColor = colorStyle.backgroundColor;
            span.style.fontWeight = colorStyle.fontWeight;
            
            span.innerHTML = `${assistantText} ${isEditable ? `<button data-dept-id="${dept.id}" data-assistant-name="${assistantTitleCase}" class="btn-danger-small remove-assistant-btn">x</button>` : ''}`;
            assistantsContainer.appendChild(span);
        });
        cell.appendChild(assistantsContainer);

        if (isEditable && (dept.assistants || []).length < 2) {
            const select = document.createElement('select');
            select.className = 'header-input text-sm p-1 w-full';
            
            const currentResponsibles = new Set(departmentsData.map(d => toTitleCase(d.responsible)).filter(r => r));
            const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []).map(a => toTitleCase(a)));
            const assignedSubstitutes = new Set((activityData.substitutes || []).map(s => toTitleCase(s)));
            
            const availableForAssistant = allTeachers.map(name => toTitleCase(name)).filter(teacher => 
                !managementAndInitialHeads.map(name => toTitleCase(name)).includes(teacher) &&
                !currentResponsibles.has(teacher) &&
                !assignedAssistants.has(teacher) &&
                !assignedSubstitutes.has(teacher)
            );

            select.innerHTML = `<option value="">Επιλέξτε βοηθό...</option>`;
            availableForAssistant.forEach(teacher => {
                const hours = (teachingHours[teacher] || teachingHours[toTitleCase(teacher)])?.[dept.id] || 0;
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
        if (!substitutesList) return;
        const selectedSubstitutes = new Set((activityData.substitutes || []).map(s => toTitleCase(s)));
        const currentResponsibles = new Set(departmentsData.map(d => toTitleCase(d.responsible)).filter(r => r));
        const assignedAssistants = new Set(departmentsData.flatMap(d => d.assistants || []).map(a => toTitleCase(a)));
        
        const potentialSubstitutes = allTeachers.map(name => toTitleCase(name)).filter(t => 
            !managementAndInitialHeads.map(name => toTitleCase(name)).includes(t) &&
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
        if (!activityNameDisplay) return;
        const substitutes = (activityData.substitutes || []).map(s => toTitleCase(s));
        if (substitutes.length > 0) {
            activityNameDisplay.innerHTML = substitutes
                .map((name, index) => `<div>${index + 1}. ${name}</div>`)
                .join('');
        } else {
            activityNameDisplay.innerHTML = `<div class="text-gray-400">Δεν έχουν επιλεγεί αναπληρωτές.</div>`;
        }
    }

    function updateUIForLoggedInUser(user) {
        if (userStatus) {
            userStatus.textContent = user.email;
            userStatus.classList.remove('hidden');
        }
        if (showLoginBtn) showLoginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (loginModal) loginModal.classList.add('hidden');
        if (externalPageViewer) externalPageViewer.classList.remove('hidden');
        document.querySelectorAll('.editable-control').forEach(el => el.disabled = false);
        render();
    }

    function updateUIForLoggedOutUser() {
        if (userStatus) {
            userStatus.textContent = '';
            userStatus.classList.add('hidden');
        }
        if (showLoginBtn) showLoginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (externalPageViewer) externalPageViewer.classList.add('hidden');
        document.querySelectorAll('.editable-control').forEach(el => el.disabled = true);
        render();
    }

    async function handleLogin() {
        if (!loginEmailInput || !loginPasswordInput || !loginError) return;
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
        await setDoc(deptRef, { responsible: toTitleCase(teacherName) }, { merge: true });
    }

    async function addAssistant(deptId, teacherName) {
        if (!currentUser || !teacherName) return;
        const deptRef = doc(db, `artifacts/${appId}/public/data/departments`, deptId);
        try {
            await runTransaction(db, async (transaction) => {
                const deptDoc = await transaction.get(deptRef);
                if (!deptDoc.exists()) throw "Document does not exist!";
                const newAssistants = deptDoc.data().assistants || [];
                if (!newAssistants.includes(toTitleCase(teacherName)) && newAssistants.length < 2) {
                    newAssistants.push(toTitleCase(teacherName));
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
                const newAssistants = assistants.filter(a => toTitleCase(a) !== toTitleCase(teacherName));
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
        const currentSubstitutes = (activityData.substitutes || []).map(s => toTitleCase(s));
        let newSubstitutes = isChecked 
            ? [...new Set([...currentSubstitutes, teacher])] 
            : currentSubstitutes.filter(t => t !== teacher);
        const activityRef = doc(db, `artifacts/${appId}/public/data/activity/config`);
        setDoc(activityRef, { substitutes: newSubstitutes }, { merge: true });
    }

    // === EVENT LISTENERS ATTACHMENT ===
    if (schoolNameInput) schoolNameInput.addEventListener('input', saveHeader);
    if (schoolYearInput) schoolYearInput.addEventListener('input', saveHeader);
    if (periodInput) periodInput.addEventListener('input', saveHeader);
    if (activityGoalInput) {
        activityGoalInput.addEventListener('input', () => {
            autoResizeTextarea(activityGoalInput);
            saveActivity();
        });
    }
    if (resetBtn) resetBtn.addEventListener('click', handleReset);
    if (resetSubstitutesBtn) resetSubstitutesBtn.addEventListener('click', handleResetSubstitutes);
    if (substitutesList) substitutesList.addEventListener('change', handleSubstituteChange);
    if (printProgramBtn) printProgramBtn.addEventListener('click', handlePrintProgram);
    
    if (openExternalBtn) {
        openExternalBtn.addEventListener('click', () => {
            window.open('https://evretirionlm.web.app/', '_blank');
        });
    }
    
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-assistant-btn')) {
            const { deptId, assistantName } = e.target.dataset;
            removeAssistant(deptId, assistantName);
        }
    });

    if (showLoginBtn) showLoginBtn.addEventListener('click', () => { if (loginModal) loginModal.classList.remove('hidden') });
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if (loginModal) loginModal.classList.add('hidden') });
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);


    // === APP START ===
    initializeAppAndAuth();
});

