[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$docFiles = Get-ChildItem -Path "C:\Users\NUC\Desktop\anaplirosis\public" -Filter "*.doc*"

foreach ($file in $docFiles) {
    $htmlName = $file.BaseName + ".html"
    $htmlPath = Join-Path -Path "C:\Users\NUC\Desktop\anaplirosis\public" -ChildPath $htmlName

    $htmlContent = @"
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$($file.BaseName)</title>
</head>
<body>
    <h1>$($file.BaseName)</h1>
</body>
</html>
"@

    [System.IO.File]::WriteAllText($htmlPath, $htmlContent, [System.Text.Encoding]::UTF8)
    Write-Output "Created: $htmlName"
}

Write-Output "`nTotal files created: $($docFiles.Count)"
