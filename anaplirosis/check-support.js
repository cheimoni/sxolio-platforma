const fs = require('fs');

const support = JSON.parse(fs.readFileSync('./public/support-classes.json', 'utf8'));

console.log('Support classes check:');
console.log('Array:', Array.isArray(support));
console.log('Length:', support.length);
console.log('');

const st4 = support.find(c => c.className.includes('Στ.Ο.4'));

console.log('Looking for Στ.Ο.4 (Γ1):');
console.log('Found:', st4 ? 'YES' : 'NO');

if (st4) {
  console.log('className:', st4.className);
  console.log('Has students field:', !!st4.students);
  console.log('Students is array:', Array.isArray(st4.students));
  console.log('studentCount:', st4.studentCount);
  console.log('Actual students.length:', st4.students.length);
  console.log('\nFirst 10 students:');
  st4.students.slice(0, 10).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.am} ${s.epitheto} ${s.onoma} (${s.tmima})`);
  });
}
