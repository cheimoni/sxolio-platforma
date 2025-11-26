const fs = require('fs');

// Read teachers.json
const teachersData = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

let changesCount = 0;

// Go through all teachers and fix "Κ.Ν." to "Κ.Κ." (Κοινός Κορμός)
Object.values(teachersData).forEach(teacher => {
  const schedule = teacher['πρόγραμμα'];
  if (!schedule) return;

  Object.keys(schedule).forEach(day => {
    Object.keys(schedule[day]).forEach(period => {
      const subject = schedule[day][period];

      // Replace "Κ.Ν." with "Κ.Κ." (Κοινός Κορμός)
      if (subject && subject.includes(' Κ.Ν. ')) {
        const newSubject = subject.replace(/ Κ\.Ν\. /g, ' Κ.Κ. ');
        schedule[day][period] = newSubject;
        changesCount++;
        console.log(`Fixed: ${teacher['καθηγητής']} - ${day} ${period}η`);
        console.log(`  Before: ${subject}`);
        console.log(`  After:  ${newSubject}\n`);
      }
    });
  });
});

if (changesCount > 0) {
  // Write fixed data
  fs.writeFileSync(
    './public/teachers.json',
    JSON.stringify(teachersData, null, 2),
    'utf8'
  );
  console.log(`✓ Fixed ${changesCount} entries in teachers.json`);
  console.log('✓ Changed "Κ.Ν." to "Κ.Κ." (Κοινός Κορμός)');
} else {
  console.log('No changes needed.');
}
