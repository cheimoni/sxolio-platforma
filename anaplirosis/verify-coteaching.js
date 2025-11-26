const fs = require('fs');

const students = JSON.parse(fs.readFileSync('./public/students-all.json', 'utf8'));

// Ομαδοποίηση ανά Συνδιδασκαλία
const byCoteaching = {};
students.forEach(s => {
  const ct = s['Συνδιδασκαλία'];
  if (ct) {
    if (!byCoteaching[ct]) {
      byCoteaching[ct] = [];
    }
    byCoteaching[ct].push(s);
  }
});

console.log('📊 ΓΕΝΙΚΗ ΕΠΑΛΗΘΕΥΣΗ ΣΥΝΔΙΔΑΣΚΑΛΙΩΝ\n');
console.log(`Σύνολο μαθητών: ${students.length}`);
console.log(`Σύνολο συνδιδασκαλιών: ${Object.keys(byCoteaching).length}\n`);

// Ταξινόμηση και εμφάνιση
const sorted = Object.entries(byCoteaching).sort((a, b) => a[0].localeCompare(b[0], 'el'));

console.log('📋 ΛΙΣΤΑ ΣΥΝΔΙΔΑΣΚΑΛΙΩΝ:\n');

let totalStudents = 0;
let warnings = [];

sorted.forEach(([name, studs]) => {
  const count = studs.length;
  totalStudents += count;

  // Ελέγχουμε για πολλούς μαθητές (πιθανό fallback πρόβλημα)
  let status = '✅';
  if (count > 50) {
    status = '⚠️ ΠΟΛΛΟΙ';
    warnings.push(`${name}: ${count} μαθητές (πιθανό fallback)`);
  } else if (count === 0) {
    status = '❌ ΚΕΝΟ';
    warnings.push(`${name}: Κενό`);
  }

  console.log(`${status} ${name.padEnd(35)} - ${count.toString().padStart(3)} μαθητές`);
});

console.log(`\n📊 Σύνολο μαθητών σε συνδιδασκαλίες: ${totalStudents}`);

if (warnings.length > 0) {
  console.log('\n⚠️ ΠΡΟΕΙΔΟΠΟΙΗΣΕΙΣ:\n');
  warnings.forEach(w => console.log(`   ${w}`));
} else {
  console.log('\n✅ Όλες οι συνδιδασκαλίες έχουν λογικό αριθμό μαθητών!');
}

// Έλεγχος για συγκεκριμένες συνδιδασκαλίες
console.log('\n🔍 ΕΛΕΓΧΟΣ ΣΥΓΚΕΚΡΙΜΕΝΩΝ ΣΥΝΔΙΔΑΣΚΑΛΙΩΝ:\n');

const testCases = [
  'Α21_ΦΤ_Τ',
  'Α41_ΤΠ_Τ',
  'βκατ_2 ΛΓΣΤ_κατ (Β)',
  'Γκατ_2 ΛΓΣΤ_κατ (Γ)',
  'Γ32 Μαθηματικά κατ (Γ)'
];

testCases.forEach(testCase => {
  const found = byCoteaching[testCase];
  if (found) {
    console.log(`✅ ${testCase}: ${found.length} μαθητές`);
    if (found.length > 0 && found.length <= 3) {
      console.log(`   Παράδειγμα: ${found[0]['ΑΜ']} ${found[0]['Επίθετο']} ${found[0]['Όνομα']} (${found[0]['Τμήμα']})`);
    }
  } else {
    console.log(`❌ ${testCase}: ΔΕΝ ΒΡΕΘΗΚΕ`);
  }
});
