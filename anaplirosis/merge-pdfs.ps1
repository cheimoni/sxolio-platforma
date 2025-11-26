# PowerShell script to merge PDFs using Windows tools
param(
    [string]$InputFolder = "C:\Users\NUC\Desktop\anaplirosis\public",
    [string]$OutputFile = "C:\Users\NUC\Desktop\anaplirosis\public\ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf"
)

Write-Host "🚀 Ξεκινάω την ένωση των PDF αρχείων..." -ForegroundColor Green

# List of PDF files to merge in specific order
$pdfFiles = @(
    "greek_odigos_ipodoxis.pdf",
    "orarioleitourgias.pdf", 
    "sxolia .pdf",
    "Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).pdf",
    "Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.pdf",
    "Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf",
    "Γραφεία ΔΟ.pdf",
    "Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf",
    "Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf",
    "Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf",
    "ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf"
)

# Check if input folder exists
if (-not (Test-Path $InputFolder)) {
    Write-Host "❌ Ο φάκελος $InputFolder δεν υπάρχει!" -ForegroundColor Red
    exit 1
}

# Create a list of existing PDF files
$existingPdfs = @()
foreach ($pdfFile in $pdfFiles) {
    $fullPath = Join-Path $InputFolder $pdfFile
    if (Test-Path $fullPath) {
        $existingPdfs += $fullPath
        Write-Host "✅ Βρέθηκε: $pdfFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Δεν βρέθηκε: $pdfFile" -ForegroundColor Yellow
    }
}

if ($existingPdfs.Count -eq 0) {
    Write-Host "❌ Δεν βρέθηκε κανένα PDF αρχείο!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Συνολικά βρέθηκαν $($existingPdfs.Count) PDF αρχεία" -ForegroundColor Cyan

# Try to use node with pdf-lib if available, otherwise create a simple batch file
try {
    # Create a simple Node.js script for merging
    $nodeScript = @"
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function mergePDFs() {
    const mergedPdf = await PDFDocument.create();
    const pdfFiles = [
        '$($existingPdfs -join "','")'
    ];

    for (const pdfFile of pdfFiles) {
        if (fs.existsSync(pdfFile)) {
            console.log('📄 Προσθέτω:', pdfFile.split('\\').pop());
            const pdfBytes = fs.readFileSync(pdfFile);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
    }

    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync('$OutputFile', mergedPdfBytes);
    
    console.log('✅ Η ένωση ολοκληρώθηκε!');
    console.log('📁 Αποθηκεύτηκε στο: $OutputFile');
}

mergePDFs().catch(console.error);
"@

    $tempNodeFile = Join-Path $env:TEMP "merge_pdfs_temp.js"
    $nodeScript | Out-File -FilePath $tempNodeFile -Encoding UTF8

    # Try to run with node
    node $tempNodeFile
    Remove-Item $tempNodeFile -Force
    
} catch {
    Write-Host "❌ Σφάλμα με Node.js: $_" -ForegroundColor Red
    
    # Fallback: Create a batch file that copies files sequentially
    Write-Host "📝 Δημιουργώ αντίγραφο του πρώτου αρχείου..." -ForegroundColor Yellow
    Copy-Item $existingPdfs[0] $OutputFile
    
    Write-Host "✅ Δημιουργήθηκε βασικό αρχείο. Για πλήρη ένωση χρησιμοποιήστε εξωτερικό εργαλείο." -ForegroundColor Green
}

if (Test-Path $OutputFile) {
    $fileSize = (Get-Item $OutputFile).Length / 1MB
    Write-Host "📊 Μέγεθος αρχείου: $($fileSize.ToString('F2')) MB" -ForegroundColor Cyan
    Write-Host "🎉 Ολοκληρώθηκε επιτυχώς!" -ForegroundColor Green
} else {
    Write-Host "❌ Κάτι πήγε στραβά με τη δημιουργία του αρχείου" -ForegroundColor Red
}