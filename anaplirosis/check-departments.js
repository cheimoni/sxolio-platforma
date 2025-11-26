const fs = require('fs');

console.log('📖 Ανάγνωση JSON αρχείου...\n');
const data = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.json', 'utf8'));

const departments = {
  A: new Set(),
  B: new Set(),
  C: new Set()
};

console.log('🔍 Αναζήτηση όλων των τμημάτων...\n');

data.groups.forEach((group, idx) => {
  if (group.members) {
    group.members.forEach(member => {
      // Έλεγχος σε όλα τα keys και values
      Object.keys(member).forEach(key => {
        if (/^[ΑΒΓ][0-9]{2}$/i.test(key)) {
          const classLetter = key.charAt(0).toUpperCase();
          if (classLetter === 'Α') departments.A.add(key);
          else if (classLetter === 'Β') departments.B.add(key);
          else if (classLetter === 'Γ') departments.C.add(key);
        }
      });

      Object.values(member).forEach(value => {
        if (typeof value === 'string' && /^[ΑΒΓ][0-9]{2}$/i.test(value)) {
          const classLetter = value.charAt(0).toUpperCase();
          if (classLetter === 'Α') departments.A.add(value);
          else if (classLetter === 'Β') departments.B.add(value);
          else if (classLetter === 'Γ') departments.C.add(value);
        }
      });
    });
  }
});

console.log('═══════════════════════════════════════');
console.log('📊 ΤΜΗΜΑΤΑ ΑΝΑ ΤΑΞΗ:\n');

console.log(`🔵 Α' ΤΆΞΗ (${departments.A.size} τμήματα):`);
console.log('   ', Array.from(departments.A).sort().join(', '));
console.log('');

console.log(`🟢 Β' ΤΆΞΗ (${departments.B.size} τμήματα):`);
console.log('   ', Array.from(departments.B).sort().join(', '));
console.log('');

console.log(`🟡 Γ' ΤΆΞΗ (${departments.C.size} τμήματα):`);
console.log('   ', Array.from(departments.C).sort().join(', '));
console.log('');

console.log('═══════════════════════════════════════');
console.log(`📌 ΣΥΝΟΛΟ: ${departments.A.size + departments.B.size + departments.C.size} τμήματα`);
console.log('═══════════════════════════════════════');
