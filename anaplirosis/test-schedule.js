const fs = require('fs');

const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const className = 'Β31';
const day = 'Δευτέρα';

console.log(`\n=== ΟΛΕΣ οι εγγραφές που περιέχουν "${className}" - ${day} ===\n`);

const allMatches = [];

teachers.forEach(teacher => {
  const daySchedule = teacher.πρόγραμμα?.[day];
  if (!daySchedule) return;

  for (let period = 1; period <= 8; period++) {
    const subject = daySchedule[period.toString()];
    if (!subject || subject === '***' || subject === '-') continue;

    const subjectUpper = subject.toUpperCase();

    // Show ALL subjects that contain Β31 anywhere
    if (subjectUpper.includes(className)) {
      allMatches.push({
        period: period,
        teacher: teacher.καθηγητής,
        subject: subject
      });
      console.log(`Περίοδος ${period}: "${subject}" (${teacher.καθηγητής})`);
    }
  }
});

console.log(`\nΣύνολο: ${allMatches.length} μαθήματα`);

// Now build the schedule
const schedule = {};
allMatches.forEach(match => {
  if (!schedule[match.period]) schedule[match.period] = [];
  schedule[match.period].push(match);
});

console.log(`\n=== Πρόγραμμα ${className} - ${day} ===\n`);
for (let period = 1; period <= 8; period++) {
  const lessons = schedule[period];
  if (lessons && lessons.length > 0) {
    console.log(`${period}η ώρα:`);
    lessons.forEach(lesson => {
      console.log(`  ${lesson.subject}`);
    });
  } else {
    console.log(`${period}η ώρα: ΚΕΝΟ`);
  }
  console.log('');
}
