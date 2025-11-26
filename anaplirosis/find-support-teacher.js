const fs = require('fs');

const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

console.log('Looking for "Στ.Ο.4" in teacher schedules...\n');

for (const t of teachers) {
  if (!t.schedule) continue;

  for (const day in t.schedule) {
    for (const period in t.schedule[day]) {
      const subj = t.schedule[day][period];
      if (subj && subj.includes('Στ.Ο.4')) {
        console.log('Teacher:', t.name);
        console.log('Subject:', subj);
        console.log('Day:', day, 'Period:', period);
        console.log('');
      }
    }
  }
}
