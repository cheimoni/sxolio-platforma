const fs = require('fs');

console.log('📖 Ανάγνωση JSON αρχείου...\n');
const data = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.json', 'utf8'));

// Δημιουργία 3 κατηγοριών για κάθε τάξη
const classA = { metadata: {}, groups: [] };
const classB = { metadata: {}, groups: [] };
const classC = { metadata: {}, groups: [] };

// Στατιστικά
const stats = {
  A: { groups: 0, students: 0, departments: new Set() },
  B: { groups: 0, students: 0, departments: new Set() },
  C: { groups: 0, students: 0, departments: new Set() }
};

console.log('🔍 Ανάλυση ομάδων και ταξινόμηση...\n');

data.groups.forEach((group, index) => {
  let classLetter = null;
  let departments = [];

  // Μέθοδος 1: Έλεγχος από τα μέλη (κανονικά πεδία)
  if (group.members && group.members.length > 0) {
    group.members.forEach(member => {
      const dept = member['Τμήμα'] || member['ΤΜΗΜΑ'] || '';
      if (dept) {
        departments.push(dept);
        if (!classLetter) {
          classLetter = dept.charAt(0).toUpperCase();
        }
      }

      // Μέθοδος 2: Έλεγχος σε όλα τα keys του member
      if (!classLetter) {
        Object.keys(member).forEach(key => {
          // Νέο regex: Χ1 ή Χ## (1-2 ψηφία)
          if (/^[ΑΒΓABC][0-9]{1,2}$/i.test(key)) {
            departments.push(key);
            classLetter = key.charAt(0).toUpperCase();
          }
        });
      }

      // Μέθοδος 3: Έλεγχος στις τιμές του member
      if (!classLetter) {
        Object.values(member).forEach(value => {
          if (typeof value === 'string' && /^[ΑΒΓABC][0-9]{1,2}$/i.test(value)) {
            departments.push(value);
            if (!classLetter) {
              classLetter = value.charAt(0).toUpperCase();
            }
          }
        });
      }
    });
  }

  // Μέθοδος 4: Έλεγχος από τον τίτλο της ομάδας
  if (!classLetter && group.title) {
    const titleMatch = group.title.match(/[ΑΒΓ][0-9]{1,2}/i);
    if (titleMatch) {
      classLetter = titleMatch[0].charAt(0).toUpperCase();
      departments.push(titleMatch[0]);
    }
  }

  // Κανονικοποίηση Β -> Β
  if (classLetter === 'B') classLetter = 'Β';
  if (classLetter === 'C' || classLetter === 'G') classLetter = 'Γ';
  if (classLetter === 'A') classLetter = 'Α';

  // Προσθήκη στην κατάλληλη κατηγορία
  if (classLetter === 'Α') {
    classA.groups.push(group);
    stats.A.groups++;
    stats.A.students += group.members?.length || 0;
    departments.forEach(d => stats.A.departments.add(d));
  } else if (classLetter === 'Β') {
    classB.groups.push(group);
    stats.B.groups++;
    stats.B.students += group.members?.length || 0;
    departments.forEach(d => stats.B.departments.add(d));
  } else if (classLetter === 'Γ') {
    classC.groups.push(group);
    stats.C.groups++;
    stats.C.students += group.members?.length || 0;
    departments.forEach(d => stats.C.departments.add(d));
  } else {
    console.log(`⚠️  Ομάδα ${index + 1} (${group.groupName}): Δεν βρέθηκε τάξη`);
  }
});

// Custom sort για σωστή ταξινόμηση τμημάτων
const sortDepartments = (a, b) => {
  const aNum = parseInt(a.substring(1));
  const bNum = parseInt(b.substring(1));
  return aNum - bNum;
};

// Προσθήκη metadata σε κάθε αρχείο
classA.metadata = {
  source: 'Συνδιδασκαλία.xml',
  class: 'Α',
  totalGroups: classA.groups.length,
  totalStudents: stats.A.students,
  departments: Array.from(stats.A.departments).sort(sortDepartments),
  convertedAt: new Date().toISOString()
};

classB.metadata = {
  source: 'Συνδιδασκαλία.xml',
  class: 'Β',
  totalGroups: classB.groups.length,
  totalStudents: stats.B.students,
  departments: Array.from(stats.B.departments).sort(sortDepartments),
  convertedAt: new Date().toISOString()
};

classC.metadata = {
  source: 'Συνδιδασκαλία.xml',
  class: 'Γ',
  totalGroups: classC.groups.length,
  totalStudents: stats.C.students,
  departments: Array.from(stats.C.departments).sort(sortDepartments),
  convertedAt: new Date().toISOString()
};

// Αποθήκευση σε 3 ξεχωριστά αρχεία
console.log('\n💾 Αποθήκευση αρχείων...\n');

fs.writeFileSync(
  './prokramata sxiliou/Συνδιδασκαλία_Α_Τάξη.json',
  JSON.stringify(classA, null, 2),
  'utf8'
);

fs.writeFileSync(
  './prokramata sxiliou/Συνδιδασκαλία_Β_Τάξη.json',
  JSON.stringify(classB, null, 2),
  'utf8'
);

fs.writeFileSync(
  './prokramata sxiliou/Συνδιδασκαλία_Γ_Τάξη.json',
  JSON.stringify(classC, null, 2),
  'utf8'
);

// Εμφάνιση αποτελεσμάτων
console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Τα αρχεία δημιουργήθηκαν επιτυχώς!');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📊 ΣΤΑΤΙΣΤΙΚΑ ΑΝΑ ΤΑΞΗ:\n');

console.log('🔵 Α\' ΤΑΞΗ:');
console.log(`   • Αρχείο: Συνδιδασκαλία_Α_Τάξη.json`);
console.log(`   • Ομάδες Συνδιδασκαλίας: ${stats.A.groups}`);
console.log(`   • Μαθητές: ${stats.A.students}`);
console.log(`   • Τμήματα (${stats.A.departments.size}): ${Array.from(stats.A.departments).sort(sortDepartments).join(', ')}`);
console.log('');

console.log('🟢 Β\' ΤΑΞΗ:');
console.log(`   • Αρχείο: Συνδιδασκαλία_Β_Τάξη.json`);
console.log(`   • Ομάδες Συνδιδασκαλίας: ${stats.B.groups}`);
console.log(`   • Μαθητές: ${stats.B.students}`);
console.log(`   • Τμήματα (${stats.B.departments.size}): ${Array.from(stats.B.departments).sort(sortDepartments).join(', ')}`);
console.log('');

console.log('🟡 Γ\' ΤΑΞΗ:');
console.log(`   • Αρχείο: Συνδιδασκαλία_Γ_Τάξη.json`);
console.log(`   • Ομάδες Συνδιδασκαλίας: ${stats.C.groups}`);
console.log(`   • Μαθητές: ${stats.C.students}`);
console.log(`   • Τμήματα (${stats.C.departments.size}): ${Array.from(stats.C.departments).sort(sortDepartments).join(', ')}`);
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log(`📌 ΣΥΝΟΛΟ: ${stats.A.groups + stats.B.groups + stats.C.groups} ομάδες, ${stats.A.students + stats.B.students + stats.C.students} μαθητές`);
console.log(`📌 ΣΥΝΟΛΟ ΤΜΗΜΑΤΩΝ: ${stats.A.departments.size + stats.B.departments.size + stats.C.departments.size}`);
console.log('═══════════════════════════════════════════════════════════');
