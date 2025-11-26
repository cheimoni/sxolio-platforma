const fs = require('fs');

// Read teachers.json
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

// Find all BD (Β.Δ.) teachers and their schedules
const bdSchedule = {
  "ημέρες_εμφάνισης": {
    "Β.Δ.": {
      "Δευτέρα": null,
      "Τρίτη": null,
      "Τετάρτη": null,
      "Πέμπτη": null,
      "Παρασκευή": null
    }
  }
};

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

// Find BD teachers (those with τίτλος "Β.Δ.")
const bdTeachers = teachers.filter(t => t.τίτλος === 'Β.Δ.');

console.log(`Found ${bdTeachers.length} BD teachers:`);
bdTeachers.forEach(bd => {
  console.log(`  - ${bd.καθηγητής} (${bd.ειδικότητα || 'Γενικά'})`);
});

// For each day, find which BD is free during the last period
days.forEach(day => {
  bdTeachers.forEach(bd => {
    const daySchedule = bd.πρόγραμμα?.[day];
    if (!daySchedule) return;

    // Find the last period for this day
    const daysWith8Periods = ['Δευτέρα', 'Πέμπτη'];
    const lastPeriod = daysWith8Periods.includes(day) ? '8' : '7';

    const lastPeriodSubject = daySchedule[lastPeriod];

    // If BD is free during last period (no subject, or "***", or "-")
    if (!lastPeriodSubject || lastPeriodSubject === '***' || lastPeriodSubject === '-' || lastPeriodSubject === undefined) {
      if (!bdSchedule.ημέρες_εμφάνισης['Β.Δ.'][day]) {
        bdSchedule.ημέρες_εμφάνισης['Β.Δ.'][day] = bd.καθηγητής;
        console.log(`  ${day}: ${bd.καθηγητής} is free at period ${lastPeriod}`);
      }
    }
  });
});

// Write to public/bd-directors-schedule.json
fs.writeFileSync(
  './public/bd-directors-schedule.json',
  JSON.stringify(bdSchedule, null, 2),
  'utf8'
);

console.log('\n✓ Created public/bd-directors-schedule.json');
console.log('\nBD Schedule:');
console.log(JSON.stringify(bdSchedule, null, 2));
