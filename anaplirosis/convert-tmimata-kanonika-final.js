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

    const entries = [];
    const lastNames = [];
    const firstNames = [];

    let j = i + 1;

    // Ανιχνεύουμε format
    let format = 1;
    let aaLineIndex = -1;

    // Αν βρούμε "A/A ΑΜ" στην ίδια γραμμή → Format 1
    let hasAAinSameLine = false;
    for (let k = j; k < Math.min(j + 30, lines.length); k++) {
      // Σταματάμε αν βρούμε το επόμενο section
      if (k > i && lines[k].includes('Τμήμα/Συνδιδασκαλία:')) break;

      if (lines[k].includes('A/A') && lines[k].includes('ΑΜ')) {
        hasAAinSameLine = true;
        format = 1;
        break;
      }
    }

    if (!hasAAinSameLine) {
      for (let k = j; k < Math.min(j + 30, lines.length); k++) {
        // Σταματάμε αν βρούμε το επόμενο section
        if (k > i && lines[k].includes('Τμήμα/Συνδιδασκαλία:')) break;

        if (lines[k] === 'A/A') {
          aaLineIndex = k;
          // Μετράμε πόσα μονά ψηφία ακολουθούν
          let singleDigitCount = 0;
          let m = k + 1;
          while (m < lines.length && lines[m] === '') m++;

          // Format 3: Πολλά μονά ψηφία σε ξεχωριστές γραμμές (1, 2, 3, ...)
          while (m < Math.min(m + 50, lines.length)) {
            if (/^\d{1,2}$/.test(lines[m])) {
              singleDigitCount++;
              m++;
              while (m < lines.length && lines[m] === '') m++;
            } else {
              break;
            }
          }

          if (singleDigitCount > 3) {
            format = 3;
            break;
          }

          // Format 2: Ένα ψηφίο, μετά "ΑΜ", μετά ΑΜ
          m = k + 1;
          while (m < lines.length && lines[m] === '') m++;
          if (m < lines.length && /^\d{1,2}$/.test(lines[m])) {
            format = 2;
            break;
          }
        }
      }
    }

    if (format === 1) {
      // FORMAT 1: "1 1286104 ΓΑΒΡΙΛΙΔΟΥ" (όλα στην ίδια γραμμή)
      while (j < lines.length && !lines[j].includes('Τμήμα/Συνδιδασκαλία:')) {
        const ln = lines[j];
        // Regex πιο ανεκτικό: ΑΜ μπορεί να έχει 4+ ψηφία και "…"
        if (/^\d{1,2}\s+[\d…]+\s+[Α-ΩΆ-Ώ]+/.test(ln)) {
          const parts = ln.split(/\s+/);
          entries.push({
            aa: parts[0],
            am: parts[1],
            lastName: parts.slice(2).join(' ')
          });
        }
        j++;
      }

      // Συλλογή ονομάτων
      j = i + 1;
      let collectingNames = false;
      while (j < lines.length &&
             !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
             firstNames.length < entries.length) {
        const ln = lines[j];
        if (collectingNames && ln.length > 0 && /^[Α-ΩΆ-Ώ\s]+$/.test(ln) && ln !== currentSection) {
          firstNames.push(ln);
        }
        if (entries.length > 0 && ln.includes(entries[entries.length - 1].lastName)) {
          collectingNames = true;
        }
        j++;
      }

    } else if (format === 2) {
      // FORMAT 2: A/A και ΑΜ σε ξεχωριστές γραμμές

      // Πρώτη εγγραφή
      while (j < lines.length && lines[j] !== 'A/A') j++;
      if (j < lines.length && lines[j] === 'A/A') {
        j++;
        let firstAA = '';
        let firstAM = '';
        let firstLastName = '';

        // A/A
        if (j < lines.length && /^\d{1,2}$/.test(lines[j])) {
          firstAA = lines[j];
          j++;
        }

        // ΑΜ
        while (j < lines.length && lines[j] !== 'ΑΜ') j++;
        if (j < lines.length && lines[j] === 'ΑΜ') {
          j++;
          if (j < lines.length && /^[\d…]+$/.test(lines[j])) {
            firstAM = lines[j];
            j++;
          }
        }

        // Επίθετο
        while (j < lines.length && lines[j] !== 'Επίθετο') j++;
        if (j < lines.length && lines[j] === 'Επίθετο') {
          j++;
          if (j < lines.length && /^[Α-ΩΆ-Ώ]+$/.test(lines[j])) {
            firstLastName = lines[j];
          }
        }

        if (firstAM && firstLastName) {
          entries.push({
            aa: firstAA,
            am: firstAM,
            lastName: firstLastName
          });
          lastNames.push(firstLastName);
        }
      }

      // Υπόλοιπες εγγραφές (μορφή: "2 6864")
      j = i + 1;
      while (j < lines.length && !lines[j].includes('Τμήμα/Συνδιδασκαλία:')) {
        const ln = lines[j];
        if (/^\d{1,2}\s+[\d…]+$/.test(ln)) {
          const parts = ln.split(/\s+/);
          entries.push({
            aa: parts[0],
            am: parts[1],
            lastName: ''
          });
        }
        j++;
      }

      // Συλλογή επιθέτων (για τις υπόλοιπες εγγραφές)
      j = i + 1;
      while (j < lines.length &&
             !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
             lastNames.length < entries.length) {
        const ln = lines[j];
        if (ln.length > 0 &&
            /^[Α-ΩΆ-Ώ]+$/.test(ln) &&
            ln !== 'Επίθετο' &&
            ln !== 'Όνομα' &&
            ln !== 'Τμήμα' &&
            !ln.includes('ΧΡΟΝΙΑ')) {
          lastNames.push(ln);
        }
        j++;
      }

      // Ενημέρωση επιθέτων στις εγγραφές
      for (let k = 0; k < entries.length && k < lastNames.length; k++) {
        if (!entries[k].lastName) {
          entries[k].lastName = lastNames[k];
        }
      }

      // Συλλογή ονομάτων
      // Μορφή Α: "ΧΑΡΑΛΑΜΠΙΑ Β1" (όνομα + τμήμα στην ίδια γραμμή)
      // Μορφή Β: "Όνομα" label, μετά το όνομα σε ξεχωριστή γραμμή
      j = i + 1;
      while (j < lines.length &&
             !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
             firstNames.length < entries.length) {
        const ln = lines[j];

        // Μορφή Β: Βρίσκουμε "Όνομα" label
        if (ln === 'Όνομα') {
          j++;
          while (j < lines.length && lines[j] === '') j++;
          if (j < lines.length && /^[Α-ΩΆ-Ώ\s]+$/.test(lines[j])) {
            firstNames.push(lines[j]);
          }
          j++;
          continue;
        }

        // Μορφή Α: όνομα + τμήμα στην ίδια γραμμή
        if (ln.includes(currentSection)) {
          const firstName = ln.replace(currentSection, '').trim();
          if (firstName && /^[Α-ΩΆ-Ώ\s]+$/.test(firstName)) {
            firstNames.push(firstName);
          }
        }
        j++;
      }

    } else if (format === 3) {
      // FORMAT 3: Όλα τα A/A μαζί, μετά όλα τα ΑΜ μαζί, μετά επίθετα, μετά ονόματα

      const aaList = [];
      const amList = [];

      // Συλλογή A/A
      j = aaLineIndex + 1;
      while (j < lines.length && lines[j] === '') j++;
      while (j < lines.length && /^\d{1,2}$/.test(lines[j])) {
        aaList.push(lines[j]);
        j++;
        while (j < lines.length && lines[j] === '') j++;
      }

      // Βρίσκουμε "ΑΜ"
      while (j < lines.length && lines[j] !== 'ΑΜ') j++;
      if (j < lines.length && lines[j] === 'ΑΜ') {
        j++;
        while (j < lines.length && lines[j] === '') j++;

        // Συλλογή ΑΜ
        while (j < lines.length && /^[\d…]+$/.test(lines[j])) {
          amList.push(lines[j]);
          j++;
          while (j < lines.length && lines[j] === '') j++;
        }
      }

      // Συλλογή επιθέτων
      while (j < lines.length &&
             !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
             lastNames.length < aaList.length) {
        const ln = lines[j];
        if (ln.length > 0 &&
            /^[Α-ΩΆ-Ώ]+$/.test(ln) &&
            ln !== 'Επίθετο' &&
            ln !== 'Όνομα' &&
            ln !== 'Τμήμα' &&
            !ln.includes('ΧΡΟΝΙΑ')) {
          lastNames.push(ln);
        }
        j++;
      }

      // Συλλογή ονομάτων (μορφή: "ΧΑΡΑΛΑΜΠΙΑ Β31")
      j = i + 1;
      while (j < lines.length &&
             !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
             firstNames.length < aaList.length) {
        const ln = lines[j];
        if (ln.includes(currentSection)) {
          const firstName = ln.replace(currentSection, '').trim();
          if (firstName && /^[Α-ΩΆ-Ώ\s]+$/.test(firstName)) {
            firstNames.push(firstName);
          }
        }
        j++;
      }

      // Δημιουργία entries
      for (let k = 0; k < aaList.length; k++) {
        entries.push({
          aa: aaList[k] || '',
          am: amList[k] || '',
          lastName: lastNames[k] || ''
        });
      }
    }

    // Συνδυασμός
    for (let k = 0; k < entries.length; k++) {
      students.push({
        'Τμήμα': currentSection,
        'Α/Α': entries[k].aa,
        'ΑΜ': entries[k].am,
        'Επίθετο': entries[k].lastName,
        'Όνομα': firstNames[k] || ''
      });
    }

    console.log(`📋 ${currentSection}: ${entries.length} μαθητές (Format ${format})`);

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
