const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Registration = require('./models/Registration');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saicaregroup_cne';

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check current count
    const count = await Registration.countDocuments();
    console.log(`📊 Current registrations in database: ${count}`);

    if (count > 0) {
      // Delete all registrations
      const result = await Registration.deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} registrations`);
    } else {
      console.log('✅ Database is already empty');
    }

    // Clear payment uploads folder
    const uploadsDir = path.join(__dirname, 'uploads', 'payments');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedFiles = 0;
      
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        if (fs.statSync(filePath).isFile() && file !== '.gitkeep') {
          fs.unlinkSync(filePath);
          deletedFiles++;
        }
      });
      
      console.log(`🗑️  Deleted ${deletedFiles} payment screenshots`);
    }

    // Verify database is empty
    const finalCount = await Registration.countDocuments();
    console.log(`\n✅ Database is now clean!`);
    console.log(`📊 Final count: ${finalCount} registrations`);
    console.log(`🆕 Ready for new workshop`);
    console.log(`📝 Next form number will be: 1\n`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

clearDatabase();
