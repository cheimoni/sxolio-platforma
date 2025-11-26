# Εντολές για Push στο GitHub

Αφού δημιουργήσεις το repository στο GitHub, εκτέλεσε αυτές τις εντολές:

```bash
cd "C:\Users\NUC\Desktop\sxolio platforma"

# Σύνδεση με GitHub (αντικατέστησε cheimoni με το GitHub username σου)
git remote add origin https://github.com/cheimoni/sxolio-platforma.git

# Αλλαγή branch σε main
git branch -M main

# Αποστολή στο GitHub
git push -u origin main
```

**Σημείωση:** Αν το GitHub username σου δεν είναι "cheimoni", άλλαξε το στην πρώτη εντολή.

**Αν ζητήσει username/password:**
- Username: το GitHub username σου
- Password: ΔΕΝ χρησιμοποιείς το password σου! Χρειάζεσαι Personal Access Token
  - Πήγαινε: https://github.com/settings/tokens
  - Κάνε "Generate new token (classic)"
  - Επέλεξε scope: "repo"
  - Χρησιμοποίησε το token ως password

