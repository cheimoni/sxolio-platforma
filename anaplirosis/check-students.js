const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/students-sindidaskalia.json', 'utf8'));

console.log(`Total students: ${data.length}`);

const groups = {};
data.forEach(s => {
  const g = s['Συνδιδασκαλία'] || s['Καθηγητής'];
  if (g) {
    groups[g] = (groups[g] || 0) + 1;
  }
});

console.log(`Groups with students: ${Object.keys(groups).length}`);

// Check specific groups
const testGroups = ['Α11_ΠΤ_Τ', 'Α11_ΤΠ_Π', 'Α11_ΤΠ_Τ', 'Α21_ΠΤ_Π', 'Α21_ΠΤ_Τ'];
testGroups.forEach(g => {
  const count = groups[g] || 0;
  console.log(`${g}: ${count} students`);
});

