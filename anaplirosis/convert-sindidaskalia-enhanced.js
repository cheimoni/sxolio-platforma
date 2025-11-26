// convert-sindidaskalia-enhanced.js
// Script για εξαγωγή συνδιδασκαλιών από το HTML, συμπεριλαμβανομένων των "Γκατ_1" και "ΑΓΓ_6_κατ"

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = './prokramata sxiliou/Συνδιδασκαλία.html';
const outputFile = './public/students-sindidaskalia.json';

console.log(`📖 Ανάγνωση αρχείου: ${inputFile}`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

const students = [];

// Βρίσκουμε όλα τα <p> και <h1> tags που περιέχουν "Τμήμα/Συνδιδασκαλία:"
$('p, h1').each((index, pElement) => {
  const pText = $(pElement).text();
  
  // Ελέγχουμε αν περιέχει "Τμήμα/Συνδιδασκαλία:"
  if (pText.includes('Τμήμα/Συνδιδασκαλία:')) {
    // Εξάγουμε το όνομα της συνδιδασκαλίας
    // Patterns: "Τμήμα/Συνδιδασκαλία: Α11_ΠΤ_Π" ή "Τμήμα/Συνδιδασκαλία: βκατ_2 ΛΓΣΤ_κατ (Β)" κλπ
    // Παίρνουμε ό,τι υπάρχει μετά το "Τμήμα/Συνδιδασκαλία:" μέχρι το τέλος της γραμμής
    const match = pText.match(/Τμήμα\/Συνδιδασκαλία:\s*(.+?)$/m);
    
    if (match) {
      const coteachingName = match[1].trim();
      console.log(`\n📋 Βρέθηκε συνδιδασκαλία: "${coteachingName}"`);
      
      // Βρίσκουμε τον πίνακα που ακολουθεί
      const table = $(pElement).nextAll('table').first();
      
      if (table.length > 0) {
        // Διαβάζουμε τις γραμμές του πίνακα
        table.find('tr').each((rowIndex, row) => {
          const cells = $(row).find('td');
          
          if (cells.length >= 5) {
            const cell0 = $(cells[0]).text().trim(); // A/A
            const cell1 = $(cells[1]).text().trim(); // ΑΜ
            const cell2 = $(cells[2]).text().trim(); // Επίθετο
            const cell3 = $(cells[3]).text().trim(); // Όνομα
            const cell4 = $(cells[4]).text().trim(); // Τμήμα
            
            // Παραλείπουμε headers
            if (cell0 === 'A/A' || cell2 === 'Επίθετο' || cell1 === 'ΑΜ') {
              return;
            }
            
            // Παραλείπουμε άδειες γραμμές
            if (!cell1 || !cell2 || !cell3) {
              return;
            }
            
            // Προσθέτουμε τον μαθητή με το όνομα της συνδιδασκαλίας στο "Καθηγητής"
            students.push({
              "Καθηγητής": coteachingName,
              "A/A": cell0,
              "ΑΜ": cell1,
              "Επίθετο": cell2,
              "Όνομα": cell3,
              "Τμήμα": cell4 || '',
              "": ""
            });
          }
        });
        
        console.log(`   ✅ Προστέθηκαν ${table.find('tr').length - 1} μαθητές`);
      } else {
        console.log(`   ⚠️ Δεν βρέθηκε πίνακας για "${coteachingName}"`);
      }
    }
  }
});

console.log(`\n📊 Σύνολο μαθητών: ${students.length}`);

// Ομαδοποίηση ανά συνδιδασκαλία για στατιστικά
const byCoteaching = {};
students.forEach(s => {
  const ct = s["Καθηγητής"];
  if (!byCoteaching[ct]) byCoteaching[ct] = 0;
  byCoteaching[ct]++;
});

console.log('\n📈 Μαθητές ανά συνδιδασκαλία:');
Object.entries(byCoteaching)
  .sort((a, b) => a[0].localeCompare(b[0], 'el'))
  .forEach(([ct, count]) => {
    console.log(`   ${ct}: ${count} μαθητές`);
  });

// Ελέγχουμε αν υπάρχουν "Γκατ_1" ή "ΑΓΓ_6_κατ"
const gkatMatches = Object.keys(byCoteaching).filter(k => k.includes('Γκατ') || k.includes('ΓΚΑΤ'));
const aggMatches = Object.keys(byCoteaching).filter(k => k.includes('ΑΓΓ') || k.includes('Αγγ'));

if (gkatMatches.length > 0) {
  console.log(`\n✅ Βρέθηκαν συνδιδασκαλίες τύπου "Γκατ": ${gkatMatches.join(', ')}`);
} else {
  console.log(`\n⚠️ Δεν βρέθηκαν συνδιδασκαλίες τύπου "Γκατ"`);
}

if (aggMatches.length > 0) {
  console.log(`✅ Βρέθηκαν συνδιδασκαλίες τύπου "ΑΓΓ": ${aggMatches.join(', ')}`);
} else {
  console.log(`⚠️ Δεν βρέθηκαν συνδιδασκαλίες τύπου "ΑΓΓ"`);
}

// Αποθήκευση στο JSON
fs.writeFileSync(outputFile, JSON.stringify(students, null, 2), 'utf8');
console.log(`\n✅ Αποθηκεύτηκε στο: ${outputFile}`);

