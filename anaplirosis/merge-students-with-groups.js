const fs = require('fs');

console.log('📖 Φόρτωση δεδομένων...\n');

// Φόρτωση μαθητών
const allStudents = JSON.parse(fs.readFileSync('public/students-kanonika.json', 'utf8'));

// Φόρτωση συνδιδασκαλικών ομάδων
const groupsA = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Α_Τάξη.json', 'utf8'));
const groupsB = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Β_Τάξη.json', 'utf8'));
const groupsC = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Γ_Τάξη.json', 'utf8'));

console.log(`✓ Φορτώθηκαν ${allStudents.length} μαθητές`);
console.log(`✓ Φορτώθηκαν ${groupsA.groups.length} ομάδες Α' τάξης`);
console.log(`✓ Φορτώθηκαν ${groupsB.groups.length} ομάδες Β' τάξης`);
console.log(`✓ Φορτώθηκαν ${groupsC.groups.length} ομάδες Γ' τάξης\n`);

// Δημιουργία map ΑΜ -> ομάδα συνδιδασκαλίας
const studentToGroup = new Map();

function addStudentsFromGroups(groups, classLetter) {
  groups.groups.forEach((group, groupIndex) => {
    if (group.members) {
      group.members.forEach(member => {
        // Εύρεση ΑΜ από το member
        let am = member['ΑΜ'] || member['αμ'] || member['AM'];

        // Αν δεν βρέθηκε ως κλειδί, ψάξε στις τιμές
        if (!am) {
          Object.values(member).forEach(value => {
            if (typeof value === 'string' && /^[0-9]{7}$/.test(value)) {
              am = value;
            }
          });
        }

        if (am) {
          studentToGroup.set(am, {
            groupId: `${classLetter}_${groupIndex + 1}`,
            groupName: group.groupName || `Group ${groupIndex + 1}`,
            groupTitle: group.title || ''
          });
        }
      });
    }
  });
}

console.log('🔗 Δημιουργία αντιστοιχιών μαθητών με ομάδες...\n');

addStudentsFromGroups(groupsA, 'A');
addStudentsFromGroups(groupsB, 'B');
addStudentsFromGroups(groupsC, 'C');

console.log(`✓ Δημιουργήθηκαν ${studentToGroup.size} αντιστοιχίες\n`);

// Εμπλουτισμός μαθητών με πληροφορίες ομάδας
let matched = 0;
let notMatched = 0;

const enrichedStudents = allStudents.map(student => {
  const am = student['ΑΜ'] || student['αμ'] || student['AM'];

  if (am && studentToGroup.has(am)) {
    matched++;
    return {
      ...student,
      ΟμάδαΣυνδιδασκαλίας: studentToGroup.get(am)
    };
  } else {
    notMatched++;
    return {
      ...student,
      ΟμάδαΣυνδιδασκαλίας: null
    };
  }
});

console.log('📊 Στατιστικά αντιστοίχισης:');
console.log(`   ✓ Μαθητές με ομάδα: ${matched}`);
console.log(`   ⚠ Μαθητές χωρίς ομάδα: ${notMatched}\n`);

// Ομαδοποίηση ανά τάξη
const studentsByClass = {
  A: enrichedStudents.filter(s => {
    const dept = s['Τμήμα'] || s['ΤΜΗΜΑ'];
    return dept && dept.charAt(0).toUpperCase() === 'Α';
  }),
  B: enrichedStudents.filter(s => {
    const dept = s['Τμήμα'] || s['ΤΜΗΜΑ'];
    return dept && dept.charAt(0).toUpperCase() === 'Β';
  }),
  C: enrichedStudents.filter(s => {
    const dept = s['Τμήμα'] || s['ΤΜΗΜΑ'];
    return dept && dept.charAt(0).toUpperCase() === 'Γ';
  })
};

console.log('💾 Αποθήκευση αρχείων...\n');

// Αποθήκευση ανά τάξη
fs.writeFileSync(
  'public/students-with-groups-A.json',
  JSON.stringify(studentsByClass.A, null, 2),
  'utf8'
);

fs.writeFileSync(
  'public/students-with-groups-B.json',
  JSON.stringify(studentsByClass.B, null, 2),
  'utf8'
);

fs.writeFileSync(
  'public/students-with-groups-C.json',
  JSON.stringify(studentsByClass.C, null, 2),
  'utf8'
);

// Αποθήκευση όλων μαζί
fs.writeFileSync(
  'public/students-with-groups-all.json',
  JSON.stringify(enrichedStudents, null, 2),
  'utf8'
);

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Η ένωση ολοκληρώθηκε επιτυχώς!');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📁 Δημιουργήθηκαν τα αρχεία:\n');
console.log(`   🔵 students-with-groups-A.json (${studentsByClass.A.length} μαθητές)`);
console.log(`   🟢 students-with-groups-B.json (${studentsByClass.B.length} μαθητές)`);
console.log(`   🟡 students-with-groups-C.json (${studentsByClass.C.length} μαθητές)`);
console.log(`   📋 students-with-groups-all.json (${enrichedStudents.length} μαθητές)\n`);

// Στατιστικά ανά τάξη
console.log('📊 Στατιστικά ανά τάξη:\n');

['A', 'B', 'C'].forEach((cls, idx) => {
  const emoji = ['🔵', '🟢', '🟡'][idx];
  const name = ['Α\'', 'Β\'', 'Γ\''][idx];
  const students = studentsByClass[cls];
  const withGroup = students.filter(s => s.ΟμάδαΣυνδιδασκαλίας).length;
  const withoutGroup = students.length - withGroup;

  console.log(`${emoji} ${name} ΤΑΞΗ:`);
  console.log(`   • Σύνολο μαθητών: ${students.length}`);
  console.log(`   • Με ομάδα συνδιδασκαλίας: ${withGroup}`);
  console.log(`   • Χωρίς ομάδα: ${withoutGroup}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════');

// Δείγμα
if (enrichedStudents.length > 0) {
  const sample = enrichedStudents.find(s => s.ΟμάδαΣυνδιδασκαλίας);
  if (sample) {
    console.log('\n📌 Δείγμα μαθητή με ομάδα συνδιδασκαλίας:\n');
    console.log(JSON.stringify(sample, null, 2).substring(0, 400) + '...');
  }
}
