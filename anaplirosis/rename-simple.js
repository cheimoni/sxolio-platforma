/**
 * Απλό script για μετονομασία των mp3 files
 */

const fs = require('fs');
const path = require('path');

const announcementsDir = path.join(__dirname, 'public', 'announcements');

console.log('📢 Μετονομασία Φωνητικών Ανακοινώσεων');
console.log('='.repeat(60));
console.log('');

// Mapping παλιών ονομάτων σε νέα
const renameMap = {
  '1.mp3': 'period1.mp3',
  '2.mp3': 'period2.mp3',
  '3.mp3': 'period3.mp3',
  '4.mp3': 'period4.mp3',
  '5.mp3': 'period5.mp3',
  '6.mp3': 'period6.mp3',
  '7.mp3': 'period7.mp3',
  '8.mp3': 'period8.mp3',
  '1 dialima.mp3': 'break1.mp3',
  '2 dialima.mp3': 'break2.mp3',
  '3 dialima.mp3': 'break3.mp3',
  'morning.mp3': 'morning.mp3', // Ήδη σωστό
  'telos.mp3': 'end.mp3'
};

let renamed = 0;
let errors = 0;

console.log('🔄 Ξεκινάει η μετονομασία...\n');

for (const [oldName, newName] of Object.entries(renameMap)) {
  const oldPath = path.join(announcementsDir, oldName);
  const newPath = path.join(announcementsDir, newName);

  // Έλεγξε αν υπάρχει το παλιό αρχείο
  if (!fs.existsSync(oldPath)) {
    console.log(`⚠️  ${oldName} - ΔΕΝ ΒΡΕΘΗΚΕ`);
    continue;
  }

  // Αν έχει ήδη το σωστό όνομα
  if (oldName === newName) {
    console.log(`✓ ${oldName} - ΗΔΗ ΣΩΣΤΟ`);
    continue;
  }

  // Έλεγξε αν υπάρχει ήδη το νέο αρχείο
  if (fs.existsSync(newPath)) {
    console.log(`⚠️  ${oldName} → ${newName} - ΤΟ ΝΕΟ ΥΠΑΡΧΕΙ ΗΔΗ`);
    continue;
  }

  // Μετονόμασε
  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✓ ${oldName} → ${newName}`);
    renamed++;
  } catch (err) {
    console.log(`❌ ${oldName} - ΣΦΑΛΜΑ: ${err.message}`);
    errors++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Αποτελέσματα:`);
console.log(`   ✓ Μετονομάστηκαν: ${renamed}`);
console.log(`   ❌ Σφάλματα: ${errors}`);
console.log('');

// Έλεγξε ποια αρχεία υπάρχουν τώρα
const requiredFiles = [
  'morning.mp3',
  'period1.mp3', 'period2.mp3', 'period3.mp3', 'period4.mp3',
  'period5.mp3', 'period6.mp3', 'period7.mp3', 'period8.mp3',
  'break1.mp3', 'break2.mp3', 'break3.mp3',
  'end.mp3'
];

console.log('📋 Έλεγχος αρχείων:\n');
let allPresent = true;

requiredFiles.forEach(file => {
  const filePath = path.join(announcementsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ❌ ${file} - ΛΕΙΠΕΙ`);
    allPresent = false;
  }
});

console.log('');
if (allPresent) {
  console.log('🎉 ΤΕΛΕΙΑ! Όλα τα αρχεία είναι έτοιμα!');
  console.log('   Το ρολόι θα παίζει τις φωνητικές ανακοινώσεις!');
} else {
  console.log('⚠️  Λείπουν κάποια αρχεία. Βάλτα στον φάκελο και τρέξε ξανά.');
}
console.log('');
