const fs = require('fs');

console.log('📖 Διάβασμα students-all.json...');
const students = JSON.parse(fs.readFileSync('./public/students-all.json', 'utf8'));

console.log(`📊 Σύνολο entries: ${students.length}`);

// Αφαιρούμε duplicates κρατώντας μόνο unique ΑΜ + Συνδιδασκαλία
const uniqueMap = new Map();

students.forEach(student => {
  const key = `${student['ΑΜ']}_${student['Συνδιδασκαλία']}`;

  // Κρατάμε το πρώτο entry για κάθε ΑΜ+Συνδιδασκαλία
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, student);
  }
});

const unique = Array.from(uniqueMap.values());

console.log(`✅ Μοναδικά entries: ${unique.length}`);
console.log(`🗑️  Αφαιρέθηκαν: ${students.length - unique.length} duplicates`);

// Backup
fs.writeFileSync(
  './public/students-all.json.before-dedup',
  JSON.stringify(students, null, 2),
  'utf8'
);
console.log('💾 Backup: students-all.json.before-dedup');

// Αποθήκευση
fs.writeFileSync(
  './public/students-all.json',
  JSON.stringify(unique, null, 2),
  'utf8'
);
console.log('✅ Αποθηκεύτηκε: students-all.json');

// Στατιστικά
const byCoteaching = {};
unique.forEach(s => {
  const ct = s['Συνδιδασκαλία'];
  if (!byCoteaching[ct]) byCoteaching[ct] = 0;
  byCoteaching[ct]++;
});

console.log('\n📊 Μαθητές ανά συνδιδασκαλία (πρώτες 10):');
Object.entries(byCoteaching)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([name, count]) => {
    console.log(`  ${name}: ${count} μαθητές`);
  });
