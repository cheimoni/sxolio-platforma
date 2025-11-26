const fs = require('fs');

const students = JSON.parse(fs.readFileSync('./public/students-complete-all.json', 'utf8'));

// Get all Γ1 entries
const g1All = students.filter(s => s['Τμήμα'] === 'Γ1');

// Get unique students by ΑΜ
const uniqueStudents = new Map();
g1All.forEach(s => {
  const am = s['ΑΜ'];
  if (am && !uniqueStudents.has(am)) {
    uniqueStudents.set(am, s);
  }
});

console.log('📊 Γ1 Class Statistics:');
console.log('Total entries (with coteaching duplicates):', g1All.length);
console.log('UNIQUE students in Γ1:', uniqueStudents.size);

console.log('\n✅ All unique Γ1 students:');
Array.from(uniqueStudents.values()).forEach((s, i) => {
  console.log(`  ${i+1}. ${s['ΑΜ']} ${s['Επίθετο']} ${s['Όνομα']}`);
});

// Find Εικαστικές (Arts) groups for Γ1
console.log('\n📚 Εικαστικές (Arts) groups for Γ1 students:');
const eikClasses = {};
students.filter(s => s['Τμήμα'] === 'Γ1' && s['Συνδιδασκαλία'] && s['Συνδιδασκαλία'].includes('ΕΙΚ')).forEach(s => {
  const cls = s['Συνδιδασκαλία'];
  if (!eikClasses[cls]) eikClasses[cls] = new Set();
  eikClasses[cls].add(s['ΑΜ']);
});

Object.keys(eikClasses).forEach(cls => {
  console.log(`  ${cls}: ${eikClasses[cls].size} students`);
  Array.from(eikClasses[cls]).forEach(am => {
    const student = uniqueStudents.get(am);
    if (student) {
      console.log(`    - ${am} ${student['Επίθετο']} ${student['Όνομα']}`);
    }
  });
});
