#!/bin/bash

# AI Meeting Digest Backend Development Script for Cloudflare Workers
# This script builds and runs the backend locally using Wrangler

set -e

echo "🔧 Starting local development with Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it with: npm install -g wrangler"
    exit 1
fi

echo "📦 Building for Cloudflare Workers..."
bun run build:worker

echo "🔍 Validating wrangler configuration..."
wrangler validate

echo "🚀 Starting local development server..."
echo "📝 Your API will be available at: http://localhost:8787"
echo "🛑 Press Ctrl+C to stop the server"

wrangler dev
