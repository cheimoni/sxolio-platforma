/**
 * Script για δημιουργία φωνητικών ανακοινώσεων
 *
 * ΣΗΜΕΙΩΣΗ: Αυτό το script χρειάζεται Google Cloud Text-to-Speech API key.
 * Εναλλακτικά, μπορείς να χρησιμοποιήσεις online services όπως:
 * - https://ttsmaker.com/ (δωρεάν, ελληνικά)
 * - https://www.naturalreaders.com/
 * - https://ttsfree.com/
 */

const fs = require('fs');
const path = require('path');

// Διάβασε τα κείμενα από το announcements.json
const announcementsPath = path.join(__dirname, 'public', 'announcements.json');
const announcements = JSON.parse(fs.readFileSync(announcementsPath, 'utf8'));

console.log('📢 Φωνητικές Ανακοινώσεις Σχολικού Ρολογιού');
console.log('='.repeat(50));
console.log('');
console.log('Για να δημιουργήσεις τα mp3 αρχεία, χρησιμοποίησε ένα από τα παρακάτω:');
console.log('');
console.log('1. Online TTS Service (Προτείνεται):');
console.log('   - Πήγαινε στο: https://ttsmaker.com/');
console.log('   - Επέλεξε: Ελληνικά (Greek)');
console.log('   - Αντίγραψε το κείμενο από κάτω');
console.log('   - Κατέβασε το mp3');
console.log('');
console.log('2. Google Cloud TTS API (Για προγραμματιστές):');
console.log('   - Χρειάζεται API key από: https://cloud.google.com/text-to-speech');
console.log('');
console.log('='.repeat(50));
console.log('');

// Δημιούργησε το output directory αν δεν υπάρχει
const outputDir = path.join(__dirname, 'public', 'announcements');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Δημιούργησε ένα text αρχείο με οδηγίες για κάθε ανακοίνωση
const instructionsPath = path.join(outputDir, 'INSTRUCTIONS.txt');
let instructions = '';

instructions += 'ΟΔΗΓΙΕΣ ΔΗΜΙΟΥΡΓΙΑΣ MP3 ΑΡΧΕΙΩΝ\n';
instructions += '='.repeat(70) + '\n\n';
instructions += 'Για κάθε ανακοίνωση παρακάτω:\n';
instructions += '1. Πήγαινε στο https://ttsmaker.com/\n';
instructions += '2. Επέλεξε φωνή: Ελληνικά (Greek) - προτείνεται "el-GR-AthinaNeural" (γυναικεία)\n';
instructions += '3. Αντίγραψε το κείμενο\n';
instructions += '4. Πάτα "Convert to Speech"\n';
instructions += '5. Κατέβασε το mp3 και μετονόμασέ το στο αντίστοιχο όνομα αρχείου\n';
instructions += '6. Βάλτο στον φάκελο: public/announcements/\n\n';
instructions += '='.repeat(70) + '\n\n';

// Mapping των announcements σε filenames
const mapping = [
  { file: 'morning.mp3', key: 'morning', title: 'Καλημέρα' },
  { file: 'period1.mp3', key: 'period1', title: '1η Περίοδος' },
  { file: 'period2.mp3', key: 'period2', title: '2η Περίοδος' },
  { file: 'period3.mp3', key: 'period3', title: '3η Περίοδος' },
  { file: 'period4.mp3', key: 'period4', title: '4η Περίοδος' },
  { file: 'period5.mp3', key: 'period5', title: '5η Περίοδος' },
  { file: 'period6.mp3', key: 'period6', title: '6η Περίοδος' },
  { file: 'period7.mp3', key: 'period7', title: '7η Περίοδος' },
  { file: 'period8.mp3', key: 'period8', title: '8η Περίοδος' },
  { file: 'break1.mp3', key: 'break1', title: '1ο Διάλειμμα' },
  { file: 'break2.mp3', key: 'break2', title: '2ο Διάλειμμα' },
  { file: 'break3.mp3', key: 'break3', title: '3ο Διάλειμμα' },
  { file: 'end.mp3', key: 'end', title: 'Τέλος Ωραρίου' }
];

mapping.forEach((item, index) => {
  const text = announcements[item.key];

  instructions += `${index + 1}. ${item.title}\n`;
  instructions += `-`.repeat(70) + '\n';
  instructions += `Όνομα αρχείου: ${item.file}\n`;
  instructions += `Κείμενο:\n`;
  instructions += `"${text}"\n\n`;

  console.log(`${index + 1}. ${item.file}`);
  console.log(`   "${text}"`);
  console.log('');
});

fs.writeFileSync(instructionsPath, instructions, 'utf8');

console.log('='.repeat(50));
console.log('');
console.log(`✅ Οδηγίες αποθηκεύτηκαν στο: ${instructionsPath}`);
console.log('');
console.log('💡 TIP: Μπορείς επίσης να ηχογραφήσεις τις ανακοινώσεις με τη δική σου φωνή!');
console.log('');
