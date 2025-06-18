# PushDeploy CLI Setup for GearGrab

This directory contains the PushDeploy CLI tool that automates the entire deployment pipeline for GearGrab from code commit to live production deployment.

## Quick Start

### Step 1: Run the Setup Script
```bash
./setup-pushdeploy.sh
```

This will:
- Create the pushdeploy directory and CLI tool
- Install all dependencies
- Configure environment variables with your GitHub token and GCP project
- Set up the CLI tool globally (if possible)
- Run tests to verify everything works

### Step 2: Authenticate with Google Cloud
```bash
gcloud auth login
gcloud config set project geargrabco
```

### Step 3: Deploy to Production
```bash
./deploy.sh "Your commit message"
```

## What It Does

The PushDeploy CLI automates:

1. **Git Operations**: Stages all changes, commits with your message, pushes to GitHub
2. **GitHub Actions**: Triggers CI/CD workflow on the pushed commit
3. **Docker Build**: Builds and pushes Docker images to Container Registry
4. **Cloud Run Deploy**: Deploys services with zero-downtime updates
5. **Domain Mapping**: Ensures geargrab.co and www.geargrab.co are properly mapped
6. **Health Checks**: Validates deployment and reports status

## Configuration

The tool is pre-configured with your actual values:

- **GitHub Token**: `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`
- **GCP Project**: `geargrabco` (227444442028)
- **Repository**: `Faitltd/geargrab`
- **Domains**: `geargrab.co`, `www.geargrab.co`

## Alternative Usage

If global installation works:
```bash
pushdeploy deploy "Your commit message"
```

If not globally installed:
```bash
cd pushdeploy && node src/index.js deploy "Your commit message"
```

## Commands

- `pushdeploy init` - Initialize configuration file
- `pushdeploy deploy <message>` - Full deployment pipeline
- `pushdeploy status` - Check deployment status

## Troubleshooting

If you encounter issues:

1. **Permission denied**: Run `chmod +x setup-pushdeploy.sh deploy.sh`
2. **Command not found**: Use the full path: `./setup-pushdeploy.sh`
3. **GCP authentication**: Run `gcloud auth login` first
4. **GitHub API errors**: Check your GitHub token permissions

## Files Created

- `pushdeploy/` - Complete CLI tool directory
- `setup-pushdeploy.sh` - One-time setup script
- `deploy.sh` - Simple deployment script
- `PUSHDEPLOY_SETUP.md` - This documentation

The CLI tool is production-ready and configured specifically for your GearGrab project! 🚀
