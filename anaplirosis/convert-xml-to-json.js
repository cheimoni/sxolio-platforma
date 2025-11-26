const fs = require('fs');
const xml2js = require('xml2js');

// Διάβασμα XML αρχείου
const xmlData = fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.xml', 'utf8');

// Parser για μετατροπή XML σε JSON
const parser = new xml2js.Parser({
  explicitArray: false,
  mergeAttrs: true,
  trim: true
});

parser.parseString(xmlData, (err, result) => {
  if (err) {
    console.error('Σφάλμα κατά την ανάλυση XML:', err);
    return;
  }

  // Καθαρισμός και οργάνωση δεδομένων
  const cleanData = processData(result);

  // Αποθήκευση σε JSON αρχείο
  fs.writeFileSync(
    './prokramata sxiliou/Συνδιδασκαλία.json',
    JSON.stringify(cleanData, null, 2),
    'utf8'
  );

  console.log('✓ Η μετατροπή ολοκληρώθηκε!');
  console.log(`✓ Δημιουργήθηκε το αρχείο: Συνδιδασκαλία.json`);

  // Εκτύπωση στατιστικών
  if (cleanData.groups) {
    console.log(`\n📊 Στατιστικά:`);
    console.log(`   Σύνολο ομάδων: ${cleanData.groups.length}`);
    cleanData.groups.forEach((group, idx) => {
      console.log(`   Ομάδα ${idx + 1}: ${group.name || 'Χωρίς όνομα'} - ${group.members?.length || 0} μέλη`);
    });
  }
});

function processData(data) {
  // Καθαρή δομή JSON με έμφαση στις ομάδες
  const processed = {
    metadata: {},
    groups: []
  };

  // Επεξεργασία ανάλογα με τη δομή του XML
  // Αυτό θα προσαρμοστεί μόλις δούμε τη δομή

  if (data.root) {
    data = data.root;
  }

  // Αν υπάρχουν ομάδες
  if (data.groups) {
    const groups = Array.isArray(data.groups) ? data.groups : [data.groups];
    processed.groups = groups.map(group => cleanGroup(group));
  } else if (data.group) {
    const groups = Array.isArray(data.group) ? data.group : [data.group];
    processed.groups = groups.map(group => cleanGroup(group));
  } else {
    // Αναζήτηση ομάδων σε όλα τα επίπεδα
    processed.groups = findGroups(data);
  }

  return processed;
}

function cleanGroup(group) {
  const cleaned = {};

  // Βασικές πληροφορίες ομάδας
  if (group.name || group.Name || group.NAME) {
    cleaned.name = group.name || group.Name || group.NAME;
  }

  if (group.id || group.Id || group.ID) {
    cleaned.id = group.id || group.Id || group.ID;
  }

  // Μέλη ομάδας
  if (group.members || group.member || group.students || group.student) {
    const members = group.members || group.member || group.students || group.student;
    cleaned.members = Array.isArray(members) ? members : [members];
  }

  // Άλλα attributes
  Object.keys(group).forEach(key => {
    if (!['name', 'Name', 'NAME', 'id', 'Id', 'ID', 'members', 'member', 'students', 'student'].includes(key)) {
      cleaned[key] = group[key];
    }
  });

  return cleaned;
}

function findGroups(obj, groups = []) {
  if (!obj || typeof obj !== 'object') return groups;

  Object.keys(obj).forEach(key => {
    if (key.toLowerCase().includes('group') || key.toLowerCase().includes('ομάδα')) {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach(item => groups.push(cleanGroup(item)));
      } else {
        groups.push(cleanGroup(value));
      }
    } else if (typeof obj[key] === 'object') {
      findGroups(obj[key], groups);
    }
  });

  return groups;
}
