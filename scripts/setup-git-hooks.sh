#!/bin/bash

# Setup Git Hooks for Secret Protection
# Run this script after cloning the repository on any new machine

echo "🔧 Setting up Git hooks for secret protection..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook to prevent API keys from being committed
# This hook will scan staged files for Firebase API keys and other secrets

echo "🔒 Checking for exposed secrets..."

# Patterns to search for
FIREBASE_API_KEY_PATTERN="AIzaSy[0-9A-Za-z_-]{33}"
PROJECT_ID_PATTERN="(platformalas|gradesystem-4ca8b)"

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check if there are any staged files
if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

# Flag to track if secrets were found
SECRETS_FOUND=0

# Check each staged file
for file in $STAGED_FILES; do
    # Skip binary files and ignored files
    if [[ "$file" == *".env.local"* ]] || \
       [[ "$file" == *"firebase-schedule.js"* ]] || \
       [[ "$file" == *"/firebase.js" ]] && [[ "$file" != *".example.js" ]]; then
        continue
    fi

    # Check for Firebase API keys
    if git diff --cached "$file" | grep -qE "$FIREBASE_API_KEY_PATTERN"; then
        echo "❌ ERROR: Firebase API key detected in: $file"
        SECRETS_FOUND=1
    fi

    # Check for old project IDs
    if git diff --cached "$file" | grep -qE "$PROJECT_ID_PATTERN"; then
        echo "⚠️  WARNING: Old project ID detected in: $file"
        echo "   This file references 'platformalas' or 'gradesystem-4ca8b'"
        echo "   It should use 'platforma-97609' instead"
        SECRETS_FOUND=1
    fi
done

# If secrets were found, abort the commit
if [ $SECRETS_FOUND -eq 1 ]; then
    echo ""
    echo "🚨 COMMIT BLOCKED! Secrets detected in staged files."
    echo ""
    echo "To fix this:"
    echo "1. Remove the API keys from the files"
    echo "2. Use environment variables or config files that are in .gitignore"
    echo "3. Check .gitignore to ensure secret files are listed"
    echo ""
    echo "Secret files that should NEVER be committed:"
    echo "  - platforma-bathmologia/.env.local"
    echo "  - platforma-orario/js/config/firebase.js"
    echo "  - platforma-orario/js/config/firebase-schedule.js"
    echo ""
    exit 1
fi

echo "✅ No secrets detected. Commit allowed."
exit 0
EOF

# Make it executable
chmod +x .git/hooks/pre-commit

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Scan all commits for Firebase API keys"
echo "  • Block commits that contain secrets"
echo "  • Prevent accidental exposure of credentials"
echo ""
echo "This protection is now active on this machine! 🔒"
