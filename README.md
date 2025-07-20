# GearGrab

A modern, refactored marketplace for outdoor gear built with SvelteKit, Firebase, and TypeScript.

## 🚀 Features

- **User Authentication**: Secure login/signup with Firebase Auth and Google OAuth
- **Gear Listings**: Create, browse, and manage outdoor gear listings with advanced filtering
- **Rental System**: Comprehensive rental management with date selection and booking
- **Sales Platform**: Buy and sell gear with integrated Stripe payments
- **Condition Verification**: Photo-based condition checking with camera integration
- **Reviews & Ratings**: Comprehensive user and listing review system
- **Real-time Updates**: Live notifications and real-time data synchronization
- **Responsive Design**: Mobile-first responsive interface with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with strict type checking

## 🛠 Tech Stack

- **Frontend**: SvelteKit 2.x, TypeScript 5.x, Tailwind CSS 3.x
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Payments**: Stripe integration with webhooks
- **Development**: Vite, ESLint, Prettier, Husky
- **Deployment**: Firebase Hosting with CI/CD

## 📁 Refactored Architecture

The codebase has been completely refactored with improved organization:

### Core Structure
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   ├── forms/          # Form-specific components
│   │   ├── auth/           # Authentication components
│   │   ├── gear/           # Gear-related components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── modals/         # Modal components
│   │   └── index.ts        # Component exports
│   ├── services/           # Business logic layer
│   │   ├── base.service.ts # Base service class
│   │   ├── api.service.ts  # HTTP client service
│   │   ├── *.service.ts    # Domain-specific services
│   │   └── index.ts        # Service exports
│   ├── stores/             # State management
│   │   ├── base.store.ts   # Base store patterns
│   │   ├── *.store.ts      # Domain-specific stores
│   │   └── index.ts        # Store exports
│   ├── types/              # TypeScript definitions
│   │   ├── common.ts       # Common types
│   │   ├── *.ts           # Domain-specific types
│   │   └── index.ts        # Type exports
│   ├── utils/              # Utility functions
│   │   ├── formatters.ts   # Data formatting
│   │   ├── validators.ts   # Input validation
│   │   ├── *.ts           # Other utilities
│   │   └── index.ts        # Utility exports
│   └── index.ts            # Main library exports
├── routes/                 # SvelteKit routes
└── app.html               # HTML template
```

### Key Improvements

1. **Type Safety**: Comprehensive TypeScript types for all data structures
2. **Service Layer**: Consistent service patterns with base classes and error handling
3. **Component Architecture**: Reusable UI components with consistent prop interfaces
4. **State Management**: Enhanced stores with base patterns and reactive updates
5. **Utility Functions**: Centralized formatters, validators, and helpers
6. **Configuration**: Improved build setup with strict linting and formatting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI
- Git

### Installation

1. **Clone and install**:
```bash
git clone <repository-url>
cd geargrab
npm install
```

2. **Firebase setup**:
```bash
firebase login
firebase use --add
```

3. **Environment configuration**:
Create `.env.local`:
```env
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Start development**:
```bash
npm run dev
```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run check` - Run TypeScript type checking
- `npm run check:watch` - Watch mode for type checking
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run prepare` - Set up Husky git hooks

## 🏗 Development Patterns

### Services
```typescript
// Use the base service for consistent patterns
class MyService extends BaseService<MyEntity> {
  constructor() {
    super('my-collection');
  }

  async customMethod(): Promise<MyEntity[]> {
    // Implementation with error handling
  }
}
```

### Stores
```typescript
// Use base store for reactive state management
const myStore = new BaseStore<MyData>(initialData);

// Or create async stores
const asyncStore = createAsyncStore(() => myService.getData());
```

### Components
```typescript
// Consistent prop interfaces
export let variant: ButtonVariant = 'primary';
export let size: ButtonSize = 'md';
export let disabled = false;
```

## 🔧 Firebase Configuration

1. **Create Firebase project**
2. **Enable services**:
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
   - Functions
3. **Deploy rules**:
```bash
firebase deploy --only firestore:rules,storage
```

## 🚀 Deployment

### Production Build
```bash
npm run build
firebase deploy
```

## 🧪 Testing

```bash
# Run type checking
npm run check

# Run linting
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes following the established patterns
4. Run tests: `npm run check && npm run lint`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
