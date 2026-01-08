// Migration script to create the first workshop and link existing registrations
require('dotenv').config();
const mongoose = require('mongoose');
const Workshop = require('./models/Workshop');
const Registration = require('./models/Registration');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saicaregroup_cne';

async function migrate() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if workshop already exists
        const existingWorkshop = await Workshop.findOne({ title: 'NATIONAL HEALTH PROGRAMMES' });
        let workshop;

        if (existingWorkshop) {
            console.log('ℹ️  Workshop already exists:', existingWorkshop.title);
            workshop = existingWorkshop;
        } else {
            // Create the first workshop
            workshop = new Workshop({
                title: 'NATIONAL HEALTH PROGRAMMES',
                description: 'Comprehensive workshop on National Health Programmes covering key public health initiatives and implementation strategies.',
                date: new Date('2026-01-04T00:00:00.000Z'), // January 4, 2026
                dayOfWeek: 'SUNDAY',
                venue: 'SAI CARE COLLEGE OF NURSING NASHIK, SERVEY NO 134, NEAR KISHOR SURYAWANSHI SCHOOL, BEHIND MUHS UNIVERSITY, DINDORI ROAD, MANORI, NASHIK. PIN- 422004',
                venueLink: 'https://share.google/6RTz3qtkGG1O2WzOj',
                fee: 500,
                credits: 10,
                maxSeats: 500,
                currentRegistrations: 0,
                status: 'active', // Set as active since registration is open
                qrCodeImage: null // QR code will be uploaded via admin panel
            });

            await workshop.save();
            console.log('✅ Workshop created successfully');
            console.log('   Title:', workshop.title);
            console.log('   Date:', workshop.date);
            console.log('   Status:', workshop.status);
            console.log('   Workshop ID:', workshop._id);
        }

        // Get all registrations without workshopId
        const orphanRegistrations = await Registration.find({ 
            $or: [
                { workshopId: { $exists: false } },
                { workshopId: null }
            ]
        });

        console.log(`\n📋 Found ${orphanRegistrations.length} registrations without workshop link`);

        if (orphanRegistrations.length > 0) {
            // Update all registrations to link to this workshop
            const result = await Registration.updateMany(
                { 
                    $or: [
                        { workshopId: { $exists: false } },
                        { workshopId: null }
                    ]
                },
                { 
                    $set: { workshopId: workshop._id }
                }
            );

            console.log(`✅ Linked ${result.modifiedCount} registrations to workshop`);

            // Update workshop's currentRegistrations count
            workshop.currentRegistrations = await Registration.countDocuments({ workshopId: workshop._id });
            
            // Check if workshop should be marked as full
            if (workshop.currentRegistrations >= workshop.maxSeats) {
                workshop.status = 'full';
                console.log(`⚠️  Workshop is full (${workshop.currentRegistrations}/${workshop.maxSeats})`);
            }
            
            await workshop.save();
            console.log(`✅ Updated workshop registration count: ${workshop.currentRegistrations}/${workshop.maxSeats}`);
        } else {
            console.log('ℹ️  All registrations are already linked to workshops');
        }

        console.log('\n✨ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   Workshop ID:', workshop._id);
        console.log('   Workshop Title:', workshop.title);
        console.log('   Workshop Date:', workshop.date.toLocaleDateString());
        console.log('   Workshop Status:', workshop.status);
        console.log('   Total Registrations:', workshop.currentRegistrations);
        console.log('   Seats Remaining:', workshop.maxSeats - workshop.currentRegistrations);

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

// Run migration
migrate();
