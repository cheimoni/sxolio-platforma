const fs = require('fs');

// Load data
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const studentsComplete = JSON.parse(fs.readFileSync('./public/students-complete-all.json', 'utf8'));

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

// Get all unique coteaching classes
const coteachingClasses = new Set();
studentsComplete.forEach(student => {
  if (student['Συνδιδασκαλία']) {
    coteachingClasses.add(student['Συνδιδασκαλία']);
  }
});

console.log(`Found ${coteachingClasses.size} unique coteaching classes`);

// Build coteaching data
const coteachingData = [];

coteachingClasses.forEach(className => {
  console.log(`\nProcessing: ${className}`);

  // Get students in this class
  const students = studentsComplete
    .filter(s => s['Συνδιδασκαλία'] === className)
    .map(s => ({
      am: s['ΑΜ'],
      epitheto: s['Επίθετο'],
      onoma: s['Όνομα'],
      tmima: s['Τμήμα']
    }));

  console.log(`  Students: ${students.length}`);

  // Find teacher and schedule
  const schedule = {};
  const teachersList = [];
  const rooms = new Set();

  teachers.forEach(teacher => {
    const teacherName = teacher['καθηγητής'];
    const programa = teacher['πρόγραμμα'];

    if (!programa) return;

    days.forEach(day => {
      const daySchedule = programa[day];
      if (!daySchedule) return;

      for (let period = 1; period <= 8; period++) {
        const subject = daySchedule[period.toString()];
        if (subject && subject.includes(className)) {
          if (!schedule[day]) schedule[day] = {};
          if (!schedule[day][period]) schedule[day][period] = [];

          schedule[day][period].push({
            teacher: teacherName,
            subject: subject
          });

          if (!teachersList.includes(teacherName)) {
            teachersList.push(teacherName);
          }

          // Extract room from subject (usually at the end)
          const roomMatch = subject.match(/([AB][0-9]{3}|Α[0-9]{3})/);
          if (roomMatch) {
            rooms.add(roomMatch[1]);
          }
        }
      }
    });
  });

  // Add ALL classes, even if no schedule found
  coteachingData.push({
    className: className,
    teachers: teachersList,
    schedule: schedule,
    rooms: Array.from(rooms),
    studentCount: students.length,
    students: students
  });

  if (Object.keys(schedule).length > 0) {
    console.log(`  Teachers: ${teachersList.join(', ')}`);
    console.log(`  Rooms: ${Array.from(rooms).join(', ')}`);
  } else {
    console.log(`  WARNING: No schedule found (but class added anyway)`);
  }
});

// Sort by className
coteachingData.sort((a, b) => a.className.localeCompare(b.className, 'el'));

// Save to file
fs.writeFileSync(
  './public/coteaching-classes.json',
  JSON.stringify(coteachingData, null, 2),
  'utf8'
);

console.log(`\n✅ Created coteaching-classes.json with ${coteachingData.length} classes`);

// Show first few entries
console.log('\nFirst 3 entries:');
coteachingData.slice(0, 3).forEach(entry => {
  console.log(`\n${entry.className}:`);
  console.log(`  Teachers: ${entry.teachers.join(', ')}`);
  console.log(`  Students: ${entry.studentCount}`);
  console.log(`  Rooms: ${entry.rooms.join(', ')}`);
  console.log(`  Days: ${Object.keys(entry.schedule).join(', ')}`);
});
