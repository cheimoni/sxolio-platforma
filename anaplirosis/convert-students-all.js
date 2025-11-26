const fs = require('fs');
const cheerio = require('cheerio');

// Read the mathites HTML file
const htmlContent = fs.readFileSync('./prokramata sxiliou/mathites.html', 'utf8');
const $ = cheerio.load(htmlContent);

const students = [];

// Find all student rows in tables
$('tr').each((index, row) => {
  const cells = $(row).find('td');

  if (cells.length >= 5) {
    const cell0 = $(cells[0]).text().trim(); // A/A or student number
    const cell1 = $(cells[1]).text().trim(); // ΑΜ (student ID)
    const cell2 = $(cells[2]).text().trim(); // Last name
    const cell3 = $(cells[3]).text().trim(); // First name
    const cell4 = $(cells[4]).text().trim(); // Class

    // Skip headers
    if (cell0 === 'A/A' || cell2 === 'Επίθετο' || cell1 === 'ΑΜ') {
      return;
    }

    // Skip empty rows
    if (!cell1 || !cell2 || !cell3 || !cell4) {
      return;
    }

    // Extract class name from the header or cell4
    let className = cell4;

    // If cell4 is empty, look for class name in previous headings
    if (!className || className === '') {
      const prevHeaders = $(row).prevAll('tr').find('td:contains("Τμήμα:")');
      if (prevHeaders.length > 0) {
        const headerText = prevHeaders.first().text();
        const match = headerText.match(/Τμήμα:\s*([Α-ΓA-Z][0-9]+)/);
        if (match) {
          className = match[1];
        }
      }
    }

    students.push({
      '0': cell0,      // A/A
      '1': cell1,      // ΑΜ
      '2': cell2,      // Επίθετο
      '3': cell3,      // Όνομα
      '4': className,  // Τμήμα
      'Source': className
    });
  }
});

console.log(`Found ${students.length} students`);

// Group by class to verify
const byClass = {};
students.forEach(s => {
  const cls = s['4'];
  if (!byClass[cls]) byClass[cls] = 0;
  byClass[cls]++;
});

console.log('\nStudents by class:');
Object.entries(byClass).sort().forEach(([cls, count]) => {
  console.log(`  ${cls}: ${count} students`);
});

// Write to public/students-all.json
fs.writeFileSync(
  './public/students-all.json',
  JSON.stringify(students, null, 2),
  'utf8'
);

console.log('\n✓ Created public/students-all.json');

// Test: Find students in Α31
const a31Students = students.filter(s => s['4'] === 'Α31');
console.log(`\nTest: Found ${a31Students.length} students in Α31`);
if (a31Students.length > 0) {
  console.log('First 3 students in Α31:');
  a31Students.slice(0, 3).forEach(s => {
    console.log(`  ${s['1']} - ${s['2']} ${s['3']}`);
  });
}
