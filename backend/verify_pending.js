const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const FeeRequest = require('./models/FeeRequest');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await FeeRequest.countDocuments({ status: 'PENDING' });
        console.log('--- VERIFICATION SUCCESS ---');
        console.log(`Current Pending Requests: ${count}`);
        
        if (count === 0) {
            console.log('No pending requests found. Creating a test request...');
            // Find a student
            const Student = require('./models/Student');
            const student = await Student.findOne();
            if (student) {
                await FeeRequest.create({
                    studentId: student._id,
                    type: 'EXTENSION',
                    reason: 'Verification test request'
                });
                const newCount = await FeeRequest.countDocuments({ status: 'PENDING' });
                console.log(`Test request created. New Pending Count: ${newCount}`);
            } else {
                console.log('No students found to create a test request.');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
