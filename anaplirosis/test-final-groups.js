const fs = require('fs');

// Simulate the complete buildClassSchedule logic
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const students = JSON.parse(fs.readFileSync('./public/mathites-schedule.json', 'utf8'));
const classrooms = JSON.parse(fs.readFileSync('./public/classrooms-schedule.json', 'utf8'));

const className = 'Β31';
const day = 'Δευτέρα';
const searchClassNameUpper = className.toUpperCase();

console.log(`\n=== Τελικό Πρόγραμμα ${className} - ${day} (με ομάδες) ===\n`);

// Collect teacher data
const teacherData = {};
teachers.forEach(teacher => {
  const daySchedule = teacher.πρόγραμμα?.[day];
  if (!daySchedule) return;
  for (let period = 1; period <= 8; period++) {
    const subject = daySchedule[period.toString()];
    if (subject && subject.trim() !== '-' && subject.toUpperCase().includes(searchClassNameUpper)) {
      const key = `${day}-${period}`;
      if (!teacherData[key]) teacherData[key] = [];
      teacherData[key].push({ teacher: teacher.καθηγητής, subject: subject });
    }
  }
});

// Collect student group data
const studentGroupData = {};
const classStudents = students.filter(s => {
  const kategoria = s['Κατηγορία'] || '';
  return kategoria.includes(`(${className})`);
});

const uniqueStudents = [...new Set(classStudents.map(s => s['Κατηγορία']))];

for (let period = 1; period <= 8; period++) {
  const key = `${day}-${period}`;
  const subjectsInPeriod = new Map();

  uniqueStudents.forEach(studentId => {
    const studentRecords = students.filter(s => s['Κατηγορία'] === studentId);
    const periodRecord = studentRecords.find(r => r[''] === period.toString());

    if (periodRecord && periodRecord[day]) {
      const subject = periodRecord[day].trim();
      if (subject) {
        if (!subjectsInPeriod.has(subject)) {
          subjectsInPeriod.set(subject, 0);
        }
        subjectsInPeriod.set(subject, subjectsInPeriod.get(subject) + 1);
      }
    }
  });

  if (subjectsInPeriod.size > 1) {
    // Students are split - this is a group period
    studentGroupData[key] = Array.from(subjectsInPeriod.entries()).map(([subject, count]) => ({
      subject: subject,
      studentCount: count
    }));
  }
}

// Display final schedule
console.log('=== ΤΕΛΙΚΟ ΠΡΟΓΡΑΜΜΑ ===\n');
for (let period = 1; period <= 8; period++) {
  const key = `${day}-${period}`;

  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║ ${period}η ΩΡΑ${' '.repeat(52)}║`);
  console.log(`╠═══════════════════════════════════════════════════════════╣`);

  if (teacherData[key]) {
    // Regular class - all students together
    teacherData[key].forEach(item => {
      console.log(`║ Μάθημα: ${item.subject.padEnd(47)}║`);
      console.log(`║ Καθηγητής: ${item.teacher.padEnd(44)}║`);
    });
  } else if (studentGroupData[key]) {
    // Students split into groups
    console.log(`║ ΟΜΑΔΕΣ ΣΥΝΔΙΔΑΣΚΑΛΙΑΣ/ELECTIVES${' '.repeat(27)}║`);
    console.log(`╠═══════════════════════════════════════════════════════════╣`);
    studentGroupData[key].forEach((group, idx) => {
      // Extract room from subject
      const roomMatch = group.subject.match(/([A-ZΑ-Ω][0-9]{3}|[A-ZΑ-Ω]{2,}[0-9]{1,3}|Γηπ[0-9])/);
      const room = roomMatch ? roomMatch[0] : 'N/A';

      console.log(`║ Ομάδα ${idx + 1}: ${group.subject.substring(0, 40).padEnd(40)}║`);
      console.log(`║   └─ ${group.studentCount} μαθητές → Αίθουσα ${room.padEnd(30)}║`);
      if (idx < studentGroupData[key].length - 1) {
        console.log(`║${' '.repeat(59)}║`);
      }
    });
  } else {
    console.log(`║ (Δεν υπάρχουν δεδομένα)${' '.repeat(35)}║`);
  }

  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log();
}

console.log('=== Τέλος ===\n');
