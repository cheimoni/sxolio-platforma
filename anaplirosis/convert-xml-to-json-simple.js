const fs = require('fs');

// Διάβασμα XML αρχείου
console.log('Φόρτωση XML αρχείου...');
const xmlData = fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.xml', 'utf8');

console.log(`Μέγεθος αρχείου: ${(xmlData.length / 1024 / 1024).toFixed(2)} MB`);

// Απλή εξαγωγή ομάδων από XML
const groups = [];

// Regex για εύρεση ομάδων και των στοιχείων τους
// Προσαρμόζεται ανάλογα με τη δομή του XML

// Παράδειγμα 1: Αν οι ομάδες είναι σε <Group> ή <Ομάδα> tags
const groupPattern = /<(?:Group|Ομάδα|group)[^>]*>([\s\S]*?)<\/(?:Group|Ομάδα|group)>/gi;
let match;
let groupCounter = 0;

while ((match = groupPattern.exec(xmlData)) !== null) {
  groupCounter++;
  const groupContent = match[1];

  const group = {
    id: groupCounter,
    name: extractValue(groupContent, ['Name', 'name', 'Όνομα', 'Title', 'title']),
    members: extractMembers(groupContent),
    rawData: extractAllAttributes(groupContent)
  };

  groups.push(group);

  if (groupCounter <= 3) {
    console.log(`\nΟμάδα ${groupCounter}:`, group.name || 'Χωρίς όνομα');
  }
}

console.log(`\n✓ Βρέθηκαν ${groups.length} ομάδες`);

// Αν δεν βρέθηκαν ομάδες, δοκιμάζουμε άλλα patterns
if (groups.length === 0) {
  console.log('\nΔοκιμή εναλλακτικών patterns...');

  // Εύρεση όλων των tags που μπορεί να περιέχουν ομάδες
  const possibleGroupTags = [
    'Team', 'team', 'Class', 'class', 'Section', 'section',
    'Τμήμα', 'τμήμα', 'Student', 'student', 'Μαθητής'
  ];

  possibleGroupTags.forEach(tag => {
    const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let tagMatch;
    let tagCounter = 0;

    while ((tagMatch = pattern.exec(xmlData)) !== null && tagCounter < 5) {
      tagCounter++;
      const content = tagMatch[1];

      const group = {
        id: `${tag}-${tagCounter}`,
        type: tag,
        name: extractValue(content, ['Name', 'name', 'Όνομα', 'Title', 'title', 'ID', 'id']),
        data: extractAllAttributes(content)
      };

      groups.push(group);
    }

    if (tagCounter > 0) {
      console.log(`  - Βρέθηκαν ${tagCounter} <${tag}> στοιχεία`);
    }
  });
}

// Δημιουργία καθαρού JSON
const cleanData = {
  metadata: {
    source: 'Συνδιδασκαλία.xml',
    totalGroups: groups.length,
    convertedAt: new Date().toISOString()
  },
  groups: groups
};

// Αποθήκευση σε JSON
const outputPath = './prokramata sxiliou/Συνδιδασκαλία.json';
fs.writeFileSync(outputPath, JSON.stringify(cleanData, null, 2), 'utf8');

console.log(`\n✓ Η μετατροπή ολοκληρώθηκε!`);
console.log(`✓ Αποθηκεύτηκε στο: ${outputPath}`);
console.log(`\n📊 Σύνολο ομάδων: ${groups.length}`);

// Εμφάνιση δείγματος
if (groups.length > 0) {
  console.log(`\n📋 Δείγμα πρώτης ομάδας:`);
  console.log(JSON.stringify(groups[0], null, 2).substring(0, 500) + '...');
}

// === Helper Functions ===

function extractValue(content, possibleTags) {
  for (const tag of possibleTags) {
    const pattern = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
    const match = content.match(pattern);
    if (match) return match[1].trim();

    // Προσπάθεια για attribute
    const attrPattern = new RegExp(`${tag}="([^"]*)"`, 'i');
    const attrMatch = content.match(attrPattern);
    if (attrMatch) return attrMatch[1].trim();
  }
  return null;
}

function extractMembers(content) {
  const members = [];
  const memberPatterns = [
    /<(?:Member|Student|Μαθητής|Μέλος)[^>]*>([\s\S]*?)<\/(?:Member|Student|Μαθητής|Μέλος)>/gi,
  ];

  memberPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const memberContent = match[1];
      members.push({
        name: extractValue(memberContent, ['Name', 'name', 'Όνομα', 'FullName', 'fullname']),
        id: extractValue(memberContent, ['ID', 'id', 'StudentID', 'ΑΜ', 'αμ']),
        details: extractAllAttributes(memberContent)
      });
    }
  });

  return members;
}

function extractAllAttributes(content) {
  const attrs = {};

  // Εξαγωγή όλων των XML tags
  const tagPattern = /<([a-zA-Zα-ωΑ-Ω_][a-zA-Zα-ωΑ-Ω0-9_-]*)[^>]*>([^<]*)<\/\1>/gi;
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    if (value && !attrs[key]) {
      attrs[key] = value;
    }
  }

  // Εξαγωγή attributes
  const attrPattern = /([a-zA-Zα-ωΑ-Ω_][a-zA-Zα-ωΑ-Ω0-9_-]*)="([^"]*)"/gi;
  while ((match = attrPattern.exec(content)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    if (value && !attrs[key]) {
      attrs[key] = value;
    }
  }

  return attrs;
}
