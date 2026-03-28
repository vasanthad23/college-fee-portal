const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Student = require('./models/Student');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    const students = await Student.find().populate('user');
    for (const student of students) {
        console.log(`Student: ${student.user.name} (${student.user.email})`);
        console.log(`Additional Fees:`, student.additionalFees);
        console.log('---');
    }
    process.exit(0);
}).catch(console.error);
