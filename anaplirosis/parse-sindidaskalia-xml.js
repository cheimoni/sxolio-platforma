// parse-sindidaskalia-xml.js
// Εξαγωγή τμημάτων από το XML αρχείο Συνδιδασκαλία.xml

const fs = require('fs');
const cheerio = require('cheerio');

// Χρησιμοποιούμε το πλήρες path με escape characters
const xmlFile = './prokramata sxiliou/Συνδιδασκαλία.xml';

console.log('📖 Ανάγνωση XML αρχείου...');

try {
  const xmlContent = fs.readFileSync(xmlFile, 'utf8');
  const $ = cheerio.load(xmlContent, { xmlMode: true });
  
  console.log('✅ XML φορτώθηκε επιτυχώς');
  
  const students = [];
  const foundClasses = new Set();
  
  // Εύρεση όλων των text nodes που περιέχουν "Τμήμα/Συνδιδασκαλία:"
  $('*').each((index, element) => {
    const text = $(element).text();
    
    if (text.includes('Τμήμα/Συνδιδασκαλία:')) {
      // Εξάγουμε το όνομα της συνδιδασκαλίας
      const match = text.match(/Τμήμα\/Συνδιδασκαλία:\s*([^\n]+)/);
      if (match) {
        const coteachingName = match[1].trim();
        foundClasses.add(coteachingName);
        console.log(`📋 Βρέθηκε: "${coteachingName}"`);
      }
    }
  });
  
  console.log(`\n📊 Συνολικά βρέθηκαν ${foundClasses.size} μοναδικές συνδιδασκαλίες:`);
  Array.from(foundClasses).sort().forEach((ct, i) => {
    console.log(`  ${i+1}. ${ct}`);
  });
  
  // Ελέγχουμε αν υπάρχουν "Γκατ_1", "ΑΡΧ_4_κατ" κλπ
  const gkatClasses = Array.from(foundClasses).filter(c => c.includes('Γκατ') || c.includes('ΓΚΑΤ'));
  const archClasses = Array.from(foundClasses).filter(c => c.includes('ΑΡΧ') || c.includes('Αρχ'));
  const aggClasses = Array.from(foundClasses).filter(c => c.includes('ΑΓΓ') || c.includes('Αγγ'));
  
  console.log(`\n🔍 Ειδικές κατηγορίες:`);
  console.log(`   Γκατ: ${gkatClasses.length > 0 ? gkatClasses.join(', ') : 'Δεν βρέθηκαν'}`);
  console.log(`   ΑΡΧ: ${archClasses.length > 0 ? archClasses.join(', ') : 'Δεν βρέθηκαν'}`);
  console.log(`   ΑΓΓ: ${aggClasses.length > 0 ? aggClasses.join(', ') : 'Δεν βρέθηκαν'}`);
  
  // Αποθήκευση αποτελεσμάτων
  const result = {
    totalClasses: foundClasses.size,
    allClasses: Array.from(foundClasses).sort(),
    gkatClasses: gkatClasses,
    archClasses: archClasses,
    aggClasses: aggClasses
  };
  
  fs.writeFileSync('./xml-classes-analysis.json', JSON.stringify(result, null, 2), 'utf8');
  console.log('\n✅ Αποθηκεύτηκε ανάλυση στο xml-classes-analysis.json');
  
} catch (error) {
  console.error('❌ Σφάλμα:', error.message);
  console.error('   Stack:', error.stack);
}
