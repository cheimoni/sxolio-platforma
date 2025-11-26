// convert-pdf-sindidaskalia-final.js
// ΑΚΡΙΒΗΣ μετατροπή PDF Συνδιδασκαλίας σε JSON
// Διαβάζει το PDF και μετατρέπει σε JSON με βελτιωμένη λογική

const fs = require('fs');
const pdf = require('pdf-parse');

const inputPdf = './prokramata sxiliou/Συνδιδασκαλία.pdf';
const inputTxt = './Συνδιδασκαλία.txt'; // Fallback αν το PDF δεν λειτουργεί
const outputFile = './public/students-sindidaskalia.json';

console.log(`📖 Μετατροπή PDF σε JSON...\n`);

// Προσπαθούμε πρώτα να διαβάσουμε το PDF
let content = null;
let usePdf = false;

(async () => {
try {
  console.log(`📄 Διαβάζω PDF: ${inputPdf}`);
  const dataBuffer = fs.readFileSync(inputPdf);
  const pdfData = await pdf(dataBuffer);
  console.log(`✅ PDF διαβάστηκε: ${pdfData.numpages} σελίδες, ${pdfData.text.length} χαρακτήρες\n`);
  content = pdfData.text;
  usePdf = true;
} catch (error) {
  console.log(`⚠️ Δεν μπόρεσα να διαβάσω το PDF: ${error.message}`);
  console.log(`📄 Χρησιμοποιώ TXT fallback: ${inputTxt}\n`);
  content = fs.readFileSync(inputTxt, 'utf8');
  usePdf = false;
}

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
  
  const lines = section.split('\n').map(l => l.trim()).filter(l => l);
  
  // Βελτιωμένη ανίχνευση format
  const has7DigitAM = lines.some(l => /^\d+\s+\d{7}\s+/.test(l));
  const has4DigitAM = lines.some(l => /^\d+\s+\d{4}(\s|$)/.test(l));
  const hasCombinedFormat = lines.some(l => /^\d+\s+\d{4,7}\s+[Α-ΩΑ-Ω\s]+$/.test(l));
  
  if (has7DigitAM || hasCombinedFormat) {
    parseFormat1(lines, groupName, students);
  } else if (has4DigitAM) {
    parseFormat2(lines, groupName, students);
  } else {
    // Προσπάθεια με format 3: Διαφορετική δομή
    parseFormat3(lines, groupName, students);
  }
});

function parseFormat1(lines, groupName, students) {
  const records = [];
  for (const line of lines) {
    // Pattern: "1 1286104 ΓΑΒΡΙΛΙΔΟΥ" ή "1 1286104 ΓΑΒΡΙΛΙΔΟΥ ΚΩΝΣΤΑΝΤΙΝΑ"
    const match = line.match(/^(\d+)\s+(\d{7})\s+(.+)$/);
    if (match) {
      const [_, serialNum, am, namePart] = match;
      // Το namePart μπορεί να είναι μόνο επώνυμο ή επώνυμο + όνομα
      const nameParts = namePart.trim().split(/\s+/);
      const lastName = nameParts[0];
      const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      records.push({ serialNum, am, lastName, firstName });
    }
  }
  
  if (records.length === 0) {
    console.log('  ⚠️ No students found in format 1');
    return;
  }
  
  // Αν δεν έχουμε firstNames, τα ψάχνουμε σε ξεχωριστές γραμμές
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
    
    if (records.length > 0 && !inClassCodes && /^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length < 50 && !line.match(/^\d+$/)) {
      firstNames.push(line);
    }
  }
  
  // Αν έχουμε firstNames από records, τα χρησιμοποιούμε
  const recordsWithFirstName = records.filter(r => r.firstName);
  if (recordsWithFirstName.length > 0) {
    // Χρησιμοποιούμε τα firstNames από records
    const count = Math.min(records.length, classCodes.length);
    for (let i = 0; i < count; i++) {
      students.push({
        'Καθηγητής': groupName,
        'A/A': records[i].serialNum,
        'ΑΜ': records[i].am,
        'Επίθετο': records[i].lastName,
        'Όνομα': records[i].firstName || firstNames[i] || '',
        'Τμήμα': classCodes[i] || ''
      });
    }
  } else {
    // Χρησιμοποιούμε τα firstNames από ξεχωριστές γραμμές
    const count = Math.min(records.length, firstNames.length, classCodes.length);
    for (let i = 0; i < count; i++) {
      students.push({
        'Καθηγητής': groupName,
        'A/A': records[i].serialNum,
        'ΑΜ': records[i].am,
        'Επίθετο': records[i].lastName,
        'Όνομα': firstNames[i] || '',
        'Τμήμα': classCodes[i] || ''
      });
    }
  }
  
  console.log(`  ✅ Βρέθηκαν ${Math.min(records.length, firstNames.length || records.filter(r => r.firstName).length, classCodes.length)} μαθητές`);
}

function parseFormat2(lines, groupName, students) {
  // Β', Γ' τάξη format - βελτιωμένη έκδοση
  let allSerialNums = [];
  let allAMs = [];
  let allLastNames = [];
  let allFirstNames = [];
  let allClassCodes = [];
  
  // Phase 1: Extract first student
  let firstStudentAM = null;
  let firstStudentLastName = null;
  let firstStudentClass = null;
  let firstStudentFirstName = null;
  
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
  
  // Phase 2: Extract "number AM" lines
  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(\d{4})$/);
    if (match) {
      allSerialNums.push(match[1]);
      allAMs.push(match[2]);
    }
  }
  
  // Phase 3: Collect names
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
  
  // Phase 4: Collect class codes
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
  
  // Phase 5: Split names
  const numLastNames2toN = allSerialNums.length;
  for (let i = 0; i < namesCollected.length; i++) {
    if (i < numLastNames2toN) {
      allLastNames.push(namesCollected[i]);
    } else {
      allFirstNames.push(namesCollected[i]);
    }
  }
  
  // Phase 6: Build records
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
  // Format 3: Προσπάθεια να βρούμε μαθητές με οποιοδήποτε format
  let found = false;
  
  // Προσπάθεια 1: Ψάχνουμε για "number AM LastName" patterns
  const records = [];
  for (const line of lines) {
    // Pattern: "1 1286104" ή "1 1286" ή "1 1286104 ΓΑΒΡΙΛΙΔΟΥ"
    const match1 = line.match(/^(\d+)\s+(\d{4,7})(\s+([Α-ΩΑ-Ω\s]+))?$/);
    if (match1 && !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα)/)) {
      const [, serialNum, am, , namePart] = match1;
      if (namePart) {
        const nameParts = namePart.trim().split(/\s+/);
        records.push({
          serialNum,
          am,
          lastName: nameParts[0],
          firstName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : null
        });
        found = true;
      } else {
        records.push({ serialNum, am, lastName: null, firstName: null });
      }
    }
  }
  
  if (found && records.length > 0) {
    // Ψάχνουμε για ονόματα και τμήματα
    let firstNames = [];
    let classCodes = [];
    
    for (const line of lines) {
      if (/^[Α-Γ]\d{1,2}$/.test(line)) {
        classCodes.push(line);
      } else if (/^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length < 50 && !line.match(/^(A\/A|Α\/Α|ΑΜ|Επίθετο|Όνομα|Τμήμα)/)) {
        firstNames.push(line);
      }
    }
    
    const count = Math.min(records.length, firstNames.length, classCodes.length);
    for (let i = 0; i < count; i++) {
      if (records[i].lastName) {
        students.push({
          'Καθηγητής': groupName,
          'A/A': records[i].serialNum,
          'ΑΜ': records[i].am,
          'Επίθετο': records[i].lastName,
          'Όνομα': records[i].firstName || firstNames[i] || '',
          'Τμήμα': classCodes[i] || ''
        });
      }
    }
    
    if (count > 0) {
      console.log(`  ✅ Βρέθηκαν ${count} μαθητές (format 3)`);
      return;
    }
  }
  
  console.log('  ⚠️ Unknown format or no students');
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
})();

