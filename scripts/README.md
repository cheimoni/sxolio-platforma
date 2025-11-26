# 🤖 AI Automation Scripts

Αυτά τα scripts χρησιμοποιούνται για αυτόματη φόρτωση και ενημέρωση του project info.

## 📋 Scripts

### `ai_startup.js`
**Πότε τρέχει**: Όταν ένα AI assistant ξεκινάει να δουλεύει με το project

**Τι κάνει**:
- Φορτώνει το `project_info.json`
- Εμφανίζει project summary
- Παρέχει context στο AI

**Χρήση**:
```javascript
const AIProjectLoader = require('./scripts/ai_startup');
const loader = new AIProjectLoader();
const info = loader.loadProjectInfo();
```

### `ai_cleanup.js`
**Πότε τρέχει**: Όταν το AI ολοκληρώνει την εργασία

**Τι κάνει**:
- Ενημερώνει το `project_info.json`
- Προσθέτει change notes
- Ενημερώνει statistics
- Ανανεώνει timestamp

**Χρήση**:
```javascript
const AIProjectUpdater = require('./scripts/ai_cleanup');
const updater = new AIProjectUpdater();
updater.finalizeChanges([
  'Description of change 1',
  'Description of change 2'
]);
```

## 🔄 Auto-Integration

Αυτά τα scripts μπορούν να ενσωματωθούν σε:
- Cursor AI workflows
- Git hooks (pre-commit, post-commit)
- CI/CD pipelines
- Development tools

## 📝 Change Notes Format

```javascript
{
  timestamp: "2025-01-13T10:30:00.000Z",
  note: "Added new feature X to module Y"
}
```

## ⚠️ Important

- **ΠΑΝΤΑ** καλέστε `ai_cleanup.js` μετά από αλλαγές
- **ΠΑΝΤΑ** προσθέτετε descriptive change notes
- Το `last_updated` ενημερώνεται αυτόματα

---

# 🔒 Git Hooks - Secret Protection

## Αυτόματη Προστασία από API Key Leaks

Τα `setup-git-hooks` scripts εγκαθιστούν ένα **pre-commit hook** που **μπλοκάρει αυτόματα** οποιοδήποτε commit περιέχει Firebase API keys ή άλλα secrets.

## 🚀 Εγκατάσταση

### Σε αυτό το PC (Ήδη εγκατεστημένο ✅)

Το hook είναι ήδη ενεργό σε αυτόν τον υπολογιστή!

### Σε νέο PC (μετά από git clone)

**Linux / macOS / Git Bash (Windows):**
```bash
cd sxolio-platforma
bash scripts/setup-git-hooks.sh
```

**Windows (CMD / PowerShell):**
```cmd
cd sxolio-platforma
scripts\setup-git-hooks.bat
```

## 🛡️ Τι Προστατεύει

Το hook ελέγχει **ΚΑΘΕ commit** για:

✅ Firebase API keys (AIzaSy...)
✅ Παλιά project IDs (platformalas, gradesystem-4ca8b)
✅ Hardcoded secrets σε tracked files

## 🚫 Commit Blocked Example

Αν προσπαθήσεις να κάνεις commit αρχείο με API key, θα δεις:

```
🔒 Checking for exposed secrets...
❌ ERROR: Firebase API key detected in: some-file.js

🚨 COMMIT BLOCKED! Secrets detected in staged files.
```

Το commit **ΔΕΝ θα γίνει** και τα secrets **ΔΕΝ θα πάνε στο GitHub**! 🎉

## 📝 Προστατευόμενα Αρχεία

Αυτά τα αρχεία είναι στο `.gitignore` και **δεν πρέπει ΠΟΤΕ** να commitαριστούν:

```
platforma-bathmologia/.env.local
platforma-orario/js/config/firebase.js
platforma-orario/js/config/firebase-schedule.js
```

## ✅ Ασφαλή Templates

Αυτά **είναι ασφαλή** να commitαριστούν (δεν έχουν secrets):

```
platforma-bathmologia/.env.example
platforma-orario/js/config/firebase.example.js
platforma-orario/js/config/firebase-schedule.example.js
```

