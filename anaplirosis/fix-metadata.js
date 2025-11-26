const fs = require('fs');

console.log('🔧 Διόρθωση metadata...\n');

// Α' Τάξη
const classA = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Α_Τάξη.json', 'utf8'));
const deptsA = new Set();
classA.groups.forEach(g => {
  g.members?.forEach(m => {
    Object.keys(m).concat(Object.values(m)).forEach(v => {
      if (typeof v === 'string' && /^Α[0-9]{1,2}$/.test(v)) {
        deptsA.add(v);
      }
    });
  });
});

// Β' Τάξη
const classB = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Β_Τάξη.json', 'utf8'));
const deptsB = new Set();
classB.groups.forEach(g => {
  g.members?.forEach(m => {
    Object.keys(m).concat(Object.values(m)).forEach(v => {
      if (typeof v === 'string' && /^Β[0-9]{1,2}$/.test(v)) {
        deptsB.add(v);
      }
    });
  });
});

// Γ' Τάξη
const classC = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Γ_Τάξη.json', 'utf8'));
const deptsC = new Set();
classC.groups.forEach(g => {
  g.members?.forEach(m => {
    Object.keys(m).concat(Object.values(m)).forEach(v => {
      if (typeof v === 'string' && /^Γ[0-9]{1,2}$/.test(v)) {
        deptsC.add(v);
      }
    });
  });
});

// Sort function
const sortDepts = (a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1));

// Ενημέρωση metadata
classA.metadata.departments = Array.from(deptsA).sort(sortDepts);
classB.metadata.departments = Array.from(deptsB).sort(sortDepts);
classC.metadata.departments = Array.from(deptsC).sort(sortDepts);

// Αποθήκευση
fs.writeFileSync('./prokramata sxiliou/Συνδιδασκαλία_Α_Τάξη.json', JSON.stringify(classA, null, 2), 'utf8');
fs.writeFileSync('./prokramata sxiliou/Συνδιδασκαλία_Β_Τάξη.json', JSON.stringify(classB, null, 2), 'utf8');
fs.writeFileSync('./prokramata sxiliou/Συνδιδασκαλία_Γ_Τάξη.json', JSON.stringify(classC, null, 2), 'utf8');

console.log('═══════════════════════════════════════');
console.log('✅ Metadata διορθώθηκαν!\n');

console.log(`🔵 Α' ΤΆΞΗ (${deptsA.size} τμήματα):`);
console.log(`   ${Array.from(deptsA).sort(sortDepts).join(', ')}\n`);

console.log(`🟢 Β' ΤΆΞΗ (${deptsB.size} τμήματα):`);
console.log(`   ${Array.from(deptsB).sort(sortDepts).join(', ')}\n`);

console.log(`🟡 Γ' ΤΆΞΗ (${deptsC.size} τμήματα):`);
console.log(`   ${Array.from(deptsC).sort(sortDepts).join(', ')}\n`);

console.log('═══════════════════════════════════════');
console.log(`📌 ΣΥΝΟΛΟ: ${deptsA.size + deptsB.size + deptsC.size} τμήματα`);
console.log('═══════════════════════════════════════');
