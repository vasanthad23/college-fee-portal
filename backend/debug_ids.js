const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const FS = require('./models/FeeStructure');
    const IP = require('./models/InstallmentPlan');

    const plans = await IP.find({});
    console.log('=== INSTALLMENT PLANS ===');
    for (const p of plans) {
        console.log('Plan:', p.name);
        console.log('  feeStructureId:', p.feeStructureId.toString());
        console.log('  isArchived:', p.isArchived);
    }

    const fees = await FS.find({}).limit(8);
    console.log('\n=== FEE STRUCTURES (first 8) ===');
    for (const f of fees) {
        console.log('Fee:', f.name);
        console.log('  _id:', f._id.toString());
        console.log('  semesterId:', f.semesterId.toString());
    }

    // Now test the exact API query
    const planFeeId = plans[0]?.feeStructureId?.toString();
    console.log('\n=== MATCHING TEST ===');
    console.log('Plan is linked to feeStructureId:', planFeeId);
    const match = await FS.findById(planFeeId);
    console.log('Matching fee structure:', match?.name || 'NOT FOUND');
    
    const apiResult = await IP.find({ feeStructureId: planFeeId, isArchived: false });
    console.log('API query result count:', apiResult.length);

    process.exit();
});
