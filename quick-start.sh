#!/bin/bash

# Quick Start Script for GearGrab
echo "🚀 Quick starting GearGrab..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Step 1:${NC} Cleaning up conflicting dependencies..."
rm -rf node_modules package-lock.json .svelte-kit

echo -e "${BLUE}Step 2:${NC} Using clean package.json..."
cp package-clean.json package.json

echo -e "${BLUE}Step 3:${NC} Installing minimal dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
    
    echo -e "${BLUE}Step 4:${NC} Creating basic environment file..."
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
NODE_ENV=development
PORT=5173
PUBLIC_APP_URL=http://localhost:5173

# Firebase (Demo values - replace with your actual values)
PUBLIC_FIREBASE_API_KEY=demo-key
PUBLIC_FIREBASE_AUTH_DOMAIN=demo.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=demo-project
PUBLIC_FIREBASE_STORAGE_BUCKET=demo.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:demo

# Firebase Admin (Demo values)
FIREBASE_CLIENT_EMAIL=demo@demo.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nDEMO\n-----END PRIVATE KEY-----"
EOF
        echo -e "${GREEN}✅ Created .env file${NC}"
    fi
    
    echo -e "${BLUE}Step 5:${NC} Creating basic home page..."
    mkdir -p src/routes
    cat > src/routes/+page.svelte << 'EOF'
<script>
  let name = 'GearGrab';
</script>

<svelte:head>
  <title>Welcome to {name}</title>
  <meta name="description" content="GearGrab - Your outdoor gear marketplace" />
</svelte:head>

<main>
  <div class="container">
    <h1>🎒 Welcome to {name}!</h1>
    <p>Your outdoor gear marketplace is running locally</p>
    
    <div class="success-box">
      <strong>Success!</strong> GearGrab is running in development mode.
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <h2>🔧 Development</h2>
        <p>You're running in development mode with hot reloading enabled.</p>
      </div>
      
      <div class="info-card">
        <h2>🔥 Firebase</h2>
        <p>Configure your Firebase project in the .env file to enable authentication.</p>
      </div>
      
      <div class="info-card">
        <h2>💳 Stripe</h2>
        <p>Add your Stripe test keys to enable payment processing.</p>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #f7fafc;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }
  
  h1 {
    font-size: 3rem;
    color: #2563eb;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.25rem;
    color: #6b7280;
    margin-bottom: 2rem;
  }
  
  .success-box {
    background-color: #dcfce7;
    border: 1px solid #16a34a;
    color: #15803d;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
  }
  
  .info-card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .info-card h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  .info-card p {
    font-size: 1rem;
    color: #6b7280;
    margin: 0;
  }
</style>
EOF
    
    echo -e "${GREEN}✅ Created basic home page${NC}"
    
    echo -e "${BLUE}Step 6:${NC} Starting development server..."
    echo ""
    echo -e "${GREEN}🎉 GearGrab will be available at: http://localhost:5173${NC}"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    
    npm run dev
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo "Try running: npm install --legacy-peer-deps"
fi
