# 🏫 Σχολική Πλατφόρμα - Phase 1

## 📁 Δομή Project

```
school-platform/
├── css/
│   ├── variables.css    # Χρώματα, μεγέθη, spacing
│   ├── fonts.css        # 16 γραμματοσειρές
│   ├── reset.css        # Reset styles
│   ├── layout.css       # Sidebar, Header, Main
│   ├── components.css   # Buttons, Cards, Modals
│   ├── chat.css         # Chat-specific styles
│   ├── utilities.css    # Helper classes
│   ├── pages.css        # Page-specific styles
│   └── main.css         # Import all
│
├── js/
│   ├── config/
│   │   └── firebase.js  # Firebase configuration
│   ├── utils/
│   │   ├── constants.js # Roles, permissions
│   │   └── helpers.js   # Helper functions
│   ├── services/
│   │   ├── auth.js      # Authentication
│   │   ├── users.js     # User management
│   │   └── chat.js      # Chat/Messages
│   ├── components/
│   │   ├── sidebar.js   # Side menu
│   │   ├── header.js    # Top header
│   │   ├── chatWindow.js
│   │   ├── userList.js
│   │   └── conversationList.js
│   ├── pages/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── messages.js
│   │   └── announcements.js
│   └── app.js           # Main app controller
│
└── index.html           # Entry point
```

## 🔥 Ρύθμιση Firebase

### Βήμα 1: Δημιουργία Firebase Project

1. Πήγαινε στο [Firebase Console](https://console.firebase.google.com/)
2. Κάνε κλικ στο "Add project"
3. Δώσε όνομα (π.χ. "school-platform")
4. Απενεργοποίησε το Google Analytics (προαιρετικά)
5. Κάνε κλικ στο "Create project"

### Βήμα 2: Ενεργοποίηση Authentication

1. Στο sidebar, κάνε κλικ στο "Authentication"
2. Κάνε κλικ στο "Get started"
3. Στο tab "Sign-in method", ενεργοποίησε "Email/Password"

### Βήμα 3: Δημιουργία Firestore Database

1. Στο sidebar, κάνε κλικ στο "Firestore Database"
2. Κάνε κλικ στο "Create database"
3. Επίλεξε "Start in test mode" (για αρχή)
4. Επίλεξε location (π.χ. europe-west1)

### Βήμα 4: Λήψη Configuration

1. Κάνε κλικ στο ⚙️ (Project settings)
2. Scroll down στο "Your apps"
3. Κάνε κλικ στο "</>" (Web app)
4. Δώσε όνομα (π.χ. "school-web")
5. Αντέγραψε το configuration object

### Βήμα 5: Ενημέρωση firebase.js

Άνοιξε το `js/config/firebase.js` και αντικατέστησε:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // ← Βάλε το δικό σου
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 👤 Δημιουργία Test Users

### Στο Firebase Console:

1. Πήγαινε στο Authentication → Users
2. Κάνε κλικ στο "Add user"
3. Δημιούργησε χρήστες:
   - `director@school.gr` / password123
   - `teacher1@school.gr` / password123

### Στο Firestore:

1. Πήγαινε στο Firestore Database
2. Κάνε κλικ στο "Start collection"
3. Collection ID: `users`
4. Πρόσθεσε documents:

**Document 1 (Διευθυντής):**
```
Document ID: (copy UID from Authentication)
Fields:
  - displayName: "Γιώργος Παπαδόπουλος"
  - email: "director@school.gr"
  - role: "διευθυντής"
  - specialty: ""
  - departments: []
  - isActive: true
```

**Document 2 (Καθηγητής):**
```
Document ID: (copy UID from Authentication)
Fields:
  - displayName: "Μαρία Αλεξίου"
  - email: "teacher1@school.gr"
  - role: "καθηγητής"
  - specialty: "Φιλόλογος"
  - departments: ["Α1", "Β2"]
  - isActive: true
```

## 🚀 Εκκίνηση

### Επιλογή 1: Απλό άνοιγμα
Απλά άνοιξε το `index.html` στον browser.

### Επιλογή 2: Local Server (καλύτερο)
```bash
# Με Python
python -m http.server 8000

# Ή με Node.js
npx serve .

# Ή με VS Code Live Server extension
```

Μετά πήγαινε στο: `http://localhost:8000`

## 🔐 Firestore Rules (για production)

Αντικατέστησε τα default rules με:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: authenticated can read, only admins can write
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['διευθυντής', 'βδα'];
    }

    // Conversations: participants only
    match /conversations/{convId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
    }

    // Messages: participants of conversation only
    match /messages/{msgId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📋 Τι περιλαμβάνει το Phase 1

✅ Σύστημα Login
✅ Dashboard με στατιστικά
✅ Λίστα χρηστών
✅ 1-1 Chat σε real-time
✅ Λίστα συνομιλιών
✅ Ειδοποιήσεις unread
✅ Responsive design

## 🔜 Επόμενα Phases

- **Phase 2:** Group chats, Ανακοινώσεις
- **Phase 3:** Upload αρχείων, Ημερολόγιο
- **Phase 4:** Push notifications, Admin panel

## 🎨 Χρώματα που επιλέχθηκαν

| Στοιχείο | Χρώμα |
|----------|-------|
| Background | `#f1f8f1` |
| Sidebar | `#ffffff` |
| Header | `#16a34a` |
| Primary | `#16a34a` |
| Chat (δικά μου) | `#3b82f6` |
| Chat (άλλων) | `#ef4444` |

## 📝 Γραμματοσειρά

Βασική: **Courier New**

Διαθέσιμες (16 συνολικά):
- Courier New, Roboto, Open Sans, Noto Sans
- Literata, Source Sans Pro, Lato, Ubuntu
- Fira Sans, GFS Didot, GFS Neohellenic
- Arial, Verdana, Tahoma, Georgia, Times New Roman
