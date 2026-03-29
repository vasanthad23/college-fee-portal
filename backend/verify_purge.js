const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const Payment = require('./models/Payment');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const studentCount = await Student.countDocuments({});
        const paymentCount = await Payment.countDocuments({});
        const studentUserCount = await User.countDocuments({ role: 'student' });
        const adminUserCount = await User.countDocuments({ role: 'admin' });

        console.log(`Verification Results:`);
        console.log(`- Students: ${studentCount}`);
        console.log(`- Student User Accounts: ${studentUserCount}`);
        console.log(`- Payments: ${paymentCount}`);
        console.log(`- Admin Accounts (Preserved): ${adminUserCount}`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
