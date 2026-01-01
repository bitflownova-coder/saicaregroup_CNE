const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Registration = require('./models/Registration');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saicaregroup_cne';

async function backupOldWorkshop() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all registrations
    const registrations = await Registration.find({}).lean();
    const count = registrations.length;

    console.log(`📊 Found ${count} registrations from old workshop`);

    if (count === 0) {
      console.log('⚠️  No data to backup. Database is already empty.');
      await mongoose.disconnect();
      return;
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(backupDir, `workshop_backup_${timestamp}.json`);

    // Save to JSON file
    fs.writeFileSync(backupFile, JSON.stringify(registrations, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}`);

    // Create summary file
    const summary = {
      backupDate: new Date().toISOString(),
      totalRegistrations: count,
      backupFile: backupFile,
      registrations: registrations.map(r => ({
        formNumber: r.formNumber,
        fullName: r.fullName,
        mobileNumber: r.mobileNumber,
        submittedAt: r.submittedAt
      }))
    };

    const summaryFile = path.join(backupDir, `workshop_summary_${timestamp}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary file: ${summaryFile}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    console.log('\n✅ BACKUP COMPLETE!\n');

  } catch (error) {
    console.error('❌ Error during backup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

backupOldWorkshop();
