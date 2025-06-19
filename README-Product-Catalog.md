# 🛍️ Product Catalog Service

A comprehensive Node.js service module that exposes CRUD endpoints for a Product catalog, built using **Clean Architecture** principles with TypeScript, Express.js, and comprehensive testing.

## 🏗️ Architecture Overview

This service follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/                 # Business Logic Layer
│   ├── entities/          # Core business entities
│   │   └── Product.ts     # Product domain entity
│   └── repositories/      # Repository interfaces
│       └── ProductRepository.ts
├── application/           # Application Logic Layer
│   └── use-cases/        # Business use cases
│       └── ProductUseCases.ts
├── infrastructure/       # Infrastructure Layer
│   ├── repositories/     # Repository implementations
│   │   └── InMemoryProductRepository.ts
│   └── web/             # HTTP layer
│       ├── controllers/ # HTTP controllers
│       ├── routes/      # Route definitions
│       ├── middleware/  # HTTP middleware
│       └── app.ts       # Express app setup
└── server.ts            # Application entry point
```

## 🚀 Features

### Core Functionality
- ✅ **Complete CRUD Operations** - Create, Read, Update, Delete products
- ✅ **Advanced Search & Filtering** - Search by name, category, price range, stock status
- ✅ **Pagination Support** - Efficient data retrieval with pagination
- ✅ **Stock Management** - Increase/decrease stock with validation
- ✅ **Product Status Management** - Activate/deactivate products
- ✅ **Category Management** - Organize products by categories

### Security & Performance
- 🔒 **JWT Authentication** - Secure API endpoints
- 🛡️ **Role-based Authorization** - Admin/Manager/User roles
- ⚡ **Rate Limiting** - Prevent API abuse
- 🔐 **Input Validation** - Comprehensive request validation
- 🛡️ **Security Headers** - Helmet.js security middleware
- 📊 **Request Logging** - Morgan HTTP request logger

### Developer Experience
- 📝 **TypeScript** - Full type safety
- 🧪 **Comprehensive Testing** - Unit and integration tests
- 📚 **Auto-generated API Documentation** - Built-in API docs
- 🔄 **Hot Reload** - Development with ts-node-dev
- 📋 **ESLint & Prettier** - Code quality and formatting
- 🐳 **Docker Support** - Containerization ready

## 📋 API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products with filters & pagination |
| `GET` | `/api/products/search?q=query` | Search products |
| `GET` | `/api/products/categories` | Get all product categories |
| `GET` | `/api/products/category/:category` | Get products by category |
| `GET` | `/api/products/:id` | Get product by ID |
| `GET` | `/api/products/sku/:sku` | Get product by SKU |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/docs` | API documentation |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/api/products` | Create new product | Admin, Manager |
| `PUT` | `/api/products/:id` | Update product | Admin, Manager |
| `DELETE` | `/api/products/:id` | Delete product | Admin |
| `PATCH` | `/api/products/:id/stock` | Update product stock | Admin, Manager |
| `PATCH` | `/api/products/:id/status` | Toggle product status | Admin, Manager |
| `GET` | `/api/products/management/low-stock` | Get low stock products | Admin, Manager |

## 🛠️ Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd product-catalog-service
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Development**
```bash
npm run dev
```

4. **Production Build**
```bash
npm run build
npm start
```

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# API Security
API_KEY=your-api-key-for-system-access

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📊 Usage Examples

### Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation",
    "price": 199.99,
    "category": "Electronics",
    "sku": "WH-001",
    "stock": 50,
    "isActive": true,
    "tags": ["wireless", "audio", "electronics"],
    "images": ["https://example.com/headphones.jpg"]
  }'
```

### Get Products with Filters
```bash
curl "http://localhost:3000/api/products?category=Electronics&minPrice=100&maxPrice=300&page=1&limit=10&sortBy=price&sortOrder=asc"
```

### Search Products
```bash
curl "http://localhost:3000/api/products/search?q=wireless&page=1&limit=5"
```

### Update Stock
```bash
curl -X PATCH http://localhost:3000/api/products/PRODUCT_ID/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "quantity": 10,
    "operation": "increase"
  }'
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/                 # Unit tests
│   ├── Product.test.ts   # Product entity tests
│   └── ProductUseCases.test.ts
└── integration/          # Integration tests
    └── ProductController.test.ts
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run clean        # Clean build directory
```

### Code Quality
- **ESLint** - Linting with TypeScript rules
- **Prettier** - Code formatting
- **Husky** - Git hooks (optional)
- **Jest** - Testing framework
- **Supertest** - HTTP testing

## 🐳 Docker Support

### Build Docker Image
```bash
npm run docker:build
```

### Run Container
```bash
npm run docker:run
```

### Docker Compose (Optional)
```yaml
version: '3.8'
services:
  product-catalog:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret
    volumes:
      - ./logs:/app/logs
```

## 📈 Performance & Monitoring

### Built-in Features
- **Rate Limiting** - Configurable per endpoint
- **Request Logging** - Morgan HTTP logger
- **Health Checks** - `/health` endpoint
- **Error Tracking** - Structured error responses
- **Memory Management** - Efficient in-memory storage

### Monitoring Endpoints
- `GET /health` - Service health status
- `GET /api` - API information
- `GET /api/docs` - Complete API documentation

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure authentication
- **Role-based Access** - Admin/Manager/User roles
- **API Key Support** - Alternative authentication method

### Security Middleware
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Joi schema validation

## 🚀 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-secret
API_KEY=your-production-api-key
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start dist/server.js --name product-catalog
pm2 startup
pm2 save
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📚 API Documentation

Visit `http://localhost:3000/api/docs` when the server is running to see the complete interactive API documentation with:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error codes and messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Clean Architecture principles by Robert C. Martin
- Express.js community
- TypeScript team
- Jest testing framework
- All open-source contributors

---

**Built with ❤️ using Clean Architecture principles**
