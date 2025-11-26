const fs = require('fs');

// Read teachers.json
const teachersData = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

let changesCount = 0;

// Go through all teachers and fix "Ν.Κ." to "Κ.Ν." or full name
Object.values(teachersData).forEach(teacher => {
  const schedule = teacher['πρόγραμμα'];
  if (!schedule) return;

  Object.keys(schedule).forEach(day => {
    Object.keys(schedule[day]).forEach(period => {
      const subject = schedule[day][period];

      // Replace "Ν.Κ." with "Κ.Ν." (correct order)
      if (subject && subject.includes(' Ν.Κ. ')) {
        const newSubject = subject.replace(/ Ν\.Κ\. /g, ' Κ.Ν. ');
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
  // Backup original file
  fs.writeFileSync(
    './public/teachers.json.backup',
    JSON.stringify(teachersData, null, 2),
    'utf8'
  );
  console.log('✓ Backup created: teachers.json.backup\n');

  // Write fixed data
  fs.writeFileSync(
    './public/teachers.json',
    JSON.stringify(teachersData, null, 2),
    'utf8'
  );
  console.log(`✓ Fixed ${changesCount} entries in teachers.json`);
} else {
  console.log('No changes needed.');
}
