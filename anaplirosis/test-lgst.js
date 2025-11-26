const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('./prokramata sxiliou/Συνδιδασκαλία.html', 'utf8');
const $ = cheerio.load(html);

let found = 0;
$('p, h1').each((i, el) => {
  const txt = $(el).text();
  if (txt.includes('ΛΓΣΤ') || txt.includes('βκατ_2')) {
    console.log(`Found in <${el.name}>:`);
    console.log(txt.substring(0, 300));
    console.log('---');
    found++;
  }
});

console.log(`\nTotal found: ${found}`);
