const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const FeeStructure = require('./models/FeeStructure');
        const InstallmentPlan = require('./models/InstallmentPlan');

        const allFees = await FeeStructure.find({});
        console.log(`Checking ${allFees.length} fee structures...`);

        for (const fee of allFees) {
            // 2-Part Plan
            const existing2 = await InstallmentPlan.findOne({ feeStructureId: fee._id, name: /2-Part/i });
            if (!existing2) {
                await InstallmentPlan.create({
                    name: `Standard 2-Part Plan - ${fee.name}`,
                    feeStructureId: fee._id,
                    installments: [
                        { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                        { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
                    ],
                    isArchived: false
                });
                console.log(`Created 2-Part plan for: ${fee.name}`);
            }

            // 3-Part Plan
            const existing3 = await InstallmentPlan.findOne({ feeStructureId: fee._id, name: /3-Part/i });
            if (!existing3) {
                await InstallmentPlan.create({
                    name: `Standard 3-Part Plan - ${fee.name}`,
                    feeStructureId: fee._id,
                    installments: [
                        { sequence: 1, amountPercentage: 40, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                        { sequence: 2, amountPercentage: 30, dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
                        { sequence: 3, amountPercentage: 30, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
                    ],
                    isArchived: false
                });
                console.log(`Created 3-Part plan for: ${fee.name}`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
