const fs = require('fs');

// Read both files
const studentsAll = JSON.parse(fs.readFileSync('./public/students-all.json', 'utf8'));
const studentsSindi = JSON.parse(fs.readFileSync('./public/students-sindidaskalia.json', 'utf8'));

console.log(`📚 students-all.json: ${studentsAll.length} students`);
console.log(`📚 students-sindidaskalia.json: ${studentsSindi.length} students`);

// Convert students-all.json to the new format
const converted = [];

studentsAll.forEach(entry => {
  // Check if it has the old numeric format (0, 1, 2, 3, 4, 5=Source)
  if (entry['0'] && entry['1'] && entry['2'] && entry['3'] && entry['4']) {
    converted.push({
      'Συνδιδασκαλία': entry['Source'] || entry['5'] || 'Κατάλογος Μαθητών',
      'Α/Α': entry['0'],
      'ΑΜ': entry['1'],
      'Επίθετο': entry['2'],
      'Όνομα': entry['3'],
      'Τμήμα': entry['4']
    });
  }
});

console.log(`✅ Converted ${converted.length} students from students-all.json`);

// Convert sindidaskalia students to use "Συνδιδασκαλία" instead of "Καθηγητής"
const convertedSindi = studentsSindi.map(s => ({
  'Συνδιδασκαλία': s['Καθηγητής'] || s['Συνδιδασκαλία'] || 'Unknown',
  'Α/Α': s['A/A'] || s['Α/Α'] || '',
  'ΑΜ': s['ΑΜ'] || '',
  'Επίθετο': s['Επίθετο'] || '',
  'Όνομα': s['Όνομα'] || '',
  'Τμήμα': s['Τμήμα'] || ''
}));

// Merge: Add students-sindidaskalia students
const merged = [...convertedSindi, ...converted];

console.log(`\n📊 Total merged: ${merged.length} students`);

// Count by Συνδιδασκαλία/Source
const groups = {};
merged.forEach(s => {
  const group = s['Συνδιδασκαλία'] || 'Unknown';
  groups[group] = (groups[group] || 0) + 1;
});

console.log(`\n📋 Groups with students:`);
Object.keys(groups).sort().forEach(group => {
  console.log(`  ${group}: ${groups[group]} students`);
});

// Write merged file
fs.writeFileSync(
  './public/students-all-merged.json',
  JSON.stringify(merged, null, 2),
  'utf8'
);

console.log('\n✅ Written to public/students-all-merged.json');

// Backup old file and replace
fs.copyFileSync('./public/students-all.json', './public/students-all.json.backup');
console.log('✅ Backup created: students-all.json.backup');

fs.copyFileSync('./public/students-all-merged.json', './public/students-all.json');
console.log('✅ Replaced students-all.json with merged data');
