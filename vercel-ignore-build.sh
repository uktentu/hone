#!/bin/bash

# Vercel "Ignored Build Step" Logic:
# Exit Code 0 = IGNORE the build (Do not build)
# Exit Code 1 = PROCEED with the build (Build normally)

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" == "gh-pages" ]; then
  echo "🛑 Branch is gh-pages. Ignoring build."
  exit 0
else
  echo "✅ Branch is $VERCEL_GIT_COMMIT_REF. Proceeding with build."
  exit 1
fi
