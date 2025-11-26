// deep-check-g51.js
// Λεπτομερής έλεγχος για όλα τα μαθήματα που περιέχουν "Γ51"

const fs = require('fs');
const cheerio = require('cheerio');

const htmlContent = fs.readFileSync('mathites/index.html', 'utf-8');
const $ = cheerio.load(htmlContent);

console.log('═══════════════════════════════════════════════════════════════');
console.log('ΛΕΠΤΟΜΕΡΗΣ ΕΛΕΓΧΟΣ ΓΙΑ Γ51 - ΟΛΑ ΤΑ ΜΑΘΗΜΑΤΑ ΠΕΜΠΤΗ 1η-2η ΩΡΑ');
console.log('═══════════════════════════════════════════════════════════════\n');

let studentsInG51 = [];
let allPeriod1And2Subjects = new Set();

// Find all students
$('h1').each((index, element) => {
  const h1Text = $(element).text().trim();

  if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ') {
    const pElement = $(element).next('p');
    const studentName = pElement.find('b').text().trim();

    if (!studentName) return;

    const table = pElement.nextAll('table').first();

    // Get day headers
    const days = [];
    table.find('tr').first().find('td').each((i, dayEl) => {
      if (i > 0) days.push($(dayEl).text().trim());
    });

    // Check all periods to see if student is in G51
    let isInG51 = false;
    let period1Thursday = null;
    let period2Thursday = null;

    table.find('tr').slice(1).each((i, row) => {
      const period = $(row).find('td').first().text().trim();
      if (period) {
        $(row).find('td').slice(1).each((j, cell) => {
          const day = days[j];

          // Replace <br/> with space before extracting text
          $(cell).find('br').replaceWith(' ');
          let cellText = $(cell).text().trim().replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' ');

          if (cellText && cellText.includes('Γ51')) {
            isInG51 = true;
          }

          // Store Thursday period 1 and 2 subjects
          if (day === 'Πέμπτη') {
            if (period === '1') {
              period1Thursday = cellText || '(κενό)';
              if (cellText && cellText !== '---' && cellText !== '***') {
                allPeriod1And2Subjects.add(`1η ώρα: ${cellText}`);
              }
            }
            if (period === '2') {
              period2Thursday = cellText || '(κενό)';
              if (cellText && cellText !== '---' && cellText !== '***') {
                allPeriod1And2Subjects.add(`2η ώρα: ${cellText}`);
              }
            }
          }
        });
      }
    });

    if (isInG51) {
      studentsInG51.push({
        name: studentName,
        period1: period1Thursday,
        period2: period2Thursday
      });
    }
  }
});

console.log(`📊 ΒΡΕΘΗΚΑΝ ${studentsInG51.length} ΜΑΘΗΤΕΣ ΣΤΟ Γ51\n`);

console.log('───────────────────────────────────────────────────────────────');
console.log('ΜΑΘΗΤΕΣ Γ51 - ΤΙ ΕΧΟΥΝ ΠΕΜΠΤΗ 1η-2η ΩΡΑ:');
console.log('───────────────────────────────────────────────────────────────\n');

let hasLesson1 = 0;
let hasLesson2 = 0;
let empty1 = 0;
let empty2 = 0;

let period1Subjects = {};
let period2Subjects = {};

studentsInG51.forEach(student => {
  const p1 = student.period1;
  const p2 = student.period2;

  // Count period 1
  if (p1 && p1 !== '(κενό)' && p1 !== '---' && p1 !== '***') {
    hasLesson1++;
    period1Subjects[p1] = (period1Subjects[p1] || 0) + 1;
  } else {
    empty1++;
  }

  // Count period 2
  if (p2 && p2 !== '(κενό)' && p2 !== '---' && p2 !== '***') {
    hasLesson2++;
    period2Subjects[p2] = (period2Subjects[p2] || 0) + 1;
  } else {
    empty2++;
  }

  // Show first 10 students
  if (studentsInG51.indexOf(student) < 10) {
    console.log(`${student.name}`);
    console.log(`  1η ώρα: ${p1}`);
    console.log(`  2η ώρα: ${p2}`);
    console.log('');
  }
});

if (studentsInG51.length > 10) {
  console.log(`... και ${studentsInG51.length - 10} ακόμα μαθητές\n`);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 ΣΤΑΤΙΣΤΙΚΑ:');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`1η ΩΡΑ ΠΕΜΠΤΗ:`);
console.log(`  ✓ Έχουν μάθημα: ${hasLesson1} μαθητές`);
console.log(`  ✗ Κενό: ${empty1} μαθητές\n`);

if (Object.keys(period1Subjects).length > 0) {
  console.log(`  Μαθήματα 1ης ώρας:`);
  Object.entries(period1Subjects).forEach(([subject, count]) => {
    console.log(`    - ${subject} (${count} μαθητές)`);
  });
  console.log('');
}

console.log(`2η ΩΡΑ ΠΕΜΠΤΗ:`);
console.log(`  ✓ Έχουν μάθημα: ${hasLesson2} μαθητές`);
console.log(`  ✗ Κενό: ${empty2} μαθητές\n`);

if (Object.keys(period2Subjects).length > 0) {
  console.log(`  Μαθήματα 2ης ώρας:`);
  Object.entries(period2Subjects).forEach(([subject, count]) => {
    console.log(`    - ${subject} (${count} μαθητές)`);
  });
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('🎯 ΣΥΜΠΕΡΑΣΜΑ:');
console.log('═══════════════════════════════════════════════════════════════\n');

if (hasLesson1 === 0 && hasLesson2 === 0) {
  console.log('❌ ΚΑΝΕΝΑΣ ΜΑΘΗΤΗΣ ΤΟΥ Γ51 ΔΕΝ ΕΧΕΙ ΜΑΘΗΜΑ ΤΗΝ ΠΕΜΠΤΗ 1η-2η ΩΡΑ');
  console.log('   Το σύστημα δουλεύει σωστά με τα τρέχοντα δεδομένα!\n');
} else {
  console.log('⚠️  ΒΡΕΘΗΚΑΝ ΜΑΘΗΜΑΤΑ!');
  console.log(`   ${hasLesson1} μαθητές έχουν μάθημα 1η ώρα`);
  console.log(`   ${hasLesson2} μαθητές έχουν μάθημα 2η ώρα\n`);
}

console.log('═══════════════════════════════════════════════════════════════\n');

// Show ALL subjects in periods 1-2 Thursday (any class)
if (allPeriod1And2Subjects.size > 0) {
  console.log('📚 ΟΛΑ ΤΑ ΜΑΘΗΜΑΤΑ ΠΟΥ ΓΙΝΟΝΤΑΙ ΠΕΜΠΤΗ 1η-2η ΩΡΑ (ΟΛΑ ΤΑ ΤΜΗΜΑΤΑ):');
  console.log('───────────────────────────────────────────────────────────────\n');
  Array.from(allPeriod1And2Subjects).sort().forEach(subject => {
    console.log(`  ${subject}`);
  });
  console.log('');
}
