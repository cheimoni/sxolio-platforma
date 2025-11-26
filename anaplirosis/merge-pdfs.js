const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function mergePDFs() {
    const publicDir = path.join(__dirname, 'public');
    
    // List of PDF files to merge
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
    
    const mergedPdf = await PDFDocument.create();
    
    console.log('Ξεκινάω την ένωση των PDF αρχείων...');
    
    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(publicDir, pdfFile);
        
        if (!fs.existsSync(pdfPath)) {
            console.log(`⚠️  Το αρχείο ${pdfFile} δεν βρέθηκε`);
            continue;
        }
        
        try {
            console.log(`📄 Προσθέτω: ${pdfFile}`);
            
            const pdfBytes = fs.readFileSync(pdfPath);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            
        } catch (error) {
            console.log(`❌ Σφάλμα με το αρχείο ${pdfFile}:`, error.message);
        }
    }
    
    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    const outputPath = path.join(publicDir, 'ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf');
    
    fs.writeFileSync(outputPath, mergedPdfBytes);
    
    console.log('✅ Η ένωση ολοκληρώθηκε!');
    console.log(`📁 Το ενωμένο αρχείο αποθηκεύτηκε στο: ${outputPath}`);
    
    // Show file size
    const stats = fs.statSync(outputPath);
    console.log(`📊 Μέγεθος αρχείου: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

// Run the merge
mergePDFs().catch(console.error);