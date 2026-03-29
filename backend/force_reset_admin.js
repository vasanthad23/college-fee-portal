const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

async function resetAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Delete any existing admin with this email to be sure
        await User.deleteMany({ email: 'admin@college.com' });
        console.log('Deleted existing admin@college.com');

        const password = 'adminpassword';
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await User.create({
            name: 'College Admin',
            email: 'admin@college.com',
            password: password, // The model hook should hash it, but let's see
            role: 'admin'
        });

        console.log('New Admin Created:', admin.email);
        
        // Manual verification
        const savedAdmin = await User.findOne({ email: 'admin@college.com' }).select('+password');
        const isMatch = await bcrypt.compare('adminpassword', savedAdmin.password);
        console.log('Manual Password Match Check:', isMatch ? 'SUCCESS' : 'FAILED');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetAdmin();
