// extract-classes-from-teachers.js
// Εξαγωγή ονομάτων τμημάτων από το teachers.json

const fs = require('fs');

const teachersFile = './src/teachers.json';

console.log('📖 Ανάγνωση teachers.json...');
const teachers = JSON.parse(fs.readFileSync(teachersFile, 'utf8'));

const allClasses = new Set();

teachers.forEach(teacher => {
  const schedule = teacher.πρόγραμμα;
  if (!schedule) return;

  Object.entries(schedule).forEach(([day, periods]) => {
    if (!periods) return;

    Object.entries(periods).forEach(([period, subject]) => {
      if (!subject || subject === '-' || subject === null) return;

      // Εξάγουμε όλα τα τμήματα από το subject
      // Patterns:
      // - "Α11 ΜΑΘΗΜΑΤΙΚΑ" -> "Α11"
      // - "Α11_ΠΤ_Π" -> "Α11"
      // - "Γκατ_1 ΑΡΧ_4_κατ" -> "Γκατ_1"
      // - "Στ.Ο.6 (Β51)" -> "Στ.Ο.6 (Β51)"
      // - "ΓυμΒ11+Β21+Β22" -> "Β11", "Β21", "Β22"
      
      // Pattern 1: Κανονικά τμήματα (π.χ. "Α11", "Β32")
      const normalClassMatch = subject.match(/\b([ΑΒΓ][0-9]+)\b/);
      if (normalClassMatch) {
        allClasses.add(normalClassMatch[1]);
      }
      
      // Pattern 2: Τμήματα με underscore (π.χ. "Γκατ_1", "ΑΡΧ_4_κατ", "ΑΓΓ_6_κατ")
      // Patterns: "Γκατ_1", "ΑΡΧ_4_κατ", "ΑΓΓ_6_κατ", "Α11_ΠΤ_Π"
      const underscorePatterns = [
        /(Γκατ_\d+)/,           // Γκατ_1, Γκατ_2, κλπ
        /(ΑΡΧ_\d+_κατ)/,        // ΑΡΧ_4_κατ, κλπ
        /(ΑΓΓ_\d+_κατ)/,        // ΑΓΓ_6_κατ, κλπ
        /([ΑΒΓ][0-9]+_[Α-Ω]+(_[Α-Ω]+)?)/  // Α11_ΠΤ_Π, κλπ
      ];
      
      underscorePatterns.forEach(pattern => {
        const match = subject.match(pattern);
        if (match) {
          allClasses.add(match[1]);
        }
      });
      
      // Pattern 3: Στηρίξεις (π.χ. "Στ.Ο.6 (Β51)")
      const supportMatch = subject.match(/(Στ\.(?:Ο\.)?\d+\s*\([ΑΒΓ][0-9]+\))/);
      if (supportMatch) {
        allClasses.add(supportMatch[1]);
      }
      
      // Pattern 4: Γυμναστική με πολλαπλά τμήματα (π.χ. "ΓυμΒ11+Β21+Β22")
      const gymMatch = subject.match(/Γυμ([ΑΒΓ\d\+]+)/);
      if (gymMatch) {
        const classesStr = gymMatch[1];
        classesStr.split('+').forEach(cls => {
          const trimmed = cls.trim();
          if (trimmed) {
            allClasses.add(trimmed);
          }
        });
      }
      
      // Pattern 5: Τμήματα σε παρενθέσεις (π.χ. "... (Β51)")
      const parensMatch = subject.match(/\(([ΑΒΓ][0-9]+)\)/);
      if (parensMatch) {
        allClasses.add(parensMatch[1]);
      }
    });
  });
});

const sortedClasses = Array.from(allClasses).sort((a, b) => {
  // Ταξινόμηση: πρώτα τα γράμματα, μετά οι αριθμοί
  return a.localeCompare(b, 'el');
});

console.log(`\n📊 Βρέθηκαν ${sortedClasses.length} μοναδικά τμήματα:\n`);

// Ομαδοποίηση ανά τύπο
const normalClasses = sortedClasses.filter(c => /^[ΑΒΓ][0-9]+$/.test(c));
const underscoreClasses = sortedClasses.filter(c => c.includes('_') && !c.startsWith('Στ.'));
const supportClasses = sortedClasses.filter(c => c.startsWith('Στ.'));

console.log(`Κανονικά τμήματα (${normalClasses.length}):`);
normalClasses.forEach(c => console.log(`  - ${c}`));

console.log(`\nΤμήματα με underscore (${underscoreClasses.length}):`);
underscoreClasses.forEach(c => console.log(`  - ${c}`));

console.log(`\nΣτηρίξεις (${supportClasses.length}):`);
supportClasses.forEach(c => console.log(`  - ${c}`));

// Αποθήκευση σε JSON
const output = {
  allClasses: sortedClasses,
  normalClasses: normalClasses,
  underscoreClasses: underscoreClasses,
  supportClasses: supportClasses,
  total: sortedClasses.length
};

fs.writeFileSync('./public/classes-from-teachers.json', JSON.stringify(output, null, 2), 'utf8');
console.log(`\n✅ Αποθηκεύτηκε στο ./public/classes-from-teachers.json`);

