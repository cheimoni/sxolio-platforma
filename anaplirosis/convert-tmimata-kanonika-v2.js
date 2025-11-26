const fs = require('fs');

const txtContent = fs.readFileSync('./prokramata sxiliou/tmimata kanonika.txt', 'utf8');

const students = [];
const lines = txtContent.split('\n').map(l => l.trim());

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // Βρίσκουμε "Τμήμα/Συνδιδασκαλία:"
  if (line.includes('Τμήμα/Συνδιδασκαλία:')) {
    const match = line.match(/Τμήμα\/Συνδιδασκαλία:\s+(.+)/);
    if (!match) {
      i++;
      continue;
    }

    const currentSection = match[1].trim();
    console.log(`\n📋 Βρέθηκε: ${currentSection}`);

    const amList = [];
    const aaList = [];
    const lastNames = [];
    const firstNames = [];

    // Προχωράμε μέχρι να βρούμε το πρώτο ΑΜ
    let j = i + 1;
    let firstAM = '';
    let firstAA = '';

    // Φάση 1: Πρώτη εγγραφή (A/A, ΑΜ σε ξεχωριστές γραμμές)
    while (j < lines.length && !lines[j].includes('Τμήμα/Συνδιδασκαλία:')) {
      if (lines[j] === 'A/A') {
        // Το A/A είναι στην επόμενη γραμμή
        if (j + 1 < lines.length && /^\d{1,2}$/.test(lines[j + 1])) {
          firstAA = lines[j + 1];
          j += 2;

          // Βρίσκουμε το ΑΜ
          while (j < lines.length && lines[j] !== 'ΑΜ') j++;
          if (j < lines.length && lines[j] === 'ΑΜ') {
            j++;
            if (j < lines.length && /^\d{4,7}$/.test(lines[j])) {
              firstAM = lines[j];
              amList.push(firstAM);
              aaList.push(firstAA);
              break;
            }
          }
        }
      }
      j++;
    }

    // Φάση 2: Υπόλοιπες εγγραφές (μορφή "2 6864")
    j++;
    while (j < lines.length && /^\d{1,2}\s+\d{4,7}$/.test(lines[j])) {
      const parts = lines[j].split(/\s+/);
      aaList.push(parts[0]);
      amList.push(parts[1]);
      j++;
    }

    // Φάση 3: Επίθετα (κεφαλαία ελληνικά)
    while (j < lines.length &&
           !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
           lastNames.length < amList.length) {
      const ln = lines[j];
      if (ln.length > 0 &&
          /^[Α-ΩΆ-Ώ]+$/.test(ln) &&
          !ln.includes('ΧΡΟΝΙΑ') &&
          ln !== 'Επίθετο' &&
          ln !== 'Όνομα' &&
          ln !== 'Τμήμα') {
        lastNames.push(ln);
      }
      j++;
    }

    // Φάση 4: Ονόματα (με τμήμα στο τέλος, π.χ. "ΕΛΕΝΑ Β1" ή "ΧΑΡΑΛΑΜΠΙΑ Β1")
    j = i + 1;
    while (j < lines.length &&
           !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
           firstNames.length < amList.length) {
      const ln = lines[j];
      if (ln.includes(currentSection)) {
        const firstName = ln.replace(currentSection, '').trim();
        if (firstName && /^[Α-ΩΆ-Ώ\s]+$/.test(firstName)) {
          firstNames.push(firstName);
        }
      }
      j++;
    }

    // Συνδυασμός δεδομένων
    for (let k = 0; k < amList.length; k++) {
      students.push({
        'Τμήμα': currentSection,
        'Α/Α': aaList[k] || '',
        'ΑΜ': amList[k] || '',
        'Επίθετο': lastNames[k] || '',
        'Όνομα': firstNames[k] || ''
      });
    }

    console.log(`   → ${amList.length} μαθητές`);

    // Βρίσκουμε το επόμενο section
    i = j;
  } else {
    i++;
  }
}

console.log(`\n📊 Σύνολο μαθητών: ${students.length}`);

// Στατιστικά ανά τμήμα
const byClass = {};
students.forEach(s => {
  const cls = s['Τμήμα'];
  if (!byClass[cls]) byClass[cls] = 0;
  byClass[cls]++;
});

console.log('\n📈 Μαθητές ανά τμήμα:');
Object.entries(byClass)
  .sort((a, b) => a[0].localeCompare(b[0], 'el'))
  .forEach(([cls, count]) => {
    console.log(`  ${cls}: ${count} μαθητές`);
  });

// Αποθήκευση
fs.writeFileSync(
  './public/students-kanonika.json',
  JSON.stringify(students, null, 2),
  'utf8'
);
console.log('\n✅ Αποθηκεύτηκε: students-kanonika.json');
