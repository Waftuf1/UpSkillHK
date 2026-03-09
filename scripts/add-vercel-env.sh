#!/bin/bash
# Add environment variables to Vercel. Run from project root: ./scripts/add-vercel-env.sh
# Requires: npx vercel link (run once to link project)
# Set your env vars in .env.local, then run: source .env.local 2>/dev/null; ./scripts/add-vercel-env.sh

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Adding env vars to Vercel (from environment)..."

# AI keys - use env vars, never commit secrets
for key in MINIMAX_API_KEY OPENAI_API_KEY GOOGLE_GEMINI_API_KEY OPENROUTER_API_KEY; do
  val="${!key}"
  if [ -n "$val" ]; then
    echo "$val" | npx vercel env add "$key" production 2>/dev/null || true
  fi
done

# AWS Bedrock
if [ -n "$AWS_BEDROCK_API_KEY" ]; then
  echo "$AWS_BEDROCK_API_KEY" | npx vercel env add AWS_BEDROCK_API_KEY production 2>/dev/null || true
fi
if [ -n "$AWS_BEARER_TOKEN_BEDROCK" ]; then
  echo "$AWS_BEARER_TOKEN_BEDROCK" | npx vercel env add AWS_BEARER_TOKEN_BEDROCK production 2>/dev/null || true
fi

# Firebase (public - safe to add via Vercel dashboard)
for key in NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID; do
  val="${!key}"
  if [ -n "$val" ]; then
    echo "$val" | npx vercel env add "$key" production 2>/dev/null || true
  fi
done

echo "Done. Add any missing vars in Vercel dashboard, then redeploy."
