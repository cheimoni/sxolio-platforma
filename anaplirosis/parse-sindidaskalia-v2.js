const fs = require('fs');

// Read the Συνδιδασκαλία.txt file
const content = fs.readFileSync('./Συνδιδασκαλία.txt', 'utf8');

// Split by sections
const sections = content.split(/Λύκειο Αγίου Σπυρίδωνα\s+ΣΧΟΛΙΚΗ ΧΡΟΝΙΑ: 2025-2026/).filter(s => s.trim());

const students = [];
let processedGroups = new Set();

sections.forEach(section => {
  const groupMatch = section.match(/Τμήμα\/Συνδιδασκαλία:\s+([^\n]+)/);
  if (!groupMatch) return;

  const groupName = groupMatch[1].trim();
  processedGroups.add(groupName);

  console.log(`\nProcessing: ${groupName}`);

  const lines = section.split('\n').map(l => l.trim()).filter(l => l);

  // Detect format type by checking if we have 7-digit or 4-digit AMs
  const has7DigitAM = lines.some(l => /^\d+\s+\d{7}\s+/.test(l));
  const has4DigitAM = lines.some(l => /^\d+\s+\d{4}(\s|$)/.test(l));

  if (has7DigitAM) {
    // Α' τάξη format: "number AM LASTNAME" all in one line
    parseFormat1(lines, groupName, students);
  } else if (has4DigitAM) {
    // Β', Γ' τάξη format: separated sections
    parseFormat2(lines, groupName, students);
  } else {
    console.log('  Unknown format or no students');
  }
});

function parseFormat1(lines, groupName, students) {
  // Format 1: Α' τάξη - "number AM LASTNAME" in one line
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip headers and record lines
    if (line.includes('A/A') || line.includes('ΑΜ') || line.includes('Επίθετο') ||
        line.includes('Όνομα') || line.includes('Τμήμα') || line.includes('Κατάλογος') ||
        /^\d+\s+\d{7}\s+/.test(line)) {
      continue;
    }

    // Class codes
    if (/^[Α-Γ]\d{2}$/.test(line)) {
      classCodes.push(line);
      inClassCodes = true;
      continue;
    }

    // First names
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
  // Format 2: Β', Γ' τάξη - separated sections
  // First student has full format, rest have "number AM" only

  let serialNums = [];
  let ams = [];
  let lastNames = [];
  let firstNames = [];
  let classCodes = [];

  let collectingLastNames = false;
  let collectingFirstNames = false;
  let collectingClassCodes = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip headers
    if (line === 'A/A' || line === 'ΑΜ' || line === 'Επίθετο' ||
        line === 'Όνομα' || line === 'Τμήμα' || line.includes('Κατάλογος')) {
      if (line === 'Επίθετο') collectingLastNames = true;
      if (line === 'Όνομα') {
        collectingLastNames = false;
        collectingFirstNames = true;
      }
      if (line === 'Τμήμα') {
        collectingFirstNames = false;
        collectingClassCodes = true;
      }
      continue;
    }

    // Pattern: "number AM" (subsequent students)
    const amMatch = line.match(/^(\d+)\s+(\d{4})$/);
    if (amMatch) {
      serialNums.push(amMatch[1]);
      ams.push(amMatch[2]);
      continue;
    }

    // Pattern: single number (serial number)
    if (/^\d+$/.test(line) && line.length <= 3 && serialNums.length === 0) {
      // This might be the first serial number
      continue;
    }

    // Pattern: 4-digit AM alone
    if (/^\d{4}$/.test(line) && line.length === 4) {
      ams.push(line);
      continue;
    }

    // Pattern: class code (Α11, Β31, etc.)
    if (/^[Α-Γ]\d{2}$/.test(line)) {
      classCodes.push(line);
      continue;
    }

    // Pattern: Name (Greek uppercase letters)
    if (/^[Α-ΩΆΈΉΊΌΎΏΪΫ\s…]+$/.test(line) && line.length > 1 && line.length < 50) {
      if (collectingLastNames) {
        lastNames.push(line);
      } else if (collectingFirstNames || (!collectingLastNames && lastNames.length > 0)) {
        firstNames.push(line);
      } else {
        lastNames.push(line);
      }
    }
  }

  // Match up the data
  const count = Math.min(serialNums.length, ams.length, lastNames.length, firstNames.length, classCodes.length);

  if (count === 0) {
    console.log('  No students found');
    return;
  }

  for (let i = 0; i < count; i++) {
    students.push({
      'Συνδιδασκαλία': groupName,
      'Α/Α': serialNums[i],
      'ΑΜ': ams[i],
      'Επίθετο': lastNames[i] || '???',
      'Όνομα': firstNames[i] || '???',
      'Τμήμα': classCodes[i]
    });
    console.log(`  ${serialNums[i]}. ${ams[i]} ${lastNames[i]} ${firstNames[i]} (${classCodes[i]})`);
  }

  console.log(`  ℹ️ Collected: ${serialNums.length} nums, ${ams.length} AMs, ${lastNames.length} lastNames, ${firstNames.length} firstNames, ${classCodes.length} classes`);
}

console.log(`\n✓ Total students extracted: ${students.length}`);
console.log(`✓ Total coteaching groups: ${processedGroups.size}`);

// Show all unique coteaching groups
console.log('\n📋 All coteaching groups found:');
Array.from(processedGroups).sort().forEach(group => {
  const count = students.filter(s => s['Συνδιδασκαλία'] === group).length;
  console.log(`  ${group}: ${count} students`);
});

// Write to JSON
fs.writeFileSync(
  './public/students-sindidaskalia.json',
  JSON.stringify(students, null, 2),
  'utf8'
);

console.log('\n✓ Written to public/students-sindidaskalia.json');
