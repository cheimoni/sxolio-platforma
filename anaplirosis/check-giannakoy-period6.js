const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

console.log('ΓΙΑΝΝΑΚΟΥ ΑΝΤΡΗ - Full Schedule:\n');

const teacher = Object.values(data).find(t => t['καθηγητής'] === 'ΓΙΑΝΝΑΚΟΥ ΑΝΤΡΗ');

if (teacher) {
  const schedule = teacher['πρόγραμμα'];
  Object.keys(schedule).forEach(day => {
    console.log(`\n${day}:`);
    Object.keys(schedule[day]).sort().forEach(period => {
      const subject = schedule[day][period];
      console.log(`  ${period}η: ${subject}`);
    });
  });
}
