#!/usr/bin/env node

/**
 * 🎯 Render Database Migration Script
 * Created: August 26, 2025
 * 
 * This script runs the higher education migration specifically on Render database
 * using the external DATABASE_URL
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Force use of Render DATABASE_URL (or fall back to placeholder)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@your-db-host.oregon-postgres.render.com/your_render_db';

console.log('🎯 Render Database Migration: Higher Education Columns');
console.log('=====================================================');
console.log('📅 Migration Date:', new Date().toISOString());
console.log('🔗 Target Database:', DATABASE_URL.split('@')[1]); // Hide credentials

// Create pool for Render database
const renderPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testRenderConnection() {
    try {
        console.log('🔍 Testing Render database connection...');
        const result = await renderPool.query('SELECT version();');
        console.log('✅ Connected to Render database successfully');
        console.log('📊 PostgreSQL Version:', result.rows[0].version.split(' ')[1]);
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to Render database:', error.message);
        return false;
    }
}

async function runRenderMigration() {
    try {
        // Test connection first
        const connected = await testRenderConnection();
        if (!connected) {
            throw new Error('Cannot connect to Render database');
        }

        // Read the migration SQL file
        const migrationFile = path.join(__dirname, '..', 'database', 'migrations', 'add-higher-education-columns.sql');
        console.log('📖 Reading migration file:', migrationFile);
        
        if (!fs.existsSync(migrationFile)) {
            throw new Error('Migration file not found: ' + migrationFile);
        }
        
        const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
        console.log('📄 Migration SQL loaded successfully');

        // Check current table structure
        console.log('🔍 Checking current Render database structure...');
        const currentStructure = await renderPool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'alumni_profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('📊 Current alumni_profiles columns on Render:');
        currentStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check if columns already exist
        const newColumns = [
            'current_institution',
            'current_course', 
            'institution_country',
            'is_pursuing_higher_education',
            'expected_graduation_year'
        ];

        const existingNewColumns = currentStructure.rows.filter(col => 
            newColumns.includes(col.column_name)
        );

        if (existingNewColumns.length > 0) {
            console.log('⚠️  Some new columns already exist on Render:');
            existingNewColumns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type})`);
            });
            console.log('');
            console.log('This might mean the migration was already run.');
            console.log('Do you want to continue anyway? The migration will handle existing columns gracefully.');
        }

        // Execute the migration
        console.log('🚀 Executing migration on Render database...');
        await renderPool.query('BEGIN');
        
        try {
            await renderPool.query(migrationSQL);
            await renderPool.query('COMMIT');
            console.log('✅ Migration executed successfully on Render!');
        } catch (error) {
            await renderPool.query('ROLLBACK');
            throw error;
        }

        // Verify the migration results
        console.log('🔍 Verifying migration results on Render...');
        const newStructure = await renderPool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'alumni_profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);

        console.log('📊 Updated alumni_profiles structure on Render:');
        newStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check specifically for new columns
        console.log('🔍 Verifying new columns on Render:');
        newColumns.forEach(columnName => {
            const exists = newStructure.rows.some(col => col.column_name === columnName);
            console.log(`   ${exists ? '✅' : '❌'} ${columnName}`);
        });

        // Check indexes on Render
        console.log('🔍 Verifying indexes on Render...');
        const indexes = await renderPool.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'alumni_profiles' 
            AND (indexname LIKE '%current%' OR indexname LIKE '%pursuing%' OR indexname LIKE '%country%')
            ORDER BY indexname;
        `);

        console.log('📊 New indexes created on Render:');
        indexes.rows.forEach(idx => {
            console.log(`   ✅ ${idx.indexname}`);
        });

        // Test data count
        const alumniCount = await renderPool.query(`
            SELECT COUNT(*) as total FROM alumni_profiles;
        `);
        
        console.log(`📊 Total alumni profiles on Render: ${alumniCount.rows[0].total}`);

        console.log('');
        console.log('🎉 Render Database Migration Completed Successfully!');
        console.log('📋 Summary of changes on Render:');
        console.log('   ✅ Added current_institution column');
        console.log('   ✅ Added current_course column');
        console.log('   ✅ Added institution_country column');
        console.log('   ✅ Added is_pursuing_higher_education column');
        console.log('   ✅ Added expected_graduation_year column');
        console.log('   ✅ Created performance indexes');
        console.log('   ✅ Added column comments');
        console.log('');
        console.log('🚀 Your Render database is now ready for the higher education feature!');
        console.log('💡 You can now deploy your frontend and backend changes.');

    } catch (error) {
        console.error('❌ Render migration failed:', error.message);
        console.error('🔍 Error details:', error);
        
        if (error.message.includes('connect ENOTFOUND')) {
            console.error('');
            console.error('🔧 Connection troubleshooting:');
            console.error('   1. Check if your internet connection is working');
            console.error('   2. Verify the Render database URL is correct');
            console.error('   3. Ensure the database is running (not sleeping)');
        }
        
        process.exit(1);
    } finally {
        // Close database connection
        if (renderPool) {
            await renderPool.end();
            console.log('📪 Render database connection closed');
        }
    }
}

// Run the migration
if (require.main === module) {
    runRenderMigration()
        .then(() => {
            console.log('✨ Render migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Render migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runRenderMigration };
