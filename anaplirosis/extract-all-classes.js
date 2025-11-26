const fs = require('fs');

// Load teachers data
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

// Sets to collect classes
const regularClasses = new Set();
const supportClasses = new Set(); // Στήριξη (Στ.Ο.X)

console.log('Extracting all classes from teachers schedules...\n');

teachers.forEach(teacher => {
  const teacherName = teacher['καθηγητής'];
  const programa = teacher['πρόγραμμα'];

  if (!programa) return;

  days.forEach(day => {
    const daySchedule = programa[day];
    if (!daySchedule) return;

    for (let period = 1; period <= 8; period++) {
      const subject = daySchedule[period.toString()];
      if (!subject || subject === '***' || subject.trim() === '-') continue;

      const subjectUpper = subject.toUpperCase().trim();

      // Extract support classes (Στ.Ο.X)
      // Pattern: "Στ.Ο.4 (Γ1)" or "Στ. 13 (Β1)"
      const supportMatch = subject.match(/^(Στ\.?\s*Ο?\.?\s*[0-9]+)\s*\(([ΑΒΓ][0-9]+)\)/);
      if (supportMatch) {
        const fullClassName = `${supportMatch[1]} (${supportMatch[2]})`;
        supportClasses.add(fullClassName);
        continue;
      }

      // Extract regular classes (Α11, Β51, Γ1, etc.)
      const classMatches = subject.match(/([ΑΒΓ][0-9]{1,2})(?:[^0-9]|$)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          const className = match.match(/([ΑΒΓ][0-9]{1,2})/)[1];
          regularClasses.add(className);
        });
      }
    }
  });
});

console.log(`✅ Regular classes found: ${regularClasses.size}`);
console.log(Array.from(regularClasses).sort((a,b) => a.localeCompare(b, 'el')).join(', '));

console.log(`\n✅ Support classes found: ${supportClasses.size}`);
Array.from(supportClasses).sort((a,b) => a.localeCompare(b, 'el')).forEach(cls => {
  console.log(`  - ${cls}`);
});

// Save to JSON
const allClasses = {
  regular: Array.from(regularClasses).sort((a,b) => a.localeCompare(b, 'el')),
  support: Array.from(supportClasses).sort((a,b) => a.localeCompare(b, 'el')),
  total: regularClasses.size + supportClasses.size
};

fs.writeFileSync(
  './public/all-classes.json',
  JSON.stringify(allClasses, null, 2),
  'utf8'
);

console.log(`\n✅ Saved to all-classes.json`);
console.log(`   Total: ${allClasses.total} classes (${allClasses.regular.length} regular + ${allClasses.support.length} support)`);
