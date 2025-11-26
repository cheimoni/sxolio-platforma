# 📂 OneDrive Setup - Πλήρης Οδηγός

## 🎯 Γιατί OneDrive;

- ✅ **ΖΕΡΟϵντολές** - Αυτόματο sync
- ✅ **Backup** - Τα πάντα στο cloud
- ✅ **Πρόσβαση παντού** - Σπίτι, σχολείο, κινητό
- ✅ **Απλό** - Copy-paste και δουλεύει
- ✅ **Δωρεάν** - 5GB με Microsoft account

---

## 🚀 Βήμα 1: Μετακίνηση Project στο OneDrive

### Τρόπος 1: Copy το Folder (Ασφαλέστερο)

1. **Άνοιξε το OneDrive folder:**
   ```
   C:\Users\NUC\OneDrive\
   ```

2. **Δημιούργησε folder για projects:**
   ```
   C:\Users\NUC\OneDrive\Projects\
   ```

3. **Copy ολόκληρο το project:**
   - Πήγαινε: `C:\Users\NUC\Desktop\sxolio platforma`
   - Πάτα **Ctrl+C** (copy)
   - Πήγαινε: `C:\Users\NUC\OneDrive\Projects\`
   - Πάτα **Ctrl+V** (paste)

4. **Περίμενε το sync** (2-5 λεπτά)
   - Δες το OneDrive icon στο taskbar
   - Όταν δεις ✅ = Done!

5. **Τέστ:**
   - Άνοιξε το project από το OneDrive location
   - Κάνε ένα μικρό edit
   - Περίμενε sync (βλέπεις το icon)
   - ✅ Έτοιμο!

---

## 🏫 Βήμα 2: Στο Σχολείο (1η Φορά)

### Όταν πας σχολείο:

1. **Κάνε login στο OneDrive:**
   - Άνοιξε browser
   - Πήγαινε: https://onedrive.live.com
   - Login με το Microsoft account σου

2. **Δύο τρόποι να δουλέψεις:**

#### Τρόπος Α: Download to PC (Πιο γρήγορο)
```
1. Βρες το folder "Projects/sxolio platforma"
2. Δεξί κλικ → Download
3. Unzip στο Desktop
4. Δούλεψε κανονικά
5. Όταν τελειώσεις:
   - Επιλέξε όλα τα αρχεία
   - Drag & drop στο OneDrive.com
   - Overwrite existing files
```

#### Τρόπος Β: Εγκατάσταση OneDrive (Μόνο 1 φορά)
```
1. Download OneDrive app:
   https://www.microsoft.com/en-us/microsoft-365/onedrive/download

2. Εγκατάσταση & Login

3. Sync το folder

4. Δούλεψε κανονικά από:
   C:\Users\[Username]\OneDrive\Projects\sxolio platforma
```

---

## 📝 Καθημερινή Χρήση

### Στο Σπίτι:

```
1. Άνοιξε το project:
   C:\Users\NUC\OneDrive\Projects\sxolio platforma\

2. Δούλεψε κανονικά

3. Όταν τελειώσεις:
   - Κλείσε τα αρχεία
   - Περίμενε 10 δευτερόλεπτα (auto sync)
   - Βλέπεις ✅ στο OneDrive icon? = Done!
```

### Στο Σχολείο:

```
Τρόπος Α (Browser):
1. Πήγαινε: onedrive.live.com
2. Άνοιξε το project
3. Edit online ΄Η download
4. Upload όταν τελειώσεις

Τρόπος Β (Desktop App - αν το έχεις):
1. Περίμενε 20 δευτερόλεπτα (auto sync)
2. Άνοιξε το project
3. Δούλεψε κανονικά
4. Κλείσε - auto sync
```

---

## ⚠️ Προσοχές

### ✅ ΝΑΙ:
- Περίμενε το sync πριν κλείσεις τον υπολογιστή
- Έλεγξε το ✅ icon στο taskbar
- Κράτα backup σε USB μία φορά τη βδομάδα

### ❌ ΟΧΙ:
- ΜΗΝ δουλέψεις ταυτόχρονα από 2 PCs (θα γίνει conflict)
- ΜΗΝ κλείσεις τον PC ενώ γίνεται sync
- ΜΗΝ διαγράψεις το original (κράτα backup)

---

## 🔒 Ασφάλεια API Keys

**ΣΗΜΑΝΤΙΚΟ:** Τα API keys θα πάνε στο OneDrive!

### Αν θέλεις ΜΕΓΙΣΤΗ ασφάλεια:

1. **Δημιούργησε `.onedriveignore` file** (δεν υποστηρίζεται ακόμα)

2. **Χρησιμοποίησε δύο folders:**
   ```
   OneDrive\Projects\sxolio-platforma\        ← Όλα εκτός secrets
   Desktop\platforma-secrets\                  ← Μόνο .env.local & firebase.js
   ```

3. **Ή απλά μην ανησυχείς:**
   - Το OneDrive account σου είναι ιδιωτικό
   - Κανείς άλλος δεν έχει πρόσβαση
   - Τα API keys είναι restricted (μόνο δικό σου domain)

---

## 🆚 OneDrive vs Git

| Feature | OneDrive | Git/GitHub |
|---------|----------|------------|
| **Ευκολία** | ⭐⭐⭐⭐⭐ Zero commands | ⭐⭐⭐ Χρειάζεται commands |
| **Auto Sync** | ✅ Αυτόματο | ❌ Manual (pull/push) |
| **Backup** | ✅ Cloud | ✅ Cloud |
| **Version History** | ✅ 30 days | ✅ Πλήρες history |
| **Offline Work** | ✅ Ναι | ✅ Ναι |
| **Conflicts** | ⚠️ Manual fix | ✅ Merge tools |
| **Συνεργασία** | ⚠️ Limited | ✅ Excellent |

---

## 🎯 Best Practice - Υβριδική Λύση

### Συνιστώμενο Setup:

```
1. ΚΥΡΙΟ: OneDrive
   - Καθημερινή δουλειά
   - Auto sync
   - Easy access

2. BACKUP: USB (1x/week)
   - Copy ολόκληρο το folder
   - Κράτα 2-3 versions

3. OPTIONAL: Git/GitHub (αν μάθεις αργότερα)
   - Version control
   - Professional workflow
```

---

## 📱 Bonus: Mobile Access

Κατέβασε το OneDrive app στο κινητό:
- iOS: https://apps.apple.com/app/microsoft-onedrive/id477537958
- Android: https://play.google.com/store/apps/details?id=com.microsoft.skydrive

Τώρα μπορείς να δεις/edit τα αρχεία σου από ΠΑΝΤΟΥ! 🚀

---

## 🆘 Troubleshooting

### Δεν syncs;
1. Έλεγξε internet connection
2. Κλικ το OneDrive icon → Settings → Account
3. Verify που είσαι logged in
4. Restart OneDrive

### Conflict detected?
1. OneDrive θα δημιουργήσει 2 versions
2. Άνοιξε και τις δύο
3. Κράτα τη σωστή έκδοση
4. Διέγραψε την άλλη

### Μου τελείωσε ο χώρος (5GB);
1. Καθάρισε παλιά αρχεία
2. Upgrade σε Microsoft 365 (100GB, €2/month)
3. Χρησιμοποίησε Google Drive επιπλέον (15GB free)

---

## ✅ Checklist Setup

- [ ] OneDrive εγκατεστημένο & logged in
- [ ] Project copied στο OneDrive\Projects\
- [ ] Test sync (edit + wait + check ✅)
- [ ] Σχολείο: Test login στο onedrive.live.com
- [ ] USB backup δημιουργημένο
- [ ] Διάβασε τις "Προσοχές"

---

**Όλα έτοιμα! Τώρα δουλεύεις απλά και ασφαλώς! 🎉**
