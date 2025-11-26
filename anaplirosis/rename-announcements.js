/**
 * Script για μετονομασία mp3 αρχείων σε σωστά ονόματα
 *
 * ΧΡΗΣΗ:
 * 1. Βάλε όλα τα mp3 files στον φάκελο: public/announcements/
 * 2. Τρέξε: node rename-announcements.js
 */

const fs = require('fs');
const path = require('path');

const announcementsDir = path.join(__dirname, 'public', 'announcements');

console.log('📢 Μετονομασία Φωνητικών Ανακοινώσεων');
console.log('='.repeat(60));
console.log('');

// Διάβασε τα κείμενα από το announcements.json
const announcementsPath = path.join(__dirname, 'public', 'announcements.json');
const announcements = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'));

// Mapping κειμένων σε ονόματα αρχείων
const textToFilename = {
  'Καλημέραα… Εύχομαι να έχουμε μια όμορφη μέρα, χωρίς προβλήματα. Προσέχουμε πάντα την υγεία μας, εντάξει;': 'morning.mp3',
  'Ξεκινά η πρώτη περίοδος.': 'period1.mp3',
  'Ξεκινά η δεύτερη περίοδος.': 'period2.mp3',
  'Ξεκινά η τρίτη περίοδος.': 'period3.mp3',
  'Ξεκινά η τέταρτη περίοδος.': 'period4.mp3',
  'Ξεκινά η πέμπτη περίοδος.': 'period5.mp3',
  'Ξεκινά η έκτη περίοδος.': 'period6.mp3',
  'Ξεκινά η έβδομη περίοδος.': 'period7.mp3',
  'Ξεκινά η όγδοη περίοδος.': 'period8.mp3',
  'Ξεκινά το πρώτοο διάλειμμα! Λίγη ξεκούραση…': 'break1.mp3',
  'Ξεκινά το δεύτεροο διάλειμμα! Πάμε λίγο να χαλαρώσουμε.': 'break2.mp3',
  'Ξεκινά το τρίτοο διάλειμμα! Μην αργήσετε να επιστρέψετε…': 'break3.mp3',
  'Το σχολικό ωράριο ολοκληρώθηκε… Καλή ξεκούραση φίλε, τα λέμε αύριο!': 'end.mp3'
};

// Εναλλακτικά ονόματα που μπορεί να έχουν τα αρχεία
const alternativeNames = {
  'kalimera': 'morning.mp3',
  'kalhmera': 'morning.mp3',
  '1h': 'period1.mp3',
  'proti': 'period1.mp3',
  'prwth': 'period1.mp3',
  '2h': 'period2.mp3',
  'deuteri': 'period2.mp3',
  'deyterh': 'period2.mp3',
  '3h': 'period3.mp3',
  'triti': 'period3.mp3',
  'trith': 'period3.mp3',
  '4h': 'period4.mp3',
  'tetarti': 'period4.mp3',
  'tetarth': 'period4.mp3',
  '5h': 'period5.mp3',
  'pempti': 'period5.mp3',
  'pempth': 'period5.mp3',
  '6h': 'period6.mp3',
  'ekti': 'period6.mp3',
  'ekth': 'period6.mp3',
  '7h': 'period7.mp3',
  'ebdomi': 'period7.mp3',
  'ebdomh': 'period7.mp3',
  '8h': 'period8.mp3',
  'ogdoi': 'period8.mp3',
  'ogdoh': 'period8.mp3',
  '1o_dialeimma': 'break1.mp3',
  'proto_dialeimma': 'break1.mp3',
  'prwto_dialeimma': 'break1.mp3',
  '2o_dialeimma': 'break2.mp3',
  'deutero_dialeimma': 'break2.mp3',
  'deytero_dialeimma': 'break2.mp3',
  '3o_dialeimma': 'break3.mp3',
  'trito_dialeimma': 'break3.mp3',
  'trito_dialeimma': 'break3.mp3',
  'telos': 'end.mp3',
  'end': 'end.mp3'
};

console.log('🔍 Ψάχνω για mp3 αρχεία στο:', announcementsDir);
console.log('');

// Διάβασε όλα τα αρχεία στον φάκελο
let files = [];
try {
  files = fs.readdirSync(announcementsDir).filter(file => file.endsWith('.mp3'));
} catch (err) {
  console.error('❌ Σφάλμα: Δεν μπορώ να διαβάσω τον φάκελο:', err.message);
  process.exit(1);
}

if (files.length === 0) {
  console.log('❌ Δεν βρέθηκαν mp3 αρχεία!');
  console.log('');
  console.log('Παρακαλώ:');
  console.log('1. Αντίγραψε τα mp3 files στο:', announcementsDir);
  console.log('2. Τρέξε ξανά αυτό το script');
  process.exit(1);
}

console.log(`✅ Βρέθηκαν ${files.length} mp3 αρχεία:`);
files.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));
console.log('');
console.log('='.repeat(60));
console.log('');

// Για κάθε αρχείο, προσπάθησε να βρεις το σωστό όνομα
let renamed = 0;
let skipped = 0;

files.forEach(file => {
  const oldPath = path.join(announcementsDir, file);
  const fileNameWithoutExt = file.replace('.mp3', '').toLowerCase();

  // Έλεγξε αν ήδη έχει το σωστό όνομα
  const requiredFiles = Object.values(textToFilename);
  if (requiredFiles.includes(file)) {
    console.log(`✓ ${file} - ΗΔΗ ΣΩΣΤΟ`);
    skipped++;
    return;
  }

  // Προσπάθησε να βρεις αντιστοίχιση
  let newFilename = null;

  for (const [key, value] of Object.entries(alternativeNames)) {
    if (fileNameWithoutExt.includes(key)) {
      newFilename = value;
      break;
    }
  }

  if (newFilename) {
    const newPath = path.join(announcementsDir, newFilename);

    // Έλεγξε αν υπάρχει ήδη αρχείο με αυτό το όνομα
    if (fs.existsSync(newPath)) {
      console.log(`⚠ ${file} → ${newFilename} (ΥΠΑΡΧΕΙ ΗΔΗ, ΠΑΡΑΛΕΙΠΕΤΑΙ)`);
      skipped++;
    } else {
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`✓ ${file} → ${newFilename}`);
        renamed++;
      } catch (err) {
        console.log(`❌ ${file} - ΣΦΑΛΜΑ: ${err.message}`);
        skipped++;
      }
    }
  } else {
    console.log(`? ${file} - ΔΕΝ ΒΡΕΘΗΚΕ ΑΝΤΙΣΤΟΙΧΙΣΗ (χρειάζεται χειροκίνητη μετονομασία)`);
    skipped++;
  }
});

console.log('');
console.log('='.repeat(60));
console.log('');
console.log(`📊 Αποτελέσματα:`);
console.log(`   ✓ Μετονομάστηκαν: ${renamed}`);
console.log(`   ⊘ Παραλείφθηκαν: ${skipped}`);
console.log('');

// Έλεγξε ποια αρχεία λείπουν ακόμα
const requiredFiles = [
  'morning.mp3',
  'period1.mp3', 'period2.mp3', 'period3.mp3', 'period4.mp3',
  'period5.mp3', 'period6.mp3', 'period7.mp3', 'period8.mp3',
  'break1.mp3', 'break2.mp3', 'break3.mp3',
  'end.mp3'
];

const currentFiles = fs.readdirSync(announcementsDir).filter(f => f.endsWith('.mp3'));
const missing = requiredFiles.filter(f => !currentFiles.includes(f));

if (missing.length > 0) {
  console.log('⚠️  ΛΕΙΠΟΥΝ ακόμα:');
  missing.forEach(f => console.log(`   - ${f}`));
  console.log('');
} else {
  console.log('✅ ΤΕΛΕΙΑ! Όλα τα απαιτούμενα αρχεία είναι έτοιμα!');
  console.log('');
}
