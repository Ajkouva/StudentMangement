const pool = require('./db');

async function resetData() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log('Deleting Attendance records...');
        await connection.query('DELETE FROM attendance');

        console.log('Deleting Student profiles...');
        await connection.query('DELETE FROM students');

        console.log('Deleting Users with role STUDENT...');
        await connection.query("DELETE FROM users WHERE role = 'STUDENT'");

        await connection.commit();
        console.log('✅ All student and attendance data deleted successfully.');

    } catch (err) {
        await connection.rollback();
        console.error('❌ Data reset failed:', err);
    } finally {
        connection.release();
        process.exit(0);
    }
}

resetData();
