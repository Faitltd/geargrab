# GearGrab Admin System Documentation

## 🎯 Overview

The GearGrab Admin System is a comprehensive administrative interface that provides complete control and monitoring capabilities for the outdoor gear rental platform. Built with SvelteKit and TypeScript, it offers real-time system monitoring, testing interfaces, and management tools.

## 🚀 Features

### Core Admin Features
- **User Management**: Add/remove admin privileges, view user details, manage accounts
- **Listing Management**: Monitor, edit, and moderate gear listings
- **Booking Management**: Track and manage rental bookings
- **Message Management**: Monitor conversations and handle disputes
- **Verification Management**: Oversee identity and background check processes
- **Claims Management**: Handle damage claims and disputes

### System Testing & Monitoring
- **System Health Checks**: Real-time monitoring of all system components
- **Integration Tests**: End-to-end testing of all system integrations
- **Webhook Testing**: Test payment webhook integrations
- **Background Check Testing**: Test provider integrations (Checkr, Sterling)
- **Email Testing**: Test email templates and delivery

### Analytics & Reporting
- **Platform Analytics**: User growth, booking trends, revenue metrics
- **System Settings**: Configure platform settings and parameters

## 🔧 Technical Architecture

### Authentication & Authorization
- Firebase Authentication with custom admin claims
- Role-based access control (RBAC)
- Secure admin-only routes with middleware protection

### Database Integration
- Firestore real-time database
- Optimized queries with pagination
- Real-time updates and subscriptions

### External Integrations
- **Stripe**: Payment processing and webhook handling
- **Resend**: Email delivery service
- **Checkr/Sterling**: Background check providers
- **Firebase Storage**: File upload and storage

## 📋 Admin Navigation

### Main Sections
1. **Dashboard** (`/admin`) - Overview and key metrics
2. **Users** (`/admin/users`) - User management and admin privileges
3. **Listings** (`/admin/listings`) - Gear listing management
4. **Bookings** (`/admin/bookings`) - Rental booking oversight
5. **Messages** (`/admin/messages`) - Communication monitoring
6. **Background Checks** (`/admin/background-checks`) - Verification management
7. **Verification** (`/admin/verification`) - Identity verification
8. **Claims** (`/admin/claims`) - Damage claim handling

### Testing & Monitoring
9. **Webhooks** (`/admin/webhooks`) - Payment webhook testing
10. **BG Check Testing** (`/admin/background-checks/test`) - Provider testing
11. **Email Testing** (`/admin/emails/test`) - Email system testing
12. **System Health** (`/admin/system-health`) - Health monitoring
13. **Integration Tests** (`/admin/integration-tests`) - End-to-end testing

### Configuration
14. **Analytics** (`/admin/analytics`) - Platform analytics
15. **Settings** (`/admin/settings`) - System configuration

## 🛠️ Setup & Configuration

### Environment Variables
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Payment Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
RESEND_API_KEY=re_...
FROM_EMAIL=GearGrab <bookings@geargrab.co>

# Background Check Providers
CHECKR_API_KEY=your_checkr_key
STERLING_API_KEY=your_sterling_key
```

### Admin User Setup
1. Create a user account through normal registration
2. Use the admin interface to grant admin privileges:
   ```typescript
   import { makeUserAdmin } from '$lib/firebase/auth';
   await makeUserAdmin('user_uid_here');
   ```

## 🧪 Testing System

### Health Checks
The system includes comprehensive health monitoring:
- Firebase connection status
- Database operation verification
- Email system configuration
- Payment webhook endpoints
- Background check provider status
- Search functionality
- File storage system

### Integration Tests
End-to-end testing covers:
- User authentication flow
- Database CRUD operations
- Search and filtering
- Email system integration
- Payment webhook processing
- Background check workflow
- File upload and storage
- Real-time messaging

### Manual Testing Interfaces
- **Webhook Testing**: Simulate Stripe webhook events
- **Background Check Testing**: Test provider integrations
- **Email Testing**: Send test emails with various templates

## 📊 Monitoring & Analytics

### Real-time Metrics
- Active users and sessions
- Booking conversion rates
- Revenue tracking
- System performance metrics

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Automatic retry mechanisms
- Fallback systems for external services

## 🔒 Security Features

### Access Control
- Admin-only route protection
- Firebase security rules
- Input validation and sanitization
- CSRF protection

### Data Protection
- Encrypted data transmission
- Secure API endpoints
- Rate limiting
- Audit logging

## 🚀 Deployment

### Production Checklist
1. Configure all environment variables
2. Set up Firebase project with security rules
3. Configure Stripe webhooks
4. Set up email domain with Resend
5. Configure background check provider APIs
6. Test all integrations
7. Run health checks and integration tests

### Monitoring Setup
1. Enable Firebase Analytics
2. Set up error tracking
3. Configure uptime monitoring
4. Set up alert notifications

## 📝 API Endpoints

### Health Check APIs
- `GET /api/health/firebase` - Firebase connection
- `GET /api/health/database` - Database operations
- `GET /api/health/email` - Email system
- `GET /api/health/webhooks` - Webhook endpoints
- `GET /api/health/background-checks` - BG check providers
- `GET /api/health/search` - Search functionality
- `GET /api/health/storage` - File storage

### Testing APIs
- `POST /api/webhooks/test` - Test webhook processing
- `POST /api/background-check/test` - Test BG check providers
- `POST /api/emails/test` - Test email delivery

## 🤝 Support & Maintenance

### Regular Maintenance
- Monitor system health daily
- Review error logs weekly
- Update dependencies monthly
- Test integrations quarterly

### Troubleshooting
1. Check system health dashboard
2. Review integration test results
3. Examine error logs
4. Test individual components
5. Verify external service status

## 📈 Future Enhancements

### Planned Features
- Advanced analytics dashboard
- Automated testing pipelines
- Performance optimization tools
- Enhanced monitoring capabilities
- Multi-tenant support

### Scalability Considerations
- Database query optimization
- Caching strategies
- Load balancing
- Microservice architecture
- CDN integration

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: GearGrab Development Team
