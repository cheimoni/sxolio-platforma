const fs = require('fs');

const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

console.log('Μέγιστη περίοδος με πραγματικό μάθημα (όχι *** ή -):');
console.log('='.repeat(60));

days.forEach(day => {
  let maxPeriod = 0;
  let teachersWithMax = [];

  teachers.forEach(teacher => {
    const daySchedule = teacher.πρόγραμμα?.[day];
    if (daySchedule) {
      Object.entries(daySchedule).forEach(([period, subject]) => {
        // Αγνοούμε *** και - (δεν είναι πραγματικά μαθήματα)
        if (subject && subject !== '***' && subject !== '-') {
          const periodNum = parseInt(period);
          if (!isNaN(periodNum)) {
            if (periodNum > maxPeriod) {
              maxPeriod = periodNum;
              teachersWithMax = [teacher.καθηγητής];
            } else if (periodNum === maxPeriod) {
              teachersWithMax.push(teacher.καθηγητής);
            }
          }
        }
      });
    }
  });

  console.log(`\n${day}: ${maxPeriod} περίοδοι`);
  console.log(`  Καθηγητές με μάθημα στην ${maxPeriod}η: ${teachersWithMax.length}`);
  if (teachersWithMax.length <= 5) {
    teachersWithMax.forEach(t => console.log(`    - ${t}`));
  } else {
    teachersWithMax.slice(0, 3).forEach(t => console.log(`    - ${t}`));
    console.log(`    ... και ${teachersWithMax.length - 3} ακόμα`);
  }
});
