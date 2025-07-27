/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */

const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'geargrab',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  
  // Connection pool settings
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection function
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Database query helper with error handling
async function query(text, params) {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, text);
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      query: text,
      params,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Common query builders
const queryBuilders = {
  // Build SELECT query with filters
  buildSelectQuery(table, filters = {}, options = {}) {
    let query = `SELECT * FROM ${table}`;
    const params = [];
    const conditions = [];
    
    // Add WHERE conditions
    Object.entries(filters).forEach(([key, value], index) => {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${index + 1}`);
        params.push(value);
      }
    });
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add ORDER BY
    if (options.orderBy) {
      const direction = options.orderBy.startsWith('-') ? 'DESC' : 'ASC';
      const column = options.orderBy.replace(/^-/, '');
      query += ` ORDER BY ${column} ${direction}`;
    }
    
    // Add LIMIT and OFFSET
    if (options.limit) {
      query += ` LIMIT ${parseInt(options.limit)}`;
    }
    
    if (options.offset) {
      query += ` OFFSET ${parseInt(options.offset)}`;
    }
    
    return { query, params };
  },
  
  // Build INSERT query
  buildInsertQuery(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    return { query, params: values };
  },
  
  // Build UPDATE query
  buildUpdateQuery(table, id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`);
    
    const query = `
      UPDATE ${table}
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    return { query, params: [id, ...values] };
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  queryBuilders
};
