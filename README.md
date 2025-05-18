# GearGrab

GearGrab is a peer-to-peer marketplace for outdoor gear rentals. Find camping, hiking, skiing, and other outdoor equipment from local owners.

## Features

- Browse and search for outdoor gear by category, location, and availability
- List your own gear for rent with detailed descriptions and photos
- Secure booking and payment processing
- User verification system for trust and safety
- Messaging between renters and owners
- Reviews and ratings
- Dashboard for managing listings and bookings

## Tech Stack

- **Frontend**: SvelteKit, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **Deployment**: Google Cloud Run, Firebase Hosting
- **Payment Processing**: Stripe

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firebase account
- Stripe account (for payment processing)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/geargrab.git
   cd geargrab
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase and Stripe configuration:
   ```
   # Firebase Client Config
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # Firebase Admin Config (for server-side)
   FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
   FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
   FIREBASE_PROJECT_ID=your_project_id
   
   # Stripe
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Firebase Emulators

For local development, you can use Firebase emulators:

```
npm run emulate
```

This will start the Firebase emulators for Authentication, Firestore, and Storage.

## Deployment

### Firebase Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Deploy to Firebase:
   ```
   npm run deploy
   ```

### Cloud Run Deployment

Follow the instructions in `cloud-run-deployment.md` for deploying to Google Cloud Run.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [SvelteKit](https://kit.svelte.dev/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Stripe](https://stripe.com/)
