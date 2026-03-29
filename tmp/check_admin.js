const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: 'admin@college.com' }).select('+password');
        if (admin) {
            console.log('Admin user found:', admin.email);
            console.log('Admin roll:', admin.role);
        } else {
            console.log('Admin user NOT found!');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
