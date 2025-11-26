const fs = require('fs');

// Load classrooms with period numbers
const classrooms = JSON.parse(fs.readFileSync('./public/classrooms-schedule.json', 'utf8'));
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const students = JSON.parse(fs.readFileSync('./public/mathites-schedule.json', 'utf8'));

const className = 'Β31';
const day = 'Δευτέρα';

console.log(`\n=== Complete Analysis for ${className} - ${day} ===\n`);

// 1. From classrooms - find which rooms have Β31 and at what periods
console.log('--- FROM CLASSROOMS (with periods) ---');
const classroomSchedule = {};
for (let period = 1; period <= 8; period++) {
  const periodRecords = classrooms.filter(c => c[''] === period.toString());
  periodRecords.forEach(record => {
    if (record[day] && record[day].includes(className)) {
      const room = record['Κατηγορία'];
      const entry = record[day];
      console.log(`Period ${period}, Room ${room}: ${entry}`);
      classroomSchedule[period] = { room, entry };
    }
  });
}

// 2. From teachers - find who teaches Β31
console.log('\n--- FROM TEACHERS ---');
const teacherSchedule = {};
teachers.forEach(teacher => {
  const daySchedule = teacher.πρόγραμμα?.[day];
  if (!daySchedule) return;

  for (let period = 1; period <= 8; period++) {
    const subject = daySchedule[period.toString()];
    if (subject && subject.toUpperCase().includes(className)) {
      console.log(`Period ${period}: ${subject} (${teacher.καθηγητής})`);
      teacherSchedule[period] = { teacher: teacher.καθηγητής, subject };
    }
  }
});

// 3. From students - find what all students do
console.log('\n--- FROM STUDENTS ---');
const classStudents = students.filter(s => {
  const kategoria = s['Κατηγορία'] || '';
  return kategoria.includes(`(${className})`);
});

const uniqueStudents = [...new Set(classStudents.map(s => s['Κατηγορία']))];
console.log(`Total students in ${className}:`, uniqueStudents.length);

for (let period = 1; period <= 8; period++) {
  const subjectsInPeriod = new Set();
  const roomsInPeriod = new Set();

  uniqueStudents.forEach(studentId => {
    const studentRecords = students.filter(s => s['Κατηγορία'] === studentId);
    const periodRecord = studentRecords.find(r => r[''] === period.toString());

    if (periodRecord && periodRecord[day]) {
      const subject = periodRecord[day].trim();
      if (subject) {
        subjectsInPeriod.add(subject);
      }
    }
  });

  if (subjectsInPeriod.size === 1) {
    const subject = Array.from(subjectsInPeriod)[0];
    console.log(`Period ${period}: All students → "${subject}"`);
  } else if (subjectsInPeriod.size > 1) {
    console.log(`Period ${period}: Students split into ${subjectsInPeriod.size} different groups`);
    Array.from(subjectsInPeriod).forEach(s => {
      console.log(`  - ${s}`);
    });
  }
}

// 4. MERGED VIEW
console.log('\n--- FINAL MERGED SCHEDULE ---');
for (let period = 1; period <= 8; period++) {
  const teacherInfo = teacherSchedule[period];
  const classroomInfo = classroomSchedule[period];

  if (teacherInfo) {
    const room = classroomInfo ? classroomInfo.room : 'Unknown room';
    console.log(`${period}η ώρα: ${teacherInfo.subject}`);
    console.log(`         Καθηγητής: ${teacherInfo.teacher}, Αίθουσα: ${room}`);
  } else {
    console.log(`${period}η ώρα: ΚΕΝΟ (μαθητές σε διάφορες ομάδες)`);
  }
}

console.log('\n=== End ===\n');
