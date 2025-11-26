// convert-class-schedules.js
// Δημιουργεί προγράμματα τμημάτων από τα προγράμματα μαθητών

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'mathites/index.html';
const outputFile = './public/class-schedules.json';

console.log(`Ανάγνωση αρχείου: ${inputFile}\n`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

// Store all class schedules: { "Α11": { "Δευτέρα": { "1": "Μάθημα", ... }, ... }, ... }
const classSchedules = {};

let studentsProcessed = 0;

// Find all student schedules
$('h1').each((index, element) => {
  const h1Text = $(element).text().trim();

  if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ') {
    const pElement = $(element).next('p');
    const studentName = pElement.find('b').text().trim();

    if (!studentName) return;

    studentsProcessed++;
    if (studentsProcessed % 50 === 0) {
      console.log(`Επεξεργασία μαθητή ${studentsProcessed}...`);
    }

    const table = pElement.nextAll('table').first();

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

          if (cellText === '' || cellText.includes('---') || cellText.includes('***')) {
            cellText = null;
          }

          if (cellText) {
            // Extract class name from the subject
            // Examples: "Α11 Μαθηματικά", "Γ51 Νέα Ελληνικά (Γ) B259", "ΓυμΓ41+Γ51_Κ Φυσική Αγωγή", "Γκατ_1 ΛΓΣΤ_κατ"
            const classMatch = cellText.match(/^([^\s]+)/);
            if (classMatch) {
              let className = classMatch[1];

              // Handle co-teaching: "ΓυμΓ41+Γ51_Κ" -> extract both classes
              const classes = [];
              if (className.includes('+')) {
                // Co-teaching format: "ΓυμΓ41+Γ51_Κ"
                const parts = className.split('+');
                classes.push(parts[0].replace(/^Γυμ/, '').replace(/_.*$/, '')); // "Γ41"
                parts.slice(1).forEach(part => {
                  classes.push(part.replace(/_.*$/, '')); // "Γ51"
                });
              } else if (className.includes('Στ.Ο.')) {
                // Στάθμη Ομαδοποίησης format: "Στ.Ο.2 (Γ51)"
                const soMatch = cellText.match(/Στ\.Ο\.\d+\s*\(([^)]+)\)/);
                if (soMatch) {
                  classes.push(soMatch[1]); // "Γ51"
                }
              } else if (className.match(/^[Α-Γ]κατ_\d+$/)) {
                // Electives format: "Γκατ_1", "Βκατ_2", etc.
                // Extract base class from student info in parentheses
                // Example: "6725 ΑΝΑΞΑΓΟΡΟΥ ΧΡΙΣΤΙΝΑ (Γ41)" -> Student belongs to Γ41
                // We need to track which students took this elective and map back to their class

                // Find the student's actual class from the HTML (indicated in parentheses)
                // This is tricky - we need to look at the student name line
                const studentInfo = pElement.text();
                const studentClassMatch = studentInfo.match(/\(([Α-Γ]\d{2})\)/);
                if (studentClassMatch) {
                  // Student belongs to this class, so add elective to their class schedule
                  classes.push(studentClassMatch[1]); // "Γ41", "Γ51", etc.
                }
              } else {
                // Regular format: "Α11_ΠΤ_Π" or "Γ51"
                classes.push(className.replace(/_.*$/, '').replace(/^Γυμ/, ''));
              }

              // Add to each class schedule
              classes.forEach(cls => {
                if (!classSchedules[cls]) {
                  classSchedules[cls] = {
                    'Δευτέρα': {},
                    'Τρίτη': {},
                    'Τετάρτη': {},
                    'Πέμπτη': {},
                    'Παρασκευή': {}
                  };
                }

                // Store the subject for this class/day/period
                if (!classSchedules[cls][day]) {
                  classSchedules[cls][day] = {};
                }

                if (!classSchedules[cls][day][period]) {
                  classSchedules[cls][day][period] = cellText;
                }
              });
            }
          }
        });
      }
    });
  }
});

console.log(`\nΕπεξεργάστηκαν ${studentsProcessed} μαθητές`);
console.log(`Βρέθηκαν ${Object.keys(classSchedules).length} τμήματα\n`);

// Convert to array format for JSON
const classSchedulesArray = Object.keys(classSchedules).sort().map(className => {
  return {
    τμήμα: className,
    σχολική_χρονιά: '2025-2026',
    πρόγραμμα: classSchedules[className]
  };
});

// Write to file
fs.writeFileSync(outputFile, JSON.stringify(classSchedulesArray, null, 2), 'utf-8');

console.log(`✅ Ολοκληρώθηκε! Το αρχείο αποθηκεύτηκε: ${outputFile}\n`);

// Display sample: Γ51 on Thursday
const g51 = classSchedulesArray.find(c => c.τμήμα === 'Γ51');
if (g51) {
  console.log('========== ΠΑΡΑΔΕΙΓΜΑ: Γ51 ΠΕΜΠΤΗ ==========\n');
  const thursdaySchedule = g51.πρόγραμμα['Πέμπτη'];
  for (let p = 1; p <= 8; p++) {
    if (thursdaySchedule[p.toString()]) {
      console.log(`✓ ${p}η ώρα: ${thursdaySchedule[p.toString()]}`);
    } else {
      console.log(`✗ ${p}η ώρα: (κενό)`);
    }
  }
  console.log('\n' + '='.repeat(60) + '\n');
}
