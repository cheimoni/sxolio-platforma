const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/students-sindidaskalia.json', 'utf8'));

console.log('A24 students with Γ (coteaching):\n');

const a24 = data.filter(s => s['Τμήμα'] === 'Α24');

a24.forEach(s => {
  const lastName = s['Επίθετο'] || '';
  const firstName = s['Όνομα'] || '';
  const initials = (lastName.charAt(0) || '') + '.' + (firstName.charAt(0) || '') + '.';

  console.log(`${lastName} ${firstName} (${initials})`);

  // Check if initials match Ν.Κ.
  if (lastName.startsWith('Ν') && firstName.startsWith('Κ')) {
    console.log('  ⭐ This could be Ν.Κ.!');
  }
});
