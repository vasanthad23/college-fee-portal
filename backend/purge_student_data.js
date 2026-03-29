const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./models/User');
const Student = require('./models/Student');
const Payment = require('./models/Payment');
const Receipt = require('./models/Receipt');
const FeeRequest = require('./models/FeeRequest');

async function purgeData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        console.log('Starting data purge...');

        // 1. Delete all payments
        const paymentDelete = await Payment.deleteMany({});
        console.log(`- Deleted ${paymentDelete.deletedCount} payment records.`);

        // 2. Delete all receipts
        const receiptDelete = await Receipt.deleteMany({});
        console.log(`- Deleted ${receiptDelete.deletedCount} receipt records.`);

        // 3. Delete all fee requests
        const feeRequestDelete = await FeeRequest.deleteMany({});
        console.log(`- Deleted ${feeRequestDelete.deletedCount} fee request records.`);

        // 4. Delete all students
        const studentDelete = await Student.deleteMany({});
        console.log(`- Deleted ${studentDelete.deletedCount} student profiles.`);

        // 5. Delete all users with role 'student'
        const userDelete = await User.deleteMany({ role: 'student' });
        console.log(`- Deleted ${userDelete.deletedCount} student user accounts.`);

        console.log('\n✅ Data purge completed successfully.');
        console.log('Note: Admin accounts, semesters, fee structures, and installment plans were NOT deleted.');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during data purge:', err);
        process.exit(1);
    }
}

purgeData();
