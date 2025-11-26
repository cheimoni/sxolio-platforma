const fs = require('fs');

// Load data
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const studentsAll = JSON.parse(fs.readFileSync('./public/students-complete-all.json', 'utf8'));

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

// Collect support classes with their teachers and schedules
const supportClasses = {};

console.log('Extracting support classes...\n');

teachers.forEach(teacher => {
  const teacherName = teacher['καθηγητής'];
  const programa = teacher['πρόγραμμα'];

  if (!programa) return;

  days.forEach(day => {
    const daySchedule = programa[day];
    if (!daySchedule) return;

    for (let period = 1; period <= 8; period++) {
      const subject = daySchedule[period.toString()];
      if (!subject || subject === '***' || subject.trim() === '-') continue;

      // Match support classes: "Στ.Ο.4 (Γ1)" or "Στ. 13 (Β1)"
      const supportMatch = subject.match(/^(Στ\.?\s*Ο?\.?\s*[0-9]+)\s*\(([ΑΒΓ][0-9]+)\)/);
      if (supportMatch) {
        const fullClassName = `${supportMatch[1]} (${supportMatch[2]})`;
        const baseClass = supportMatch[2]; // "Γ1", "Β1", etc.

        if (!supportClasses[fullClassName]) {
          supportClasses[fullClassName] = {
            className: fullClassName,
            baseClass: baseClass,
            teachers: [],
            schedule: [],
            rooms: new Set()
          };
        }

        // Add teacher if not already added
        if (!supportClasses[fullClassName].teachers.includes(teacherName)) {
          supportClasses[fullClassName].teachers.push(teacherName);
        }

        // Add schedule
        const roomMatch = subject.match(/([A-ZΑ-Ω][0-9]+|Γηπ[0-9]|Βιβλ)$/);
        const room = roomMatch ? roomMatch[1] : '';

        supportClasses[fullClassName].schedule.push({
          day,
          period,
          teacher: teacherName,
          room
        });

        if (room) {
          supportClasses[fullClassName].rooms.add(room);
        }
      }
    }
  });
});

// For each support class, find students from the base class
const supportClassesArray = [];

Object.keys(supportClasses).forEach(className => {
  const classData = supportClasses[className];

  // Get students from the base class (e.g., all Γ1 students)
  const baseClassStudents = studentsAll.filter(s => s['Τμήμα'] === classData.baseClass);

  const students = baseClassStudents.map(s => ({
    am: s['ΑΜ'],
    epitheto: s['Επίθετο'],
    onoma: s['Όνομα'],
    tmima: s['Τμήμα']
  }));

  supportClassesArray.push({
    className: classData.className,
    baseClass: classData.baseClass,
    teachers: classData.teachers,
    schedule: classData.schedule,
    rooms: Array.from(classData.rooms),
    studentCount: students.length,
    students: students,
    type: 'support'
  });

  console.log(`✅ ${className}: ${students.length} students (from ${classData.baseClass}), ${classData.teachers.length} teacher(s)`);
});

// Save to JSON
fs.writeFileSync(
  './public/support-classes.json',
  JSON.stringify(supportClassesArray, null, 2),
  'utf8'
);

console.log(`\n✅ Saved ${supportClassesArray.length} support classes to support-classes.json`);
