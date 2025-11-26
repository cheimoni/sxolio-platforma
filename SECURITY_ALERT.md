# 🚨 SECURITY ALERT - IMMEDIATE ACTION REQUIRED

## Exposed API Keys Detected

GitHub has detected that Firebase API keys were exposed in your repository. **These keys need to be rotated immediately** as they are now publicly accessible.

## 🔒 What Has Been Fixed

1. ✅ Removed hardcoded API keys from source code
2. ✅ Created environment configuration files
3. ✅ Updated .gitignore to prevent future exposures
4. ✅ Separated config files from source code

## ⚠️ CRITICAL: Rotate Your API Keys

Since the API keys were already committed to GitHub, they are considered compromised. You **MUST** rotate them:

### For batholokio project (GradeSystem):
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `gradesystem-4ca8b`
3. Go to Project Settings > General
4. Under "Your apps" section, find your web app
5. Click "Regenerate" or create a new web app
6. Copy the new configuration
7. Update the file: `batholokio/.env.local` with new values

### For school-platform (Schedule Adjuster):
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `platformalas`
3. Go to Project Settings > General
4. Under "Your apps" section, find your web app
5. Click "Regenerate" or create a new web app
6. Copy the new configuration
7. Update the file: `school-platform/js/config/firebase-schedule.js` with new values

## 🔐 Additional Security Steps

### 1. Restrict API Keys in Firebase Console

After rotating, restrict your API keys:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Credentials"
4. Find your API key and click "Edit"
5. Under "Application restrictions", select "HTTP referrers (web sites)"
6. Add your domains:
   - `localhost:3000` (for development)
   - `localhost:5000` (for development)
   - Your production domain (e.g., `yourdomain.com`, `*.yourdomain.com`)
7. Under "API restrictions", select "Restrict key" and enable only:
   - Firebase Authentication API
   - Cloud Firestore API
   - Firebase Realtime Database API
   - Firebase Storage API

### 2. Configure Firebase Security Rules

Make sure your Firebase databases have proper security rules:

```javascript
// Firestore Rules Example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

// Realtime Database Rules Example
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 3. Monitor Usage

- Regularly check your Firebase Console for unusual activity
- Set up billing alerts in Google Cloud Console
- Review authentication logs

## 📝 How to Use the New Configuration

### For batholokio (React app):

1. Copy `.env.example` to `.env.local`:
   ```bash
   cd batholokio
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your **NEW** Firebase credentials

3. The app will automatically load these values

### For school-platform (HTML app):

1. The configuration is in `school-platform/js/config/firebase-schedule.js`
2. Update this file with your **NEW** Firebase credentials
3. This file is now in .gitignore and won't be committed

## 🚫 What NOT to Do

- ❌ Don't commit `.env.local` files
- ❌ Don't commit `firebase-schedule.js`
- ❌ Don't share API keys in chat, email, or documents
- ❌ Don't use the old (exposed) API keys anywhere

## ✅ Verification

After rotating keys, verify:

1. Applications still work with new keys
2. Old keys are revoked in Firebase Console
3. `.gitignore` is properly configured
4. No secrets in `git status`

## 🆘 Need Help?

If you're unsure about any step:
1. Check [Firebase Security Documentation](https://firebase.google.com/docs/projects/api-keys)
2. Review [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
3. Contact your team's security lead

---

**Remember**: API keys in source control = compromised keys. Always use environment variables!
