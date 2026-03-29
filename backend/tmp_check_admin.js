const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: 'admin@college.com' });
        if (admin) {
            console.log('Admin user found:', admin.email);
            console.log('Admin role:', admin.role);
        } else {
            console.log('Admin user NOT found! Re-creating...');
            await User.create({
                name: 'Admin User',
                email: 'admin@college.com',
                password: 'adminpassword',
                role: 'admin'
            });
            console.log('Admin created: admin@college.com / adminpassword');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAdmin();
