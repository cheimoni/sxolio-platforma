# Firebase Integration Guide

## 📝 Περιγραφή

Το Firebase είναι ρυθμισμένο και έτοιμο για χρήση στην εφαρμογή.

## 🔧 Τι έχει εγκατασταθεί

- ✅ Firebase SDK
- ✅ Realtime Database
- ✅ Authentication (έτοιμο αν χρειαστεί)
- ✅ Analytics

## 📁 Δομή Αρχείων

```
src/firebase/
├── config.js       - Firebase configuration & initialization
├── database.js     - Helper functions για τη βάση
└── README.md       - Αυτό το αρχείο
```

## 🚀 Πώς να Χρησιμοποιήσεις το Firebase

### 1. Import σε Component

```javascript
import { saveAbsenceReport, getAbsenceReport } from '../firebase/database';
```

### 2. Αποθήκευση Αναφοράς Απουσιών

```javascript
const handleSave = async () => {
  const today = new Date();
  const reportData = {
    teachers: absenceData,
    timestamp: Date.now(),
    createdBy: 'User Name'
  };
  
  const result = await saveAbsenceReport(today, reportData);
  if (result.success) {
    console.log('Αποθηκεύτηκε!');
  }
};
```

### 3. Ανάκτηση Δεδομένων

```javascript
const loadReport = async () => {
  const today = new Date();
  const result = await getAbsenceReport(today);
  
  if (result.success && result.data) {
    console.log('Δεδομένα:', result.data);
    setAbsenceData(result.data.teachers);
  }
};
```

### 4. Real-time Listening (προχωρημένο)

```javascript
import { listenToData } from '../firebase/database';

useEffect(() => {
  const unsubscribe = listenToData('absences/2025-01-15', (data) => {
    console.log('Νέα δεδομένα:', data);
    setAbsenceData(data);
  });
  
  // Cleanup
  return () => unsubscribe();
}, []);
```

## 📊 Δομή Δεδομένων στη Βάση

```
anaplirosis-v2/
├── absences/
│   ├── 2025-01-15/
│   │   ├── teachers: [...]
│   │   ├── timestamp: 1736899200000
│   │   └── createdBy: "User Name"
│   └── 2025-01-16/
│       └── ...
└── replacements/
    ├── 2025-01-15/
    │   └── [...]
    └── ...
```

## 🎯 Διαθέσιμες Συναρτήσεις

### Βασικές

- `saveData(path, data)` - Αποθήκευση
- `getData(path)` - Ανάγνωση
- `updateData(path, updates)` - Ενημέρωση
- `deleteData(path)` - Διαγραφή
- `listenToData(path, callback)` - Real-time listening
- `pushData(path, data)` - Προσθήκη με auto-ID

### Εξειδικευμένες

- `saveAbsenceReport(date, reportData)` - Αποθήκευση αναφοράς
- `getAbsenceReport(date)` - Ανάκτηση αναφοράς
- `saveReplacements(date, replacements)` - Αποθήκευση αναπληρώσεων
- `getReplacements(date)` - Ανάκτηση αναπληρώσεων

## 🔐 Ασφάλεια

⚠️ **ΣΗΜΑΝΤΙΚΟ**: Τα API keys είναι ορατά στον κώδικα (normal για web apps).
Η ασφάλεια ελέγχεται από τα Firebase Rules στο console.

### Προτεινόμενα Rules για Realtime Database:

```json
{
  "rules": {
    "absences": {
      ".read": true,
      ".write": true
    },
    "replacements": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 📱 Firebase Console

Πρόσβαση: https://console.firebase.google.com/project/anaplirosis-v2

## 💡 Επόμενα Βήματα

1. Πρόσθεσε κουμπί "Αποθήκευση" στο MainWindow
2. Πρόσθεσε auto-save κάθε X λεπτά
3. Πρόσθεσε εμφάνιση "Τελευταία αποθήκευση: ..."
4. (Προαιρετικό) Πρόσθεσε Authentication για πολλαπλούς χρήστες

## 🆘 Troubleshooting

### Σφάλμα: "Permission denied"
→ Έλεγξε τα Rules στο Firebase Console

### Δεν αποθηκεύονται δεδομένα
→ Έλεγξε το console για errors
→ Βεβαιώσου ότι το path είναι σωστό

### Slow loading
→ Το Firebase Realtime Database είναι γρήγορο
→ Αν έχεις πρόβλημα, ελέγξε το network tab

