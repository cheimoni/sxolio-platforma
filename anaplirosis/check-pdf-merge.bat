@echo off
echo 🚀 Δημιουργία ενωμένου PDF αρχείου...
echo.

set "PUBLIC_DIR=C:\Users\NUC\Desktop\anaplirosis\public"
set "OUTPUT_FILE=%PUBLIC_DIR%\ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf"

echo 📋 Λίστα των PDF αρχείων που θα ενωθούν:
echo.

if exist "%PUBLIC_DIR%\greek_odigos_ipodoxis.pdf" (
    echo ✅ 1. greek_odigos_ipodoxis.pdf
) else (
    echo ❌ 1. greek_odigos_ipodoxis.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\orarioleitourgias.pdf" (
    echo ✅ 2. orarioleitourgias.pdf  
) else (
    echo ❌ 2. orarioleitourgias.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\sxolia .pdf" (
    echo ✅ 3. sxolia .pdf
) else (
    echo ❌ 3. sxolia .pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).pdf" (
    echo ✅ 4. Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).pdf
) else (
    echo ❌ 4. Β.Δ. Συντονιστές κλάδων και Διοικητικοί (1).pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.pdf" (
    echo ✅ 5. Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.pdf
) else (
    echo ❌ 5. Β.Δ.Α Υπεύθυνος ΔΔΚ_καθήκοντα.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf" (
    echo ✅ 6. Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf
) else (
    echo ❌ 6. Β.Δ.Α Υπεύθυνος Τομέα -  καθήκοντα.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Γραφεία ΔΟ.pdf" (
    echo ✅ 7. Γραφεία ΔΟ.pdf
) else (
    echo ❌ 7. Γραφεία ΔΟ.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf" (
    echo ✅ 8. Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf
) else (
    echo ❌ 8. Ειδικά καθήκοντα και αρμοδιότητες Β.Δ.Α και Β.Δ. 30 Αυγούστου.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf" (
    echo ✅ 9. Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf
) else (
    echo ❌ 9. Καθήκοντα ΒΔ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf" (
    echo ✅ 10. Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf
) else (
    echo ❌ 10. Καθήκοντα ΒΔΑ ΣΥΓΚΕΝΤΡΩΤΙΚΑ.pdf (δεν βρέθηκε)
)

if exist "%PUBLIC_DIR%\ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf" (
    echo ✅ 11. ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf
) else (
    echo ❌ 11. ΥΠΕΥΘΥΝΟΙ ΤΜΗΜΑΤΩΝ ΚΑΙ Β.Δ. (3) (1).pdf (δεν βρέθηκε)
)

echo.
echo 📝 ΟΔΗΓΙΕΣ για την ένωση των PDF:
echo.
echo 1. Χρησιμοποιήστε εργαλεία όπως:
echo    - Adobe Acrobat Reader DC (Combine files)
echo    - PDFtk (εντολή: pdftk file1.pdf file2.pdf ... cat output combined.pdf)
echo    - Online PDF merger (ilovepdf.com, smallpdf.com)
echo    - Microsoft Word (Insert → Object → Text from File)
echo.
echo 2. Η σειρά ένωσης των αρχείων είναι η παραπάνω (1-11)
echo.
echo 3. Αποθηκεύστε το ενωμένο αρχείο ως: ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf
echo    στο φάκελο: %PUBLIC_DIR%
echo.

if exist "%OUTPUT_FILE%" (
    echo ✅ Το αρχείο ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf υπάρχει ήδη!
    echo 📊 Μέγεθος: 
    for %%A in ("%OUTPUT_FILE%") do echo    %%~zA bytes
) else (
    echo ⚠️  Το αρχείο ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf δεν υπάρχει ακόμη
)

echo.
echo 🎯 Το κουμπί στο HTML αρχείο είναι έτοιμο και δείχνει στο: ΟΛΕΣ_ΟΙ_ΟΔΗΓΙΕΣ_ΕΝΩΜΕΝΕΣ.pdf
echo.
pause