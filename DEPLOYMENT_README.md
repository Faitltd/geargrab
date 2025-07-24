# 🚀 GearGrab Production Deployment Guide

This repository contains comprehensive deployment scripts and configuration for deploying GearGrab to Google Cloud Run with full CI/CD automation.

## 📋 Quick Start

### 1. Initial Setup
```bash
# Run the setup script to configure deployment
npm run deploy:setup
```

### 2. Deploy to Production
```bash
# Deploy to production
npm run deploy
```

### 3. Monitor Deployment
```bash
# Check application health
npm run deploy:monitor
```

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Setup** | `npm run deploy:setup` | Configure deployment environment |
| **Deploy** | `npm run deploy` | Deploy to production |
| **Monitor** | `npm run deploy:monitor` | Health check and monitoring |
| **Rollback** | `npm run deploy:rollback` | Emergency rollback |
| **Logs** | `npm run deploy:logs` | View live application logs |
| **Status** | `npm run deploy:status` | Get service status |

## 📁 Deployment Files

### Core Scripts
- **`setup-deployment.sh`** - Interactive setup and configuration
- **`deploy.sh`** - Main deployment script
- **`rollback.sh`** - Emergency rollback script  
- **`monitor.sh`** - Health monitoring and metrics

### Configuration Files
- **`.env.production`** - Production environment variables
- **`Dockerfile`** - Container configuration
- **`nginx.conf`** - Web server configuration
- **`service.yaml`** - Cloud Run service definition

### CI/CD
- **`.github/workflows/deploy.yml`** - GitHub Actions workflow
- **`DEPLOYMENT.md`** - Detailed deployment documentation

## 🔧 Prerequisites

### Required Tools
- **Node.js 18+** - Application runtime
- **Google Cloud CLI** - Cloud deployment
- **Git** - Version control
- **Docker** - Container builds (optional)

### Authentication
```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### GitHub Secrets (for automated deployment)
Add these secrets to your GitHub repository:
- `GCP_SA_KEY` - Google Cloud Service Account key (JSON format)

## 🌐 Deployment Architecture

```
GitHub Repository
       ↓
   GitHub Actions
       ↓
   Google Cloud Build
       ↓
   Google Cloud Run
       ↓
   Custom Domain (geargrab.co)
```

## 📊 Features

### ✅ Automated Deployment
- **Git Integration** - Automatic commits and pushes
- **Build Process** - Automated testing and building
- **Container Deployment** - Docker-based Cloud Run deployment
- **Domain Mapping** - Custom domain configuration

### ✅ Health Monitoring
- **Health Checks** - Endpoint availability testing
- **Performance Metrics** - Response time monitoring
- **Log Analysis** - Real-time log viewing
- **Resource Monitoring** - CPU and memory usage

### ✅ Rollback Capability
- **Emergency Rollback** - Quick revert to previous versions
- **Revision Management** - Multiple version tracking
- **Traffic Splitting** - Gradual rollout support

### ✅ Security & Performance
- **HTTPS Enforcement** - SSL/TLS encryption
- **Gzip Compression** - Optimized content delivery
- **Security Headers** - XSS and clickjacking protection
- **Caching Strategy** - Static asset optimization

## 🔄 Deployment Process

### Manual Deployment Flow
1. **Pre-checks** - Verify authentication and dependencies
2. **Testing** - Run unit and integration tests
3. **Building** - Create production build
4. **Git Operations** - Commit and push changes
5. **Container Build** - Create Docker image
6. **Cloud Deployment** - Deploy to Cloud Run
7. **Domain Mapping** - Update custom domain
8. **Verification** - Health checks and testing

### Automated Deployment (GitHub Actions)
- Triggered on push to `main` branch
- Runs tests automatically
- Builds and deploys on test success
- Sends notifications on completion

## 🚨 Emergency Procedures

### Quick Rollback
```bash
npm run deploy:rollback
```

### View Live Logs
```bash
npm run deploy:logs
```

### Check Service Status
```bash
npm run deploy:status
```

## 📈 Monitoring & Maintenance

### Health Monitoring
The monitoring script checks:
- **Service availability** - Basic connectivity
- **Endpoint health** - API responsiveness  
- **Performance metrics** - Response times
- **Resource usage** - Memory and CPU
- **Recent logs** - Error detection

### Performance Optimization
- **Response time targets** - < 1s excellent, < 3s acceptable
- **Resource limits** - 512Mi memory, 1 CPU
- **Auto-scaling** - 0-10 instances based on traffic
- **Caching** - Static assets cached for 1 year

## 🔐 Security Considerations

### Environment Variables
- Production secrets in `.env.production`
- No sensitive data in repository
- Google Cloud Secret Manager integration

### Network Security
- HTTPS-only traffic
- Security headers enabled
- CORS configuration
- Rate limiting (Cloud Run built-in)

## 🐛 Troubleshooting

### Common Issues

**Deployment Fails**
```bash
# Check authentication
gcloud auth list

# Verify project access
gcloud projects list

# Check service logs
npm run deploy:logs
```

**Service Not Responding**
```bash
# Run health check
npm run deploy:monitor

# Check recent deployments
gcloud run revisions list --service=geargrab
```

**Domain Issues**
```bash
# Verify domain mapping
gcloud run domain-mappings list

# Check DNS configuration
nslookup geargrab.co
```

## 📞 Support

### Resources
- **Google Cloud Console** - Service management
- **GitHub Actions** - CI/CD monitoring  
- **Application Logs** - Error investigation
- **Health Endpoints** - Status verification

### Commands Reference
```bash
# Service management
gcloud run services list
gcloud run services describe geargrab
gcloud run services delete geargrab

# Revision management  
gcloud run revisions list --service=geargrab
gcloud run revisions describe REVISION_NAME

# Traffic management
gcloud run services update-traffic geargrab --to-latest
```

## 🎯 Next Steps

After successful deployment:

1. **Monitor Performance** - Use `npm run deploy:monitor`
2. **Set Up Alerts** - Configure Google Cloud monitoring
3. **Plan Maintenance** - Schedule regular updates
4. **Document Changes** - Keep deployment log updated
5. **Team Training** - Share deployment procedures

---

**🎉 Happy Deploying!**

For questions or issues, check the logs first, then consult the troubleshooting section above.
