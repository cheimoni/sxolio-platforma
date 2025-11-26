// services/firebase.service.js
export class FirebaseService {
    constructor(config) {
        this.app = initializeApp(config);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
        this.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    }

    async initAuth() {
        await setPersistence(this.auth, browserLocalPersistence);
        return new Promise((resolve) => {
            onAuthStateChanged(this.auth, (user) => {
                resolve(user);
            });
        });
    }

    // Consolidated data subscription
    subscribeToData(callback) {
        const unsubscribes = [];
        
        // Header subscription
        const headerRef = doc(this.db, `artifacts/${this.appId}/public/data/header/config`);
        unsubscribes.push(onSnapshot(headerRef, (snap) => {
            callback('header', snap.exists() ? snap.data() : null);
        }));

        // Departments subscription
        const deptCol = collection(this.db, `artifacts/${this.appId}/public/data/departments`);
        unsubscribes.push(onSnapshot(deptCol, (snap) => {
            const departments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback('departments', departments);
        }));

        // Activity subscription
        const activityRef = doc(this.db, `artifacts/${this.appId}/public/data/activity/config`);
        unsubscribes.push(onSnapshot(activityRef, (snap) => {
            callback('activity', snap.exists() ? snap.data() : null);
        }));

        return () => unsubscribes.forEach(unsub => unsub());
    }

    async updateHeader(data) {
        const ref = doc(this.db, `artifacts/${this.appId}/public/data/header/config`);
        return setDoc(ref, data, { merge: true });
    }

    async updateDepartment(deptId, data) {
        const ref = doc(this.db, `artifacts/${this.appId}/public/data/departments`, deptId);
        return setDoc(ref, data, { merge: true });
    }

    async updateActivity(data) {
        const ref = doc(this.db, `artifacts/${this.appId}/public/data/activity/config`);
        return setDoc(ref, data, { merge: true });
    }
}

// stores/app.store.js
export class AppStore {
    constructor() {
        this.state = {
            user: null,
            header: null,
            departments: [],
            activity: null,
            loading: false,
            error: null
        };
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(listener => listener(this.state));
    }

    updateData(type, data) {
        this.setState({ [type]: data });
    }

    getAvailableTeachers() {
        const currentResponsibles = new Set(this.state.departments.map(d => d.responsible));
        const assignedAssistants = new Set(this.state.departments.flatMap(d => d.assistants || []));
        const assignedSubstitutes = new Set(this.state.activity?.substitutes || []);

        return allTeachers.filter(t => 
            !managementAndInitialHeads.includes(t) &&
            !currentResponsibles.has(t) &&
            !assignedAssistants.has(t) &&
            !assignedSubstitutes.has(t)
        ).sort((a, b) => a.localeCompare(b, 'el'));
    }
}

// components/department-table.component.js
export class DepartmentTableComponent {
    constructor(container, store, firebaseService) {
        this.container = container;
        this.store = store;
        this.firebaseService = firebaseService;
        this.tbody = container.querySelector('#departments-tbody');
        
        this.store.subscribe(this.render.bind(this));
    }

    render(state) {
        if (!state.departments) return;
        
        // Only re-render if departments actually changed
        if (this.lastDepartments && 
            JSON.stringify(this.lastDepartments) === JSON.stringify(state.departments)) {
            return;
        }
        
        this.lastDepartments = [...state.departments];
        this.tbody.innerHTML = '';
        
        state.departments
            .sort((a, b) => a.id.localeCompare(b.id))
            .forEach(dept => this.renderDepartment(dept, state));
    }

    renderDepartment(dept, state) {
        const tr = document.createElement('tr');
        tr.dataset.grade = dept.id.charAt(0);
        tr.innerHTML = this.getDepartmentHTML(dept, state.user);
        
        // Add event listeners
        this.setupDepartmentEventListeners(tr, dept);
        
        this.tbody.appendChild(tr);
    }

    getDepartmentHTML(dept, user) {
        const isEditable = !!user;
        return `
            <td class="font-semibold">${dept.id}</td>
            <td>
                <select class="header-input text-sm p-1 w-full" ${!isEditable ? 'disabled' : ''}>
                    ${this.getResponsibleOptions(dept.responsible)}
                </select>
            </td>
            <td class="assistants-cell" data-dept-id="${dept.id}">
                ${this.getAssistantsHTML(dept, isEditable)}
            </td>
            <td>${dept.director}</td>
        `;
    }

    setupDepartmentEventListeners(tr, dept) {
        // Responsible change listener
        const select = tr.querySelector('select');
        select.addEventListener('change', (e) => {
            this.handleResponsibleChange(dept.id, e.target.value);
        });

        // Assistant management listeners
        const assistantsCell = tr.querySelector('.assistants-cell');
        assistantsCell.addEventListener('click', this.handleAssistantClick.bind(this));
    }

    async handleResponsibleChange(deptId, newResponsible) {
        this.store.setState({ loading: true });
        try {
            await this.firebaseService.updateDepartment(deptId, { responsible: newResponsible });
        } catch (error) {
            this.store.setState({ error: error.message });
        } finally {
            this.store.setState({ loading: false });
        }
    }
}

// utils/debounce.js
export function debounce(func, wait) {
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

// main.js - Application entry point
import { FirebaseService } from './services/firebase.service.js';
import { AppStore } from './stores/app.store.js';
import { DepartmentTableComponent } from './components/department-table.component.js';
import { firebaseConfig } from './firebase-config.js';

class App {
    constructor() {
        this.firebaseService = new FirebaseService(firebaseConfig);
        this.store = new AppStore();
        this.components = {};
        this.unsubscribeData = null;
    }

    async init() {
        try {
            // Initialize auth
            const user = await this.firebaseService.initAuth();
            this.store.setState({ user });

            // Initialize components
            this.initComponents();

            // Subscribe to data changes
            this.unsubscribeData = this.firebaseService.subscribeToData(
                (type, data) => this.store.updateData(type, data)
            );

            // Show app
            document.getElementById('app-container').classList.remove('opacity-0');
        } catch (error) {
            console.error('App initialization failed:', error);
            this.store.setState({ error: error.message });
        }
    }

    initComponents() {
        // Initialize all components
        this.components.departmentTable = new DepartmentTableComponent(
            document.querySelector('.styled-table'),
            this.store,
            this.firebaseService
        );
        
        // Add other components as needed
    }

    destroy() {
        if (this.unsubscribeData) {
            this.unsubscribeData();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});