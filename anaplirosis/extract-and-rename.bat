@echo off
chcp 65001 >nul
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo    ΕΞΑΓΩΓΗ ΚΑΙ ΜΕΤΟΝΟΜΑΣΙΑ MP3 ΑΡΧΕΙΩΝ
echo ═══════════════════════════════════════════════════════════════
echo.

cd public\announcements

echo Εξαγωγή mp3 από φακέλους...
echo.

REM Περίοδοι 1-8
if exist "1\Maya.mp3" copy "1\Maya.mp3" "period1.mp3" >nul && echo ✓ 1\Maya.mp3 → period1.mp3
if exist "2\Benjamin.mp3" copy "2\Benjamin.mp3" "period2.mp3" >nul && echo ✓ 2\Benjamin.mp3 → period2.mp3
if exist "3\Blake.mp3" copy "3\Blake.mp3" "period3.mp3" >nul && echo ✓ 3\Blake.mp3 → period3.mp3
if exist "4\Lydia.mp3" copy "4\Lydia.mp3" "period4.mp3" >nul && echo ✓ 4\Lydia.mp3 → period4.mp3
if exist "5\David.mp3" copy "5\David.mp3" "period5.mp3" >nul && echo ✓ 5\David.mp3 → period5.mp3
if exist "6\Blake.mp3" copy "6\Blake.mp3" "period6.mp3" >nul && echo ✓ 6\Blake.mp3 → period6.mp3
if exist "7\Benjamin.mp3" copy "7\Benjamin.mp3" "period7.mp3" >nul && echo ✓ 7\Benjamin.mp3 → period7.mp3
if exist "8\Jessica.mp3" copy "8\Jessica.mp3" "period8.mp3" >nul && echo ✓ 8\Jessica.mp3 → period8.mp3

REM Διαλείμματα
if exist "1 dialima\Sophie.mp3" copy "1 dialima\Sophie.mp3" "break1.mp3" >nul && echo ✓ 1 dialima\Sophie.mp3 → break1.mp3
if exist "2 dialima\Lydia.mp3" copy "2 dialima\Lydia.mp3" "break2.mp3" >nul && echo ✓ 2 dialima\Lydia.mp3 → break2.mp3
if exist "3 dialima\Cooper.mp3" copy "3 dialima\Cooper.mp3" "break3.mp3" >nul && echo ✓ 3 dialima\Cooper.mp3 → break3.mp3

REM Πρωί και τέλος
if exist "morning\Mel.mp3" copy "morning\Mel.mp3" "morning.mp3" >nul && echo ✓ morning\Mel.mp3 → morning.mp3
if exist "telos\Lydia.mp3" copy "telos\Lydia.mp3" "end.mp3" >nul && echo ✓ telos\Lydia.mp3 → end.mp3

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo ✅ ΟΛΟΚΛΗΡΩΘΗΚΕ!
echo.
echo Τα mp3 αρχεία είναι τώρα έτοιμα για χρήση!
echo Το σχολικό ρολόι θα παίζει τις φωνητικές ανακοινώσεις! 🎵
echo.
pause
