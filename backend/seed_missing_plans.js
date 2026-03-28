const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const FeeStructure = require('./models/FeeStructure');
const InstallmentPlan = require('./models/InstallmentPlan');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const addMissingPlans = async () => {
    try {
        // Find all fee structures that do NOT have installment plans
        const allFeeStructures = await FeeStructure.find();
        let created = 0;

        for (const fs of allFeeStructures) {
            const existingPlans = await InstallmentPlan.find({ feeStructureId: fs._id });
            if (existingPlans.length > 0) continue; // Already has plans

            // Create 2-Part Plan
            await InstallmentPlan.create({
                name: 'Standard 2-Part Payment',
                feeStructureId: fs._id,
                totalAmount: fs.totalAmount,
                installments: [
                    { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                    { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
                ]
            });

            // Create 3-Part Plan
            await InstallmentPlan.create({
                name: 'Standard 3-Part Payment',
                feeStructureId: fs._id,
                totalAmount: fs.totalAmount,
                installments: [
                    { sequence: 1, amountPercentage: 40, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                    { sequence: 2, amountPercentage: 30, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
                    { sequence: 3, amountPercentage: 30, dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) }
                ]
            });

            created++;
            console.log(`  Added plans for: ${fs.name}`);
        }

        console.log(`\nDone! Added installment plans for ${created} fee structures that were missing them.`);
        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

addMissingPlans();
