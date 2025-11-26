$word = New-Object -ComObject Word.Application
$word.Visible = $false

$publicPath = "C:\Users\NUC\Desktop\anaplirosis\public"

# Get all .doc files (not .docx)
$docFiles = Get-ChildItem -Path $publicPath -Filter "*.doc" | Where-Object { $_.Extension -eq ".doc" }

foreach ($file in $docFiles) {
  $inputPath = $file.FullName
  $outputName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".docx"
  $outputPath = Join-Path $publicPath $outputName

  Write-Host "Converting $($file.Name) to .docx..."

  try {
    $doc = $word.Documents.Open($inputPath)
    $doc.SaveAs2($outputPath, 16)  # 16 = wdFormatXMLDocument (.docx)
    $doc.Close()
    Write-Host "Success: $outputName"
  } catch {
    Write-Host "Error: $_"
  }
}

$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "All conversions completed!"
