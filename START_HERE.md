# 🚀 ΟΔΗΓΟΣ ΕΚΚΙΝΗΣΗΣ - Σχολική Πλατφόρμα

## ⚡ ΓΡΗΓΟΡΗ ΕΚΚΙΝΗΣΗ (Quick Start)

### Windows:
- **School Platform**: Double-click `start_school_platform.bat`
- **Anaplirosis**: Double-click `start_anaplirosis.bat`

### Linux/Mac:
```bash
chmod +x start_school_platform.sh start_anaplirosis.sh
./start_school_platform.sh
# ή
./start_anaplirosis.sh
```

---

## 📋 Γρήγορη Επισκόπηση

Το project αποτελείται από **2 κύρια συστήματα**:

1. **School Platform** - Web εφαρμογή (Vanilla JS + Firebase)
2. **Anaplirosis** - React εφαρμογή (React 18)

---

## 🏫 PART 1: SCHOOL PLATFORM

### Προαπαιτούμενα
- ✅ Web browser (Chrome, Firefox, Edge)
- ✅ Firebase account (δωρεάν)
- ✅ Local web server (Python ή Node.js)

### Βήμα 1: Ρύθμιση Firebase

#### 1.1 Δημιουργία Firebase Project

1. Πήγαινε στο [Firebase Console](https://console.firebase.google.com/)
2. Κάνε κλικ στο **"Add project"**
3. Δώσε όνομα (π.χ. "school-platform")
4. Απενεργοποίησε το Google Analytics (προαιρετικά)
5. Κάνε κλικ στο **"Create project"**

#### 1.2 Ενεργοποίηση Authentication

1. Στο sidebar → **"Authentication"**
2. Κάνε κλικ στο **"Get started"**
3. Στο tab **"Sign-in method"** → Ενεργοποίησε **"Email/Password"**

#### 1.3 Δημιουργία Firestore Database

1. Στο sidebar → **"Firestore Database"**
2. Κάνε κλικ στο **"Create database"**
3. Επίλεξε **"Start in test mode"** (για αρχή)
4. Επίλεξε location (π.χ. `europe-west1`)

#### 1.4 Λήψη Firebase Configuration

1. Κάνε κλικ στο ⚙️ (**Project settings**)
2. Scroll down στο **"Your apps"**
3. Κάνε κλικ στο **"</>"** (Web app icon)
4. Δώσε όνομα (π.χ. "school-web")
5. **Αντέγραψε** το configuration object

#### 1.5 Ενημέρωση firebase.js

Άνοιξε το αρχείο: `school-platform/js/config/firebase.js`

Αντικατέστησε το configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // ← Βάλε το δικό σου
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Βήμα 2: Δημιουργία Test Users

#### 2.1 Στο Firebase Authentication

1. Πήγαινε στο **Authentication → Users**
2. Κάνε κλικ στο **"Add user"**
3. Δημιούργησε χρήστες:

**Χρήστης 1 - Διευθυντής:**
- Email: `director@school.gr`
- Password: `password123`

**Χρήστης 2 - Καθηγητής:**
- Email: `teacher1@school.gr`
- Password: `password123`

#### 2.2 Στο Firestore Database

1. Πήγαινε στο **Firestore Database**
2. Κάνε κλικ στο **"Start collection"**
3. Collection ID: `users`

**Document 1 (Διευθυντής):**
- Document ID: (αντίγραψε το UID από Authentication)
- Fields:
  ```
  displayName: "Γιώργος Παπαδόπουλος"
  email: "director@school.gr"
  role: "διευθυντής"
  specialty: ""
  departments: []
  isActive: true
  ```

**Document 2 (Καθηγητής):**
- Document ID: (αντίγραψε το UID από Authentication)
- Fields:
  ```
  displayName: "Μαρία Αλεξίου"
  email: "teacher1@school.gr"
  role: "καθηγητής"
  specialty: "Φιλόλογος"
  departments: ["Α1", "Β2"]
  isActive: true
  ```

### Βήμα 3: Εκκίνηση School Platform

#### Επιλογή 1: Απλό Άνοιγμα (Γρήγορο)
Απλά άνοιξε το αρχείο:
```
school-platform/index.html
```
στον browser.

⚠️ **Σημείωση**: Μπορεί να έχεις CORS issues με Firebase.

#### Επιλογή 2: Local Server (Συνιστάται)

**Με Python:**
```bash
cd school-platform
python -m http.server 8000
```

**Με Node.js:**
```bash
cd school-platform
npx serve .
```

**Με VS Code:**
- Εγκατάστησε το extension **"Live Server"**
- Κάνε right-click στο `index.html`
- Επίλεξε **"Open with Live Server"**

#### Άνοιγμα στον Browser

Πήγαινε στο: **`http://localhost:8000`**

---

## 🔧 PART 2: ANAPLIROSIS (React App)

### Προαπαιτούμενα
- ✅ Node.js (v14 ή νεότερο)
- ✅ npm ή yarn

### Βήμα 1: Εγκατάσταση Dependencies

```bash
cd anaplirosis
npm install
```

Αυτό θα εγκαταστήσει:
- React 18
- Firebase SDK
- Lucide React (icons)
- PDF libraries
- και άλλα dependencies

### Βήμα 2: Εκκίνηση Development Server

```bash
npm start
```

Αυτό θα:
- Ξεκινήσει το development server
- Ανοίξει αυτόματα τον browser στο `http://localhost:3000`
- Ενεργοποιήσει hot reload (αυτόματη ανανέωση)

### Βήμα 3: Build για Production

```bash
npm run build
```

Αυτό δημιουργεί optimized build στο φάκελο `build/`

---

## 🔐 Firestore Security Rules

Για production, αντικατέστησε τα default rules με:

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

---

## 📊 Quick Start Checklist

### School Platform:
- [ ] Firebase project δημιουργήθηκε
- [ ] Authentication ενεργοποιήθηκε
- [ ] Firestore database δημιουργήθηκε
- [ ] Firebase config ενημερώθηκε στο `firebase.js`
- [ ] Test users δημιουργήθηκαν
- [ ] Local server ξεκίνησε
- [ ] Άνοιξε `http://localhost:8000`

### Anaplirosis:
- [ ] Node.js εγκαταστάθηκε
- [ ] `npm install` εκτελέστηκε
- [ ] `npm start` εκτελέστηκε
- [ ] Άνοιξε `http://localhost:3000`

---

## 🐛 Troubleshooting

### Problem: CORS Errors
**Solution**: Χρησιμοποίησε local server αντί για direct file open

### Problem: Firebase not initialized
**Solution**: Έλεγξε αν το `firebase.js` έχει σωστό configuration

### Problem: Cannot login
**Solution**: 
- Έλεγξε αν ο χρήστης υπάρχει στο Authentication
- Έλεγξε αν το Firestore document έχει σωστό role

### Problem: npm install fails
**Solution**: 
- Δοκίμασε `npm install --legacy-peer-deps`
- Ή `npm cache clean --force` και ξανά `npm install`

### Problem: Port already in use
**Solution**: 
- School Platform: Άλλαξε port `python -m http.server 8001`
- Anaplirosis: Set `PORT=3001 npm start`

---

## 📚 Περισσότερες Πληροφορίες

- **Project Info**: Διάβασε `project_info.json` για πλήρη λίστα features
- **AI Instructions**: Διάβασε `AI_INSTRUCTIONS.md` για development guidelines
- **School Platform README**: `school-platform/README.md`
- **Anaplirosis README**: `anaplirosis/README.md`

---

## 🎯 Next Steps

Μετά την εκκίνηση:

1. **Test Login**: Συνδέσου με `director@school.gr` / `password123`
2. **Explore Features**: Δες το Dashboard, Messages, Announcements
3. **Check Permissions**: Δοκίμασε διαφορετικούς ρόλους
4. **Read Documentation**: Διάβασε `project_info.json` για όλα τα features

---

**Καλή Εργασία! 🚀**

*Τελευταία ενημέρωση: 2025-01-13*

