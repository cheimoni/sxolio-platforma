const fs = require('fs');
const path = require('path');

const publicDir = './public';
const pdfButton = '            <a href="ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf" class="nav-button" target="_blank">📄 Όλες οι Οδηγίες (PDF)</a>';

// Find all HTML files that have navigation buttons
const htmlFiles = [
    'Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.html'
];

console.log('🔧 Προσθέτω κουμπί PDF σε HTML αρχεία...');

htmlFiles.forEach(filename => {
    const filepath = path.join(publicDir, filename);
    
    if (fs.existsSync(filepath)) {
        try {
            let content = fs.readFileSync(filepath, 'utf8');
            
            // Check if PDF button already exists
            if (content.includes('Όλες οι Οδηγίες (PDF)')) {
                console.log(`✅ Το κουμπί υπάρχει ήδη στο: ${filename}`);
                return;
            }
            
            // Add PDF button before closing </div> of nav-buttons
            const navEndPattern = /(\s+)<\/div>(\s*<\/div>)/;
            const replacement = `$1${pdfButton}\n$1</div>$2`;
            
            if (content.match(navEndPattern)) {
                content = content.replace(navEndPattern, replacement);
                fs.writeFileSync(filepath, content, 'utf8');
                console.log(`✅ Προστέθηκε κουμπί PDF στο: ${filename}`);
            } else {
                console.log(`⚠️  Δεν βρέθηκε navigation στο: ${filename}`);
            }
            
        } catch (error) {
            console.log(`❌ Σφάλμα με το αρχείο ${filename}: ${error.message}`);
        }
    } else {
        console.log(`⚠️  Δεν βρέθηκε: ${filename}`);
    }
});

console.log('\n📋 Λίστα όλων των PDF αρχείων που πρέπει να ενωθούν:');
const pdfFiles = [
    'greek_odigos_ipodoxis.pdf',
    'orarioleitourgias.pdf', 
    'sxolia .pdf',
    'Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).pdf',
    'Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.pdf',
    'Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf',
    'Γραφεία ΔΟ.pdf',
    'Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf',
    'Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf',
    'Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf',
    'ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf'
];

pdfFiles.forEach((file, index) => {
    const fullPath = path.join(publicDir, file);
    const exists = fs.existsSync(fullPath) ? '✅' : '❌';
    console.log(`${index + 1}. ${exists} ${file}`);
});

console.log('\n🎉 Ολοκληρώθηκε! Τώρα έχετε κουμπί για το ενωμένο PDF.');