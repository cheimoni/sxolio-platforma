const fs = require('fs');

const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));

let count = 0;
let withClass = 0;

teachers.forEach(t => {
  const p8 = t.πρόγραμμα['Παρασκευή']?.[8];
  if (p8) {
    count++;
    if (p8 !== '***' && p8 !== '-') {
      withClass++;
      console.log(`${t.καθηγητής}: ${p8}`);
    }
  }
});

console.log(`\nΠαρασκευή 8η περίοδος:`);
console.log(`  Συνολικά entries: ${count}`);
console.log(`  Με πραγματικό μάθημα: ${withClass}`);
console.log(`  Με *** ή κενό: ${count - withClass}`);
