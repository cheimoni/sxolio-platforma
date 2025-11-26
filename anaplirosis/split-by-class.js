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
  // Έλεγχος του τμήματος από τα μέλη
  if (group.members && group.members.length > 0) {
    const firstMember = group.members[0];
    const department = firstMember['Τμήμα'] || firstMember['ΤΜΗΜΑ'] || '';

    // Εξαγωγή της τάξης από το τμήμα (π.χ. "Α11" -> "Α")
    const classLetter = department.charAt(0).toUpperCase();

    // Προσθήκη στην κατάλληλη κατηγορία
    if (classLetter === 'Α' || classLetter === 'A') {
      classA.groups.push(group);
      stats.A.groups++;
      stats.A.students += group.members.length;
      group.members.forEach(m => stats.A.departments.add(m['Τμήμα'] || m['ΤΜΗΜΑ']));
    } else if (classLetter === 'Β' || classLetter === 'B') {
      classB.groups.push(group);
      stats.B.groups++;
      stats.B.students += group.members.length;
      group.members.forEach(m => stats.B.departments.add(m['Τμήμα'] || m['ΤΜΗΜΑ']));
    } else if (classLetter === 'Γ' || classLetter === 'C' || classLetter === 'G') {
      classC.groups.push(group);
      stats.C.groups++;
      stats.C.students += group.members.length;
      group.members.forEach(m => stats.C.departments.add(m['Τμήμα'] || m['ΤΜΗΜΑ']));
    } else {
      console.log(`⚠️  Άγνωστη τάξη στην ομάδα ${index + 1}: "${department}"`);
    }
  }
});

// Προσθήκη metadata σε κάθε αρχείο
classA.metadata = {
  source: 'Συνδιδασκαλία.xml',
  class: 'Α',
  totalGroups: classA.groups.length,
  totalStudents: stats.A.students,
  departments: Array.from(stats.A.departments).sort(),
  convertedAt: new Date().toISOString()
};

classB.metadata = {
  source: 'Συνδιδασκαλία.xml',
  class: 'Β',
  totalGroups: classB.groups.length,
  totalStudents: stats.B.students,
  departments: Array.from(stats.B.departments).sort(),
  convertedAt: new Date().toISOString()
};

classC.metadata = {
  source: 'Συνδιδασκαλία.xml',
  class: 'Γ',
  totalGroups: classC.groups.length,
  totalStudents: stats.C.students,
  departments: Array.from(stats.C.departments).sort(),
  convertedAt: new Date().toISOString()
};

// Αποθήκευση σε 3 ξεχωριστά αρχεία
console.log('💾 Αποθήκευση αρχείων...\n');

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
console.log(`   • Τμήματα: ${Array.from(stats.A.departments).sort().join(', ')}`);
console.log('');

console.log('🟢 Β\' ΤΑΞΗ:');
console.log(`   • Αρχείο: Συνδιδασκαλία_Β_Τάξη.json`);
console.log(`   • Ομάδες Συνδιδασκαλίας: ${stats.B.groups}`);
console.log(`   • Μαθητές: ${stats.B.students}`);
console.log(`   • Τμήματα: ${Array.from(stats.B.departments).sort().join(', ')}`);
console.log('');

console.log('🟡 Γ\' ΤΑΞΗ:');
console.log(`   • Αρχείο: Συνδιδασκαλία_Γ_Τάξη.json`);
console.log(`   • Ομάδες Συνδιδασκαλίας: ${stats.C.groups}`);
console.log(`   • Μαθητές: ${stats.C.students}`);
console.log(`   • Τμήματα: ${Array.from(stats.C.departments).sort().join(', ')}`);
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log(`📌 ΣΥΝΟΛΟ: ${stats.A.groups + stats.B.groups + stats.C.groups} ομάδες, ${stats.A.students + stats.B.students + stats.C.students} μαθητές`);
console.log('═══════════════════════════════════════════════════════════');
