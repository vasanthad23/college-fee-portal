const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const FeeStructure = require('./models/FeeStructure');
    const InstallmentPlan = require('./models/InstallmentPlan');

    const allFees = await FeeStructure.find({});
    let created = 0;

    for (const fee of allFees) {
        // Check if a plan already exists for this fee structure
        const existing = await InstallmentPlan.findOne({ feeStructureId: fee._id });
        if (existing) {
            console.log('Plan already exists for:', fee.name);
            continue;
        }

        await InstallmentPlan.create({
            name: `Standard 2-Part Payment`,
            feeStructureId: fee._id,
            totalAmount: fee.totalAmount,
            installments: [
                { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
            ],
            isArchived: false
        });
        created++;
        console.log('Created plan for:', fee.name);
    }

    console.log(`\nDone! Created ${created} new installment plans.`);
    process.exit();
});
