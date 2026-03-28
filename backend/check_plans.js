const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const InstallmentPlan = require('./models/InstallmentPlan');
    const plans = await InstallmentPlan.find({ isArchived: false });
    console.log('--- Installment Plans in DB ---');
    plans.forEach(p => {
        console.log(`Plan: "${p.name}", Fee Structure ID: ${p.feeStructureId}`);
    });
    console.log('-------------------------------');
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
