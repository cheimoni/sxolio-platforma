[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$htmlFiles = @(
    "C:\Users\NUC\Desktop\anaplirosis\public\Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.html",
    "C:\Users\NUC\Desktop\anaplirosis\public\Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.html",
    "C:\Users\NUC\Desktop\anaplirosis\public\Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.html",
    "C:\Users\NUC\Desktop\anaplirosis\public\Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.html",
    "C:\Users\NUC\Desktop\anaplirosis\public\Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.html",
    "C:\Users\NUC\Desktop\anaplirosis\public\ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).html",
    "C:\Users\NUC\Desktop\anaplirosis\public\ΩΡΑΡΙΟ ΛΕΙΤΟΥΡΓΙΑΣ ΤΟΥ  ΣΧΟΛΕΙΟΥ (3).html"
)

$navButtonsHTML = @"
    <style>
        body { font-family: 'Open Sans', sans-serif; background-color: #f7f7f7; color: #333; margin: 20px; padding-bottom: 40px; }
        .container { max-width: 1000px; margin: auto; background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
        h1 { text-align: center; color: #00796b; border-bottom: 3px solid #00796b; padding-bottom: 10px; margin-bottom: 30px; }
        .nav-buttons { display: flex; gap: 15px; justify-content: center; margin-bottom: 25px; flex-wrap: wrap; }
        .nav-button { padding: 12px 24px; background-color: #00796b; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; transition: all 0.3s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .nav-button:hover { background-color: #004d40; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        .nav-button.home { background-color: #0288d1; }
        .nav-button.home:hover { background-color: #01579b; }
    </style>
"@

$navButtons = @"
        <div class="nav-buttons">
            <a href="/" class="nav-button home">🏠 Αρχική Σελίδα</a>
            <a href="http://evagorasev.fwh.is/index_menu.php" class="nav-button" target="_blank">📋 Αναπληρώσεις</a>
            <a href="https://lasl-8511e.web.app/welcome.html" class="nav-button" target="_blank">🏛️ Διοίκηση</a>
            <a href="https://imerolokio-2025v2.web.app/" class="nav-button" target="_blank">📅 Προγραμματισμός</a>
        </div>
"@

foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

        # Αντικατάσταση του <title> tag για να προσθέσουμε το style
        if ($content -match '</head>') {
            $content = $content -replace '</head>', "$navButtonsHTML`n</head>"
        }

        # Προσθήκη των κουμπιών μετά το <body> ή μέσα σε <div class="container"> αν υπάρχει
        if ($content -match '<body>') {
            if ($content -match '<div class="container">') {
                # Αν υπάρχει ήδη container, δεν χρειάζεται να προσθέσουμε άλλο
                $content = $content -replace '(<h1>.*?</h1>)', "`$1`n$navButtons"
            } else {
                # Προσθήκη container και κουμπιών
                $content = $content -replace '<body>', "<body>`n    <div class=`"container`">`n        $navButtons"
                $content = $content -replace '</body>', "    </div>`n</body>"
            }
        }

        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Output "Updated: $(Split-Path $file -Leaf)"
    } else {
        Write-Output "Not found: $(Split-Path $file -Leaf)"
    }
}

Write-Output "`nCompleted!"
