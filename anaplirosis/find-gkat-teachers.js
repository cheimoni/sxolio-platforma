// find-gkat-teachers.js
// Εύρεση καθηγητών που διδάσκουν "Γκατ_1" και των τμημάτων τους

const fs = require('fs');

const teachersFile = './src/teachers.json';
const teachers = JSON.parse(fs.readFileSync(teachersFile, 'utf8'));

const gkatTeachers = [];

teachers.forEach(teacher => {
  const teacherName = teacher.καθηγητής;
  const schedule = teacher.πρόγραμμα;
  if (!schedule) return;

  Object.entries(schedule).forEach(([day, periods]) => {
    if (!periods) return;

    Object.entries(periods).forEach(([period, subject]) => {
      if (!subject || subject === '-' || subject === null) return;

      // Ελέγχουμε αν το subject περιέχει "Γκατ_1"
      if (subject.includes('Γκατ_1') || subject.includes('ΓΚΑΤ_1')) {
        // Εξάγουμε το τμήμα από παρενθέσεις (π.χ. "(Γ)" από "Γκατ_1 ΕΜΠ_κατ (Γ)")
        const classMatch = subject.match(/\(([ΑΒΓ][0-9]*)\)/);
        const classInParens = classMatch ? classMatch[1] : null;
        
        // Εξάγουμε και το πλήρες όνομα (π.χ. "ΑΡΧ_4_κατ" από "Γκατ_1 ΑΡΧ_4_κατ")
        const fullMatch = subject.match(/Γκατ_\d+\s+([Α-Ω_]+)/);
        const fullName = fullMatch ? fullMatch[1] : null;

        gkatTeachers.push({
          teacher: teacherName,
          day: day,
          period: period,
          subject: subject,
          classInParens: classInParens,
          fullName: fullName
        });
      }
    });
  });
});

console.log(`📊 Βρέθηκαν ${gkatTeachers.length} εγγραφές με "Γκατ_1":\n`);

gkatTeachers.forEach((entry, i) => {
  console.log(`${i+1}. Καθηγητής: ${entry.teacher}`);
  console.log(`   Ημέρα/Περίοδος: ${entry.day} / ${entry.period}`);
  console.log(`   Subject: ${entry.subject}`);
  console.log(`   Τμήμα σε παρενθέσεις: ${entry.classInParens || 'Δεν βρέθηκε'}`);
  console.log(`   Πλήρες όνομα: ${entry.fullName || 'Δεν βρέθηκε'}`);
  console.log('');
});

// Ομαδοποίηση ανά καθηγητή
const teachersMap = new Map();
gkatTeachers.forEach(entry => {
  if (!teachersMap.has(entry.teacher)) {
    teachersMap.set(entry.teacher, []);
  }
  teachersMap.get(entry.teacher).push(entry);
});

console.log(`\n📋 Ομαδοποίηση ανά καθηγητή:\n`);
teachersMap.forEach((entries, teacher) => {
  const uniqueClasses = [...new Set(entries.map(e => e.classInParens).filter(Boolean))];
  console.log(`${teacher}:`);
  console.log(`   Εγγραφές: ${entries.length}`);
  console.log(`   Τμήματα: ${uniqueClasses.join(', ') || 'Δεν βρέθηκαν'}`);
  console.log('');
});

// Αποθήκευση αποτελεσμάτων
const result = {
  totalEntries: gkatTeachers.length,
  entries: gkatTeachers,
  teachersSummary: Array.from(teachersMap.entries()).map(([teacher, entries]) => ({
    teacher: teacher,
    entriesCount: entries.length,
    classes: [...new Set(entries.map(e => e.classInParens).filter(Boolean))],
    fullNames: [...new Set(entries.map(e => e.fullName).filter(Boolean))]
  }))
};

fs.writeFileSync('./gkat-teachers-analysis.json', JSON.stringify(result, null, 2), 'utf8');
console.log('✅ Αποθηκεύτηκε ανάλυση στο gkat-teachers-analysis.json');

