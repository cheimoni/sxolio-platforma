const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

console.log('Searching for A24 classes in period 6...\n');

Object.values(data).forEach(teacher => {
  const schedule = teacher['πρόγραμμα'];
  if (!schedule) return;

  Object.keys(schedule).forEach(day => {
    Object.keys(schedule[day]).forEach(period => {
      const subject = schedule[day][period];
      if (subject && subject.includes('Α24') && period === '6') {
        console.log('Teacher:', teacher['καθηγητής']);
        console.log('Day:', day, 'Period:', period);
        console.log('Subject:', subject);
        console.log('---\n');
      }
    });
  });
});
