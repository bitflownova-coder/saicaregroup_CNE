const mongoose = require('mongoose');

async function fixMncUidIndex() {
  try {
    // Get MongoDB URI from command line or environment
    const mongoUri = process.argv[2] || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not provided');
      console.error('Usage: node fix-mncuid-index.js <MONGO_URI>');
      console.error('   or: Set MONGO_URI in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('registrations');

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => {
      console.log(`- ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Drop the old mncUID_1 index if it exists
    try {
      await collection.dropIndex('mncUID_1');
      console.log('\n✓ Dropped old mncUID_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n- mncUID_1 index does not exist, skipping');
      } else {
        throw err;
      }
    }

    // Create new compound unique index for workshopId + mncUID
    try {
      await collection.createIndex(
        { workshopId: 1, mncUID: 1 },
        { unique: true, name: 'workshopId_1_mncUID_1' }
      );
      console.log('✓ Created new compound index: workshopId_1_mncUID_1');
    } catch (err) {
      if (err.code === 85 || err.code === 86) {
        console.log('- Compound index already exists, skipping');
      } else {
        throw err;
      }
    }

    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      console.log(`- ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('Students can now register for multiple workshops with the same MNC UID.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixMncUidIndex();
