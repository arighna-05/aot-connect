const bcrypt = require("bcrypt");
const db = require("./db");

async function seed() {
    try {
        console.log("Seeding demo users...");

        // Admin User
        const adminPassword = await bcrypt.hash("admin123", 10);
        await db.query(`
            INSERT INTO users (id, email, username, full_name, role, password_hash, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET password_hash = $6, role = $5
        `, ['u-admin', 'admin@aot.edu.in', 'admin', 'System Admin', 'ADMIN', adminPassword, true]);

        // Demo Student
        const studentPassword = await bcrypt.hash("password123", 10);
        await db.query(`
            INSERT INTO users (id, email, username, full_name, role, password_hash, is_verified, department, year)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET password_hash = $6
        `, ['u-demo', 'student@aot.edu.in', 'demo_student', 'Demo Student', 'STUDENT', studentPassword, true, 'CSE', 'THIRD']);

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding database:", err);
        process.exit(1);
    }
}

seed();
