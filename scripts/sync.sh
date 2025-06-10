#!/bin/bash

# FakeStrava Auto-Sync Script
# This script automatically commits and pushes changes to GitHub

echo "🚀 FakeStrava Auto-Sync Starting..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to sync"
    exit 0
fi

# Add all changes
echo "📁 Adding changes..."
git add .

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Commit with timestamp
echo "💾 Committing changes..."
git commit -m "auto-sync: Updates from $TIMESTAMP"

# Push to GitHub
echo "🌐 Pushing to GitHub..."
git push origin main

echo "✅ Sync completed successfully!"
echo "🔗 View at: https://github.com/pobrei/fakestrava"
