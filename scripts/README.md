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

