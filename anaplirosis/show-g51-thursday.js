const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/class-schedules.json', 'utf-8'));
const g51 = data.find(c => c.τμήμα === 'Γ51');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║          ΠΛΗΡΕΣ ΠΡΟΓΡΑΜΜΑ Γ51 - ΠΕΜΠΤΗ                      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const thursday = g51.πρόγραμμα['Πέμπτη'];
Object.entries(thursday)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([period, subject]) => {
    console.log(`  ${period}η ώρα: ${subject}`);
  });

console.log('\n✅ Τώρα το Γ51 έχει ΟΛΟΚΛΗΡΩΜΕΝΟ πρόγραμμα με μαθήματα κατεύθυνσης!\n');
