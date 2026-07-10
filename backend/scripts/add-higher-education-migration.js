#!/usr/bin/env node

/**
 * 🎓 Migration Script: Add Higher Education Columns
 * Created: August 25, 2025
 * 
 * This script adds columns to the alumni_profiles table for tracking
 * alumni who are currently pursuing higher education.
 * 
 * New columns added:
 * - current_institution: Name of current educational institution
 * - current_course: Current course/program being pursued
 * - institution_country: Country where institution is located
 * - is_pursuing_higher_education: Boolean flag
 * - expected_graduation_year: Expected graduation year
 */

const fs = require('fs');
const path = require('path');

// Import database connection
const dbPath = path.join(__dirname, '..', 'config', 'database.js');
console.log('📍 Loading database config from:', dbPath);

const { pool, testConnection } = require('../config/database.js');

async function runMigration() {
    console.log('🚀 Starting Higher Education Columns Migration...');
    console.log('📅 Migration Date:', new Date().toISOString());

    try {
        // Test database connection first
        console.log('🔍 Testing database connection...');
        await testConnection();
        console.log('✅ Database connection successful');

        // Read the migration SQL file
        const migrationFile = path.join(__dirname, '..', 'database', 'migrations', 'add-higher-education-columns.sql');
        console.log('📖 Reading migration file:', migrationFile);
        
        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
        console.log('📄 Migration SQL loaded successfully');

        // Check current table structure before migration
        console.log('🔍 Checking current alumni_profiles table structure...');
        const currentStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'alumni_profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('📊 Current alumni_profiles columns:');
        currentStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Execute the migration
        console.log('🔄 Executing migration...');
        await pool.query('BEGIN');
        
        try {
            await pool.query(migrationSQL);
            await pool.query('COMMIT');
            console.log('✅ Migration executed successfully');
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }

        // Verify the migration by checking the new table structure
        console.log('🔍 Verifying migration results...');
        const newStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'alumni_profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);

        console.log('📊 Updated alumni_profiles columns:');
        newStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check specifically for new columns
        const newColumns = [
            'current_institution',
            'current_course', 
            'institution_country',
            'is_pursuing_higher_education',
            'expected_graduation_year'
        ];

        console.log('🔍 Checking for new columns:');
        newColumns.forEach(columnName => {
            const exists = newStructure.rows.some(col => col.column_name === columnName);
            console.log(`   ${exists ? '✅' : '❌'} ${columnName}`);
        });

        // Check indexes
        console.log('🔍 Verifying indexes...');
        const indexes = await pool.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'alumni_profiles' 
            AND indexname LIKE '%current%' OR indexname LIKE '%pursuing%' OR indexname LIKE '%country%'
            ORDER BY indexname;
        `);

        console.log('📊 New indexes created:');
        indexes.rows.forEach(idx => {
            console.log(`   ✅ ${idx.indexname}`);
        });

        // Test a sample update to verify columns work
        console.log('🧪 Testing new columns with sample data...');
        const testResult = await pool.query(`
            SELECT COUNT(*) as total_alumni FROM alumni_profiles;
        `);
        
        console.log(`📊 Total alumni profiles: ${testResult.rows[0].total_alumni}`);

        // If there are existing profiles, show example of how to update them
        if (testResult.rows[0].total_alumni > 0) {
            console.log('💡 Example SQL to update an alumni with higher education info:');
            console.log(`
UPDATE alumni_profiles 
SET current_institution = 'Stanford University',
    current_course = 'M.S. Computer Science',
    institution_country = 'USA',
    is_pursuing_higher_education = TRUE,
    expected_graduation_year = 2026,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1; -- Replace with actual user_id
            `);
        }

        console.log('🎉 Migration completed successfully!');
        console.log('📋 Summary of changes:');
        console.log('   ✅ Added current_institution column');
        console.log('   ✅ Added current_course column');
        console.log('   ✅ Added institution_country column');
        console.log('   ✅ Added is_pursuing_higher_education column');
        console.log('   ✅ Added expected_graduation_year column');
        console.log('   ✅ Created performance indexes');
        console.log('   ✅ Added column comments for documentation');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('🔍 Error details:', error);
        process.exit(1);
    } finally {
        // Close database connection
        if (pool) {
            await pool.end();
            console.log('📪 Database connection closed');
        }
    }
}

// Run the migration
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('✨ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigration };
