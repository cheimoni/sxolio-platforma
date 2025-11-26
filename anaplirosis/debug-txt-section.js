const fs = require('fs');

const txtContent = fs.readFileSync('./public/tmimata-kanonika.txt', 'utf8');

const sections = txtContent.split('Τμήμα/Συνδιδασκαλία:');

console.log('Total sections:', sections.length);
console.log('');

// Find Στ.Ο.4 section
const st4Section = sections.find(s => {
  const normalized = s.trim().toUpperCase();
  return normalized.startsWith('ΣΤ.Ο.4');
});

if (st4Section) {
  console.log('Found Στ.Ο.4 section!');
  console.log('First 500 characters:');
  console.log(st4Section.substring(0, 500));
  console.log('');
  console.log('Lines (first 30):');
  const lines = st4Section.split('\n');
  lines.slice(0, 30).forEach((line, i) => {
    console.log(`${i}: "${line}"`);
  });
} else {
  console.log('Στ.Ο.4 section NOT found');
  console.log('');
  console.log('Available sections (first 10):');
  sections.slice(0, 10).forEach((s, i) => {
    const firstLine = s.split('\n')[0].trim();
    console.log(`${i}: "${firstLine.substring(0, 50)}"`);
  });
}
