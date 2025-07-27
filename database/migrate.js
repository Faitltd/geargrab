#!/usr/bin/env node

/**
 * Database Migration Script for GearGrab
 * 
 * This script sets up the PostgreSQL database with all required tables,
 * indexes, and functions for the GearGrab marketplace.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'geargrab',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
};

// Create database connection pool
const pool = new Pool(dbConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting GearGrab database migration...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    console.log('📋 Creating tables and indexes...');
    await client.query(schema);
    
    console.log('✅ Database migration completed successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Insert some sample data for development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🌱 Seeding development data...');
      await seedDevelopmentData(client);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedDevelopmentData(client) {
  try {
    // Create a test user
    const testUser = await client.query(`
      INSERT INTO users (
        email, display_name, first_name, last_name, 
        city, state, zip_code, is_verified
      ) VALUES (
        'test@geargrab.com', 'Test User', 'Test', 'User',
        'Denver', 'CO', '80202', true
      ) RETURNING id
    `);
    
    const userId = testUser.rows[0].id;
    
    // Create sample gear items
    const gearItems = [
      {
        title: 'REI Co-op Half Dome 2 Plus Tent',
        description: 'Spacious 2-person tent perfect for car camping and backpacking. Easy to set up with color-coded clips.',
        category: 'camping',
        subcategory: 'tents',
        brand: 'REI Co-op',
        model: 'Half Dome 2 Plus',
        condition: 'Like New',
        daily_price: 25.00,
        weekly_price: 150.00,
        city: 'Denver',
        state: 'CO',
        zip_code: '80202'
      },
      {
        title: 'Osprey Atmos AG 65 Backpack',
        description: 'Ultra-comfortable 65L backpack with Anti-Gravity suspension system. Perfect for multi-day hikes.',
        category: 'hiking',
        subcategory: 'backpacks',
        brand: 'Osprey',
        model: 'Atmos AG 65',
        condition: 'Good',
        daily_price: 15.00,
        weekly_price: 90.00,
        city: 'Boulder',
        state: 'CO',
        zip_code: '80301'
      },
      {
        title: 'YETI Tundra 45 Cooler',
        description: 'Rotomolded cooler that keeps ice for days. Perfect for camping trips and tailgating.',
        category: 'camping',
        subcategory: 'cooking',
        brand: 'YETI',
        model: 'Tundra 45',
        condition: 'Like New',
        daily_price: 20.00,
        weekly_price: 120.00,
        city: 'Fort Collins',
        state: 'CO',
        zip_code: '80521'
      }
    ];
    
    for (const item of gearItems) {
      await client.query(`
        INSERT INTO gear_items (
          owner_id, title, description, category, subcategory,
          brand, model, condition, daily_price, weekly_price,
          city, state, zip_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        userId, item.title, item.description, item.category, item.subcategory,
        item.brand, item.model, item.condition, item.daily_price, item.weekly_price,
        item.city, item.state, item.zip_code
      ]);
    }
    
    console.log('  ✅ Created test user and sample gear items');
    
  } catch (error) {
    console.error('  ❌ Failed to seed development data:', error);
  }
}

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'up':
    runMigration();
    break;
  case 'down':
    console.log('⚠️  Drop database functionality not implemented for safety');
    console.log('   To reset the database, manually drop and recreate it');
    break;
  default:
    console.log('Usage: node migrate.js [up|down]');
    console.log('  up   - Run migrations (create tables)');
    console.log('  down - Drop all tables (not implemented)');
    process.exit(1);
}
