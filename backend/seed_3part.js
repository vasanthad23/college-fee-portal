const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const FeeStructure = require('./models/FeeStructure');
    const InstallmentPlan = require('./models/InstallmentPlan');

    const allFees = await FeeStructure.find({});
    let created = 0;

    for (const fee of allFees) {
        // Check if a 3-part plan already exists
        const existing = await InstallmentPlan.findOne({ feeStructureId: fee._id, name: 'Standard 3-Part Payment' });
        if (existing) {
            console.log('3-Part plan already exists for:', fee.name);
            continue;
        }

        await InstallmentPlan.create({
            name: 'Standard 3-Part Payment',
            feeStructureId: fee._id,
            totalAmount: fee.totalAmount,
            installments: [
                { sequence: 1, amountPercentage: 34, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                { sequence: 2, amountPercentage: 33, dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
                { sequence: 3, amountPercentage: 33, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
            ],
            isArchived: false
        });
        created++;
        console.log('Created 3-Part plan for:', fee.name);
    }

    console.log(`\nDone! Created ${created} new 3-part installment plans.`);
    process.exit();
});
