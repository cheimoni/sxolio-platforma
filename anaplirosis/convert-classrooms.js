// convert-classrooms.js (ΕΝΑΛΛΑΚΤΙΚΗ ΠΡΟΣΕΓΓΙΣΗ)

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'classrooms.html';
const outputFile = './src/classrooms.json';

console.log(`Ανάγνωση αρχείου: ${inputFile}`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

const allSchedules = [];

// Νέα λογική: Βρίσκουμε κάθε τίτλο H1
$('h1').each((index, element) => {
    const h1Text = $(element).text().trim();

    // Αν ο τίτλος είναι "ΠΡΟΓΡΑΜΜΑ ΑΙΘΟΥΣΑΣ"
    if (h1Text === 'ΠΡΟΓΡΑΜΜΑ ΑΙΘΟΥΣΑΣ') {
        
        // Βρίσκουμε την επόμενη παράγραφο <p> που περιέχει τα στοιχεία
        const pElement = $(element).next('p.s1');
        const classroomName = pElement.find('b').text().trim();

        if (!classroomName) return; // Αν δεν βρεθεί όνομα, προχωράμε

        console.log(`Επεξεργασία προγράμματος για αίθουσα: ${classroomName}`);

        const classroomSchedule = {
            "αίθουσα": classroomName,
            "σχολική_χρονιά": "2025-2026",
            "πρόγραμμα": {}
        };

        const table = pElement.nextAll('table').first();
        const days = [];
        table.find('tr').first().find('td').each((i, dayEl) => {
            if (i > 0) days.push($(dayEl).text().trim());
        });

        classroomSchedule["πρόγραμμα"] = Object.fromEntries(days.map(day => [day, {}]));

        table.find('tr').slice(1).each((i, row) => {
            const period = $(row).find('td').first().text().trim();
            if (period) {
                $(row).find('td').slice(1).each((j, cell) => {
                    const day = days[j];
                    
                    // FIXED: Replace <br/> with space before extracting text
                    $(cell).find('br').replaceWith(' ');
                    
                    const pTags = $(cell).find('p');
                    let cellText = '';
                    
                    if (pTags.length > 0) {
                        // Join all p tags with space to preserve structure
                        cellText = pTags.map((idx, p) => $(p).text().trim()).get().join(' ');
                    } else {
                        // Fallback to direct text if no p tags
                        cellText = $(cell).text().trim();
                    }
                    
                    // Clean up: remove multiple spaces and newlines
                    cellText = cellText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' ').trim();
                    
                    if (cellText === '' || cellText.includes('---') || cellText.includes('***')) {
                        cellText = null;
                    }
                    classroomSchedule["πρόγραμμα"][day][period] = cellText;
                });
            }
        });

        allSchedules.push(classroomSchedule);
    }
});

fs.writeFileSync(outputFile, JSON.stringify(allSchedules, null, 2), 'utf-8');

console.log(`\n✅ Ολοκληρώθηκε! Βρέθηκαν ${allSchedules.length} προγράμματα. Το αρχείο αποθηκεύτηκε: ${outputFile}`);
