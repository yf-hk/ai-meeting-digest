#!/bin/bash

# AI Meeting Digest Backend Deployment Script
# This script builds and deploys the backend to Cloudflare Workers

set -e

echo "🚀 Starting deployment to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run: wrangler login"
    exit 1
fi

echo "📦 Building for Cloudflare Workers..."
bun run build:worker

echo "🔍 Validating wrangler configuration..."
wrangler validate

echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Your API is now live on Cloudflare Workers"
echo "📊 Monitor your deployment at: https://dash.cloudflare.com"
