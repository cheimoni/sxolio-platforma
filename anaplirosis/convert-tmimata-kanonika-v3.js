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
    const firstNames = [];

    // Φάση 1: Συλλογή εγγραφών (μορφή: "1 1286104 ΓΑΒΡΙΛΙΔΟΥ")
    let j = i + 1;
    while (j < lines.length && !lines[j].includes('Τμήμα/Συνδιδασκαλία:')) {
      const ln = lines[j];

      // Εγγραφή: αριθμός + ΑΜ (4-7 ψηφία) + Επίθετο
      if (/^\d{1,2}\s+\d{4,7}\s+[Α-ΩΆ-Ώ]+/.test(ln)) {
        const parts = ln.split(/\s+/);
        const aa = parts[0];
        const am = parts[1];
        const lastName = parts.slice(2).join(' ');

        entries.push({
          aa: aa,
          am: am,
          lastName: lastName
        });
      }
      j++;
    }

    // Φάση 2: Συλλογή ονομάτων (μετά τις εγγραφές)
    j = i + 1;
    let collectingNames = false;
    while (j < lines.length &&
           !lines[j].includes('Τμήμα/Συνδιδασκαλία:') &&
           firstNames.length < entries.length) {
      const ln = lines[j];

      // Τα ονόματα αρχίζουν μετά τις εγγραφές
      if (collectingNames && ln.length > 0 && /^[Α-ΩΆ-Ώ\s]+$/.test(ln) && ln !== currentSection) {
        firstNames.push(ln);
      }

      // Ξεκινάμε τη συλλογή ονομάτων όταν βρούμε την τελευταία εγγραφή
      if (entries.length > 0 && ln.includes(entries[entries.length - 1].lastName)) {
        collectingNames = true;
      }

      j++;
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

    console.log(`📋 ${currentSection}: ${entries.length} μαθητές`);

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
