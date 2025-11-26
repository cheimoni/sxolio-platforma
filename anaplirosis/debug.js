// debug.js

const fs = require('fs');
const cheerio = require('cheerio');

const inputFile = 'students.html';

console.log(`--- ΕΚΚΙΝΗΣΗ ΕΛΕΓΧΟΥ ΓΙΑ ΤΟ ΑΡΧΕΙΟ: ${inputFile} ---\n`);

try {
    const htmlContent = fs.readFileSync(inputFile, 'utf-8');
    const $ = cheerio.load(htmlContent);

    console.log("## 1. Έλεγχος για τίτλους <h1>:");
    const h1s = $('h1');
    if (h1s.length > 0) {
        h1s.each((i, el) => {
            console.log(`- Βρέθηκε h1[${i}]: "${$(el).text().trim()}"`);
        });
    } else {
        console.log("- Δεν βρέθηκε κανένα tag <h1> στο αρχείο.");
    }

    console.log("\n## 2. Έλεγχος για παραγράφους <p> που περιέχουν 'ΜΑΘΗΤΗ':");
    const paragraphs = $('p');
    let foundParagraphs = 0;
    paragraphs.each((i, el) => {
        const pText = $(el).text();
        if (pText.includes('ΜΑΘΗΤΗ')) {
            foundParagraphs++;
            console.log(`- Βρέθηκε σχετική παράγραφος. Το HTML της είναι:`);
            console.log(`   ${$(el).parent().html().trim().split('\n')[0]}`); // Print the raw HTML of the found element
        }
    });

    if (foundParagraphs === 0) {
        console.log("- Δεν βρέθηκε καμία παράγραφος <p> που να περιέχει τη λέξη 'ΜΑΘΗΤΗ'.");
    }

} catch (error) {
    console.error("\n--- ΣΦΑΛΜΑ ---");
    console.error(`Δεν ήταν δυνατή η ανάγνωση του αρχείου ${inputFile}. Βεβαιωθείτε ότι υπάρχει στον σωστό φάκελο.`);
    console.error(error);
}

console.log("\n--- ΤΕΛΟΣ ΕΛΕΓΧΟΥ ---");
