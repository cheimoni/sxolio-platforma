// fix-sindidaskalia.js
// Αφαίρεση μαθητών που προστέθηκαν με "Γκατ_1" ως συνδιδασκαλία (είναι τμήμα, όχι συνδιδασκαλία)

const fs = require('fs');

const studentsSindidaskaliaFile = './public/students-sindidaskalia.json';

console.log('📖 Ανάγνωση students-sindidaskalia.json...');
const students = JSON.parse(fs.readFileSync(studentsSindidaskaliaFile, 'utf8'));

console.log(`📊 Αρχικός αριθμός μαθητών: ${students.length}`);

// Αφαιρούμε μαθητές που έχουν "Γκατ_1", "Γκατ_2", "Γκατ_3" ή "ΑΓΓ_6_κατ" ως "Καθηγητής"
// γιατί αυτά είναι τμήματα, όχι συνδιδασκαλίες
const toRemove = ['Γκατ_1', 'Γκατ_2', 'Γκατ_3', 'ΑΓΓ_6_κατ'];

const filteredStudents = students.filter(student => {
  const kathigitis = student['Καθηγητής'] || '';
  return !toRemove.includes(kathigitis);
});

const removed = students.length - filteredStudents.length;

console.log(`\n🗑️  Αφαιρέθηκαν ${removed} μαθητές με λάθος όνομα συνδιδασκαλίας`);
console.log(`📊 Νέος αριθμός μαθητών: ${filteredStudents.length}`);

// Ελέγχουμε τι συνδιδασκαλίες έχουν μείνει
const remainingCoteachings = [...new Set(filteredStudents.map(s => s['Καθηγητής']).filter(Boolean))].sort();
console.log(`\n📋 Υπάρχουσες συνδιδασκαλίες (${remainingCoteachings.length}):`);
remainingCoteachings.forEach(ct => {
  const count = filteredStudents.filter(s => s['Καθηγητής'] === ct).length;
  console.log(`   - ${ct}: ${count} μαθητές`);
});

// Αποθήκευση
fs.writeFileSync(studentsSindidaskaliaFile, JSON.stringify(filteredStudents, null, 2), 'utf8');
console.log(`\n✅ Αποθηκεύτηκε στο ${studentsSindidaskaliaFile}`);

