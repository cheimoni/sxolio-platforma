// extract-gkat-from-teachers.js
// Script για εξαγωγή συνδιδασκαλιών τύπου "Γκατ_1" και "ΑΓΓ_6_κατ" από το teachers.json

const fs = require('fs');

const teachersFile = './src/teachers.json';
const studentsSindidaskaliaFile = './public/students-sindidaskalia.json';
const studentsAllFile = './public/students-all.json';

console.log('📖 Ανάγνωση teachers.json...');
const teachers = JSON.parse(fs.readFileSync(teachersFile, 'utf8'));

console.log('📖 Ανάγνωση students-all.json...');
const allStudents = JSON.parse(fs.readFileSync(studentsAllFile, 'utf8'));

console.log('📖 Ανάγνωση students-sindidaskalia.json...');
const sindidaskaliaStudents = JSON.parse(fs.readFileSync(studentsSindidaskaliaFile, 'utf8'));

// Βρίσκουμε όλες τις συνδιδασκαλίες τύπου "Γκατ_1" και "ΑΓΓ_6_κατ"
const coteachingGroups = new Map();

teachers.forEach(teacher => {
  const schedule = teacher.πρόγραμμα;
  if (!schedule) return;

  Object.entries(schedule).forEach(([day, periods]) => {
    if (!periods) return;

    Object.entries(periods).forEach(([period, subject]) => {
      if (!subject || subject === '-' || subject === null) return;

      // Εξάγουμε συνδιδασκαλίες τύπου "Γκατ_1 ΕΜΠ_κατ (Γ)" ή "ΑΓΓ_6_κατ" ή "βκατ_1 ΕΛΣΧ_κατ"
      // Updated pattern to capture FULL coteaching name including subject code
      const gkatFullMatch = subject.match(/([Α-Ωα-ω]+κατ_\d+\s+[Α-ΩA-Z]+_κατ\s*\([ΑΒΓ]\))/);
      const aggMatch = subject.match(/(ΑΓΓ_\d+_κατ)/);

      // Also match patterns without parentheses like "βκατ_1 ΕΛΣΧ_κατ"
      const katPatternNoParens = subject.match(/([Α-Ωα-ω]+κατ_\d+\s+[Α-ΩA-Z]+_κατ)/);

      if (gkatFullMatch) {
        const coteachingName = gkatFullMatch[1].trim();
        if (!coteachingGroups.has(coteachingName)) {
          coteachingGroups.set(coteachingName, {
            name: coteachingName,
            students: [],
            source: 'teachers.json'
          });
        }
      } else if (katPatternNoParens && !gkatFullMatch) {
        // Only use this if we didn't already match the full pattern
        const coteachingName = katPatternNoParens[1].trim();
        if (!coteachingGroups.has(coteachingName)) {
          coteachingGroups.set(coteachingName, {
            name: coteachingName,
            students: [],
            source: 'teachers.json'
          });
        }
      }

      if (aggMatch) {
        const coteachingName = aggMatch[1];
        if (!coteachingGroups.has(coteachingName)) {
          coteachingGroups.set(coteachingName, {
            name: coteachingName,
            students: [],
            source: 'teachers.json'
          });
        }
      }
    });
  });
});

console.log(`\n✅ Βρέθηκαν ${coteachingGroups.size} συνδιδασκαλίες τύπου "Γκατ" ή "ΑΓΓ":`);
coteachingGroups.forEach((group, name) => {
  console.log(`   - ${name}`);
});

// Για κάθε συνδιδασκαλία, βρίσκουμε τους μαθητές από το students-all.json
// με βάση το τμήμα που αναφέρεται στο subject (π.χ. "Γ" από "(Γ)")
coteachingGroups.forEach((group, coteachingName) => {
  console.log(`\n🔍 Αναζήτηση μαθητών για "${coteachingName}"...`);
  
  // Βρίσκουμε το subject που περιέχει αυτή τη συνδιδασκαλία
  let foundSubject = null;
  teachers.forEach(teacher => {
    const schedule = teacher.πρόγραμμα;
    if (!schedule) return;

    Object.entries(schedule).forEach(([day, periods]) => {
      if (!periods) return;
      Object.entries(periods).forEach(([period, subject]) => {
        if (subject && (subject.includes(coteachingName))) {
          foundSubject = subject;
        }
      });
    });
  });

  if (foundSubject) {
    console.log(`   Subject: "${foundSubject}"`);
    
    // Εξάγουμε το τμήμα από παρενθέσεις (π.χ. "Γ31" ή "Γ")
    const classMatch = foundSubject.match(/\(([ΑΒΓ][0-9]+)\)/);
    const singleLetterMatch = foundSubject.match(/\(([ΑΒΓ])\)/);
    
    let targetClass = null;
    if (classMatch) {
      targetClass = classMatch[1];
    } else if (singleLetterMatch) {
      targetClass = singleLetterMatch[1];
    }

    if (targetClass) {
      console.log(`   Τμήμα: "${targetClass}"`);
      
      // Αν είναι μόνο γράμμα (π.χ. "Γ"), βρίσκουμε όλους τους μαθητές που ξεκινάνε με "Γ"
      // Αν είναι πλήρες τμήμα (π.χ. "Γ31"), βρίσκουμε μόνο αυτούς
      const matchingStudents = allStudents.filter(student => {
        const studentClass = student['Τμήμα'] || student['4'] || student.classRoom || '';
        const studentClassUpper = studentClass.trim().toUpperCase();

        if (targetClass.length === 1) {
          // Μόνο γράμμα - ψάχνουμε για όλα τα τμήματα που ξεκινάνε με αυτό το γράμμα
          return studentClassUpper.startsWith(targetClass.toUpperCase());
        } else {
          // Πλήρες τμήμα - exact match
          return studentClassUpper === targetClass.toUpperCase();
        }
      });

      console.log(`   ✅ Βρέθηκαν ${matchingStudents.length} μαθητές`);
      
      // Μετατρέπουμε σε μορφή students-all.json με "Συνδιδασκαλία" field
      matchingStudents.forEach((student, index) => {
        group.students.push({
          "Συνδιδασκαλία": coteachingName,
          "Α/Α": student['Α/Α'] || student['0'] || (index + 1).toString(),
          "ΑΜ": student['ΑΜ'] || student['1'] || student.studentId || '',
          "Επίθετο": student['Επίθετο'] || student['2'] || student.lastName || '',
          "Όνομα": student['Όνομα'] || student['3'] || student.firstName || '',
          "Τμήμα": student['Τμήμα'] || student['4'] || student.classRoom || ''
        });
      });
    } else {
      console.log(`   ⚠️ Δεν βρέθηκε τμήμα στο subject`);
    }
  } else {
    console.log(`   ⚠️ Δεν βρέθηκε subject για "${coteachingName}"`);
  }
});

// Προσθέτουμε τους νέους μαθητές στο students-all.json
let newStudents = [];
coteachingGroups.forEach((group, name) => {
  if (group.students.length > 0) {
    console.log(`\n✅ Προσθήκη ${group.students.length} μαθητών για "${name}"`);
    newStudents = newStudents.concat(group.students);
  }
});

if (newStudents.length > 0) {
  // Remove duplicates from allStudents where Συνδιδασκαλία matches any of the new coteaching names
  const newCoteachingNames = new Set(newStudents.map(s => s['Συνδιδασκαλία']));
  const filteredAllStudents = allStudents.filter(s => {
    const studentCoteaching = s['Συνδιδασκαλία'];
    return !studentCoteaching || !newCoteachingNames.has(studentCoteaching);
  });

  // Merge with existing students
  const updatedStudents = [...filteredAllStudents, ...newStudents];

  fs.writeFileSync(studentsAllFile, JSON.stringify(updatedStudents, null, 2), 'utf8');
  console.log(`\n✅ Αποθηκεύτηκαν ${newStudents.length} νέοι μαθητές στο ${studentsAllFile}`);
  console.log(`📊 Σύνολο μαθητών στο JSON: ${updatedStudents.length}`);
} else {
  console.log(`\n⚠️ Δεν προστέθηκαν νέοι μαθητές`);
}

