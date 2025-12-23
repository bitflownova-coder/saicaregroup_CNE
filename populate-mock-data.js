require('dotenv').config();
const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const fs = require('fs');
const path = require('path');

// Sample data (form numbers assigned dynamically during seeding)
const mockRegistrations = [
  {
    fullName: 'Priya Sharma',
    mncUID: 'MNC2024001',
    mncRegistrationNumber: 'REG/MH/2024/001',
    mobileNumber: '9876543210',
    paymentUTR: 'UTR12345678901',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 0,
    submittedAt: new Date('2025-12-20T10:30:00'),
    ipAddress: '192.168.1.10'
  },
  {
    fullName: 'Amit Kumar',
    mncUID: 'MNC2024002',
    mncRegistrationNumber: 'REG/MH/2024/002',
    mobileNumber: '9876543211',
    paymentUTR: 'UTR12345678902',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 1,
    submittedAt: new Date('2025-12-20T11:15:00'),
    ipAddress: '192.168.1.11'
  },
  {
    fullName: 'Sneha Patel',
    mncUID: 'MNC2024003',
    mncRegistrationNumber: 'REG/MH/2024/003',
    mobileNumber: '9876543212',
    paymentUTR: 'UTR12345678903',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 2,
    submittedAt: new Date('2025-12-20T12:00:00'),
    ipAddress: '192.168.1.12'
  },
  {
    fullName: 'Rahul Verma',
    mncUID: 'MNC2024004',
    mncRegistrationNumber: 'REG/MH/2024/004',
    mobileNumber: '9876543213',
    paymentUTR: 'UTR12345678904',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 0,
    submittedAt: new Date('2025-12-21T09:30:00'),
    ipAddress: '192.168.1.13'
  },
  {
    fullName: 'Anjali Desai',
    mncUID: 'MNC2024005',
    mncRegistrationNumber: 'REG/MH/2024/005',
    mobileNumber: '9876543214',
    paymentUTR: 'UTR12345678905',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 1,
    submittedAt: new Date('2025-12-21T10:45:00'),
    ipAddress: '192.168.1.14'
  },
  {
    fullName: 'Vikram Singh',
    mncUID: 'MNC2024006',
    mncRegistrationNumber: 'REG/MH/2024/006',
    mobileNumber: '9876543215',
    paymentUTR: 'UTR12345678906',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 0,
    submittedAt: new Date('2025-12-21T14:20:00'),
    ipAddress: '192.168.1.15'
  },
  {
    fullName: 'Pooja Gupta',
    mncUID: 'MNC2024007',
    mncRegistrationNumber: 'REG/MH/2024/007',
    mobileNumber: '9876543216',
    paymentUTR: 'UTR12345678907',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 0,
    submittedAt: new Date('2025-12-22T08:00:00'),
    ipAddress: '192.168.1.16'
  },
  {
    fullName: 'Rajesh Yadav',
    mncUID: 'MNC2024008',
    mncRegistrationNumber: 'REG/MH/2024/008',
    mobileNumber: '9876543217',
    paymentUTR: 'UTR12345678908',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 2,
    submittedAt: new Date('2025-12-22T11:30:00'),
    ipAddress: '192.168.1.17'
  },
  {
    fullName: 'Neha Joshi',
    mncUID: 'MNC2024009',
    mncRegistrationNumber: 'REG/MH/2024/009',
    mobileNumber: '9876543218',
    paymentUTR: 'UTR12345678909',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 1,
    submittedAt: new Date('2025-12-22T15:45:00'),
    ipAddress: '192.168.1.18'
  },
  {
    fullName: 'Sanjay Mehta',
    mncUID: 'MNC2024010',
    mncRegistrationNumber: 'REG/MH/2024/010',
    mobileNumber: '9876543219',
    paymentUTR: 'UTR12345678910',
    paymentScreenshot: 'sample-payment.jpg',
    downloadCount: 0,
    submittedAt: new Date('2025-12-23T09:15:00'),
    ipAddress: '192.168.1.19'
  }
];

async function populateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saicare_cne_registration');
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const deleteResult = await Registration.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing registrations`);

    // Create sample payment screenshot if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads', 'payments');
    const sampleFile = path.join(uploadsDir, 'sample-payment.jpg');
    
    if (!fs.existsSync(sampleFile)) {
      // Copy the Payment QR as sample payment screenshot
      const qrPath = path.join(__dirname, 'assest', 'PaymentQR.jpeg');
      if (fs.existsSync(qrPath)) {
        fs.copyFileSync(qrPath, sampleFile);
        console.log('✅ Created sample payment screenshot');
      } else {
        console.warn('⚠️ Payment QR not found at assest/PaymentQR.jpeg; sample screenshot not created');
      }
    }

    // Determine starting form number then assign dynamically to mock data
    const startFormNumber = await Registration.getNextFormNumber();
    const dataWithFormNumbers = mockRegistrations.map((reg, idx) => ({
      ...reg,
      formNumber: startFormNumber + idx
    }));

    // Insert mock data
    const result = await Registration.insertMany(dataWithFormNumbers);
    console.log(`✅ Added ${result.length} mock registrations`);

    // Display summary
    const count = await Registration.getRegistrationCount();
    console.log(`\n📊 Total Registrations: ${count}/500`);
    console.log(`📊 Remaining Slots: ${500 - count}/500`);

    console.log('\n🎉 Mock data populated successfully!');
    console.log(`\n📝 Form numbers assigned dynamically starting at ${startFormNumber} through ${startFormNumber + mockRegistrations.length - 1}.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating data:', error);
    process.exit(1);
  }
}

populateData();
