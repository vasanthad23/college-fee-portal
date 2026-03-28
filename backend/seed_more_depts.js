const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Semester = require('./models/Semester');
const FeeStructure = require('./models/FeeStructure');
const InstallmentPlan = require('./models/InstallmentPlan');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Adding Departments'))
    .catch(err => console.log(err));

const addMoreDepartments = async () => {
    try {
        // Fetch existing semesters
        const semesters = await Semester.find().sort({ name: 1 });
        if (semesters.length === 0) {
            console.log('No semesters found! Please run seed.js first.');
            process.exit(1);
        }
        console.log(`Found ${semesters.length} semesters.`);

        // New departments to add with their fee amounts
        const newDepartments = [
            { name: 'EEE', fee: 72000 },
            { name: 'IT', fee: 82000 },
            { name: 'AIDS', fee: 90000 },
            { name: 'AIML', fee: 88000 },
            { name: 'BioTech', fee: 68000 },
            { name: 'Chemical', fee: 65000 },
        ];

        let feeStructuresCreated = 0;
        let installmentPlansCreated = 0;

        for (const sem of semesters) {
            for (const dept of newDepartments) {
                // Check if fee structure already exists for this dept + semester
                const existing = await FeeStructure.findOne({
                    name: `B.Tech ${dept.name} - ${sem.name} Fee`,
                    semesterId: sem._id
                });

                if (existing) {
                    console.log(`  Skipping: B.Tech ${dept.name} - ${sem.name} Fee (already exists)`);
                    continue;
                }

                // Create fee structure
                const feeStructure = await FeeStructure.create({
                    name: `B.Tech ${dept.name} - ${sem.name} Fee`,
                    semesterId: sem._id,
                    totalAmount: dept.fee,
                    isActive: true
                });
                feeStructuresCreated++;

                // Create installment plans for each fee structure
                // 2-Part Plan
                await InstallmentPlan.create({
                    name: 'Standard 2-Part Payment',
                    feeStructureId: feeStructure._id,
                    totalAmount: feeStructure.totalAmount,
                    installments: [
                        { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                        { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
                    ]
                });
                installmentPlansCreated++;

                // 3-Part Plan
                await InstallmentPlan.create({
                    name: 'Standard 3-Part Payment',
                    feeStructureId: feeStructure._id,
                    totalAmount: feeStructure.totalAmount,
                    installments: [
                        { sequence: 1, amountPercentage: 40, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                        { sequence: 2, amountPercentage: 30, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
                        { sequence: 3, amountPercentage: 30, dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) }
                    ]
                });
                installmentPlansCreated++;

                console.log(`  Created: B.Tech ${dept.name} - ${sem.name} Fee (₹${dept.fee})`);
            }
        }

        console.log(`\nDone! Created ${feeStructuresCreated} fee structures and ${installmentPlansCreated} installment plans.`);
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

addMoreDepartments();
