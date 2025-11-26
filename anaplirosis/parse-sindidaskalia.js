const fs = require('fs');

const content = fs.readFileSync('./Συνδιδασκαλία.txt', 'utf8');
const sections = content.split(/Λύκειο Αγίου Σπυρίδωνα\s+ΣΧΟΛΙΚΗ ΧΡΟΝΙΑ: 2025-2026/).filter(s => s.trim());

const students = [];
let processedGroups = new Set();

sections.forEach(section => {
  const groupMatch = section.match(/Τμήμα\/Συνδιδασκαλία:\s+([^\n]+)/);
  if (!groupMatch) return;

  const groupName = groupMatch[1].trim();
  processedGroups.add(groupName);

  console.log(`\nProcessing: ${groupName}`);

  const allLines = section.split('\n').map(l => l.trim());
  const lines = allLines.filter(l => l);
  
  // Βελτιωμένη ανίχνευση format
  const has7DigitAM = lines.some(l => /^\d+\s+\d{7}\s+/.test(l));
  const has4DigitAM = lines.some(l => /^\d+\s+\d{4}(\s|$)/.test(l));
  const hasCombinedFormat = lines.some(l => /^\d+\s+\d{4,7}\s+[Α-ΩΑ-Ω\s]+$/.test(l));
  const hasSeparatedFormat = lines.some(l => /^\d{1,2}$/.test(l)) && lines.some(l => /^\d{4,7}$/.test(l));
  // Check για column format - χρησιμοποιούμε lines (filtered) γιατί τα headers δεν είναι κενά
  // Το "A/A ΑΜ" μπορεί να είναι σε μια γραμμή
  const hasColumnFormat = lines.some(l => l === 'A/A' || l === 'Α/Α' || l === 'ΑΜ' || l.match(/^A\/A\s+ΑΜ$/i) || l.match(/^A\/A\s*ΑΜ$/)) || 
                          lines.includes('Επίθετο') || lines.includes('Όνομα') || lines.includes('Τμήμα');
  
  // Αν έχει column format (ξεχωριστές στήλες), χρησιμοποιούμε format 3 πρώτα
  // Χρησιμοποιούμε allLines (με κενές) για format 3, lines για τα άλλα
  if (hasColumnFormat) {
    parseFormat3(allLines, groupName, students);
  } else if (has7DigitAM || hasCombinedFormat) {
    parseFormat1(lines, groupName, students);
  } else if (has4DigitAM || hasSeparatedFormat) {
    parseFormat2(lines, groupName, students);
  } else {
    // Προσπάθεια με format 3: Διαφορετική δομή
    parseFormat3(allLines, groupName, students);
  }
});

function parseFormat1(lines, groupName, students) {
  const records = [];
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(\d{7})\s+(.+)$/);
    if (match) {
      const [_, serialNum, am, lastName] = match;
      records.push({ serialNum, am, lastName });
    }
  }

  if (records.length === 0) {
    console.log('  No students found');
    return;
  }

  let firstNames = [];
  let classCodes = [];
  let inClassCodes = false;

  for (const line of lines) {
    if (line.includes('A/A') || line.includes('ΑΜ') || line.includes('Επίθετο') ||
        line.includes('Όνομα') || line.includes('Τμήμα') || line.includes('Κατάλογος') ||
        /^\d+\s+\d{7}\s+/.test(line)) {
      continue;
    }

    if (/^[Α-Γ]\d{2}$/.test(line)) {
      classCodes.push(line);
      inClassCodes = true;
      continue;
    }

    if (records.length > 0 && !inClassCodes && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length < 50) {
      firstNames.push(line);
    }
  }

  const count = Math.min(records.length, firstNames.length, classCodes.length);
  for (let i = 0; i < count; i++) {
    students.push({
      'Συνδιδασκαλία': groupName,
      'Α/Α': records[i].serialNum,
      'ΑΜ': records[i].am,
      'Επίθετο': records[i].lastName,
      'Όνομα': firstNames[i],
      'Τμήμα': classCodes[i]
    });
    console.log(`  ${records[i].serialNum}. ${records[i].am} ${records[i].lastName} ${firstNames[i]} (${classCodes[i]})`);
  }

  if (count < records.length) {
    console.log(`  ⚠️ Warning: ${records.length} records but only ${count} complete entries`);
  }
}

function parseFormat2(lines, groupName, students) {
  // Β', Γ' τάξη format
  // Structure:
  // - First student: separate lines for Α/Α, ΑΜ, Επίθετο, [NEXT STUDENT'S ΕΠΙΘΕΤΟ!], Τμήμα
  // - Rest: "number AM" on one line
  // - All lastNames for students 2-N (first student's lastName is before "Όνομα")
  // - All firstNames for students 1-N
  // - All class codes for students 2-N (first student's class is before them)

  let allSerialNums = [];
  let allAMs = [];
  let allLastNames = [];
  let allFirstNames = [];
  let allClassCodes = [];

  // Phase 1: Extract first student's data
  let firstStudentAM = null;
  let firstStudentLastName = null;
  let firstStudentClass = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find first student's AM (4-digit number after "ΑΜ" header)
    if (firstStudentAM === null && /^\d{4}$/.test(line) && i > 0 && lines[i-1] === 'ΑΜ') {
      firstStudentAM = line;
      continue;
    }

    // Find first student's last name (after "Επίθετο" header, before next name)
    if (firstStudentLastName === null && i > 0 && lines[i-1] === 'Επίθετο' && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line)) {
      firstStudentLastName = line;
      continue;
    }

    // Find first student's class (after "Τμήμα" header, before "number AM" lines)
    if (firstStudentClass === null && /^[Α-Γ]\d{2}$/.test(line) && i > 0 && (lines[i-1] === 'Τμήμα' || lines[i-1] === '')) {
      // Check if next line is "number AM" format
      if (i + 1 < lines.length && /^\d+\s+\d{4}$/.test(lines[i + 1])) {
        firstStudentClass = line;
        break;
      }
    }
  }

  // Phase 2: Extract "number AM" lines for students 2-N
  let numbersPhase = false;
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(\d{4})$/);
    if (match) {
      allSerialNums.push(match[1]);
      allAMs.push(match[2]);
      numbersPhase = true;
    } else if (numbersPhase && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length > 1 && line.length < 50) {
      // After "number AM" lines, we hit lastNames section
      break;
    }
  }

  // Phase 3: Collect all names after "number AM" section
  let collectingNames = false;
  let namesCollected = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start collecting after we see enough "number AM" lines
    if (!collectingNames && allSerialNums.length > 0) {
      // Look for first name after the last "number AM"
      const lastNumAM = allSerialNums[allSerialNums.length - 1] + ' ' + allAMs[allAMs.length - 1];
      if (lines[i - 1] === lastNumAM || (i > 2 && lines[i - 2] === lastNumAM)) {
        collectingNames = true;
      }
    }

    if (collectingNames && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length > 1 && line.length < 50) {
      namesCollected.push(line);
    }

    // Stop when we hit class codes
    if (collectingNames && /^[Α-Γ]\d{2}$/.test(line)) {
      break;
    }
  }

  // Phase 4: Collect class codes (Β31, Β32, etc.) - only for students 2-N
  let collectingClasses = false;
  for (const line of lines) {
    if (/^[Α-Γ]\d{2}$/.test(line)) {
      // Skip first student's class
      if (line === firstStudentClass && !collectingClasses) {
        continue;
      }
      allClassCodes.push(line);
      collectingClasses = true;
    } else if (collectingClasses) {
      break; // Stop after class codes section
    }
  }

  // Phase 5: Split namesCollected into lastNames and firstNames
  // First (allSerialNums.length) names are lastNames for students 2-N
  // Rest are firstNames for all students 1-N
  const numStudents = allSerialNums.length + 1; // +1 for first student
  const numLastNames2toN = allSerialNums.length;

  for (let i = 0; i < namesCollected.length; i++) {
    if (i < numLastNames2toN) {
      allLastNames.push(namesCollected[i]);
    } else {
      allFirstNames.push(namesCollected[i]);
    }
  }

  // Phase 6: Build student records
  // Student 1
  if (firstStudentAM && firstStudentLastName && firstStudentClass && allFirstNames.length > 0) {
    students.push({
      'Συνδιδασκαλία': groupName,
      'Α/Α': '1',
      'ΑΜ': firstStudentAM,
      'Επίθετο': firstStudentLastName,
      'Όνομα': allFirstNames[0],
      'Τμήμα': firstStudentClass
    });
    console.log(`  1. ${firstStudentAM} ${firstStudentLastName} ${allFirstNames[0]} (${firstStudentClass})`);
  }

  // Students 2-N
  const count = Math.min(allSerialNums.length, allAMs.length, allLastNames.length, allFirstNames.length - 1, allClassCodes.length);
  for (let i = 0; i < count; i++) {
    students.push({
      'Συνδιδασκαλία': groupName,
      'Α/Α': allSerialNums[i],
      'ΑΜ': allAMs[i],
      'Επίθετο': allLastNames[i],
      'Όνομα': allFirstNames[i + 1], // +1 because first name is for student 1
      'Τμήμα': allClassCodes[i]
    });
    console.log(`  ${allSerialNums[i]}. ${allAMs[i]} ${allLastNames[i]} ${allFirstNames[i + 1]} (${allClassCodes[i]})`);
  }

  console.log(`  ℹ️ Collected: ${allSerialNums.length + 1} total, ${allLastNames.length} lastNames, ${allFirstNames.length} firstNames, ${allClassCodes.length} classes`);
}

function parseFormat3(lines, groupName, students) {
  // Format 3: Format με ξεχωριστές στήλες (A/A, ΑΜ, Επίθετο, Όνομα, Τμήμα)
  let serialNums = [];
  let ams = [];
  let lastNames = [];
  let firstNames = [];
  let classCodes = [];
  
  let currentSection = null;
  
  // Check if we have column headers (lines may contain empty strings)
  const nonEmptyLines = lines.filter(l => l);
  // Check για "A/A ΑΜ" σε μια γραμμή ή ξεχωριστά
  const hasHeaders = nonEmptyLines.some(l => l === 'A/A' || l === 'Α/Α' || l === 'ΑΜ' || l.match(/^A\/A\s+ΑΜ$/i) || l.match(/^A\/A\s*ΑΜ$/)) ||
                    nonEmptyLines.includes('Επίθετο') || nonEmptyLines.includes('Όνομα') || nonEmptyLines.includes('Τμήμα');
  
  // If no headers, try combined format
  if (!hasHeaders) {
    for (const line of nonEmptyLines) {
      const match = line.match(/^(\d+)\s+(\d{4,7})\s+([Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+)$/);
      if (match) {
        const [, serial, am, name] = match;
        serialNums.push(serial);
        ams.push(am);
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length > 0) lastNames.push(nameParts[0]);
        if (nameParts.length > 1) firstNames.push(nameParts.slice(1).join(' '));
      }
    }
    if (serialNums.length > 0) {
      const count = Math.min(serialNums.length, ams.length, lastNames.length);
      for (let i = 0; i < count; i++) {
        students.push({
          'Συνδιδασκαλία': groupName,
          'Α/Α': serialNums[i],
          'ΑΜ': ams[i],
          'Επίθετο': lastNames[i] || '',
          'Όνομα': firstNames[i] || '',
          'Τμήμα': classCodes[i] || ''
        });
      }
      console.log(`  ✅ Βρέθηκαν ${count} μαθητές (format 3 - combined)`);
    }
    return;
  }
  
  // Debug: Check what headers we found
  const foundHeaders = nonEmptyLines.filter(l => l === 'A/A' || l === 'Α/Α' || l === 'ΑΜ' || l.match(/^A\/A\s+ΑΜ$/i) || l.match(/^A\/A\s*ΑΜ$/) || l === 'Επίθετο' || l === 'Όνομα' || l === 'Τμήμα');
  if (foundHeaders.length > 0) {
    // Headers found, proceed with column format parsing
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Αν βρούμε νέο section, σταματάμε
    if (line.includes('Τμήμα/Συνδιδασκαλία:')) {
      break;
    }
    
    // Εντοπίζουμε headers - μπορεί να είναι "A/A ΑΜ" σε μια γραμμή ή ξεχωριστά
    if (line === 'A/A' || line === 'Α/Α' || line.match(/^A\/A\s+ΑΜ$/i) || line.match(/^A\/A\s*ΑΜ$/)) {
      currentSection = 'serial';
      continue;
    } else if (line === 'ΑΜ') {
      currentSection = 'am';
      continue;
    } else if (line === 'Επίθετο') {
      currentSection = 'lastName';
      continue;
    } else if (line === 'Όνομα') {
      currentSection = 'firstName';
      continue;
    } else if (line === 'Τμήμα') {
      currentSection = 'class';
      continue;
    }
    
    // Skip κενές γραμμές
    if (line === '') {
      continue;
    }
    
    // Αν δεν είμαστε σε section, προσπαθούμε να βρούμε patterns
    if (!currentSection) {
      // Pattern 1: "number AM LastName" (combined format - serial + AM + επώνυμο)
      const match1 = line.match(/^(\d+)\s+(\d{4,7})\s+([Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+)$/);
      if (match1) {
        const [, serial, am, name] = match1;
        serialNums.push(serial);
        ams.push(am);
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length > 0) lastNames.push(nameParts[0]);
        if (nameParts.length > 1) firstNames.push(nameParts.slice(1).join(' '));
      }
      continue;
    }
    
    // Συλλέγουμε δεδομένα ανάλογα με το section
    if (currentSection === 'serial') {
      // Pattern: "number AM LastName" (serial + AM + επώνυμο σε μια γραμμή)
      const match = line.match(/^(\d+)\s+(\d{4,7})\s+([Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+)$/);
      if (match) {
        const [, serial, am, lastName] = match;
        serialNums.push(serial);
        ams.push(am);
        lastNames.push(lastName.trim());
      } else if (/^\d{1,3}$/.test(line) && parseInt(line) < 1000 && parseInt(line) > 0) {
        // Μόνο serial number
        serialNums.push(line);
      }
    } else if (currentSection === 'am' && /^\d{4,7}$/.test(line)) {
      ams.push(line);
    } else if (currentSection === 'lastName' && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]{2,}$/.test(line) && line.length < 50 && !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα|Τμήμα\/Συνδιδασκαλία:)/)) {
      lastNames.push(line);
    } else if (currentSection === 'firstName' && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]{2,}$/.test(line) && line.length < 50 && !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα|Τμήμα\/Συνδιδασκαλία:)/)) {
      firstNames.push(line);
    } else if (currentSection === 'class' && /^[Α-Γ]\d{1,2}$/.test(line)) {
      classCodes.push(line);
    } else if (currentSection && /^[Α-Γ]\d{1,2}$/.test(line)) {
      // Αν βρούμε τμήμα ενώ είμαστε σε άλλο section, το προσθέτουμε
      if (currentSection !== 'class' && classCodes.length < serialNums.length) {
        classCodes.push(line);
      }
    }
  }
  
  // Αν δεν βρήκαμε αρκετά classCodes, τα ψάχνουμε σε όλο το section
  if (classCodes.length < serialNums.length) {
    for (const line of lines) {
      if (/^[Α-Γ]\d{1,2}$/.test(line) && !classCodes.includes(line)) {
        classCodes.push(line);
        if (classCodes.length >= serialNums.length) break;
      }
    }
  }
  
  // Αν δεν βρήκαμε αρκετά firstNames, τα ψάχνουμε
  if (firstNames.length < serialNums.length) {
    for (const line of lines) {
      if (/^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]{2,}$/.test(line) && line.length < 50 && 
          !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα|Τμήμα\/Συνδιδασκαλία:)/) &&
          !lastNames.includes(line) && !firstNames.includes(line)) {
        firstNames.push(line);
        if (firstNames.length >= serialNums.length) break;
      }
    }
  }
  
  // Αν δεν βρήκαμε αρκετά lastNames, τα ψάχνουμε
  if (lastNames.length < serialNums.length) {
    for (const line of lines) {
      if (/^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]{2,}$/.test(line) && line.length < 50 && 
          !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα|Τμήμα\/Συνδιδασκαλία:)/) &&
          !lastNames.includes(line) && !firstNames.includes(line)) {
        lastNames.push(line);
        if (lastNames.length >= serialNums.length) break;
      }
    }
  }
  
  // Κατασκευάζουμε τους μαθητές
  const count = Math.min(serialNums.length, ams.length, lastNames.length);
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      students.push({
        'Συνδιδασκαλία': groupName,
        'Α/Α': serialNums[i],
        'ΑΜ': ams[i],
        'Επίθετο': lastNames[i] || '',
        'Όνομα': firstNames[i] || '',
        'Τμήμα': classCodes[i] || ''
      });
    }
    console.log(`  ✅ Βρέθηκαν ${count} μαθητές (format 3)`);
  } else {
    console.log('  ⚠️ Unknown format or no students');
  }
}

console.log(`\n✓ Total students extracted: ${students.length}`);
console.log(`✓ Total coteaching groups: ${processedGroups.size}`);

console.log('\n📋 All coteaching groups found:');
Array.from(processedGroups).sort().forEach(group => {
  const count = students.filter(s => s['Συνδιδασκαλία'] === group).length;
  console.log(`  ${group}: ${count} students`);
});

fs.writeFileSync(
  './public/students-sindidaskalia.json',
  JSON.stringify(students, null, 2),
  'utf8'
);

console.log('\n✓ Written to public/students-sindidaskalia.json');
