const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to DB');
        checkLogin();
    })
    .catch(err => console.log(err));

async function checkLogin() {
    try {
        const email = 'admin@college.com';
        const password = 'adminpassword';

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found');
        } else {
            console.log('User found:', user.email);
            console.log('Stored Hash:', user.password);

            const isMatch = await user.correctPassword(password, user.password);
            console.log('Password Match:', isMatch);
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
