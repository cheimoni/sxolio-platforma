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
        // Νέο regex: Χ1 ή Χ## (1-2 ψηφία)
        if (/^[ΑΒΓ][0-9]{1,2}$/i.test(key)) {
          const classLetter = key.charAt(0).toUpperCase();
          if (classLetter === 'Α') departments.A.add(key);
          else if (classLetter === 'Β') departments.B.add(key);
          else if (classLetter === 'Γ') departments.C.add(key);
        }
      });

      Object.values(member).forEach(value => {
        if (typeof value === 'string' && /^[ΑΒΓ][0-9]{1,2}$/i.test(value)) {
          const classLetter = value.charAt(0).toUpperCase();
          if (classLetter === 'Α') departments.A.add(value);
          else if (classLetter === 'Β') departments.B.add(value);
          else if (classLetter === 'Γ') departments.C.add(value);
        }
      });
    });
  }
});

// Custom sort function για σωστή ταξινόμηση
const sortDepartments = (a, b) => {
  const aNum = parseInt(a.substring(1));
  const bNum = parseInt(b.substring(1));
  return aNum - bNum;
};

console.log('═══════════════════════════════════════');
console.log('📊 ΤΜΗΜΑΤΑ ΑΝΑ ΤΑΞΗ:\n');

const deptA = Array.from(departments.A).sort(sortDepartments);
console.log(`🔵 Α' ΤΆΞΗ (${deptA.length} τμήματα):`);
console.log('   ', deptA.join(', '));
console.log('');

const deptB = Array.from(departments.B).sort(sortDepartments);
console.log(`🟢 Β' ΤΆΞΗ (${deptB.length} τμήματα):`);
console.log('   ', deptB.join(', '));
console.log('');

const deptC = Array.from(departments.C).sort(sortDepartments);
console.log(`🟡 Γ' ΤΆΞΗ (${deptC.length} τμήματα):`);
console.log('   ', deptC.join(', '));
console.log('');

console.log('═══════════════════════════════════════');
console.log(`📌 ΣΥΝΟΛΟ: ${deptA.length + deptB.length + deptC.length} τμήματα`);
console.log('═══════════════════════════════════════');
