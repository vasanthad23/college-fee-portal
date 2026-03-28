const mongoose = require('mongoose');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Student = require('./backend/models/Student');
        const FeeRequest = require('./backend/models/FeeRequest');
        const InstallmentPlan = require('./backend/models/InstallmentPlan');
        const User = require('./backend/models/User');

        // 1. Find a test student
        const student = await Student.findOne({}).populate('feeStructureId');
        if (!student) {
            console.log('No student found for testing');
            process.exit(0);
        }
        console.log(`Testing with student: ${student.rollNumber} (FS: ${student.feeStructureId.name})`);

        // 2. Create a dummy installment request
        const request = await FeeRequest.create({
            studentId: student._id,
            type: 'INSTALLMENT',
            reason: 'Verification test',
            status: 'PENDING'
        });
        console.log(`Created request: ${request._id}`);

        // 3. Simulate Admin Approval for 3-Part
        const installmentType = '3-Part';
        console.log(`Simulating Admin Approval for: ${installmentType}`);

        const plan = await InstallmentPlan.findOne({
            feeStructureId: student.feeStructureId,
            name: { $regex: /3-Part/i },
            isArchived: false
        });

        if (!plan) {
            console.error('ERROR: No 3-Part plan found for this fee structure!');
            process.exit(1);
        }
        console.log(`Found matching plan: ${plan.name} with ${plan.installments.length} installments`);

        // Update student (as requestController would)
        student.installmentPlanId = plan._id;
        student.isInstallmentEnabled = true;
        await student.save();
        
        request.status = 'APPROVED';
        await request.save();

        console.log('SUCCESS: Student updated with installment plan.');

        // 4. Verify calculation (as StudentFees.jsx would)
        const baseFee = student.feeStructureId.totalAmount;
        const additionalFeesTotal = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
        const totalFee = baseFee + additionalFeesTotal;

        console.log(`Total Fee: ${totalFee} (Base: ${baseFee}, Addl: ${additionalFeesTotal})`);
        
        plan.installments.forEach(inst => {
            const requiredAmount = (totalFee * inst.amountPercentage) / 100;
            console.log(`Installment ${inst.sequence}: ${inst.amountPercentage}% = ₹${requiredAmount}`);
        });

        // Cleanup
        await FeeRequest.deleteOne({ _id: request._id });
        console.log('Verification Complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
