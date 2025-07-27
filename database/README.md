# GearGrab Database Setup

This directory contains the database schema and migration scripts for the GearGrab marketplace.

## Prerequisites

1. **PostgreSQL 12+** installed and running
2. **Node.js 16+** for running migration scripts
3. Database created (e.g., `createdb geargrab`)

## Quick Setup

1. **Install dependencies:**
   ```bash
   cd database
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run migrations:**
   ```bash
   npm run migrate
   ```

## Database Schema

The schema includes the following main tables:

### Core Tables
- **users** - User accounts and profiles
- **gear_items** - Rental equipment listings
- **rentals** - Rental bookings and transactions
- **messages** - User-to-user messaging
- **reviews** - User and gear reviews

### Supporting Tables
- **cart_items** - Temporary checkout storage
- **transaction_records** - Financial transaction tracking
- **guarantee_claims** - Damage/dispute claims
- **tax_documents** - Tax compliance documents
- **refund_adjustments** - Payment adjustments
- **notifications** - User notifications

## Key Features

### Performance Optimizations
- Comprehensive indexing for fast queries
- Full-text search on gear items
- Optimized queries for common operations

### Data Integrity
- Foreign key constraints
- Check constraints for data validation
- Automatic timestamp updates
- Transaction number generation

### Tax Compliance
- Complete transaction tracking
- 1099 document generation support
- Multi-year tax reporting
- Audit trail maintenance

## Environment Variables

```bash
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_NAME=geargrab          # Database name
DB_USER=postgres          # Database user
DB_PASSWORD=password      # Database password
NODE_ENV=development      # Environment (development/production)
```

## Migration Commands

```bash
# Run all migrations (create tables)
npm run migrate

# Reset database (manual process)
# 1. Drop database: dropdb geargrab
# 2. Create database: createdb geargrab
# 3. Run migrations: npm run migrate
```

## Development Data

When running in development mode (`NODE_ENV=development`), the migration script will automatically create:
- A test user account
- Sample gear items
- Basic data for testing

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use secure database credentials
3. Consider using connection pooling
4. Set up regular backups
5. Monitor database performance

## Backup and Recovery

### Backup
```bash
pg_dump geargrab > backup.sql
```

### Restore
```bash
psql geargrab < backup.sql
```

## Monitoring

Key metrics to monitor:
- Connection pool usage
- Query performance
- Index usage
- Table sizes
- Transaction throughput

## Security Considerations

- Use strong database passwords
- Limit database user permissions
- Enable SSL connections in production
- Regular security updates
- Audit log monitoring
