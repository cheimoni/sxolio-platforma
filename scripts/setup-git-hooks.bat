@echo off
REM Setup Git Hooks for Secret Protection (Windows)
REM Run this script after cloning the repository on any new Windows machine

echo Setting up Git hooks for secret protection...
echo.

REM Create hooks directory if it doesn't exist
if not exist .git\hooks mkdir .git\hooks

REM Copy pre-commit hook
(
echo #!/bin/bash
echo.
echo # Pre-commit hook to prevent API keys from being committed
echo # This hook will scan staged files for Firebase API keys and other secrets
echo.
echo echo "Checking for exposed secrets..."
echo.
echo # Patterns to search for
echo FIREBASE_API_KEY_PATTERN="AIzaSy[0-9A-Za-z_-]{33}"
echo PROJECT_ID_PATTERN="^(platformalas^|gradesystem-4ca8b^)"
echo.
echo # Get list of staged files
echo STAGED_FILES=$^(git diff --cached --name-only --diff-filter=ACM^)
echo.
echo # Check if there are any staged files
echo if [ -z "$STAGED_FILES" ]; then
echo     exit 0
echo fi
echo.
echo # Flag to track if secrets were found
echo SECRETS_FOUND=0
echo.
echo # Check each staged file
echo for file in $STAGED_FILES; do
echo     # Skip binary files and ignored files
echo     if [[ "$file" == *".env.local"* ]] ^|^| \
echo        [[ "$file" == *"firebase-schedule.js"* ]] ^|^| \
echo        [[ "$file" == *"/firebase.js" ]] ^&^& [[ "$file" != *".example.js" ]]; then
echo         continue
echo     fi
echo.
echo     # Check for Firebase API keys
echo     if git diff --cached "$file" ^| grep -qE "$FIREBASE_API_KEY_PATTERN"; then
echo         echo "ERROR: Firebase API key detected in: $file"
echo         SECRETS_FOUND=1
echo     fi
echo.
echo     # Check for old project IDs
echo     if git diff --cached "$file" ^| grep -qE "$PROJECT_ID_PATTERN"; then
echo         echo "WARNING: Old project ID detected in: $file"
echo         SECRETS_FOUND=1
echo     fi
echo done
echo.
echo # If secrets were found, abort the commit
echo if [ $SECRETS_FOUND -eq 1 ]; then
echo     echo ""
echo     echo "COMMIT BLOCKED! Secrets detected in staged files."
echo     echo ""
echo     exit 1
echo fi
echo.
echo echo "No secrets detected. Commit allowed."
echo exit 0
) > .git\hooks\pre-commit

echo.
echo Git hooks installed successfully!
echo.
echo The pre-commit hook will now:
echo   - Scan all commits for Firebase API keys
echo   - Block commits that contain secrets
echo   - Prevent accidental exposure of credentials
echo.
echo This protection is now active on this machine!
pause
