# Οδηγός Git/GitHub - Εργασία από 2 Τοποθεσίες

## Σενάριο
Θέλεις να δουλεύεις το ίδιο project από το **σχολείο** και από το **σπίτι**.

## Λύση: Git + GitHub

### Βήμα 1: Εγκατάσταση Git (αν δεν το έχεις)
1. Κατέβασε το Git: https://git-scm.com/download/win
2. Εγκατάστησε το (default options είναι OK)

### Βήμα 2: Ρύθμιση Git (μόνο 1 φορά)
```bash
git config --global user.name "Το Όνομα σου"
git config --global user.email "το-email-σου@example.com"
```

### Βήμα 3: Δημιουργία GitHub Repository

1. Πήγαινε στο https://github.com
2. Κάνε login (ή δημιούργησε account)
3. Κάνε κλικ στο **"+"** → **"New repository"**
4. Όνομα repository: `sxolio-platforma` (ή ό,τι θέλεις)
5. **ΜΗΝ** επιλέξεις "Initialize with README"
6. Κάνε κλικ **"Create repository"**

### Βήμα 4: Αρχικοποίηση στο Σπίτι (1η φορά)

Ανοίγεις PowerShell στο φάκελο του project:
```bash
cd "C:\Users\NUC\Desktop\sxolio platforma"

# Αρχικοποίηση Git
git init

# Προσθήκη όλων των αρχείων
git add .

# Πρώτο commit
git commit -m "Initial commit - School Platform"

# Σύνδεση με GitHub (αντικατέστησε USERNAME με το GitHub username σου)
git remote add origin https://github.com/USERNAME/sxolio-platforma.git

# Ανώτερο branch (main)
git branch -M main

# Αποστολή στο GitHub
git push -u origin main
```

### Βήμα 5: Εργασία από το Σπίτι

**Όταν τελειώνεις δουλειά:**
```bash
cd "C:\Users\NUC\Desktop\sxolio platforma"
git add .
git commit -m "Περιγραφή των αλλαγών"
git push
```

### Βήμα 6: Εργασία από το Σχολείο (1η φορά)

**Κατέβασε το project:**
```bash
cd "C:\Users\NUC\Desktop"  # ή όπου θέλεις
git clone https://github.com/USERNAME/sxolio-platforma.git
cd sxolio-platforma
```

**Όταν τελειώνεις δουλειά:**
```bash
git add .
git commit -m "Περιγραφή των αλλαγών"
git push
```

### Βήμα 7: Εργασία από το Σχολείο (κάθε φορά)

**Πριν αρχίσεις να δουλεύεις:**
```bash
cd "C:\Users\NUC\Desktop\sxolio-platforma"
git pull
```

**Όταν τελειώνεις:**
```bash
git add .
git commit -m "Περιγραφή των αλλαγών"
git push
```

## Βασικές Εντολές

| Εντολή | Τι κάνει |
|--------|----------|
| `git status` | Δείχνει ποια αρχεία άλλαξαν |
| `git pull` | Κατεβάζει τις τελευταίες αλλαγές από GitHub |
| `git add .` | Προσθέτει όλα τα αλλαγμένα αρχεία |
| `git commit -m "μήνυμα"` | Αποθηκεύει τις αλλαγές με μήνυμα |
| `git push` | Στέλνει τις αλλαγές στο GitHub |

## Προσοχή!

**Πάντα πριν αρχίσεις να δουλεύεις:**
```bash
git pull
```

**Πάντα όταν τελειώνεις:**
```bash
git add .
git commit -m "τι έκανες"
git push
```

## Αν υπάρξει Conflict

Αν δύο άτομα (ή εσύ από 2 υπολογιστές) αλλάξουν το ίδιο αρχείο:
1. Git θα σου πει ότι υπάρχει conflict
2. Άνοιξε το αρχείο - θα δεις σημάδια `<<<<<<<`, `=======`, `>>>>>>>`
3. Διόρθωσε το αρχείο (άφησε μόνο τον σωστό κώδικα)
4. Κάνε `git add .` και `git commit -m "Fixed conflict"`

## Εναλλακτική: OneDrive/Google Drive

Αν προτιμάς απλούστερη λύση:
- Βάλε το φάκελο στο OneDrive ή Google Drive
- Το Drive θα συγχρονίσει αυτόματα
- **Προσοχή:** Μπορεί να υπάρξουν conflicts αν ανοίξεις από 2 υπολογιστές ταυτόχρονα

## Προτεινόμενη Λύση: Git + GitHub ✅

- Καλύτερος έλεγχος εκδόσεων
- Ιστορικό αλλαγών
- Backup αυτόματα
- Δουλεύει από παντού

