/**
 * DATABASE CONNECTION CONFIGURATION
 * 
 * This file sets up the PostgreSQL database connection pool.
 * A connection pool manages multiple database connections efficiently,
 * reusing connections instead of creating new ones for each request.
 * 
 * HOW IT WORKS:
 * 1. When a controller/route needs to query the database, it gets a connection from the pool
 * 2. The pool provides an available connection (or creates one if none exist)
 * 3. After the query completes, the connection returns to the pool for reuse
 * 4. This prevents connection overload and improves performance
 */

const { Pool } = require('pg');  // Import PostgreSQL client library
require('dotenv').config();      // Load environment variables from .env file

// Create a connection pool with PostgreSQL database configuration
const pool = new Pool({
    host: process.env.DB_HOST,         // Database server address (e.g., 'localhost')
    user: process.env.DB_USER,         // Database username (e.g., 'postgres')
    password: process.env.DB_PASSWORD, // Database password
    database: process.env.DB_NAME,     // Database name (e.g., 'school_db')
    port: process.env.DB_PORT || 5432, // PostgreSQL default port is 5432
    max: 10,                           // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,          // How long a connection can be idle before closing
    connectionTimeoutMillis: 2000,     // How long to wait for a connection before timing out
});

// Log when pool is successfully created
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

// Log any pool errors
pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

/**
 * EXPORT THE POOL
 * 
 * This pool object is imported in controllers to execute SQL queries.
 * 
 * USAGE IN CONTROLLERS:
 * const pool = require('./db');
 * const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
 * 
 * The $1, $2, $3... are placeholders for parameterized queries in PostgreSQL
 * (MySQL uses ? instead)
 */
module.exports = pool;
