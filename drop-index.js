const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('registrations');
        
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));
        
        try {
            await collection.dropIndex('formNumber_1');
            console.log('✅ Successfully dropped formNumber_1 index');
        } catch (e) {
            console.log('⚠️  Index drop error:', e.message);
        }
        
        const indexesAfter = await collection.indexes();
        console.log('Indexes after drop:', JSON.stringify(indexesAfter, null, 2));
        
        await mongoose.connection.close();
        console.log('✅ Migration complete');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropIndex();
