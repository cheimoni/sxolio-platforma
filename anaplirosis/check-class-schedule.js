// check-class-schedule.js
// Script to extract and display class schedule from student schedules

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'mathites/index.html';
const className = 'Γ51'; // The class we want to check

console.log(`Reading student schedules from: ${inputFile}`);
console.log(`Looking for class: ${className}\n`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

// Store all periods for this class by day
const classSchedule = {
  'Δευτέρα': {},
  'Τρίτη': {},
  'Τετάρτη': {},
  'Πέμπτη': {},
  'Παρασκευή': {}
};

let studentsProcessed = 0;
let studentsInClass = 0;

// Find all student schedules
$('h1').each((index, element) => {
  const h1Text = $(element).text().trim();

  if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ') {
    const pElement = $(element).next('p');
    const studentName = pElement.find('b').text().trim();

    if (!studentName) return;

    studentsProcessed++;

    // Check if this student belongs to the class we're looking for
    const table = pElement.nextAll('table').first();
    let belongsToClass = false;

    // Get day headers
    const days = [];
    table.find('tr').first().find('td').each((i, dayEl) => {
      if (i > 0) days.push($(dayEl).text().trim());
    });

    // Process each period
    table.find('tr').slice(1).each((i, row) => {
      const period = $(row).find('td').first().text().trim();
      if (period) {
        $(row).find('td').slice(1).each((j, cell) => {
          const day = days[j];

          // Replace <br/> with space before extracting text
          $(cell).find('br').replaceWith(' ');

          const pTags = $(cell).find('p');
          let cellText = '';

          if (pTags.length > 0) {
            cellText = pTags.map((idx, p) => $(p).text().trim()).get().join(' ');
          } else {
            cellText = $(cell).text().trim();
          }

          // Clean up
          cellText = cellText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' ').trim();

          // Check if this cell contains our class name
          if (cellText && cellText.includes(className)) {
            belongsToClass = true;

            // Store the subject for this day/period
            if (!classSchedule[day][period]) {
              classSchedule[day][period] = cellText;
            }
          }
        });
      }
    });

    if (belongsToClass) {
      studentsInClass++;
    }
  }
});

console.log(`Processed ${studentsProcessed} students`);
console.log(`Found ${studentsInClass} students in class ${className}\n`);

// Display the class schedule
console.log(`\n========== ΠΡΟΓΡΑΜΜΑ ΤΜΗΜΑΤΟΣ ${className} ==========\n`);

for (const day in classSchedule) {
  console.log(`\n${day}:`);
  console.log('─'.repeat(60));

  const periods = classSchedule[day];
  if (Object.keys(periods).length === 0) {
    console.log('  (Δεν βρέθηκαν μαθήματα)');
  } else {
    // Sort periods numerically
    const sortedPeriods = Object.keys(periods).sort((a, b) => parseInt(a) - parseInt(b));
    for (const period of sortedPeriods) {
      console.log(`  ${period}η ώρα: ${periods[period]}`);
    }
  }
}

console.log('\n' + '='.repeat(60) + '\n');

// Show Thursday specifically
console.log('\n========== ΠΕΜΠΤΗ (ΑΝΑΛΥΤΙΚΑ) ==========\n');
const thursdaySchedule = classSchedule['Πέμπτη'];
if (Object.keys(thursdaySchedule).length === 0) {
  console.log('❌ Δεν βρέθηκαν μαθήματα την Πέμπτη');
} else {
  const sortedPeriods = Object.keys(thursdaySchedule).sort((a, b) => parseInt(a) - parseInt(b));
  for (let p = 1; p <= 8; p++) {
    if (thursdaySchedule[p.toString()]) {
      console.log(`✓ ${p}η ώρα: ${thursdaySchedule[p.toString()]}`);
    } else {
      console.log(`✗ ${p}η ώρα: (κενό)`);
    }
  }
}

console.log('\n' + '='.repeat(60) + '\n');
