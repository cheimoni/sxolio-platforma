const fs = require('fs');

// Simulate the buildClassSchedule logic
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const students = JSON.parse(fs.readFileSync('./public/mathites-schedule.json', 'utf8'));
const classrooms = JSON.parse(fs.readFileSync('./public/classrooms-schedule.json', 'utf8'));

const className = 'Β31';
const day = 'Δευτέρα';
const searchClassNameUpper = className.toUpperCase();

console.log(`\n=== Testing Enhanced Schedule with Rooms for ${className} - ${day} ===\n`);

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

// Collect classroom data with room names
const classroomData = {};
const classroomRecords = classrooms.filter(c => c[''] && parseInt(c['']) >= 1 && parseInt(c['']) <= 8);
classroomRecords.forEach(record => {
  const period = record[''];
  if (record[day]) {
    const entry = record[day];
    if (entry && entry.toUpperCase().includes(searchClassNameUpper)) {
      const key = `${day}-${period}`;
      const roomName = record['Κατηγορία'];
      if (!classroomData[key]) classroomData[key] = [];
      classroomData[key].push({ room: roomName, entry: entry });
    }
  }
});

// Merge and display
console.log('=== FINAL SCHEDULE WITH ROOMS ===\n');
for (let period = 1; period <= 8; period++) {
  const key = `${day}-${period}`;
  const teacherInfo = teacherData[key];
  const classroomInfo = classroomData[key];

  if (teacherInfo && teacherInfo.length > 0) {
    teacherInfo.forEach(item => {
      let room = 'Άγνωστη αίθουσα';

      // Try to find matching classroom
      if (classroomInfo && classroomInfo.length > 0) {
        const matchingClassroom = classroomInfo.find(c =>
          c.entry.toUpperCase().includes(searchClassNameUpper)
        );
        if (matchingClassroom) {
          room = matchingClassroom.room;
        } else if (classroomInfo.length === 1) {
          room = classroomInfo[0].room;
        }
      }

      console.log(`${period}η ώρα:`);
      console.log(`  Μάθημα: ${item.subject}`);
      console.log(`  Καθηγητής: ${item.teacher}`);
      console.log(`  Αίθουσα: ${room}`);
      console.log();
    });
  } else {
    console.log(`${period}η ώρα: ΚΕΝΟ (μαθητές σε διάφορες ομάδες)`);
    console.log();
  }
}

console.log('=== End ===\n');
