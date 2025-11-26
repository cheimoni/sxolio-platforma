// check-g51-thursday.js
const fs = require('fs');
const cheerio = require('cheerio');

const htmlContent = fs.readFileSync('mathites/index.html', 'utf-8');
const $ = cheerio.load(htmlContent);

const results = [];

$('h1').each((index, element) => {
  const h1Text = $(element).text().trim();

  if (h1Text === 'ΑΤΟΜΙΚΟ ΠΡΟΓΡΑΜΜΑ ΜΑΘΗΤΗ') {
    const pElement = $(element).next('p');
    const studentName = pElement.find('b').text().trim();

    const table = pElement.nextAll('table').first();
    const days = [];
    table.find('tr').first().find('td').each((i, dayEl) => {
      if (i > 0) days.push($(dayEl).text().trim());
    });

    table.find('tr').slice(1).each((i, row) => {
      const period = $(row).find('td').first().text().trim();

      if (period === '1' || period === '2') {
        $(row).find('td').slice(1).each((j, cell) => {
          const day = days[j];

          if (day === 'Πέμπτη') {
            $(cell).find('br').replaceWith(' ');
            let cellText = $(cell).text().trim().replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s\s+/g, ' ');

            if (cellText && cellText.includes('Γ51')) {
              results.push({
                student: studentName,
                period: period,
                subject: cellText
              });
            }
          }
        });
      }
    });
  }
});

console.log(`\nΒρέθηκαν ${results.length} μαθητές του Γ51 με μαθήματα την Πέμπτη 1η-2η ώρα:\n`);

if (results.length === 0) {
  console.log('❌ ΔΕΝ βρέθηκε κανένα μάθημα για το Γ51 την Πέμπτη στις περιόδους 1-2\n');
} else {
  results.forEach(r => {
    console.log(`${r.student} - ${r.period}η ώρα: ${r.subject}`);
  });
}
