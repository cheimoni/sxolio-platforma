const fs = require('fs');

console.log('🔄 Φόρτωση XML αρχείου...\n');
const xmlData = fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.xml', 'utf8');

console.log(`📊 Μέγεθος αρχείου: ${(xmlData.length / 1024 / 1024).toFixed(2)} MB\n`);

// Εξαγωγή όλων των Worksheets (Ομάδων)
const groups = [];
const worksheetPattern = /<Worksheet\s+ss:Name="([^"]+)"[^>]*>([\s\S]*?)<\/Worksheet>/gi;
let worksheetMatch;

while ((worksheetMatch = worksheetPattern.exec(xmlData)) !== null) {
  const worksheetName = worksheetMatch[1];
  const worksheetContent = worksheetMatch[2];

  console.log(`📋 Επεξεργασία: ${worksheetName}`);

  // Εξαγωγή όλων των γραμμών (Rows)
  const rowPattern = /<Row[^>]*>([\s\S]*?)<\/Row>/gi;
  let rowMatch;
  let rowIndex = 0;
  const rows = [];

  while ((rowMatch = rowPattern.exec(worksheetContent)) !== null) {
    rowIndex++;
    const rowContent = rowMatch[1];

    // Εξαγωγή όλων των κελιών (Cells)
    const cellPattern = /<Cell[^>]*>[\s\S]*?<ss:Data[^>]*>([\s\S]*?)<\/ss:Data>[\s\S]*?<\/Cell>/gi;
    let cellMatch;
    const cells = [];

    while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
      const cellContent = cellMatch[1];

      // Καθαρισμός HTML tags από το περιεχόμενο
      const cleanContent = cellContent
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();

      if (cleanContent) {
        cells.push(cleanContent);
      }
    }

    if (cells.length > 0) {
      rows.push({
        rowNumber: rowIndex,
        cells: cells
      });
    }
  }

  // Οργάνωση δεδομένων σε δομημένη μορφή
  if (rows.length > 0) {
    const groupData = {
      groupName: worksheetName,
      title: rows[0]?.cells[0] || '',
      members: []
    };

    // Αναγνώριση headers (συνήθως γραμμή 2)
    const headers = rows[1]?.cells || [];

    // Προσθήκη μελών (από γραμμή 3 και μετά)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (row.cells.length >= 3) {
        const member = {};

        headers.forEach((header, idx) => {
          if (row.cells[idx]) {
            member[header] = row.cells[idx];
          }
        });

        // Εναλλακτική δομή αν δεν υπάρχουν headers
        if (Object.keys(member).length === 0) {
          member['A/A'] = row.cells[0] || '';
          member['ΑΜ'] = row.cells[1] || '';
          member['ΕΠΩΝΥΜΟ'] = row.cells[2] || '';
          member['ΟΝΟΜΑ'] = row.cells[3] || '';
          member['ΤΜΗΜΑ'] = row.cells[4] || '';
        }

        groupData.members.push(member);
      }
    }

    groups.push(groupData);
    console.log(`   ✓ ${groupData.members.length} μέλη\n`);
  }
}

// Δημιουργία τελικού καθαρού JSON
const finalData = {
  metadata: {
    source: 'Συνδιδασκαλία.xml',
    totalGroups: groups.length,
    totalStudents: groups.reduce((sum, g) => sum + g.members.length, 0),
    convertedAt: new Date().toISOString()
  },
  groups: groups
};

// Αποθήκευση σε JSON
const outputPath = './prokramata sxiliou/Συνδιδασκαλία.json';
fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf8');

console.log('═══════════════════════════════════════');
console.log('✅ Η μετατροπή ολοκληρώθηκε επιτυχώς!');
console.log('═══════════════════════════════════════\n');
console.log(`📁 Αποθηκεύτηκε στο: ${outputPath}\n`);
console.log(`📊 Στατιστικά:`);
console.log(`   • Σύνολο ομάδων: ${finalData.metadata.totalGroups}`);
console.log(`   • Σύνολο μαθητών: ${finalData.metadata.totalStudents}\n`);

console.log(`📋 Ομάδες:`);
groups.forEach((group, idx) => {
  console.log(`   ${idx + 1}. ${group.groupName} - ${group.members.length} μέλη`);
});

// Εμφάνιση δείγματος πρώτης ομάδας
if (groups.length > 0 && groups[0].members.length > 0) {
  console.log(`\n📌 Δείγμα πρώτων 3 μελών από "${groups[0].groupName}":`);
  groups[0].members.slice(0, 3).forEach((member, idx) => {
    console.log(`   ${idx + 1}. ${JSON.stringify(member)}`);
  });
}
