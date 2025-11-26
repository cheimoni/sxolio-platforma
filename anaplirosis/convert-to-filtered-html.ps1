$word = New-Object -ComObject Word.Application
$word.Visible = $false

$publicPath = "C:\Users\NUC\Desktop\anaplirosis\public"
$wdFormatFilteredHTML = 10

# Get all .doc and .docx files
$docFiles = Get-ChildItem -Path $publicPath -Filter "*.doc"
$docxFiles = Get-ChildItem -Path $publicPath -Filter "*.docx"
$allFiles = $docFiles + $docxFiles

foreach ($file in $allFiles) {
  $inputPath = $file.FullName
  $outputName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".html"
  $outputPath = Join-Path $publicPath $outputName

  Write-Host "Converting $($file.Name) to HTML..."

  try {
    $doc = $word.Documents.Open($inputPath)
    $doc.SaveAs($outputPath, $wdFormatFilteredHTML)
    $doc.Close()
    Write-Host "Success: $outputName"
  } catch {
    Write-Host "Error: $_"
  }
}

$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "All conversions completed!"
