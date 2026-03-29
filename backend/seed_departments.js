const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Semester = require('./models/Semester');
const FeeStructure = require('./models/FeeStructure');
const InstallmentPlan = require('./models/InstallmentPlan');

dotenv.config();

const departments = [
    { name: 'B.Tech CSE', amount: 105000 },
    { name: 'B.Tech ECE', amount: 95000 },
    { name: 'B.Tech IT', amount: 98000 },
    { name: 'B.Tech AI-DS', amount: 110000 },
    { name: 'B.Tech AI-ML', amount: 110000 },
    { name: 'B.Tech EEE', amount: 90000 },
    { name: 'B.Tech MECH', amount: 85000 },
    { name: 'B.Tech CIVIL', amount: 85000 },
    { name: 'B.Tech CHEMICAL', amount: 88000 },
    { name: 'B.Tech BIOTECH', amount: 92000 },
    { name: 'B.Tech ROBOTICS', amount: 108000 }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding departments...');

        const activeSemester = await Semester.findOne({ isActive: true });
        if (!activeSemester) {
            console.error('No active semester found. Please create or activate a semester first.');
            process.exit(1);
        }

        console.log(`Seeding departments for semester: ${activeSemester.name}`);

        for (const dept of departments) {
            // 1. Create Fee Structure
            let feeStructure = await FeeStructure.findOne({ name: dept.name, semesterId: activeSemester._id });
            
            if (!feeStructure) {
                feeStructure = await FeeStructure.create({
                    name: dept.name,
                    semesterId: activeSemester._id,
                    totalAmount: dept.amount,
                    breakdown: [
                        { headName: 'Tuition Fee', amount: dept.amount * 0.8 },
                        { headName: 'Lab & Library', amount: dept.amount * 0.15 },
                        { headName: 'Other Fees', amount: dept.amount * 0.05 }
                    ]
                });
                console.log(`Created Fee Structure for ${dept.name}`);
            } else {
                console.log(`Fee Structure for ${dept.name} already exists, updating amount...`);
                feeStructure.totalAmount = dept.amount;
                await feeStructure.save();
            }

            // 2. Create 2-Part Installment Plan
            const plan2Name = 'Standard 2-Part Payment';
            let plan2 = await InstallmentPlan.findOne({ name: plan2Name, feeStructureId: feeStructure._id });
            if (!plan2) {
                await InstallmentPlan.create({
                    name: plan2Name,
                    feeStructureId: feeStructure._id,
                    totalAmount: feeStructure.totalAmount,
                    installments: [
                        { sequence: 1, amountPercentage: 50, amountValue: feeStructure.totalAmount * 0.5, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                        { sequence: 2, amountPercentage: 50, amountValue: feeStructure.totalAmount * 0.5, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
                    ]
                });
                console.log(`  - Created 2-Part Plan for ${dept.name}`);
            }

            // 3. Create 3-Part Installment Plan
            const plan3Name = 'Standard 3-Part Payment';
            let plan3 = await InstallmentPlan.findOne({ name: plan3Name, feeStructureId: feeStructure._id });
            if (!plan3) {
                await InstallmentPlan.create({
                    name: plan3Name,
                    feeStructureId: feeStructure._id,
                    totalAmount: feeStructure.totalAmount,
                    installments: [
                        { sequence: 1, amountPercentage: 40, amountValue: feeStructure.totalAmount * 0.4, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
                        { sequence: 2, amountPercentage: 30, amountValue: feeStructure.totalAmount * 0.3, dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
                        { sequence: 3, amountPercentage: 30, amountValue: feeStructure.totalAmount * 0.3, dueDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000) }
                    ]
                });
                console.log(`  - Created 3-Part Plan for ${dept.name}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
