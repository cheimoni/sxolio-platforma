// convert-pdf-sindidaskalia-v2.js
// Μετατροπή PDF σε JSON - χρησιμοποιεί το TXT αν το PDF δεν λειτουργεί

const fs = require('fs');

const inputPdf = './prokramata sxiliou/Συνδιδασκαλία.pdf';
const inputTxt = './Συνδιδασκαλία.txt';
const outputFile = './public/students-sindidaskalia.json';

console.log(`📖 Μετατροπή σε JSON...\n`);

// Χρησιμοποιούμε το TXT αρχείο (πιο αξιόπιστο)
let content = fs.readFileSync(inputTxt, 'utf8');

// Χωρίζουμε σε sections
const sections = content.split(/Λύκειο Αγίου Σπυρίδωνα\s+ΣΧΟΛΙΚΗ ΧΡΟΝΙΑ: 2025-2026/).filter(s => s.trim());

console.log(`📋 Βρέθηκαν ${sections.length} sections\n`);

const students = [];
let processedGroups = new Set();

sections.forEach((section, sectionIndex) => {
  const groupMatch = section.match(/Τμήμα\/Συνδιδασκαλία:\s+([^\n]+)/);
  if (!groupMatch) return;
  
  const groupName = groupMatch[1].trim();
  processedGroups.add(groupName);
  
  console.log(`\n📋 Processing: "${groupName}"`);
  
  const lines = section.split('\n').map(l => l.trim());
  const nonEmptyLines = lines.filter(l => l);
  
  // Βελτιωμένη ανίχνευση format
  const has7DigitAM = nonEmptyLines.some(l => /^\d+\s+\d{7}\s+/.test(l));
  const has4DigitAM = nonEmptyLines.some(l => /^\d+\s+\d{4}(\s|$)/.test(l));
  const hasCombinedFormat = nonEmptyLines.some(l => /^\d+\s+\d{4,7}\s+[Α-ΩΑ-Ω\s]+$/.test(l));
  const hasSeparatedFormat = nonEmptyLines.some(l => /^\d{1,2}$/.test(l)) && nonEmptyLines.some(l => /^\d{4,7}$/.test(l));
  const hasColumnFormat = nonEmptyLines.includes('A/A') || nonEmptyLines.includes('Α/Α') || nonEmptyLines.includes('ΑΜ') || nonEmptyLines.includes('Επίθετο') || nonEmptyLines.includes('Όνομα') || nonEmptyLines.includes('Τμήμα');
  
  // Αν έχει column format (ξεχωριστές στήλες), χρησιμοποιούμε format 3 πρώτα
  // Χρησιμοποιούμε lines (με κενές) για format 3, nonEmptyLines για τα άλλα
  if (hasColumnFormat) {
    parseFormat3(lines, groupName, students);
  } else if (has7DigitAM || hasCombinedFormat) {
    parseFormat1(nonEmptyLines, groupName, students);
  } else if (has4DigitAM || hasSeparatedFormat) {
    parseFormat2(nonEmptyLines, groupName, students);
  } else {
    parseFormat3(lines, groupName, students);
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
    console.log('  ⚠️ No students found in format 1');
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
    
    if (/^[Α-Γ]\d{1,2}$/.test(line)) {
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
      'Καθηγητής': groupName,
      'A/A': records[i].serialNum,
      'ΑΜ': records[i].am,
      'Επίθετο': records[i].lastName,
      'Όνομα': firstNames[i],
      'Τμήμα': classCodes[i]
    });
  }
  
  console.log(`  ✅ Βρέθηκαν ${count} μαθητές`);
}

function parseFormat2(lines, groupName, students) {
  // Βελτιωμένη έκδοση format 2
  let allSerialNums = [];
  let allAMs = [];
  let allLastNames = [];
  let allFirstNames = [];
  let allClassCodes = [];
  
  let firstStudentAM = null;
  let firstStudentLastName = null;
  let firstStudentFirstName = null;
  let firstStudentClass = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (firstStudentAM === null && /^\d{4}$/.test(line) && i > 0 && lines[i-1] === 'ΑΜ') {
      firstStudentAM = line;
      continue;
    }
    
    if (firstStudentLastName === null && i > 0 && lines[i-1] === 'Επίθετο' && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line)) {
      firstStudentLastName = line;
      continue;
    }
    
    if (firstStudentFirstName === null && i > 0 && lines[i-1] === 'Όνομα' && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line)) {
      firstStudentFirstName = line;
      continue;
    }
    
    if (firstStudentClass === null && /^[Α-Γ]\d{1,2}$/.test(line) && i > 0 && (lines[i-1] === 'Τμήμα' || lines[i-1] === '')) {
      if (i + 1 < lines.length && /^\d+\s+\d{4}$/.test(lines[i + 1])) {
        firstStudentClass = line;
        break;
      }
    }
  }
  
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(\d{4})$/);
    if (match) {
      allSerialNums.push(match[1]);
      allAMs.push(match[2]);
    }
  }
  
  let collectingNames = false;
  let namesCollected = [];
  let foundLastNumAM = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!foundLastNumAM && allSerialNums.length > 0) {
      const lastNumAM = `${allSerialNums[allSerialNums.length - 1]} ${allAMs[allAMs.length - 1]}`;
      if (line === lastNumAM) {
        foundLastNumAM = true;
        collectingNames = true;
        continue;
      }
    }
    
    if (collectingNames && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length > 1 && line.length < 50 && !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα)/)) {
      namesCollected.push(line);
    }
    
    if (collectingNames && /^[Α-Γ]\d{1,2}$/.test(line)) {
      break;
    }
  }
  
  let collectingClasses = false;
  for (const line of lines) {
    if (/^[Α-Γ]\d{1,2}$/.test(line)) {
      if (line === firstStudentClass && !collectingClasses) {
        continue;
      }
      allClassCodes.push(line);
      collectingClasses = true;
    } else if (collectingClasses) {
      break;
    }
  }
  
  const numLastNames2toN = allSerialNums.length;
  for (let i = 0; i < namesCollected.length; i++) {
    if (i < numLastNames2toN) {
      allLastNames.push(namesCollected[i]);
    } else {
      allFirstNames.push(namesCollected[i]);
    }
  }
  
  if (firstStudentAM && firstStudentLastName && firstStudentClass) {
    students.push({
      'Καθηγητής': groupName,
      'A/A': '1',
      'ΑΜ': firstStudentAM,
      'Επίθετο': firstStudentLastName,
      'Όνομα': firstStudentFirstName || allFirstNames[0] || '',
      'Τμήμα': firstStudentClass
    });
  }
  
  const count = Math.min(allSerialNums.length, allAMs.length, allLastNames.length, allFirstNames.length, allClassCodes.length);
  for (let i = 0; i < count; i++) {
    students.push({
      'Καθηγητής': groupName,
      'A/A': allSerialNums[i],
      'ΑΜ': allAMs[i],
      'Επίθετο': allLastNames[i],
      'Όνομα': allFirstNames[i] || '',
      'Τμήμα': allClassCodes[i] || ''
    });
  }
  
  const total = (firstStudentAM ? 1 : 0) + count;
  console.log(`  ✅ Βρέθηκαν ${total} μαθητές`);
}

function parseFormat3(lines, groupName, students) {
  // Format 3: Format με ξεχωριστές στήλες (A/A, ΑΜ, Επίθετο, Όνομα, Τμήμα)
  let serialNums = [];
  let ams = [];
  let lastNames = [];
  let firstNames = [];
  let classCodes = [];
  
  let currentSection = null;
  
  // Debug: Check if we have column headers
  const hasHeaders = lines.some(l => l === 'A/A' || l === 'Α/Α' || l === 'ΑΜ' || l === 'Επίθετο' || l === 'Όνομα' || l === 'Τμήμα');
  if (!hasHeaders) {
    // No column format, return early
    return;
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Αν βρούμε νέο section, σταματάμε
    if (line.includes('Τμήμα/Συνδιδασκαλία:')) {
      break;
    }
    
    // Εντοπίζουμε headers
    if (line.match(/^(A\/A|Α\/Α)$/)) {
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
    
    // Αν δεν είμαστε σε section, προσπαθούμε να βρούμε patterns
    if (!currentSection) {
      // Pattern: "number AM LastName" (combined format)
      const match = line.match(/^(\d+)\s+(\d{4,7})\s+([Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+)$/);
      if (match) {
        const [, serial, am, name] = match;
        serialNums.push(serial);
        ams.push(am);
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length > 0) lastNames.push(nameParts[0]);
        if (nameParts.length > 1) firstNames.push(nameParts.slice(1).join(' '));
      }
      continue;
    }
    
    // Skip κενές γραμμές (αλλά συνεχίζουμε στο ίδιο section)
    if (line === '') {
      continue;
    }
    
    // Συλλέγουμε δεδομένα ανάλογα με το section
    if (currentSection === 'serial' && /^\d{1,3}$/.test(line) && parseInt(line) < 1000 && parseInt(line) > 0) {
      serialNums.push(line);
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
    } else if (currentSection && line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα)/)) {
      // Αν βρούμε νέο header ενώ είμαστε σε section, αλλάζουμε section
      // (αυτό δεν θα πρέπει να συμβεί, αλλά για ασφάλεια)
      continue;
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
        'Καθηγητής': groupName,
        'A/A': serialNums[i],
        'ΑΜ': ams[i],
        'Επίθετο': lastNames[i] || '',
        'Όνομα': firstNames[i] || '',
        'Τμήμα': classCodes[i] || ''
      });
    }
    console.log(`  ✅ Βρέθηκαν ${count} μαθητές (format 3)`);
  } else {
    // Debug info
    console.log(`  ⚠️ No students found - serialNums: ${serialNums.length}, ams: ${ams.length}, lastNames: ${lastNames.length}, firstNames: ${firstNames.length}, classCodes: ${classCodes.length}`);
  }
}

console.log(`\n✓ Total students extracted: ${students.length}`);
console.log(`✓ Total coteaching groups: ${processedGroups.size}`);

console.log('\n📋 All coteaching groups found:');
Array.from(processedGroups).sort().forEach(group => {
  const count = students.filter(s => s['Καθηγητής'] === group).length;
  console.log(`  ${group}: ${count} students`);
});

fs.writeFileSync(
  outputFile,
  JSON.stringify(students, null, 2),
  'utf8'
);

console.log(`\n✅ Written to ${outputFile}`);

