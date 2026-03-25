#!/usr/bin/env node

/**
 * Admin Creation Script
 * Run this script to create the first admin user
 * Usage:   node scripts/create-admin.js
 *          npm run create-admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');
const db = require('../config/db');
const { users } = require('../db/schema');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

async function createAdmin() {
    console.log('\n╔═════════════════════════════════════════════════════════════╗');
    console.log('║         PUnova - Admin User Creation Script                ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');

    try {
        // Check existing admins
        const [adminExists] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.role, 'admin'))
            .limit(1);

        if (adminExists) {
            console.log('⚠️  Warning: Admin user(s) already exist in the database.\n');
            const confirm = await question('Continue creating another admin? (yes/no): ');
            if (confirm.toLowerCase() !== 'yes') {
                console.log('Cancelled.\n');
                rl.close();
                return;
            }
        }

        // Get admin details
        console.log('\nEnter admin details:\n');
        
        const email = await question('Email: ');
        if (!email || !email.includes('@')) {
            console.error('❌ Invalid email\n');
            rl.close();
            return;
        }

        const full_name = await question('Full Name: ');
        if (!full_name || full_name.length < 2) {
            console.error('❌ Full name must be at least 2 characters\n');
            rl.close();
            return;
        }

        const password = await question('Password (min 8 chars, mix of upper/lower/numbers/special): ');
        
        // Validate password
        if (password.length < 8) {
            console.error('❌ Password must be at least 8 characters\n');
            rl.close();
            return;
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
            console.error('❌ Password must contain uppercase, lowercase, and numbers\n');
            rl.close();
            return;
        }

        const department = await question('Department (optional): ');
        
        // Check if email already exists
        const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email.toLowerCase()));

        if (existing) {
            console.error(`❌ Email ${email} already registered\n`);
            rl.close();
            return;
        }

        // Create admin
        console.log('\n⏳ Creating admin user...\n');
        
        const password_hash = await bcrypt.hash(password, 10);
        
        const [admin] = await db
            .insert(users)
            .values({
                email: email.toLowerCase(),
                password_hash,
                full_name,
                role: 'admin',
                department: department || null,
                created_at: new Date(),
                updated_at: new Date(),
            })
            .returning();

        console.log('✅ Admin user created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:     ${admin.email}`);
        console.log(`Name:      ${admin.full_name}`);
        console.log(`Role:      ${admin.role}`);
        console.log(`ID:        ${admin.id}`);
        console.log(`Created:   ${admin.created_at}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('You can now login with:');
        console.log(`  Email:    ${admin.email}`);
        console.log(`  Password: (the password you entered)\n`);

    } catch (error) {
        console.error('❌ Error creating admin:', error.message, '\n');
    } finally {
        rl.close();
    }
}

// Run only if this file is executed directly
if (require.main === module) {
    createAdmin();
}

module.exports = { createAdmin };
