const fs = require('fs');

const txtContent = fs.readFileSync('./prokramata sxiliou/tmimata kanonika.txt', 'utf8');

const students = [];
const lines = txtContent.split('\n');

let currentSection = null;
let currentStudents = [];
let lastNames = [];
let firstNames = [];
let amList = [];
let aaList = [];
let phase = 'init'; // 'init', 'am', 'lastnames', 'firstnames'

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Βρίσκουμε "Τμήμα/Συνδιδασκαλία:"
  if (line.includes('Τμήμα/Συνδιδασκαλία:')) {
    // Αποθηκεύουμε προηγούμενο section
    if (currentSection && amList.length > 0) {
      // Συνδυάζουμε όλα τα δεδομένα
      for (let j = 0; j < amList.length; j++) {
        students.push({
          'Τμήμα': currentSection,
          'Α/Α': aaList[j] || '',
          'ΑΜ': amList[j] || '',
          'Επίθετο': lastNames[j] || '',
          'Όνομα': firstNames[j] || ''
        });
      }
    }

    // Νέο section
    const match = line.match(/Τμήμα\/Συνδιδασκαλία:\s+(.+)/);
    if (match) {
      currentSection = match[1].trim();
      currentStudents = [];
      lastNames = [];
      firstNames = [];
      amList = [];
      aaList = [];
      phase = 'init';
      console.log(`\n📋 Βρέθηκε: ${currentSection}`);
    }
    continue;
  }

  if (!currentSection) continue;

  // Πρώτη εγγραφή με πλήρη δομή
  if (phase === 'init' && line.match(/^[Α-ΩΆ-Ώ]+$/) && lines[i-1] && lines[i-1].trim() === 'Επίθετο') {
    // Βρήκαμε το πρώτο επίθετο
    const firstLastName = line;
    // Το επόμενο line είναι το πρώτο όνομα
    const firstFirstName = lines[i+1] ? lines[i+1].trim() : '';

    // Βρίσκουμε το ΑΜ (πίσω στις γραμμές)
    let firstAM = '';
    let firstAA = '';
    for (let k = i - 1; k >= Math.max(0, i - 10); k--) {
      if (/^\d{4,7}$/.test(lines[k].trim())) {
        firstAM = lines[k].trim();
        // Το Α/Α είναι πάνω από το ΑΜ
        for (let m = k - 1; m >= Math.max(0, k - 5); m--) {
          if (/^\d{1,2}$/.test(lines[m].trim())) {
            firstAA = lines[m].trim();
            break;
          }
        }
        break;
      }
    }

    if (firstAM) {
      amList.push(firstAM);
      aaList.push(firstAA);
      lastNames.push(firstLastName);
      firstNames.push(firstFirstName);
    }

    phase = 'am';
    continue;
  }

  // Συλλογή ΑΜ (μορφή: "2 6864" ή "10 6858")
  if (phase === 'am' && /^\d{1,2}\s+\d{4,7}$/.test(line)) {
    const parts = line.split(/\s+/);
    aaList.push(parts[0]);
    amList.push(parts[1]);
    continue;
  }

  // Μετάβαση σε lastnames όταν βλέπουμε επιθετα (μετά τα ΑΜ)
  if (phase === 'am' && /^[Α-ΩΆ-Ώ]+$/.test(line) && line.length > 2 && !line.includes('ΧΡΟΝΙΑ')) {
    phase = 'lastnames';
    lastNames.push(line);
    continue;
  }

  // Συλλογή επιθέτων
  if (phase === 'lastnames' && /^[Α-ΩΆ-Ώ]+$/.test(line) && line.length > 2) {
    lastNames.push(line);

    // Αν έχουμε όλα τα επίθετα, περιμένουμε ονόματα
    if (lastNames.length === amList.length) {
      phase = 'firstnames';
    }
    continue;
  }

  // Συλλογή ονομάτων (μορφή: "ΧΑΡΑΛΑΜΠΙΑ Β1" ή "ΜΑΡΙΟΣ ΑΝΤΩΝΙΟΣ Β1")
  if ((phase === 'lastnames' || phase === 'firstnames') && line.includes(currentSection)) {
    const firstName = line.replace(currentSection, '').trim();
    if (firstName && /^[Α-ΩΆ-Ώ\s]+$/.test(firstName)) {
      firstNames.push(firstName);

      if (firstNames.length === amList.length) {
        phase = 'done';
      }
    }
    continue;
  }
}

// Αποθηκεύουμε τελευταίο section
if (currentSection && amList.length > 0) {
  for (let j = 0; j < amList.length; j++) {
    students.push({
      'Τμήμα': currentSection,
      'Α/Α': aaList[j] || '',
      'ΑΜ': amList[j] || '',
      'Επίθετο': lastNames[j] || '',
      'Όνομα': firstNames[j] || ''
    });
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
