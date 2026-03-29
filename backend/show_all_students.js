const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function showAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'student' });
        console.log('--- Students in DB ---');
        users.forEach(u => console.log(`ID: ${u._id}, Email: ${u.email}, Name: ${u.name}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
showAll();
