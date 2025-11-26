const fs = require('fs');

const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const className = 'Β31';
const day = 'Δευτέρα';
const schedule = {};

teachers.forEach(t => {
  const daySchedule = t.πρόγραμμα?.[day];
  if (daySchedule) {
    for (let p = 1; p <= 8; p++) {
      const subject = daySchedule[p.toString()];
      if (subject && subject.trim() !== '-') {
        const subjectUpper = subject.toUpperCase().trim();
        const matches = subjectUpper.startsWith(className.toUpperCase());

        if (matches) {
          if (!schedule[p]) schedule[p] = [];
          schedule[p].push({
            teacher: t.καθηγητής,
            subject: subject
          });
        }
      }
    }
  }
});

console.log('═══════════════════════════════════════════');
console.log('  ΠΡΟΓΡΑΜΜΑ Β31 - ΔΕΥΤΕΡΑ');
console.log('═══════════════════════════════════════════\n');

for (let p = 1; p <= 8; p++) {
  if (schedule[p] && schedule[p].length > 0) {
    console.log(`${p}η ώρα:`);
    schedule[p].forEach(item => {
      console.log(`  📚 ${item.subject}`);
      console.log(`     (${item.teacher})\n`);
    });
  } else {
    console.log(`${p}η ώρα: ⬜ Κενό\n`);
  }
}

console.log('═══════════════════════════════════════════');
