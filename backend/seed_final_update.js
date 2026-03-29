const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Semester = require('./models/Semester');
const FeeStructure = require('./models/FeeStructure');
const InstallmentPlan = require('./models/InstallmentPlan');
const Student = require('./models/Student');
const User = require('./models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Final Update');

        // 1. Ensure Semester exists
        let semester = await Semester.findOne({ name: /2025-2026/i });
        if (!semester) {
            semester = await Semester.create({
                name: 'Academic Year 2025-2026',
                startDate: new Date('2025-06-01'),
                endDate: new Date('2026-05-31')
            });
            console.log('Created Semester:', semester.name);
        }

        // 2. Define Departments and Fees
        const departments = [
            { name: 'AI DS', fee: 95000 },
            { name: 'AI ML', fee: 95000 },
            { name: 'CSE', fee: 90000 },
            { name: 'IT', fee: 85000 },
            { name: 'EEE', fee: 80000 },
            { name: 'ECE', fee: 85000 },
            { name: 'MECH', fee: 75000 },
            { name: 'CIVIL', fee: 75000 }
        ];

        for (const dept of departments) {
            const fsName = `B.E./B.Tech ${dept.name} - ${semester.name}`;
            
            let feeStructure = await FeeStructure.findOne({ name: fsName });
            if (!feeStructure) {
                feeStructure = await FeeStructure.create({
                    name: fsName,
                    semesterId: semester._id,
                    totalAmount: dept.fee,
                    breakdown: [
                        { headName: 'Tuition Fee', amount: Math.floor(dept.fee * 0.7) },
                        { headName: 'Admission Fee', amount: Math.floor(dept.fee * 0.1) },
                        { headName: 'Lab & Library Fee', amount: Math.floor(dept.fee * 0.2) }
                    ]
                });
                console.log(`Created Fee Structure for ${dept.name}`);
            }

            // Create Installment Plans if they don't exist
            const plans = [
                {
                    name: 'Standard 2-Part Payment',
                    installments: [
                        { sequence: 1, amountPercentage: 50, dueDate: new Date('2025-07-15') },
                        { sequence: 2, amountPercentage: 50, dueDate: new Date('2025-11-15') }
                    ]
                },
                {
                    name: 'Standard 3-Part Payment',
                    installments: [
                        { sequence: 1, amountPercentage: 40, dueDate: new Date('2025-07-15') },
                        { sequence: 2, amountPercentage: 30, dueDate: new Date('2025-10-15') },
                        { sequence: 3, amountPercentage: 30, dueDate: new Date('2026-01-15') }
                    ]
                }
            ];

            for (const planData of plans) {
                const existingPlan = await InstallmentPlan.findOne({
                    name: planData.name,
                    feeStructureId: feeStructure._id
                });

                if (!existingPlan) {
                    await InstallmentPlan.create({
                        name: planData.name,
                        feeStructureId: feeStructure._id,
                        totalAmount: feeStructure.totalAmount,
                        installments: planData.installments
                    });
                    console.log(`  Added ${planData.name} for ${dept.name}`);
                }
            }
        }

        // 3. Update Existing Students with Tamil Names and fix missing links
        const tamilNames = ['ASHWIN', 'SUBASH', 'THAVEEDHU', 'KRISHNAPRASATH'];
        const students = await Student.find().populate('user');
        
        console.log(`Found ${students.length} students to fix.`);

        // Fix missing structure if any
        const firstFs = await FeeStructure.findOne({ name: /AI DS/i });

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const user = student.user;

            // Update Name
            if (i < tamilNames.length) {
                user.name = tamilNames[i];
                await user.save();
                console.log(`Updated user ${user._id} to ${tamilNames[i]}`);
            }

            // Fix N/A issue (Ensure semester and feeStructure are linked)
            if (!student.semesterId) student.semesterId = semester._id;
            if (!student.feeStructureId) student.feeStructureId = firstFs._id;
            
            await student.save();
        }

        console.log('Final update seed complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

seedData();
