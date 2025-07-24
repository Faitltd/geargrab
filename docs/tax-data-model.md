# Enhanced Transaction Data Model for Tax Compliance

## Overview
This document outlines the enhanced data model required to ensure all transactional data is properly captured for tax document generation, including 1099 forms and annual tax reporting.

## Core Entities

### 1. TransactionRecord Entity
Primary financial transaction record for tax purposes.

```javascript
{
  // Unique Identifiers
  id: "uuid", // Primary key
  transaction_number: "string", // Human-readable transaction ID (e.g., "TXN-2024-000001")
  rental_id: "uuid", // Reference to Rental entity
  
  // Payment Processing
  payment_processor: "string", // "stripe", "paypal", etc.
  payment_processor_transaction_id: "string", // External transaction ID
  payment_method_type: "string", // "card", "bank_transfer", etc.
  payment_status: "string", // "completed", "pending", "failed", "refunded"
  
  // Financial Breakdown
  base_amount: "decimal", // Rental amount before fees
  platform_fee_amount: "decimal", // GearGrab service fee
  payment_processing_fee: "decimal", // Stripe/payment processor fee
  tax_amount: "decimal", // Any applicable taxes
  total_amount: "decimal", // Total transaction amount
  
  // Fee Allocation
  owner_payout_amount: "decimal", // Amount paid to gear owner
  platform_revenue: "decimal", // GearGrab's revenue from transaction
  
  // Parties
  payer_user_id: "uuid", // Renter
  payee_user_id: "uuid", // Gear owner
  
  // Timing
  transaction_date: "datetime", // When payment was processed
  tax_year: "integer", // Tax year for reporting (2024, 2025, etc.)
  
  // Tax Reporting
  requires_1099: "boolean", // Whether this transaction counts toward 1099 threshold
  is_business_transaction: "boolean", // B2B vs B2C classification
  
  // Audit Trail
  created_at: "datetime",
  updated_at: "datetime",
  created_by: "uuid"
}
```

### 2. Enhanced User Entity
Extended user profile with tax-related information.

```javascript
{
  // Existing fields...
  id: "uuid",
  email: "string",
  full_name: "string",
  
  // Tax Information
  tax_id_type: "string", // "ssn", "ein", "itin", "none"
  tax_id_number: "string", // Encrypted storage
  tax_id_verified: "boolean",
  
  // Entity Type
  entity_type: "string", // "individual", "business", "llc", "corporation"
  business_name: "string", // If applicable
  
  // Address for Tax Documents
  tax_address: {
    street_address: "string",
    city: "string",
    state: "string",
    zip_code: "string",
    country: "string"
  },
  
  // Tax Preferences
  backup_withholding: "boolean",
  tax_document_delivery: "string", // "email", "mail", "both"
  
  // Annual Tracking
  annual_earnings: {
    2024: "decimal",
    2023: "decimal"
    // ... previous years
  },
  
  // Compliance
  w9_submitted: "boolean",
  w9_submission_date: "datetime",
  requires_1099: "boolean", // Based on annual earnings threshold
  
  // Audit
  tax_info_updated_at: "datetime",
  tax_info_updated_by: "uuid"
}
```

### 3. TaxDocument Entity
Records of generated tax documents.

```javascript
{
  id: "uuid",
  document_type: "string", // "1099-MISC", "1099-K", "annual_summary"
  tax_year: "integer",
  recipient_user_id: "uuid",
  
  // Document Details
  total_earnings: "decimal",
  total_transactions: "integer",
  document_status: "string", // "draft", "generated", "sent", "corrected"
  
  // File Storage
  document_url: "string", // Secure file storage URL
  document_hash: "string", // For integrity verification
  
  // Delivery
  sent_date: "datetime",
  delivery_method: "string", // "email", "mail"
  delivery_status: "string", // "pending", "delivered", "failed"
  
  // Compliance
  irs_filing_required: "boolean",
  irs_filing_date: "datetime",
  
  created_at: "datetime",
  created_by: "uuid"
}
```

### 4. RefundAdjustment Entity
Track refunds and adjustments that affect tax reporting.

```javascript
{
  id: "uuid",
  original_transaction_id: "uuid",
  adjustment_type: "string", // "refund", "chargeback", "fee_adjustment"
  
  // Financial Impact
  adjustment_amount: "decimal",
  reason: "string",
  
  // Tax Impact
  affects_tax_reporting: "boolean",
  tax_year_impact: "integer",
  
  // Processing
  processed_date: "datetime",
  processor_reference: "string",
  
  created_at: "datetime",
  created_by: "uuid"
}
```

## Data Relationships

```
User (1) -----> (many) TransactionRecord
User (1) -----> (many) TaxDocument
TransactionRecord (1) -----> (many) RefundAdjustment
Rental (1) -----> (1) TransactionRecord
```

## Tax Reporting Requirements

### 1099-MISC Threshold
- Track annual earnings per user
- Generate 1099-MISC when user earnings exceed $600 in a tax year
- Include all platform fees paid to the user

### Data Retention
- Maintain transaction records for minimum 7 years
- Secure storage of tax identification information
- Audit trail for all tax-related data changes

### Compliance Features
- Automated threshold monitoring
- Annual document generation workflows
- IRS filing integration capabilities
- Backup withholding calculation when required

## Implementation Considerations

### Security
- Encrypt all tax identification numbers
- Restrict access to tax data to authorized personnel only
- Implement audit logging for all tax data access

### Performance
- Index transaction records by tax_year and user_id
- Implement efficient aggregation queries for annual calculations
- Consider data archiving for older tax years

### Integration Points
- Payment processor webhooks for real-time transaction data
- Tax document generation service
- Email/mail delivery services for tax documents
- IRS e-filing integration (future enhancement)
