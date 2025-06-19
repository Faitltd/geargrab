# 🔗 GearGrab API Documentation

Comprehensive RESTful API documentation following OpenAPI 3.0 specification with proper HTTP status codes, request/response schemas, and error handling.

## 🏗️ API Architecture

### **OpenAPI 3.0 Specification**
- **Complete API specification** in `openapi.yaml`
- **Proper HTTP status codes** for all scenarios
- **Comprehensive request/response schemas** with validation
- **Detailed error handling** with consistent error format
- **Authentication and authorization** patterns
- **Rate limiting** and security headers

### **API Endpoints Overview**

#### **Authentication Endpoints**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `POST /auth/forgot-password` - Password reset

#### **Gear Management Endpoints**
- `GET /gear` - List gear items with filtering
- `POST /gear` - Create new gear listing
- `GET /gear/{gearId}` - Get gear details
- `PUT /gear/{gearId}` - Update gear item
- `DELETE /gear/{gearId}` - Delete gear item

#### **Booking Endpoints**
- `GET /bookings` - List user bookings
- `POST /bookings` - Create new booking
- `GET /bookings/{bookingId}` - Get booking details
- `PATCH /bookings/{bookingId}` - Update booking status
- `POST /bookings/{bookingId}/payment` - Process payment

## 🚀 Quick Start

### **Generate Documentation**

```bash
# Install dependencies
npm install js-yaml

# Generate all documentation
node scripts/generate-api-docs.js all

# Generate specific documentation
node scripts/generate-api-docs.js interactive
node scripts/generate-api-docs.js postman
node scripts/generate-api-docs.js schemas
```

### **View Interactive Documentation**

```bash
# Generate and open interactive docs
node scripts/generate-api-docs.js interactive
open docs/api/index.html
```

### **Import to Postman**

```bash
# Generate Postman collection
node scripts/generate-api-docs.js postman

# Import docs/api/postman-collection.json to Postman
```

## 📋 HTTP Status Codes

### **Success Codes**
- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **204 No Content** - Successful deletion

### **Client Error Codes**
- **400 Bad Request** - Invalid request format
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., booking dates)
- **422 Unprocessable Entity** - Validation errors
- **429 Too Many Requests** - Rate limit exceeded

### **Server Error Codes**
- **500 Internal Server Error** - Server error

## 🔒 Authentication

### **JWT Bearer Token**
```bash
Authorization: Bearer <your-jwt-token>
```

### **API Key (Service-to-Service)**
```bash
X-API-Key: <your-api-key>
```

### **Authentication Flow**
1. **Register/Login** → Receive JWT token
2. **Include token** in Authorization header
3. **Refresh token** before expiration
4. **Logout** to invalidate session

## 📊 Request/Response Schemas

### **Standard Response Format**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_1234567890"
}
```

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields",
    "details": {
      "fields": {
        "email": ["Email format is invalid"],
        "password": ["Password must be at least 8 characters"]
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_1234567890",
  "path": "/api/v1/auth/register"
}
```

### **Pagination Format**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false,
      "nextPage": 2,
      "prevPage": null
    }
  }
}
```

## 🛡️ Error Handling

### **Error Codes**
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `INVALID_CREDENTIALS` | Authentication credentials invalid |
| `ACCOUNT_LOCKED` | User account temporarily locked |
| `EMAIL_EXISTS` | Email address already registered |
| `USER_NOT_FOUND` | User account not found |
| `TOKEN_EXPIRED` | Authentication token expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `BOOKING_CONFLICT` | Booking dates not available |
| `PAYMENT_FAILED` | Payment processing failed |
| `INTERNAL_ERROR` | Internal server error |

### **Rate Limiting**
- **Authenticated users**: 1000 requests/hour
- **Unauthenticated users**: 100 requests/hour
- **Rate limit headers** included in responses

### **Validation Errors**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields",
    "details": {
      "fields": {
        "email": [
          "Email format is invalid",
          "Email is required"
        ],
        "password": [
          "Password must be at least 8 characters long",
          "Password must contain at least one uppercase letter"
        ]
      }
    }
  }
}
```

## 📡 API Examples

### **Authentication Example**
```bash
# Register new user
curl -X POST https://api.geargrab.co/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "username": "johndoe"
  }'

# Login
curl -X POST https://api.geargrab.co/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

### **Gear Listing Example**
```bash
# List gear with filters
curl -X GET "https://api.geargrab.co/v1/gear?category=camping&location=San Francisco, CA&radius=25&priceMax=50" \
  -H "Authorization: Bearer <token>"

# Create gear listing
curl -X POST https://api.geargrab.co/v1/gear \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F 'name=4-Person Camping Tent' \
  -F 'description=Spacious family tent perfect for car camping' \
  -F 'category=camping' \
  -F 'dailyPrice=25.00' \
  -F 'condition=excellent' \
  -F 'images=@tent1.jpg' \
  -F 'images=@tent2.jpg'
```

### **Booking Example**
```bash
# Create booking
curl -X POST https://api.geargrab.co/v1/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gearId": "gear_1234567890",
    "startDate": "2024-02-01",
    "endDate": "2024-02-07",
    "deliveryMethod": "pickup",
    "message": "Looking forward to using this tent!"
  }'

# Process payment
curl -X POST https://api.geargrab.co/v1/bookings/book_1234567890/payment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethodId": "pm_1234567890",
    "savePaymentMethod": true
  }'
```

## 🔧 Development Tools

### **OpenAPI Validation**
```bash
# Validate specification
node scripts/generate-api-docs.js validate
```

### **Documentation Generation**
```bash
# Generate endpoint summary
node scripts/generate-api-docs.js summary

# Generate schema documentation
node scripts/generate-api-docs.js schemas

# Generate error documentation
node scripts/generate-api-docs.js errors

# Generate interactive HTML docs
node scripts/generate-api-docs.js interactive

# Generate Postman collection
node scripts/generate-api-docs.js postman
```

### **Testing with Postman**
1. Generate Postman collection: `node scripts/generate-api-docs.js postman`
2. Import `docs/api/postman-collection.json` to Postman
3. Set environment variables:
   - `baseUrl`: API base URL
   - `auth_token`: JWT token from login

### **Testing with curl**
```bash
# Set environment variables
export API_BASE_URL="https://api.geargrab.co/v1"
export AUTH_TOKEN="your-jwt-token"

# Test authenticated endpoint
curl -X GET "$API_BASE_URL/gear" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## 📈 API Statistics

- **Total Endpoints**: 15+
- **Authentication Endpoints**: 5
- **Gear Management Endpoints**: 5
- **Booking Endpoints**: 5
- **HTTP Status Codes**: 11
- **Error Codes**: 11
- **Request/Response Schemas**: 25+
- **Webhook Events**: 3

## 🔗 Related Documentation

- **[OpenAPI Specification](./openapi.yaml)** - Complete API specification
- **[Endpoint Summary](./endpoint-summary.md)** - Quick reference of all endpoints
- **[Schema Documentation](./schemas.md)** - Detailed schema definitions
- **[Error Handling](./error-handling.md)** - Comprehensive error documentation
- **[Interactive Documentation](./index.html)** - Swagger UI interface
- **[Postman Collection](./postman-collection.json)** - Import to Postman

This comprehensive API documentation provides everything needed to integrate with the GearGrab platform, including proper error handling, authentication, and detailed examples for all endpoints.
