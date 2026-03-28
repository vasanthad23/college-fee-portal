const mongoose = require('mongoose');
require('dotenv').config();

async function checkProfile() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Student = require('./backend/models/Student');
        const FeeRequest = require('./backend/models/FeeRequest');
        const InstallmentPlan = require('./backend/models/InstallmentPlan');
        
        // Find an approved request
        const req = await FeeRequest.findOne({ type: 'INSTALLMENT', status: 'APPROVED' });
        if (!req) {
            console.log('No approved installment requests found.');
            process.exit(0);
        }

        const student = await Student.findById(req.studentId)
            .populate('feeStructureId')
            .populate('installmentPlanId');
        
        console.log(`Student: ${student.rollNumber}`);
        console.log(`Is Installment Enabled: ${student.isInstallmentEnabled}`);
        console.log(`Installment Plan: ${student.installmentPlanId ? student.installmentPlanId.name : 'NULL'}`);
        if (student.installmentPlanId) {
            console.log(`Installment Count: ${student.installmentPlanId.installments?.length}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProfile();
