const mongoose = require('mongoose');
require('dotenv').config();

async function cleanSeed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const path = require('path');
        const FeeStructure = require(path.join(__dirname, 'models', 'FeeStructure'));
        const InstallmentPlan = require(path.join(__dirname, 'models', 'InstallmentPlan'));

        console.log('Cleaning existing plans...');
        await InstallmentPlan.deleteMany({});
        console.log('Deleted all installment plans.');

        const allFees = await FeeStructure.find({});
        console.log(`Creating plans for ${allFees.length} fee structures...`);

        for (const fee of allFees) {
            // 2-Part Plan
            await InstallmentPlan.create({
                name: `Standard 2-Part Plan - ${fee.name}`,
                feeStructureId: fee._id,
                totalAmount: fee.totalAmount, // Added this field as it's required in the schema
                installments: [
                    { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                    { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
                ],
                isArchived: false
            });

            // 3-Part Plan
            await InstallmentPlan.create({
                name: `Standard 3-Part Plan - ${fee.name}`,
                feeStructureId: fee._id,
                totalAmount: fee.totalAmount, // Added this field as it's required in the schema
                installments: [
                    { sequence: 1, amountPercentage: 40, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                    { sequence: 2, amountPercentage: 30, dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
                    { sequence: 3, amountPercentage: 30, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
                ],
                isArchived: false
            });
        }

        console.log('Seeding complete! 160 plans created.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanSeed();
