/**
 * RESET DATA SCRIPT
 * 
 * Deletes all student accounts and attendance records
 * Keeps teacher accounts intact
 * 
 * ⚠️  WARNING: THIS IS DESTRUCTIVE! ⚠️
 * Use this to clear test data and start fresh
 * 
 * USAGE:
 * node reset-data.js
 * 
 * WHAT IT DELETES:
 * - All attendance records
 * - All student profiles
 * - All student user accounts
 * 
 * WHAT IT KEEPS:
 * - Teacher accounts (including admin)
 * - Database schema/structure
 */

const pool = require('./db');

async function resetData() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('🗑️  Deleting attendance records...');
        const deleteAttendance = 'DELETE FROM attendance';
        await client.query(deleteAttendance);

        console.log('🗑️  Deleting student profiles...');
        const deleteStudents = 'DELETE FROM students';
        await client.query(deleteStudents);

        console.log('🗑️  Deleting student user accounts...');
        const deleteUsers = "DELETE FROM users WHERE role = 'STUDENT'";
        await client.query(deleteUsers);

        await client.query('COMMIT');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ All student and attendance data deleted successfully.');
        console.log('👨‍🏫 Teacher accounts preserved.');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Data reset failed:', err.message);
    } finally {
        client.release();
        await pool.end();
        process.exit(0);
    }
}

resetData();
