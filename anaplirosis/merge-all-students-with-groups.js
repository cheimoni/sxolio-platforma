const fs = require('fs');

console.log('📖 Φόρτωση δεδομένων...\n');

// Φόρτωση μαθητών (με πληροφορίες συνδιδασκαλίας ήδη)
const allStudents = JSON.parse(fs.readFileSync('public/students-all-merged.json', 'utf8'));

// Φόρτωση συνδιδασκαλικών ομάδων
const groupsA = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Α_Τάξη.json', 'utf8'));
const groupsB = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Β_Τάξη.json', 'utf8'));
const groupsC = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Γ_Τάξη.json', 'utf8'));

console.log(`✓ Φορτώθηκαν ${allStudents.length} μαθητές`);
console.log(`✓ Φορτώθηκαν ${groupsA.groups.length} ομάδες Α' τάξης`);
console.log(`✓ Φορτώθηκαν ${groupsB.groups.length} ομάδες Β' τάξης`);
console.log(`✓ Φορτώθηκαν ${groupsC.groups.length} ομάδες Γ' τάξης\n`);

// Δημιουργία map ΑΜ -> ομάδα από τις λεπτομέρειες ομάδας
const studentToGroupDetails = new Map();

function addGroupDetailsFromGroups(groups, classLetter) {
  groups.groups.forEach((group, groupIndex) => {
    if (group.members) {
      // Συλλογή όλων των τμημάτων στην ομάδα
      const departmentsInGroup = new Set();

      group.members.forEach(member => {
        // Εύρεση τμήματος
        Object.keys(member).concat(Object.values(member)).forEach(value => {
          if (typeof value === 'string' && /^[ΑΒΓ][0-9]{1,2}$/i.test(value)) {
            departmentsInGroup.add(value);
          }
        });
      });

      // Μετατροπή σε sorted array
      const sortDepts = (a, b) => {
        const aNum = parseInt(a.substring(1));
        const bNum = parseInt(b.substring(1));
        return aNum - bNum;
      };
      const deptArray = Array.from(departmentsInGroup).sort(sortDepts);

      group.members.forEach(member => {
        // Εύρεση ΑΜ
        let am = member['ΑΜ'] || member['αμ'] || member['AM'];

        // Αναζήτηση σε values ΠΡΩΤΑ (πιο συχνό για Α' τάξη)
        if (!am) {
          Object.values(member).forEach(value => {
            if (typeof value === 'string' && /^[0-9]{4,7}$/.test(value) && parseInt(value) > 1000) {
              if (!am) am = value; // Πάρε το πρώτο
            }
          });
        }

        // Αναζήτηση σε keys (για Β, Γ τάξη)
        if (!am) {
          Object.keys(member).forEach(key => {
            if (/^[0-9]{4,7}$/.test(key) && parseInt(key) > 1000) {
              if (!am) am = key;
            }
          });
        }

        if (am) {
          studentToGroupDetails.set(am, {
            groupId: groupIndex + 1,
            groupName: group.groupName || `Group ${groupIndex + 1}`,
            groupTitle: group.title || '',
            className: classLetter,
            τμήματα: deptArray  // Όλα τα τμήματα της ομάδας
          });
        }
      });
    }
  });
}

console.log('🔗 Δημιουργία λεπτομερειών ομάδων...\n');

addGroupDetailsFromGroups(groupsA, 'Α');
addGroupDetailsFromGroups(groupsB, 'Β');
addGroupDetailsFromGroups(groupsC, 'Γ');

console.log(`✓ Δημιουργήθηκαν ${studentToGroupDetails.size} αντιστοιχίες\n`);

// Εμπλουτισμός μαθητών
let matched = 0;
let notMatched = 0;

const enrichedStudents = allStudents.map(student => {
  const am = student['ΑΜ'] || student['αμ'] || student['AM'];

  if (am && studentToGroupDetails.has(am)) {
    matched++;
    const groupInfo = studentToGroupDetails.get(am);
    return {
      ...student,
      ΛεπτομέρειεςΟμάδας: groupInfo
    };
  } else {
    notMatched++;
    return {
      ...student,
      ΛεπτομέρειεςΟμάδας: null
    };
  }
});

console.log('📊 Στατιστικά αντιστοίχισης:');
console.log(`   ✓ Μαθητές με λεπτομέρειες ομάδας: ${matched}`);
console.log(`   ⚠ Μαθητές χωρίς λεπτομέρειες: ${notMatched}\n`);

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
  'public/students-complete-A.json',
  JSON.stringify(studentsByClass.A, null, 2),
  'utf8'
);

fs.writeFileSync(
  'public/students-complete-B.json',
  JSON.stringify(studentsByClass.B, null, 2),
  'utf8'
);

fs.writeFileSync(
  'public/students-complete-C.json',
  JSON.stringify(studentsByClass.C, null, 2),
  'utf8'
);

// Αποθήκευση όλων μαζί
fs.writeFileSync(
  'public/students-complete-all.json',
  JSON.stringify(enrichedStudents, null, 2),
  'utf8'
);

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Η ένωση ολοκληρώθηκε επιτυχώς!');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📁 Δημιουργήθηκαν τα αρχεία:\n');
console.log(`   🔵 students-complete-A.json (${studentsByClass.A.length} μαθητές)`);
console.log(`   🟢 students-complete-B.json (${studentsByClass.B.length} μαθητές)`);
console.log(`   🟡 students-complete-C.json (${studentsByClass.C.length} μαθητές)`);
console.log(`   📋 students-complete-all.json (${enrichedStudents.length} μαθητές)\n`);

// Στατιστικά ανά τάξη
console.log('📊 Στατιστικά ανά τάξη:\n');

['A', 'B', 'C'].forEach((cls, idx) => {
  const emoji = ['🔵', '🟢', '🟡'][idx];
  const name = ['Α\'', 'Β\'', 'Γ\''][idx];
  const students = studentsByClass[cls];
  const withGroup = students.filter(s => s.ΛεπτομέρειεςΟμάδας).length;
  const withoutGroup = students.length - withGroup;

  console.log(`${emoji} ${name} ΤΑΞΗ:`);
  console.log(`   • Σύνολο μαθητών: ${students.length}`);
  console.log(`   • Με λεπτομέρειες ομάδας: ${withGroup}`);
  console.log(`   • Χωρίς λεπτομέρειες: ${withoutGroup}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════');

// Δείγμα
if (enrichedStudents.length > 0) {
  const sample = enrichedStudents.find(s => s.ΛεπτομέρειεςΟμάδας);
  if (sample) {
    console.log('\n📌 Δείγμα μαθητή με πλήρη πληροφορίες:\n');
    console.log(JSON.stringify(sample, null, 2));
  }
}
