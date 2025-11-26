const fs = require('fs');

// Load all three data sources
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const students = JSON.parse(fs.readFileSync('./public/mathites-schedule.json', 'utf8'));
const classrooms = JSON.parse(fs.readFileSync('./public/classrooms-schedule.json', 'utf8'));

const className = 'Β31';
const day = 'Δευτέρα';

console.log(`\n=== Testing Merged Schedule for ${className} - ${day} ===\n`);

// 1. Check teacher data
console.log('--- FROM TEACHERS.JSON ---');
const teacherData = {};
teachers.forEach(teacher => {
  const daySchedule = teacher.πρόγραμμα?.[day];
  if (!daySchedule) return;

  for (let period = 1; period <= 8; period++) {
    const subject = daySchedule[period.toString()];
    if (!subject || subject === '***' || subject === '-') continue;

    const subjectUpper = subject.toUpperCase();
    if (subjectUpper.includes(className)) {
      teacherData[period] = { teacher: teacher.καθηγητής, subject };
      console.log(`Period ${period}: "${subject}" (${teacher.καθηγητής})`);
    }
  }
});

// 2. Check student data
console.log('\n--- FROM MATHITES-SCHEDULE.JSON ---');
const classStudents = students.filter(s => {
  const kategoria = s['Κατηγορία'] || '';
  return kategoria.includes(`(${className})`);
});

// Get unique student IDs
const uniqueStudents = [...new Set(classStudents.map(s => s['Κατηγορία']))];
console.log(`Total students in ${className}:`, uniqueStudents.length);

// For each period, check what subjects students have
const studentData = {};
for (let period = 1; period <= 8; period++) {
  const subjectsInPeriod = new Set();

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
    if (subject.toUpperCase().includes(className)) {
      studentData[period] = subject;
      console.log(`Period ${period}: All students have "${subject}"`);
    } else {
      console.log(`Period ${period}: All students have same elective: "${subject}"`);
    }
  } else if (subjectsInPeriod.size > 1) {
    console.log(`Period ${period}: Students have ${subjectsInPeriod.size} different subjects (electives)`);
  } else {
    console.log(`Period ${period}: No data`);
  }
}

// 3. Check classroom data
console.log('\n--- FROM CLASSROOMS-SCHEDULE.JSON ---');
const classroomData = {};
for (let period = 1; period <= 8; period++) {
  const classroomRecord = classrooms.find(c => c[''] === period.toString());
  if (classroomRecord && classroomRecord[day]) {
    const entry = classroomRecord[day];
    if (entry && entry.toUpperCase().includes(className)) {
      classroomData[period] = entry;
      console.log(`Period ${period}: "${entry}"`);
    }
  }
}

// 4. Merge all three sources
console.log('\n--- MERGED SCHEDULE ---');
for (let period = 1; period <= 8; period++) {
  if (teacherData[period]) {
    console.log(`${period}η ώρα: ${teacherData[period].subject} (${teacherData[period].teacher})`);
  } else if (studentData[period] || classroomData[period]) {
    const subject = studentData[period] || classroomData[period];
    console.log(`${period}η ώρα: ${subject} (Άγνωστος καθηγητής)`);
  } else {
    console.log(`${period}η ώρα: ΚΕΝΟ`);
  }
}

console.log('\n=== Test Complete ===\n');
