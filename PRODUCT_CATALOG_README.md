# Product Catalog Service - Clean Architecture Implementation

This document describes the Product Catalog service module built using clean architecture principles for the GearGrab application.

## Architecture Overview

The service follows clean architecture principles with clear separation of concerns across four main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   API Routes    │  │   Controllers   │  │ Validators  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Use Cases     │  │      DTOs       │  │   Mappers   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │    Entities     │  │    Services     │  │ Repositories│ │
│  │                 │  │                 │  │ (Interfaces)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Firestore     │  │   Data Mappers  │  │   External  │ │
│  │  Repositories   │  │                 │  │   Services  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/lib/
├── shared/
│   ├── types/Product.ts              # Core type definitions
│   ├── errors/ProductErrors.ts       # Custom error classes
│   └── utils/ValidationUtils.ts      # Validation utilities
├── domain/
│   ├── entities/Product.ts           # Product entity with business logic
│   ├── repositories/ProductRepository.ts  # Repository interface
│   └── services/ProductService.ts    # Domain services
├── infrastructure/
│   ├── repositories/FirestoreProductRepository.ts  # Firestore implementation
│   └── database/ProductMapper.ts     # Data mapping utilities
├── application/
│   ├── usecases/
│   │   ├── CreateProduct.ts          # Create product use case
│   │   ├── GetProduct.ts             # Get product use case
│   │   ├── ListProducts.ts           # List products use case
│   │   ├── UpdateProduct.ts          # Update product use case
│   │   └── DeleteProduct.ts          # Delete product use case
│   └── dto/ProductDTO.ts             # Data transfer objects
├── presentation/
│   └── controllers/ProductController.ts  # HTTP request handlers
├── container/
│   └── ProductContainer.ts           # Dependency injection container
└── routes/api/products/
    ├── +server.ts                    # Main products API endpoints
    └── [productId]/+server.ts        # Individual product endpoints
```

## Core Features

### Product Management
- **Create Products**: Add new products with comprehensive validation
- **Read Products**: Retrieve products by ID, slug, or search criteria
- **Update Products**: Modify existing products with business rule validation
- **Delete Products**: Soft delete with business rule checks
- **Search & Filter**: Advanced search with category, price, and tag filtering
- **Inventory Management**: Track quantity, reservations, and availability

### Business Rules
- Inventory tracking with reservation system
- Price validation (daily, weekly, monthly rates)
- Status transitions with proper authorization
- SEO-friendly slugs with uniqueness validation
- Image and specification management
- Tag-based categorization

## API Endpoints

### Products Collection (`/api/products`)

#### GET - List/Search Products
```http
GET /api/products?query=camera&category=photography&page=1&pageSize=20
```

**Query Parameters:**
- `query` - Search text
- `category` - Product category filter
- `subcategory` - Subcategory filter
- `brand` - Brand filter
- `status` - Status filter (active, inactive, draft, etc.)
- `minPrice`, `maxPrice` - Price range filter
- `tags` - Comma-separated tags
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `sortBy` - Sort field (name, price, createdAt, updatedAt)
- `sortDirection` - Sort direction (asc, desc)

#### POST - Create Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "Professional DSLR Camera",
  "description": "High-quality camera for professional photography",
  "category": "photography",
  "brand": "Canon",
  "price": {
    "dailyRate": 50,
    "weeklyRate": 300,
    "securityDeposit": 500,
    "currency": "USD"
  },
  "inventory": {
    "quantity": 5,
    "reserved": 0,
    "trackInventory": true,
    "allowBackorder": false
  },
  "images": ["https://example.com/image1.jpg"],
  "tags": ["camera", "photography", "professional"],
  "specifications": {
    "resolution": "24MP",
    "lens": "18-55mm"
  },
  "seo": {
    "metaTitle": "Professional DSLR Camera Rental",
    "metaDescription": "Rent professional DSLR camera for your photography needs",
    "keywords": ["camera", "rental", "photography"]
  }
}
```

### Individual Product (`/api/products/{productId}`)

#### GET - Get Product
```http
GET /api/products/abc123?includeDetails=true
```

#### PUT/PATCH - Update Product
```http
PUT /api/products/abc123
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": {
    "dailyRate": 60
  }
}
```

#### DELETE - Delete Product
```http
DELETE /api/products/abc123
```

### Special Endpoints

#### Get Featured Products
```http
GET /api/products/featured?limit=12
```

#### Get Recent Products
```http
GET /api/products/recent?limit=12
```

#### Get Products by Category
```http
GET /api/products/category/photography?page=1&pageSize=20
```

## Usage Examples

### Creating a Product

```typescript
import { getProductController } from '$lib/container/ProductContainer';

const controller = getProductController();

const productData = {
  name: "Mountain Bike",
  description: "High-performance mountain bike for trail riding",
  category: "sports_equipment",
  price: {
    dailyRate: 25,
    weeklyRate: 150,
    securityDeposit: 200,
    currency: "USD"
  },
  inventory: {
    quantity: 3,
    reserved: 0,
    trackInventory: true,
    allowBackorder: false
  },
  images: ["https://example.com/bike.jpg"],
  tags: ["bike", "mountain", "sports"],
  specifications: {
    "frame": "Aluminum",
    "gears": "21-speed"
  },
  seo: {
    metaTitle: "Mountain Bike Rental",
    keywords: ["bike", "mountain", "rental"]
  }
};

const result = await controller.createProduct(productData, userId, userRole);
```

### Searching Products

```typescript
const searchRequest = {
  query: "camera",
  category: "photography",
  priceRange: { min: 20, max: 100 },
  page: 1,
  pageSize: 20,
  sortBy: "createdAt",
  sortDirection: "desc"
};

const result = await controller.listProducts(searchRequest, userId, userRole);
```

## Error Handling

The service uses custom error classes for different scenarios:

- `ProductNotFoundError` - Product doesn't exist
- `ProductValidationError` - Invalid input data
- `ProductUnauthorizedError` - Authentication required
- `ProductForbiddenError` - Insufficient permissions
- `ProductBusinessRuleError` - Business rule violation
- `ProductDatabaseError` - Database operation failed

## Authentication & Authorization

- **Create/Update/Delete**: Requires authentication
- **View**: Public for active products, restricted for draft/inactive
- **Admin Operations**: Bulk operations, hard delete, view all statuses

## Business Rules

1. **Inventory Management**
   - Reserved quantity cannot exceed total quantity
   - Available quantity = Total - Reserved
   - Low stock alerts when below threshold

2. **Pricing Rules**
   - Daily rate must be positive
   - Weekly rate ≤ 7 × daily rate
   - Monthly rate ≤ 30 × daily rate
   - Security deposit ≥ 0

3. **Status Transitions**
   - Draft → Active (requires images and valid price)
   - Active → Inactive/Out of Stock/Discontinued
   - Cannot delete products with active bookings

4. **SEO & Slugs**
   - Slugs auto-generated from product name
   - Must be unique across all products
   - URL-friendly format (lowercase, hyphens)

## Testing

The clean architecture makes testing straightforward:

```typescript
// Unit test example
import { Product } from '$lib/domain/entities/Product';

describe('Product Entity', () => {
  it('should calculate price correctly', () => {
    const product = new Product(productData);
    const price = product.calculatePrice(7); // 7 days
    expect(price).toBe(product.price.weeklyRate);
  });
});
```

## Deployment Considerations

1. **Database Indexes**: Ensure Firestore indexes for search fields
2. **Caching**: Consider Redis for frequently accessed products
3. **Image Storage**: Use Firebase Storage with CDN
4. **Search**: Consider Algolia for advanced search capabilities
5. **Monitoring**: Add logging and metrics for performance tracking

## Future Enhancements

1. **Advanced Search**: Full-text search with Elasticsearch/Algolia
2. **Recommendations**: ML-based product recommendations
3. **Bulk Operations**: Import/export functionality
4. **Versioning**: Product version history
5. **Analytics**: Product performance metrics
6. **Caching**: Redis integration for performance
7. **Events**: Domain events for integration with other services
