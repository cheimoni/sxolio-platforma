// convert-teachers.js - Fixed version with proper cell text parsing

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'kathikitis/index.html';
const outputFile = './public/teachers.json';

console.log(`Reading file: ${inputFile}`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

const allTeachers = [];

// Find all H1 titles
$('h1').each((index, element) => {
    const h1Text = $(element).text().trim();

    // Check if this is a teacher schedule
    if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΚΑΘΗΓΗΤΗ') {
        
        // Get the next paragraph containing teacher info
        const pElement = $(element).next('p');
        const teacherName = pElement.find('b').text().trim();

        if (!teacherName) return;

        console.log(`Processing schedule for: ${teacherName}`);

        const teacherSchedule = {
            "καθηγητής": teacherName,
            "σχολική_χρονιά": "2025-2026",
            "πρόγραμμα": {}
        };

        const table = pElement.nextAll('table').first();
        const days = [];
        table.find('tr').first().find('td').each((i, dayEl) => {
            if (i > 0) days.push($(dayEl).text().trim());
        });

        teacherSchedule["πρόγραμμα"] = Object.fromEntries(days.map(day => [day, {}]));

        table.find('tr').slice(1).each((i, row) => {
            const period = $(row).find('td').first().text().trim();
            if (period) {
                $(row).find('td').slice(1).each((j, cell) => {
                    const day = days[j];
                    
                    // FIXED: Replace <br/> with space before extracting text
                    // This ensures class, subject, and room are properly separated
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
                    teacherSchedule["πρόγραμμα"][day][period] = cellText;
                });
            }
        });

        allTeachers.push(teacherSchedule);
    }
});

fs.writeFileSync(outputFile, JSON.stringify(allTeachers, null, 2), 'utf-8');

console.log(`\n✅ Completed! Found ${allTeachers.length} teacher schedules. File saved: ${outputFile}`);

