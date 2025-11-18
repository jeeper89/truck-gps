
#!/bin/bash

echo "🚀 Pushing truck-gps to GitHub..."
echo ""

# Set up git credentials
git config credential.helper 'cache --timeout=3600'

# Attempt to push
git push -u origin master 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo "🔗 Repository: https://github.com/jeeper89/truck-gps"
else
  echo ""
  echo "❌ Push failed. The repository might not exist yet."
  echo ""
  echo "📋 To create the repository:"
  echo "1. Go to: https://github.com/new"
  echo "2. Repository name: truck-gps"
  echo "3. Description: Professional truck GPS routing application"
  echo "4. Keep it Public"
  echo "5. DO NOT initialize with README (we already have one)"
  echo "6. Click 'Create repository'"
  echo ""
  echo "Then run this script again: ./push_to_github.sh"
fi
