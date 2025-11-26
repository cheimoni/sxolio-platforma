const fs = require('fs');

// Load teachers data for schedules
const teachers = JSON.parse(fs.readFileSync('./public/teachers.json', 'utf8'));
const txtContent = fs.readFileSync('./public/tmimata-kanonika.txt', 'utf8');

const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή'];

// Collect support classes with their teachers and schedules
const supportClasses = {};

console.log('Extracting support classes from teachers...\n');

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

// Parse tmimata-kanonika.txt to get actual students for each support class
const sections = txtContent.split('Τμήμα/Συνδιδασκαλία:');

const supportClassesArray = [];

Object.keys(supportClasses).forEach(className => {
  const classData = supportClasses[className];

  // Find the section for this support class in the txt file
  const classSection = sections.find(s => {
    const normalized = s.trim().toUpperCase();
    const classNormalized = className.toUpperCase();
    return normalized.startsWith(classNormalized) || normalized.includes(classNormalized);
  });

  const students = [];

  if (classSection) {
    const lines = classSection.split('\n');

    // Custom parser for corrupted format
    // Step 1: Find all student lines with "NUMBER CORRUPTED_AM LASTNAME"
    const studentLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop at next section header
      if (line.match(/^Λύκειο|^Κατάλογος Μαθητών/)) {
        break;
      }

      // Match: "1 10000… ΑΡΙΣΤΕΙΔΟΥ" or "2 10000… ΚΧΑΛΕΝΤΙ"
      const studentMatch = line.match(/^(\d+)\s+(\d+[…\d]*)\s+([Α-ΩΑ-Ωα-ωά-ώ\s]+)$/);
      if (studentMatch) {
        studentLines.push({
          index: i,
          number: studentMatch[1],
          am: studentMatch[2].replace('…', ''),
          lastName: studentMatch[3].trim()
        });
      }
    }

    // Step 2: Find first names (they appear after all student lines)
    // Look for lines that are only Greek letters (first names)
    const firstNames = [];
    let foundStudentLines = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip headers
      if (line.match(/^A\/A|^ΑΜ|^Επίθετο|^Όνομα|^Τμήμα/)) {
        continue;
      }

      // Stop at section end
      if (line.match(/^Λύκειο|^Κατάλογος Μαθητών|^Στ\.Ο\.\.\./)) {
        break;
      }

      // If we found student lines, look for first names after them
      if (studentLines.length > 0 && i > studentLines[studentLines.length - 1].index) {
        // Match lines with only Greek letters and spaces (first names)
        if (line && line.match(/^[Α-ΩΑ-Ωα-ωά-ώ\s]+$/) && !line.match(/^\d/)) {
          firstNames.push(line);
        }
      }
    }

    // Step 3: Match students with first names by index
    for (let i = 0; i < studentLines.length; i++) {
      const student = studentLines[i];
      const firstName = firstNames[i] || '';

      if (firstName) {
        students.push({
          am: student.am,
          epitheto: student.lastName,
          onoma: firstName,
          tmima: classData.baseClass
        });
      }
    }

    console.log(`✅ ${className}: ${students.length} students (from txt file), ${classData.teachers.length} teacher(s)`);
  } else {
    console.log(`⚠️  ${className}: Section not found in txt file`);
  }

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
});

// Save to JSON
fs.writeFileSync(
  './public/support-classes.json',
  JSON.stringify(supportClassesArray, null, 2),
  'utf8'
);

console.log(`\n✅ Saved ${supportClassesArray.length} support classes to support-classes.json`);
