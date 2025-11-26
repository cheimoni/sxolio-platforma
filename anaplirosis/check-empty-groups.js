const fs = require('fs');

console.log('🔍 Έλεγχος ομάδων συνδιδασκαλίας...\n');

// Φόρτωση ομάδων
const groupsA = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Α_Τάξη.json', 'utf8'));
const groupsB = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Β_Τάξη.json', 'utf8'));
const groupsC = JSON.parse(fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία_Γ_Τάξη.json', 'utf8'));

// Φόρτωση μαθητών με ομάδες
const studentsComplete = JSON.parse(fs.readFileSync('public/students-complete-all.json', 'utf8'));

// Συλλογή όλων των ομάδων που χρησιμοποιούνται
const usedGroups = new Set();
studentsComplete.forEach(student => {
  if (student.ΛεπτομέρειεςΟμάδας) {
    const key = `${student.ΛεπτομέρειεςΟμάδας.className}_${student.ΛεπτομέρειεςΟμάδας.groupId}`;
    usedGroups.add(key);
  }
});

function checkGroups(groups, className, classLabel) {
  console.log(`\n${classLabel}:`);
  console.log('═'.repeat(50));

  let emptyCount = 0;
  let unusedCount = 0;

  groups.groups.forEach((group, index) => {
    const groupKey = `${className}_${index + 1}`;
    const memberCount = group.members?.length || 0;
    const isUsed = usedGroups.has(groupKey);

    if (memberCount === 0) {
      emptyCount++;
      console.log(`❌ Ομάδα ${index + 1} (${group.groupName}): ΚΕΝΗ - 0 μέλη`);
      console.log(`   Title: ${group.title}`);
    } else if (!isUsed) {
      unusedCount++;
      console.log(`⚠️  Ομάδα ${index + 1} (${group.groupName}): ${memberCount} μέλη αλλά ΔΕΝ ΒΡΕΘΗΚΑΝ μαθητές`);
      console.log(`   Title: ${group.title}`);

      // Δείγμα πρώτου μέλους για debug
      if (group.members[0]) {
        console.log(`   Πρώτο μέλος:`, JSON.stringify(group.members[0]).substring(0, 150));
      }
    }
  });

  console.log(`\n📊 Σύνοψη ${classLabel}:`);
  console.log(`   • Σύνολο ομάδων: ${groups.groups.length}`);
  console.log(`   • Κενές ομάδες: ${emptyCount}`);
  console.log(`   • Ομάδες με μέλη αλλά χωρίς μαθητές: ${unusedCount}`);
  console.log(`   • Ομάδες που χρησιμοποιούνται: ${groups.groups.length - emptyCount - unusedCount}`);
}

checkGroups(groupsA, 'Α', '🔵 Α\' ΤΑΞΗ');
checkGroups(groupsB, 'Β', '🟢 Β\' ΤΑΞΗ');
checkGroups(groupsC, 'Γ', '🟡 Γ\' ΤΑΞΗ');

// Συνολικά στατιστικά
console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('📊 ΓΕΝΙΚΑ ΣΤΑΤΙΣΤΙΚΑ:');
console.log('═══════════════════════════════════════════════════════════');

const totalGroups = groupsA.groups.length + groupsB.groups.length + groupsC.groups.length;
console.log(`\n• Σύνολο ομάδων: ${totalGroups}`);
console.log(`• Ομάδες που χρησιμοποιούνται: ${usedGroups.size}`);
console.log(`• Ομάδες που ΔΕΝ χρησιμοποιούνται: ${totalGroups - usedGroups.size}`);

// Λίστα μοναδικών ομάδων που χρησιμοποιούνται
console.log(`\n📋 Ομάδες που χρησιμοποιούνται από μαθητές:`);
const sortedUsed = Array.from(usedGroups).sort();
sortedUsed.forEach(key => {
  const [cls, id] = key.split('_');
  const count = studentsComplete.filter(s =>
    s.ΛεπτομέρειεςΟμάδας?.className === cls &&
    s.ΛεπτομέρειεςΟμάδας?.groupId === parseInt(id)
  ).length;
  console.log(`   ${key}: ${count} εγγραφές μαθητών`);
});
