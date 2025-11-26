# 🤖 ΟΔΗΓΙΕΣ ΓΙΑ AI ASSISTANTS

## ⚠️ ΥΠΟΧΡΕΩΤΙΚΗ ΕΝΗΜΕΡΩΣΗ

**ΟΠΟΙΟΣΔΗΠΟΤΕ AI ASSISTANT που ξεκινάει να δουλεύει με αυτό το project ΠΡΕΠΕΙ να διαβάσει ΠΡΩΤΑ το αρχείο `project_info.json`.**

## 🚀 ΑΥΤΟΜΑΤΗ ΦΟΡΤΩΣΗ ΚΑΙ ΕΝΗΜΕΡΩΣΗ

### Όταν ΞΕΚΙΝΑΣ (Startup):
1. **ΑΥΤΟΜΑΤΑ** φορτώνεται το `project_info.json` στο AI context
2. Το AI **ΚΑΤΑΛΑΒΑΙΝΕΙ** αμέσως τι είναι το project
3. Έχει πρόσβαση σε όλες τις πληροφορίες (modules, features, permissions, etc.)

**Script**: `scripts/ai_startup.js` - Τρέχει αυτόματα στην έναρξη

### Όταν ΤΕΛΕΙΩΝΕΙΣ (Cleanup):
1. **ΑΥΤΟΜΑΤΑ** ενημερώνεται το `project_info.json` με τις αλλαγές
2. Προστίθενται change notes με το τι έκανες
3. Ενημερώνεται το `last_updated` timestamp
4. Ενημερώνονται τα statistics

**Script**: `scripts/ai_cleanup.js` - Τρέχει αυτόματα στο τέλος

### Change Notes Format:
Κάθε αλλαγή καταγράφεται με:
```json
{
  "timestamp": "2025-01-13T10:30:00.000Z",
  "note": "Περιγραφή της αλλαγής που έγινε"
}
```

---

## 📋 PROTOCOL ΕΝΑΡΞΗΣ ΕΡΓΑΣΙΑΣ

### Βήμα 1: Αυτόματη Φόρτωση Project Info
**ΑΥΤΟΜΑΤΑ** φορτώνεται το `project_info.json` όταν ξεκινάς!

Το AI system:
- ✅ Διαβάζει το `project_info.json` αυτόματα
- ✅ Καταλαβαίνει όλη τη δομή του project
- ✅ Έχει πρόσβαση σε όλες τις πληροφορίες

Αυτό το αρχείο περιέχει:
- ✅ Πλήρη λίστα όλων των modules
- ✅ Όλες τις λειτουργίες κάθε module
- ✅ User roles και permissions
- ✅ Database collections
- ✅ File structure
- ✅ Technical specifications
- ✅ Design system

**Δεν χρειάζεται να το διαβάσεις χειροκίνητα - γίνεται αυτόματα!**

### Βήμα 2: Κατανόηση Project Structure
Μετά το διάβασμα του JSON, κατανοήστε:
1. **Δύο κύρια συστήματα**: School Platform + Anaplirosis
2. **27 major modules** συνολικά
3. **150+ features** που πρέπει να γνωρίζετε
4. **7 user roles** με διαφορετικά permissions

### Βήμα 3: Αυτόματη Ενημέρωση Project Info
**ΑΥΤΟΜΑΤΑ** ενημερώνεται το `project_info.json` όταν τελειώνεις!

**ΚΑΘΕ ΦΟΡΑ** που:
- Προσθέτετε νέο feature
- Αλλάζετε υπάρχον feature
- Προσθέτετε νέο module
- Αλλάζετε permissions
- Προσθέτετε νέο collection

**ΑΥΤΟΜΑΤΑ**:
- ✅ Προστίθεται change note
- ✅ Ενημερώνεται timestamp
- ✅ Ενημερώνονται statistics
- ✅ Αποθηκεύεται το JSON

**Δεν χρειάζεται να το κάνεις χειροκίνητα - γίνεται αυτόματα!**

---

## 🔄 AUTO-UPDATE PROTOCOL

### Όταν κάνετε αλλαγές:

1. **Κάντε την αλλαγή** στον κώδικα
2. **Το `ai_cleanup.js` τρέχει αυτόματα** και:
   - Ενημερώνει το `project_info.json`
   - Προσθέτει change note
   - Ενημερώνει `last_updated` timestamp
   - Ενημερώνει statistics

### Παράδειγμα Auto-Update:
```javascript
// Αυτό γίνεται ΑΥΤΟΜΑΤΑ στο τέλος
const updater = new AIProjectUpdater();
updater.finalizeChanges([
  'Προστέθηκε νέο feature X στο module Y',
  'Ενημερώθηκε το authentication service'
]);
```

**Αποτέλεσμα στο JSON**:
```json
{
  "project_metadata": {
    "last_updated": "2025-01-13",
    "auto_update": true
  },
  "important_notes": {
    "latest_changes": [
      {
        "timestamp": "2025-01-13T10:30:00.000Z",
        "note": "Προστέθηκε νέο feature X στο module Y"
      }
    ]
  }
}
```

---

## 📁 FILE STRUCTURE REFERENCE

### School Platform:
```
school-platform/
├── js/
│   ├── services/     # Backend services (auth, chat, etc.)
│   ├── pages/        # Page components
│   ├── components/   # UI components
│   ├── utils/        # Helper functions
│   └── config/       # Configuration (Firebase)
├── css/              # Stylesheets
└── index.html        # Entry point
```

### Anaplirosis:
```
anaplirosis/
├── src/
│   ├── components/   # React components
│   ├── firebase/     # Firebase integration
│   ├── hooks/        # Custom hooks
│   └── data/         # Data files
└── public/           # Public assets
```

---

## 🎯 ΚΑΝΟΝΕΣ ΚΩΔΙΚΟΠΟΙΗΣΗΣ

### 1. Αρχιτεκτονική
- **School Platform**: Vanilla JS, modular structure
- **Anaplirosis**: React 18, component-based
- **Backend**: Firebase (Firestore, Auth, Storage)

### 2. Naming Conventions
- **Services**: `camelCase` (π.χ. `auth.js`, `chat.js`)
- **Components**: `PascalCase` (π.χ. `Sidebar.js`, `Header.js`)
- **Collections**: `lowercase` (π.χ. `users`, `messages`)

### 3. Permissions
- **ΠΑΝΤΑ** ελέγχετε permissions πριν από operations
- Χρησιμοποιείτε `AuthService.can(permission)`
- Δείτε `js/utils/constants.js` για permissions matrix

### 4. Real-time Updates
- Χρησιμοποιείτε Firebase `onSnapshot` listeners
- **ΠΑΝΤΑ** cleanup listeners όταν destroy components
- Track active listeners σε `activeListeners` arrays

---

## 🔒 SECURITY RULES

### 1. Authentication
- **ΠΑΝΤΑ** ελέγχετε `AuthService.isLoggedIn()`
- **ΠΑΝΤΑ** ελέγχετε user role πριν από sensitive operations

### 2. Data Access
- Χρησιμοποιείτε Firestore security rules
- **ΠΟΤΕ** μην expose sensitive data στο client
- Validate data πριν από database writes

### 3. File Uploads
- Validate file types και sizes
- Check permissions πριν από upload/delete

---

## 📊 DATABASE STRUCTURE

### Collections Reference:
- `users` - User accounts και profiles
- `conversations` - Chat conversations
- `messages` - Chat messages
- `announcements` - School announcements
- `files` - File metadata
- `events` - Calendar events
- `duties` - Teacher duties
- `tasks` - User tasks
- `substitutions` - Substitution requests
- `polls` - Polls και votes
- `alerts` - Emergency alerts
- `groups` - User groups
- `scheduleSettings` - Schedule configuration
- `notifications` - System notifications

**Δείτε `project_info.json` για πλήρη details κάθε collection.**

---

## 🎨 UI/UX GUIDELINES

### Design System:
- **Primary Color**: `#16a34a` (green)
- **Background**: `#f1f8f1` (light green)
- **Default Font**: Courier New
- **Responsive**: Mobile-first approach

### Components:
- Χρησιμοποιείτε existing components από `js/components/`
- Follow existing patterns για consistency
- **ΠΑΝΤΑ** responsive design

---

## 🚨 IMPORTANT REMINDERS

### ΠΡΙΝ ΚΑΝΕΤΕ ΑΛΛΑΓΕΣ:
1. ✅ Διαβάσατε το `project_info.json`?
2. ✅ Κατανοείτε το module που επηρεάζετε?
3. ✅ Έχετε ελέγξει permissions?
4. ✅ Έχετε ελέγξει dependencies?

### ΜΕΤΑ ΤΙΣ ΑΛΛΑΓΕΣ:
1. ✅ Ενημερώσατε το `project_info.json`?
2. ✅ Ενημερώσατε το `last_updated`?
3. ✅ Έχετε test τις αλλαγές?
4. ✅ Έχετε cleanup listeners/subscriptions?

---

## 📝 DOCUMENTATION UPDATES

### Όταν προσθέτετε νέο feature:
1. Ενημερώστε `project_info.json`
2. Προσθέστε documentation στο README αν χρειάζεται
3. Προσθέστε comments στον κώδικα
4. Ενημερώστε `LEITOURGIES_LIST.md` αν χρειάζεται

---

## 🔍 DEBUGGING TIPS

### Common Issues:
1. **Firebase Index Errors**: Check console για missing indexes
2. **Permission Errors**: Verify user role και permissions
3. **Real-time Not Working**: Check listeners cleanup
4. **File Upload Fails**: Check Firebase Storage rules

### Tools:
- Browser DevTools για debugging
- Firebase Console για database inspection
- Network tab για API calls

---

## ✅ CHECKLIST ΠΡΙΝ COMMIT

- [ ] Το `project_info.json` φορτώθηκε αυτόματα (startup)
- [ ] Κατανοώ το module που επηρεάζω
- [ ] Έχω ελέγξει permissions
- [ ] Έχω test τις αλλαγές
- [ ] Έχω cleanup listeners
- [ ] Το `project_info.json` ενημερώθηκε αυτόματα (cleanup)
- [ ] Έχω ενημερώσει documentation
- [ ] Code is clean και commented

**Σημείωση**: Τα scripts `ai_startup.js` και `ai_cleanup.js` τρέχουν αυτόματα!

---

## 🎯 SUMMARY

**ΚΑΝΟΝΑΣ #1**: Το `project_info.json` φορτώνεται **ΑΥΤΟΜΑΤΑ** στην έναρξη!

**ΚΑΝΟΝΑΣ #2**: Το `project_info.json` ενημερώνεται **ΑΥΤΟΜΑΤΑ** στο τέλος!

**ΚΑΝΟΝΑΣ #3**: Follow existing patterns και architecture!

**ΚΑΝΟΝΑΣ #4**: Τα scripts `ai_startup.js` και `ai_cleanup.js` κάνουν όλη τη δουλειά!

---

*Αυτό το file πρέπει να διαβάζεται από ΚΑΘΕ AI assistant που δουλεύει με το project.*

**Τελευταία ενημέρωση**: 2025-01-13

