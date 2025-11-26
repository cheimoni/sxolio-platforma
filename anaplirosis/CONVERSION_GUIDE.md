# Οδηγίες Μετατροπής HTML σε JSON

## Πρόβλημα που Διορθώθηκε

Τα HTML αρχεία περιείχαν δεδομένα σε πολλαπλά `<p>` tags με `<br/>` tags μέσα. Όταν χρησιμοποιούσαμε `.text()`, όλα τα δεδομένα (τμήμα, μάθημα, αίθουσα) σμίγονταν χωρίς κενά.

**Πριν:** `"Α32Αρχαία Ελληνικά (Α)B250"` ❌  
**Μετά:** `"Α32 Αρχαία Ελληνικά (Α) B250"` ✅

## Διορθωμένα Scripts

Όλα τα παρακάτω scripts έχουν διορθωθεί:
- ✅ `convert-teachers.js` - Για καθηγητές
- ✅ `convert-students.js` - Για μαθητές  
- ✅ `convert-classrooms.js` - Για αίθουσες
- ✅ `convert-schedule.js` - Γενικό
- ✅ `convert-all.js` - Για όλα μαζί (χρειάζεται master.html)

## Πώς να Τρέξετε τα Scripts

### Για Καθηγητές (από kathikitis/index.html)
```bash
node convert-teachers.js
```
Δημιουργεί: `public/teachers.json` και `src/teachers.json`

### Για Μαθητές
```bash
node convert-students.js
```
Δημιουργεί: `src/students.json`

### Για Αίθουσες
```bash
node convert-classrooms.js
```
Δημιουργεί: `src/classrooms.json`

## Τι Διορθώθηκε

Η αλλαγή ήταν στον τρόπο που εξάγουμε κείμενο από τα HTML cells:

```javascript
// ΠΡΙΝ - Λάθος
let cellText = $(cell).text().trim();
// Αποτέλεσμα: "Α32Αρχαία Ελληνικά (Α)B250"

// ΜΕΤΑ - Σωστό
$(cell).find('br').replaceWith(' ');  // Αντικατάσταση <br/> με κενό
const pTags = $(cell).find('p');
let cellText = pTags.map((idx, p) => $(p).text().trim()).get().join(' ');
// Αποτέλεσμα: "Α32 Αρχαία Ελληνικά (Α) B250"
```

## Σημαντικό

Κάθε φορά που ενημερώνετε τα HTML αρχεία, πρέπει να ξανατρέξετε τα conversion scripts για να ενημερώσετε τα JSON αρχεία!

