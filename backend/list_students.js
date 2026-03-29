const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'student' });
        console.log('--- Current Student Users ---');
        users.forEach(u => console.log(`- ${u.name} (${u.email})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
