// convert-students.js (ΔΙΟΡΘΩΜΕΝΟ)

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'students.html';
const outputFile = './src/students.json';

console.log(`Ανάγνωση αρχείου: ${inputFile}`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

const allSchedules = [];

// Αλλαγή: Ψάχνουμε όλες τις παραγράφους και ελέγχουμε το κείμενό τους
$('p.s1').each((index, element) => {
    const pText = $(element).text();

    if (pText.includes('ΣΤΟΙΧΕΙΑ ΜΑΘΗΤΗ:')) {
        const studentName = $(element).find('b').text().trim();
        if (!studentName) return;

        console.log(`Επεξεργασία προγράμματος για: ${studentName}`);

        const studentSchedule = {
            "μαθητής": studentName,
            "σχολική_χρονιά": "2025-2026",
            "πρόγραμμα": {}
        };

        const table = $(element).nextAll('table').first();
        const days = [];
        table.find('tr').first().find('td').each((i, dayEl) => {
            if (i > 0) days.push($(dayEl).text().trim());
        });

        studentSchedule["πρόγραμμα"] = Object.fromEntries(days.map(day => [day, {}]));

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
                    studentSchedule["πρόγραμμα"][day][period] = cellText;
                });
            }
        });

        allSchedules.push(studentSchedule);
    }
});

fs.writeFileSync(outputFile, JSON.stringify(allSchedules, null, 2), 'utf-8');

console.log(`\n✅ Ολοκληρώθηκε! Βρέθηκαν ${allSchedules.length} προγράμματα. Το αρχείο αποθηκεύτηκε: ${outputFile}`);