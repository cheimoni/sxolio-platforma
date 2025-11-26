const fs = require('fs');

// Read the new teachers JSON (array format with rows per period)
const rawData = fs.readFileSync('./prokramata sxiliou/kathikites.json', 'utf8');
const periods = JSON.parse(rawData);

// Group by teacher name
const teacherMap = {};

periods.forEach(period => {
  const teacherName = period['Κατηγορία'];
  const periodNum = period[''];

  if (!teacherName || !periodNum) return;

  if (!teacherMap[teacherName]) {
    teacherMap[teacherName] = {
      καθηγητής: teacherName,
      πρόγραμμα: {
        Δευτέρα: {},
        Τρίτη: {},
        Τετάρτη: {},
        Πέμπτη: {},
        Παρασκευή: {}
      }
    };
  }

  const teacher = teacherMap[teacherName];
  const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

  days.forEach(day => {
    const value = period[day];
    if (value && value !== '---' && value.trim() !== '') {
      teacher.πρόγραμμα[day][periodNum] = value;
    }
  });
});

// Convert to array
const teachers = Object.values(teacherMap);

console.log(`Found ${teachers.length} teachers`);

// Write to public/teachers.json
fs.writeFileSync(
  './public/teachers.json',
  JSON.stringify(teachers, null, 2),
  'utf8'
);

console.log('✓ Created public/teachers.json');

// Test: Find a specific teacher
const testTeacher = teachers.find(t => t.καθηγητής.includes('ΓΑΒΡΙΗΛ'));
if (testTeacher) {
  console.log('\nTest teacher found:', testTeacher.καθηγητής);
  console.log('Monday schedule:', testTeacher.πρόγραμμα.Δευτέρα);
}
