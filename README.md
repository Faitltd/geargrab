# GearGrab - SvelteKit Version

A peer-to-peer outdoor gear rental marketplace built with SvelteKit, Tailwind CSS, and the Base44 SDK.

## 🏔️ Features

- **Browse Gear** - Discover outdoor equipment from fellow adventurers
- **Rental Management** - Track your borrowing and lending activities
- **Secure Messaging** - Communicate directly with gear owners and renters
- **Cart & Checkout** - Streamlined rental booking process
- **Profile Management** - Manage your gear listings and account
- **GearGrab Guarantee** - Protected rentals with damage coverage

## 🚀 Tech Stack

- **Framework**: SvelteKit
- **Styling**: Tailwind CSS + shadcn-svelte
- **Icons**: Lucide Svelte
- **Backend**: Base44 SDK
- **Build Tool**: Vite
- **Type Safety**: TypeScript

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/geargrab.git
cd geargrab
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
- `npm run lint` - Run linter
- `npm run format` - Format code

## 🚢 Deployment

### Cloud Run

The application is configured for deployment to Google Cloud Run with automatic CI/CD via GitHub Actions.

1. Set up the required GitHub secrets:
   - `GCP_PROJECT_ID` - Your Google Cloud Project ID
   - `GCP_SA_KEY` - Service Account Key JSON

2. Push to the `main` branch to trigger automatic deployment

### Manual Deployment

Build and deploy manually:

```bash
# Build the application
npm run build

# Deploy to Cloud Run
gcloud run deploy geargrab-svelte \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── api/           # Base44 SDK integration
│   ├── components/ui/ # shadcn-svelte components
│   ├── stores/        # Svelte stores (cart, mobile)
│   └── utils.ts       # Utility functions
├── routes/            # SvelteKit pages
│   ├── +layout.svelte # Main layout with sidebar
│   ├── +page.svelte   # Browse gear (home)
│   ├── gear-detail/   # Individual gear pages
│   ├── my-rentals/    # Rental management
│   ├── list-gear/     # Add new gear
│   ├── messages/      # Chat interface
│   ├── profile/       # User profile
│   ├── cart/          # Shopping cart
│   ├── checkout/      # Payment flow
│   └── payment-success/ # Confirmation
└── app.css           # Global styles
```

## 🌐 Environment Variables

Create a `.env` file in the root directory:

```env
# Base44 Configuration
BASE44_APP_ID=your-app-id
BASE44_SERVER_URL=https://base44.app
BASE44_ENV=prod
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For support, email support@geargrab.co or visit our [documentation](https://docs.geargrab.co).
