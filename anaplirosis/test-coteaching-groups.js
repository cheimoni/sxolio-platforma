const fs = require('fs');

const students = JSON.parse(fs.readFileSync('./public/mathites-schedule.json', 'utf8'));
const className = 'Β31';
const day = 'Δευτέρα';

console.log(`\n=== Ομάδες Συνδιδασκαλίας για ${className} - ${day} ===\n`);

const classStudents = students.filter(s => {
  const kategoria = s['Κατηγορία'] || '';
  return kategoria.includes(`(${className})`);
});

const uniqueStudents = [...new Set(classStudents.map(s => s['Κατηγορία']))];
console.log(`Σύνολο μαθητών: ${uniqueStudents.length}\n`);

for (let period = 1; period <= 8; period++) {
  const subjectsInPeriod = new Map(); // Use Map to store subject -> students

  uniqueStudents.forEach(studentId => {
    const studentRecords = students.filter(s => s['Κατηγορία'] === studentId);
    const periodRecord = studentRecords.find(r => r[''] === period.toString());

    if (periodRecord && periodRecord[day]) {
      const subject = periodRecord[day].trim();
      if (subject) {
        if (!subjectsInPeriod.has(subject)) {
          subjectsInPeriod.set(subject, []);
        }
        subjectsInPeriod.get(subject).push(studentId.split(' ')[0]); // Just AM
      }
    }
  });

  console.log(`--- Περίοδος ${period} ---`);
  if (subjectsInPeriod.size === 0) {
    console.log('Δεν υπάρχουν δεδομένα');
  } else if (subjectsInPeriod.size === 1) {
    const [subject, studentList] = Array.from(subjectsInPeriod.entries())[0];
    console.log(`✓ Όλοι μαζί (${studentList.length} μαθητές): ${subject}`);
  } else {
    console.log(`✓ Μαθητές χωρισμένοι σε ${subjectsInPeriod.size} ομάδες:`);
    Array.from(subjectsInPeriod.entries()).forEach(([subject, studentList]) => {
      console.log(`  • ${subject}`);
      console.log(`    Μαθητές (${studentList.length}): ${studentList.slice(0, 3).join(', ')}${studentList.length > 3 ? '...' : ''}`);
    });
  }
  console.log();
}

console.log('=== Τέλος ===\n');
