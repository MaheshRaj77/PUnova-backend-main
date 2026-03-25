require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { services, timetable, alerts } = require('./schema');

async function seed() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set in .env');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    console.log('🌱 Seeding Neon DB (PostgreSQL)...');

    // Clear existing seed data (with error handling for first run)
    try {
        await db.delete(services);
        await db.delete(timetable);
        await db.delete(alerts);
        console.log('  ✅ Cleared existing seed data');
    } catch (err) {
        console.log('  ℹ️  Tables are empty or first run, skipping clear');
    }

    // Seed services
    await db.insert(services).values([
        { name: 'Library', description: 'Central university library with study rooms and digital resources.', category: 'academic', contact_info: '011-25552001', location: 'Main Campus, Block A', timings: 'Mon-Sat 8:00 AM - 8:00 PM', sort_order: 1 },
        { name: 'Health Center', description: 'On-campus medical facility for students and staff.', category: 'health', contact_info: '011-25552002', location: 'Block C, Ground Floor', timings: 'Mon-Fri 9:00 AM - 5:00 PM', sort_order: 2 },
        { name: 'IT Help Desk', description: 'Technical support for Wi-Fi, email, and university systems.', category: 'tech', contact_info: 'ithelpdesk@university.edu', location: 'Block B, Room 101', timings: 'Mon-Fri 9:00 AM - 6:00 PM', sort_order: 3 },
        { name: 'Cafeteria', description: 'Main campus dining hall serving breakfast, lunch, and snacks.', category: 'food', location: 'Student Center', timings: 'Mon-Sat 7:30 AM - 7:00 PM', sort_order: 4 },
        { name: 'Sports Complex', description: 'Indoor and outdoor sports facilities including gym, courts, and swimming pool.', category: 'recreation', contact_info: '011-25552005', location: 'East Campus', timings: 'Daily 6:00 AM - 9:00 PM', sort_order: 5 },
    ]);
    console.log('  ✅ Services seeded');

    // Seed sample timetable
    await db.insert(timetable).values([
        { day_of_week: 'Monday', subject_name: 'Data Structures', subject_code: 'CS201', instructor: 'Dr. Sharma', room: 'A-101', start_time: '09:00', end_time: '10:30' },
        { day_of_week: 'Monday', subject_name: 'Mathematics III', subject_code: 'MA201', instructor: 'Prof. Gupta', room: 'B-205', start_time: '11:00', end_time: '12:30' },
        { day_of_week: 'Tuesday', subject_name: 'Operating Systems', subject_code: 'CS301', instructor: 'Dr. Patel', room: 'A-102', start_time: '09:00', end_time: '10:30' },
        { day_of_week: 'Tuesday', subject_name: 'Database Management', subject_code: 'CS202', instructor: 'Dr. Kumar', room: 'Lab-3', start_time: '14:00', end_time: '16:00' },
        { day_of_week: 'Wednesday', subject_name: 'Computer Networks', subject_code: 'CS302', instructor: 'Prof. Singh', room: 'A-103', start_time: '09:00', end_time: '10:30' },
        { day_of_week: 'Thursday', subject_name: 'Data Structures Lab', subject_code: 'CS201L', instructor: 'Dr. Sharma', room: 'Lab-1', start_time: '10:00', end_time: '12:00' },
        { day_of_week: 'Friday', subject_name: 'Soft Skills', subject_code: 'HS201', instructor: 'Ms. Verma', room: 'C-301', start_time: '11:00', end_time: '12:00' },
    ]);
    console.log('  ✅ Timetable seeded');

    // Seed sample alerts
    await db.insert(alerts).values([
        { title: 'Campus Wi-Fi Maintenance', description: 'Wi-Fi will be down for maintenance on Saturday from 2:00 AM to 6:00 AM.', category: 'maintenance', priority: 'medium' },
        { title: 'Semester Registration Open', description: 'Registration for Spring 2025 is now open. Deadline: Jan 15.', category: 'academic', priority: 'high' },
    ]);
    console.log('  ✅ Alerts seeded');

    console.log('\n🎉 All seed data written to Neon DB (PostgreSQL) successfully!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});
