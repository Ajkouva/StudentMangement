/**
 * DATABASE INITIALIZATION SCRIPT
 * 
 * This script creates the database schema by executing database.sql
 * Run this ONCE when setting up the project for the first time
 * 
 * USAGE:
 * 1. Ensure PostgreSQL is running
 * 2. Create a database named 'school_db' in PostgreSQL
 * 3. Configure .env file with database credentials
 * 4. Run: node init-db.js
 * 
 * WHAT IT DOES:
 * - Connects to PostgreSQL database
 * - Reads database.sql file
 * - Executes all CREATE TABLE statements
 * - Creates the schema (users, students, teachers, attendance tables)
 */

const { Client } = require('pg');  // PostgreSQL client for single connections
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
    // Create a client connection (not a pool)
    // Client is used for one-time scripts, Pool is for server applications
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,  // Must connect to the database (not to 'postgres' db)
        port: process.env.DB_PORT || 5432
    });

    try {
        // Connect to database
        await client.connect();
        console.log('✅ Connected to PostgreSQL server.');

        // Read SQL file
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // PostgreSQL can handle multiple statements in one query
        // (unlike MySQL which requires splitting by semicolon)
        await client.query(sqlContent);

        console.log('✅ Database schema created successfully.');
        console.log('📋 Tables created: users, students, teachers, attendance');
        console.log('📋 ENUM types created: user_role, attendance_status');

    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        console.error('Make sure:');
        console.error('  1. PostgreSQL is running');
        console.error('  2. Database "school_db" exists');
        console.error('  3. .env file has correct credentials');
        process.exit(1);
    } finally {
        // Close connection
        await client.end();
        console.log('🔌 Database connection closed.');
        process.exit(0);
    }
}

// Run the initialization
initDb();
