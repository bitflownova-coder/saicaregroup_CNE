// Migration script to drop old formNumber unique index
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saicaregroup_cne');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        
        try {
            await db.collection('registrations').dropIndex('formNumber_1');
            console.log('✅ Successfully dropped old formNumber_1 unique index');
        } catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound') {
                console.log('⚠️  Index formNumber_1 does not exist (already dropped or never created)');
            } else {
                console.error('❌ Error dropping index:', error.message);
            }
        }

        await mongoose.disconnect();
        console.log('✅ Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
