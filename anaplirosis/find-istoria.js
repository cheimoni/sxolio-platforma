const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.html', 'utf8');
const $ = cheerio.load(html);

let found = 0;
$('p, h1').each((i, el) => {
  const txt = $(el).text();
  if (txt.includes('Ιστορία') && txt.includes('κατ')) {
    console.log('Found:', txt.substring(0, 200));
    found++;
  }
});

console.log('\nTotal found:', found);
