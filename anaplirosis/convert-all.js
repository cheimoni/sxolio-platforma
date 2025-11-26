// convert-all.js

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'master.html'; // The big file with EVERYTHING in it

console.log(`Reading master file: ${inputFile}`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

const allTeachers = [];
const allStudents = [];
const allClassrooms = [];

// Find every H1 title in the document
$('h1').each((index, element) => {
    const h1Text = $(element).text().trim();
    const pElement = $(element).next('p');
    const table = pElement.nextAll('table').first();
    
    // Skip if there's no table after the title block
    if (table.length === 0) return;

    let scheduleData = {
        "πρόγραμμα": {}
    };
    let entityName = pElement.find('b').text().trim();
    let entityType = '';

    // Determine the type of schedule based on the H1 text
    if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ') {
        scheduleData["καθηγητής"] = entityName;
        entityType = 'teacher';
    } else if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ') {
        scheduleData["μαθητής"] = entityName;
        entityType = 'student';
    } else if (h1Text === 'ΠΡΟΓΡΑΜΜΑ ΑΙΘΟΥΣΑΣ') {
        scheduleData["αίθουσα"] = entityName;
        entityType = 'classroom';
    } else {
        return; // Not a schedule we recognize, so skip
    }

    if (!entityName) return; // Skip if the name is blank
    console.log(`Processing ${entityType}: ${entityName}`);
    
    const days = [];
    table.find('tr').first().find('td').each((i, dayEl) => {
        if (i > 0) days.push($(dayEl).text().trim());
    });

    scheduleData["πρόγραμμα"] = Object.fromEntries(days.map(day => [day, {}]));

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
                scheduleData["πρόγραμμα"][day][period] = cellText;
            });
        }
    });
    
    // Add the processed schedule to the correct array
    if (entityType === 'teacher') allTeachers.push(scheduleData);
    if (entityType === 'student') allStudents.push(scheduleData);
    if (entityType === 'classroom') allClassrooms.push(scheduleData);
});

// Write all the files
fs.writeFileSync('./src/teachers.json', JSON.stringify(allTeachers, null, 2), 'utf-8');
console.log(`\n✅ Wrote ${allTeachers.length} teacher schedules to ./src/teachers.json`);

fs.writeFileSync('./src/students.json', JSON.stringify(allStudents, null, 2), 'utf-8');
console.log(`✅ Wrote ${allStudents.length} student schedules to ./src/students.json`);

fs.writeFileSync('./src/classrooms.json', JSON.stringify(allClassrooms, null, 2), 'utf-8');
console.log(`✅ Wrote ${allClassrooms.length} classroom schedules to ./src/classrooms.json`);

console.log("\nAll files converted successfully!");