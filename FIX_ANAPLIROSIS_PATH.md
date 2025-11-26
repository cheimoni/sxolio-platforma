# 🔧 Διόρθωση Path για Anaplirosis

## Πρόβλημα
Το React build του Anaplirosis χρησιμοποιεί absolute paths (`/static/js/...`) που δεν λειτουργούν όταν φορτώνεται μέσα σε iframe με relative path.

## Λύση

### Βήμα 1: Προσθήκη homepage στο package.json
✅ **Έγινε αυτόματα** - Προστέθηκε `"homepage": "."` στο `anaplirosis/package.json`

### Βήμα 2: Rebuild το Anaplirosis
```bash
cd anaplirosis
npm run build
```

Αυτό θα δημιουργήσει ένα νέο build με relative paths που θα λειτουργεί μέσα στο iframe.

### Βήμα 3: Ελέγξτε το path
Το iframe χρησιμοποιεί το path: `../anaplirosis/build/index.html`

Αν δεν λειτουργεί, δοκιμάστε:
- `./anaplirosis/build/index.html`
- `../../anaplirosis/build/index.html`

## Τι εμφανίζεται

Στο "Προηγμένο Σύστημα Αναπληρώσεων" θα πρέπει να εμφανίζεται:

1. **Header** με:
   - Κουμπί "← Απλή Προβολή"
   - Τίτλος "🎯 Προηγμένο Σύστημα Αναπληρώσεων"
   - Κουμπιά για νέο παράθυρο και fullscreen

2. **Anaplirosis React App** (μέσα σε iframe) με:
   - Λίστα καθηγητών (αριστερά)
   - Κύριο παράθυρο με ωράρια
   - Προβολή διαθεσιμότητας
   - Σύστημα αναπληρώσεων
   - Date selector
   - Theme selector

## Αν δεν φορτώνει

1. Ελέγξτε το browser console για errors
2. Βεβαιωθείτε ότι έτρεξατε `npm run build` στο anaplirosis folder
3. Ελέγξτε ότι το `anaplirosis/build/index.html` υπάρχει
4. Δοκιμάστε να ανοίξετε το `anaplirosis/build/index.html` απευθείας στον browser

## Debugging

Ανοίξτε το browser console (F12) και δείτε:
- Αν το iframe φορτώνει
- Αν υπάρχουν CORS errors
- Αν τα assets (JS/CSS) φορτώνουν

