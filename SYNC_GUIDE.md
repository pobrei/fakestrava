# 🔄 FakeStrava Sync Guide

This guide explains how to keep your local development in sync with the GitHub repository.

## 🚀 Repository Setup Complete

✅ **GitHub Repository**: https://github.com/pobrei/fakestrava.git  
✅ **Remote Origin**: Configured and connected  
✅ **Initial Push**: All code successfully uploaded  
✅ **Auto-Sync Scripts**: Ready for use  
✅ **GitHub Actions**: Deployment workflow configured  

## 📋 Quick Sync Commands

### Manual Sync (Recommended)
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Your descriptive commit message"

# Push to GitHub
git push
```

### Auto-Sync Script
```bash
# Use the automated sync script
npm run sync
# or
./scripts/sync.sh
```

## 🔄 Daily Workflow

1. **Make Changes**: Develop features, fix bugs, update documentation
2. **Test Locally**: Run `npm run dev` to test changes
3. **Sync to GitHub**: Use manual sync or auto-sync script
4. **Verify**: Check GitHub repository for updates

## 📦 Deployment

The project is configured for automatic deployment to GitHub Pages:

- **Trigger**: Every push to `main` branch
- **Build**: Automatic via GitHub Actions
- **Deploy**: Static files to GitHub Pages
- **URL**: Will be available at `https://pobrei.github.io/fakestrava`

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier

# Deployment
npm run export       # Export static files
npm run deploy       # Build and export
npm run sync         # Auto-sync to GitHub

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🔧 Git Configuration

Current setup:
- **Remote**: `origin` → `https://github.com/pobrei/fakestrava.git`
- **Branch**: `main` (default)
- **Tracking**: Local `main` tracks `origin/main`

## 📊 Project Status

### ✅ Completed Features
- 🗺️ Smart Route Builder with interactive map
- 🌍 Real elevation data integration via Open-Elevation API
- ⛰️ Elevation-adjusted pacing for realistic speed changes
- 🔍 City search functionality with global coverage
- ⚙️ Routing profile selection (Walking/Cycling/Driving)
- 📊 Live route preview with comprehensive statistics
- 📥 One-click realistic GPX generation
- 🛡️ Comprehensive error handling and fallbacks
- 📱 Responsive design for all device sizes

### 🚀 Ready for Production
- ✅ No runtime errors or React state issues
- ✅ CORS problems resolved with server-side proxy
- ✅ Real elevation API integration working
- ✅ Professional-quality GPX export
- ✅ User-friendly interface with clear guidance

## 🔗 Important Links

- **GitHub Repository**: https://github.com/pobrei/fakestrava
- **Local Development**: http://localhost:3001
- **GitHub Pages** (when deployed): https://pobrei.github.io/fakestrava
- **Issues**: https://github.com/pobrei/fakestrava/issues
- **Actions**: https://github.com/pobrei/fakestrava/actions

## 📝 Commit Message Guidelines

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

Example:
```bash
git commit -m "feat: Add real-time elevation profile visualization"
git commit -m "fix: Resolve CORS issue with elevation API"
git commit -m "docs: Update README with new features"
```

## 🆘 Troubleshooting

### Sync Issues
```bash
# Check git status
git status

# Check remote configuration
git remote -v

# Force push (use carefully)
git push --force-with-lease
```

### Development Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset git to last known good state
git reset --hard HEAD~1
```

---

**🎯 Your FakeStrava project is now fully synced with GitHub and ready for continuous development!**
