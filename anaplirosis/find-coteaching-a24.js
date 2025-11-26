const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

console.log('All teachers with A24 Μαθηματικά in Friday period 6:\n');

Object.values(data).forEach(teacher => {
  const schedule = teacher['πρόγραμμα'];
  if (!schedule || !schedule['Παρασκευή'] || !schedule['Παρασκευή']['6']) return;

  const subject = schedule['Παρασκευή']['6'];
  if (subject && subject.includes('Α24') && subject.includes('Μαθηματικά')) {
    console.log('Teacher:', teacher['καθηγητής']);
    console.log('Subject:', subject);
    console.log('---\n');
  }
});

console.log('\nAll teachers with Στ. 17 (support class 17):\n');

Object.values(data).forEach(teacher => {
  const schedule = teacher['πρόγραμμα'];
  if (!schedule) return;

  Object.keys(schedule).forEach(day => {
    Object.keys(schedule[day]).forEach(period => {
      const subject = schedule[day][period];
      if (subject && subject.includes('Στ. 17')) {
        console.log('Teacher:', teacher['καθηγητής']);
        console.log('Day:', day, 'Period:', period);
        console.log('Subject:', subject);
        console.log('---\n');
      }
    });
  });
});
