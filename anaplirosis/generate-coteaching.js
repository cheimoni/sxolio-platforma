// Script για αυτόματη εύρεση συνδιδασκαλιών από το teachers.json
const fs = require('fs');
const path = require('path');

// Φόρτωση teachers.json
const teachersData = JSON.parse(fs.readFileSync('./src/teachers.json', 'utf8'));

// Αποθήκευση συνδιδασκαλιών
const coteachingMap = new Map();

// Για κάθε καθηγητή
teachersData.forEach(teacher => {
  const teacherName = teacher.καθηγητής;
  const schedule = teacher.πρόγραμμα;

  if (!schedule) return;

  // Για κάθε ημέρα
  Object.entries(schedule).forEach(([day, periods]) => {
    if (!periods) return;

    // Για κάθε περίοδο
    Object.entries(periods).forEach(([period, subject]) => {
      if (!subject || subject === '-' || subject === null) return;

      // Εξαγωγή ΟΛΩΝ των τμημάτων από το subject
      // Για Γυμ. που έχει πολλά τμήματα (π.χ. "ΓυμΒ11+Β21+Β22...")
      // Για κανονικά μαθήματα (π.χ. "Α21_ΦΤ_ΤΣχεδ...")
      let classNames = [];

      // Έλεγχος για Γυμναστική με πολλαπλά τμήματα
      if (subject.startsWith('Γυμ')) {
        const gymMatch = subject.match(/Γυμ([ΑΒΓ\d\+]+)/);
        if (gymMatch) {
          const classesStr = gymMatch[1];
          // Χωρίζουμε τα τμήματα με +
          classNames = classesStr.split('+').map(c => c.trim());
        }
      } else {
        // Κανονικό μάθημα - εξαγωγή του τμήματος
        const classMatch = subject.match(/^([ΑΒΓ]\d{2})/);
        if (classMatch) {
          classNames = [classMatch[1]];
        }
      }

      // Για κάθε τμήμα που βρήκαμε, προσθέτουμε τον καθηγητή
      classNames.forEach(className => {
        // Δημιουργία κλειδιού: Ημέρα_Περίοδος_Τμήμα
        const key = `${day}_${period}_${className}`;

        if (!coteachingMap.has(key)) {
          coteachingMap.set(key, {
            day,
            period,
            class: className,
            teachers: [],
            subjects: []
          });
        }

        const entry = coteachingMap.get(key);
        // Αποφυγή διπλοεγγραφών
        if (!entry.teachers.includes(teacherName)) {
          entry.teachers.push(teacherName);
          entry.subjects.push(subject);
        }
      });
    });
  });
});

// Φιλτράρισμα - κρατάμε μόνο όσα έχουν 2+ καθηγητές (συνδιδασκαλία)
const coteachingPairs = [];

coteachingMap.forEach((entry, key) => {
  if (entry.teachers.length >= 2) {
    coteachingPairs.push({
      teachers: entry.teachers,
      class: entry.class,
      day: entry.day,
      period: entry.period,
      subjects: entry.subjects
    });
  }
});

// Ταξινόμηση κατά ημέρα, περίοδο, τμήμα
const dayOrder = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];
coteachingPairs.sort((a, b) => {
  const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  if (dayDiff !== 0) return dayDiff;

  const periodDiff = parseInt(a.period) - parseInt(b.period);
  if (periodDiff !== 0) return periodDiff;

  return a.class.localeCompare(b.class);
});

console.log(`\n🔍 Βρέθηκαν ${coteachingPairs.length} συνδιδασκαλίες:\n`);

coteachingPairs.forEach((pair, index) => {
  console.log(`${index + 1}. ${pair.day}, ${pair.period}η περίοδος - Τμήμα ${pair.class}`);
  console.log(`   Καθηγητές: ${pair.teachers.join(' + ')}`);
  console.log(`   Μαθήματα: ${pair.subjects.join(' | ')}`);
  console.log('');
});

// Δημιουργία του JavaScript αρχείου
const jsContent = `// Λίστα με τα ζευγάρια συνδιδασκαλίας
// Αυτόματα δημιουργημένο από generate-coteaching.js
// Format: { teachers: ['ΟΝΟΜΑ1', 'ΟΝΟΜΑ2'], class: 'Τμήμα', day: 'Ημέρα', period: 'Περίοδος' }

export const coteachingPairs = ${JSON.stringify(coteachingPairs, null, 2)};

/**
 * Ελέγχει αν δύο καθηγητές έχουν συνδιδασκαλία μια συγκεκριμένη ημέρα και περίοδο
 * @param {string} teacher1 - Όνομα πρώτου καθηγητή
 * @param {string} teacher2 - Όνομα δεύτερου καθηγητή
 * @param {string} day - Ημέρα (π.χ. 'Δευτέρα')
 * @param {string} period - Περίοδος (π.χ. '3')
 * @returns {boolean} - true αν έχουν συνδιδασκαλία, false αλλιώς
 */
export const hasCoteaching = (teacher1, teacher2, day, period) => {
  const t1 = teacher1.toUpperCase().trim();
  const t2 = teacher2.toUpperCase().trim();

  return coteachingPairs.some(pair => {
    // Έλεγχος αν οι δύο καθηγητές είναι στο ίδιο ζευγάρι
    const hasTeachers = pair.teachers.some(t => t.toUpperCase().trim() === t1) &&
                        pair.teachers.some(t => t.toUpperCase().trim() === t2);

    // Έλεγχος αν ταιριάζει η ημέρα και η περίοδος
    const matchesDayPeriod = pair.day === day && pair.period === period;

    return hasTeachers && matchesDayPeriod;
  });
};

/**
 * Επιστρέφει όλες τις συνδιδασκαλίες ενός καθηγητή
 * @param {string} teacherName - Όνομα καθηγητή
 * @returns {Array} - Λίστα με τις συνδιδασκαλίες του καθηγητή
 */
export const getCoteachingsForTeacher = (teacherName) => {
  const name = teacherName.toUpperCase().trim();

  return coteachingPairs.filter(pair =>
    pair.teachers.some(t => t.toUpperCase().trim() === name)
  );
};
`;

// Αποθήκευση
fs.writeFileSync('./src/data/coteachingPairs.js', jsContent, 'utf8');

console.log('✅ Το αρχείο src/data/coteachingPairs.js δημιουργήθηκε επιτυχώς!');
console.log(`📊 Σύνολο συνδιδασκαλιών: ${coteachingPairs.length}`);
