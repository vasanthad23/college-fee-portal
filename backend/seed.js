const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const bcrypt = require('bcryptjs'); // Not needed for hashing here as model handles it

dotenv.config();

const User = require('./models/User');
const Semester = require('./models/Semester');
const FeeStructure = require('./models/FeeStructure');
const InstallmentPlan = require('./models/InstallmentPlan');
const Student = require('./models/Student');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => console.log(err));

const seedDB = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Semester.deleteMany({});
        await FeeStructure.deleteMany({});
        await InstallmentPlan.deleteMany({});
        await Student.deleteMany({});

        console.log('Cleared existing data.');

        // 1. Create Admin
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@college.com',
            password: 'adminpassword', // Pass plain text, model will hash it
            role: 'admin'
        });
        console.log('Admin created.');

        // 2. Create Semesters (1 to 8)
        const semesters = [];
        const today = new Date();

        for (let i = 1; i <= 8; i++) {
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() + (i - 1) * 6);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 6);

            const sem = await Semester.create({
                name: `Semester ${i}`,
                startDate: startDate,
                endDate: endDate,
                isActive: i === 1 // Only Semester 1 is active by default
            });
            semesters.push(sem);
        }
        console.log('Semesters 1-8 created.');

        // 3. Create Fee Structures (Departments) for ALL Semesters
        const departments = ['CSE', 'ECE', 'MECH', 'CIVIL'];
        const feeStructures = [];

        for (const sem of semesters) {
            for (const dept of departments) {
                // Create fee structure for each semester & dept
                const fee = await FeeStructure.create({
                    name: `B.Tech ${dept} - ${sem.name} Fee`,
                    semesterId: sem._id,
                    totalAmount: dept === 'CSE' ? 85000 : 75000,
                    isActive: true
                });
                feeStructures.push(fee);
            }
        }
        console.log('Department Fee Structures created for all semesters.');

        // 4. Create Installment Plans for CSE
        const cseFee = feeStructures[0]; // CSE
        const standardPlan = await InstallmentPlan.create({
            name: 'Standard 2-Part Payment',
            feeStructureId: cseFee._id,
            totalAmount: cseFee.totalAmount,
            installments: [
                { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) }, // 15 days from now
                { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }  // 60 days from now
            ]
        });
        console.log('Installment Plan created for CSE.');

        // 5. Create a Student User
        const studentUser = await User.create({
            name: 'John Student',
            email: 'student@college.com',
            password: 'studentpassword', // Pass plain text
            role: 'student'
        });

        // 6. Link Student Data
        await Student.create({
            user: studentUser._id,
            rollNumber: 'CSE-101',
            semesterId: semesters[0]._id,
            feeStructureId: cseFee._id,
            installmentPlanId: standardPlan._id
        });
        console.log('Student user created and linked.');

        console.log('Database seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
