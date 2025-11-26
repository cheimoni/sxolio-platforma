$word = New-Object -ComObject Word.Application
$word.Visible = $false

$files = @(
  'Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).doc',
  'Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.docx',
  'Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.docx',
  'Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.docx',
  'Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.doc',
  'Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.doc',
  'ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).doc'
)

foreach ($file in $files) {
  $inputPath = 'C:\Users\NUC\Desktop\anaplirosis\public\' + $file
  $outputPath = 'C:\Users\NUC\Desktop\anaplirosis\public\' + [System.IO.Path]::GetFileNameWithoutExtension($file) + '.html'

  Write-Host "Converting $file to HTML..."

  try {
    $doc = $word.Documents.Open($inputPath)
    $doc.SaveAs([ref]$outputPath, [ref]8)
    $doc.Close()
    Write-Host "Converted: $outputPath"
  } catch {
    Write-Host "Error converting $file : $_"
  }
}

$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host 'All files conversion completed!'
