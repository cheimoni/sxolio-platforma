// convert-coteaching.js

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'coteaching.html';
const outputFile = './src/coteaching.json';

console.log(`Ανάγνωση αρχείου: ${inputFile}`);

const htmlContent = fs.readFileSync(inputFile, 'utf-8');
const $ = cheerio.load(htmlContent);

const coTeachingData = [];
const table = $('table').first();

table.find('tr').slice(1).each((i, row) => { // slice(1) to skip header row
    const cells = $(row).find('td');
    
    if (cells.length === 5) {
        const entry = {
            "τμήματα": $(cells[0]).text().trim(),
            "μάθημα": $(cells[1]).text().trim(),
            "καθηγητές": $(cells[2]).text().trim().replace(/\s\s+/g, ' '),
            "ημέρα": $(cells[3]).text().trim(),
            "ώρα": $(cells[4]).text().trim()
        };
        coTeachingData.push(entry);
    }
});

fs.writeFileSync(outputFile, JSON.stringify(coTeachingData, null, 2), 'utf-8');

console.log(`\n✅ Ολοκληρώθηκε! Βρέθηκαν ${coTeachingData.length} εγγραφές συνδιδασκαλίας.`);
console.log(`Το αρχείο αποθηκεύτηκε: ${outputFile}`);