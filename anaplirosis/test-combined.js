const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./prokramata sxiliou/combined_schedule_with_teachers_and_students.json', 'utf8'));

console.log('Total rooms:', Object.keys(data).length);

// Find rooms where Β31 has classes
const b31rooms = [];
Object.keys(data).forEach(room => {
  const sched = data[room].schedule;
  Object.keys(sched).forEach(day => {
    sched[day].forEach(entry => {
      if (entry.includes('Β31')) {
        if (!b31rooms.includes(room)) {
          b31rooms.push(room);
        }
      }
    });
  });
});

console.log('\nRooms with Β31:', b31rooms.join(', '));

// Show detailed schedule for Β31 on Monday
console.log('\n=== Β31 Schedule from combined file ===\n');
b31rooms.forEach(room => {
  const sched = data[room].schedule;
  Object.keys(sched).forEach(day => {
    const dayData = sched[day];
    dayData.forEach((entry, index) => {
      if (entry.includes('Β31')) {
        console.log(`Room ${room}, ${day}: ${entry}`);
        // Show next entries (teacher, etc)
        if (index + 1 < dayData.length) {
          console.log(`  -> ${dayData[index + 1]}`);
        }
      }
    });
  });
});
