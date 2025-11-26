const fs = require('fs');

const support = JSON.parse(fs.readFileSync('./public/support-classes.json', 'utf8'));

const classNameToSearch = 'Στ.Ο.4 (Γ1)';
const selectedClassUpper = classNameToSearch.trim().toUpperCase();

console.log('Testing matching logic:');
console.log('Looking for:', selectedClassUpper);
console.log('');

const matchingClass = support.find(classObj => {
  const classNameUpper = classObj.className.trim().toUpperCase();
  console.log('Checking:', classNameUpper);

  // Exact match or contains
  const exactMatch = classNameUpper === selectedClassUpper;
  const contains1 = classNameUpper.includes(selectedClassUpper);
  const contains2 = selectedClassUpper.includes(classNameUpper);

  console.log('  Exact match:', exactMatch);
  console.log('  classNameUpper.includes(selectedClassUpper):', contains1);
  console.log('  selectedClassUpper.includes(classNameUpper):', contains2);
  console.log('  Result:', exactMatch || contains1 || contains2);
  console.log('');

  return exactMatch || contains1 || contains2;
});

console.log('Match found:', matchingClass ? 'YES' : 'NO');
if (matchingClass) {
  console.log('Matched class:', matchingClass.className);
  console.log('Students:', matchingClass.studentCount);
}
