const fs = require('fs');

const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

const supportClasses = new Set();

for (const t of teachers) {
  if (!t.schedule) continue;

  for (const day in t.schedule) {
    for (const period in t.schedule[day]) {
      const subj = t.schedule[day][period];
      if (subj && subj.match(/Στ\./i)) {
        supportClasses.add(subj);
      }
    }
  }
}

console.log('Support classes found in teachers.json:');
Array.from(supportClasses).sort().forEach(c => console.log('  ', c));
console.log('\nTotal:', supportClasses.size);
