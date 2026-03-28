const mongoose = require('mongoose');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const path = require('path');
        const Student = require(path.join(__dirname, 'models', 'Student'));
        const InstallmentPlan = require(path.join(__dirname, 'models', 'InstallmentPlan'));
        const FeeStructure = require(path.join(__dirname, 'models', 'FeeStructure'));

        // 1. Find a test student
        const student = await Student.findOne({}).populate('feeStructureId');
        if (!student) {
            console.log('No student found');
            process.exit(0);
        }
        console.log(`Test Student: ${student.rollNumber} | FS: ${student.feeStructureId.name}`);

        // 2. Perform splitting logic (as in requestController)
        const installmentType = '2-Part';
        console.log(`Testing Splitting for: ${installmentType}`);

        const planNameMatch = /2-Part/i;
        const plan = await InstallmentPlan.findOne({
            feeStructureId: student.feeStructureId._id,
            name: { $regex: planNameMatch },
            isArchived: false
        });

        if (!plan) {
            console.error('ERROR: Matching plan NOT found for student FS.');
            process.exit(1);
        }
        console.log(`Found Matching Plan: ${plan.name} (${plan._id})`);

        // 3. Update student
        student.installmentPlanId = plan._id;
        student.isInstallmentEnabled = true;
        await student.save();
        console.log('Student updated and saved.');

        // 4. Verify calculation logic (as in StudentFees.jsx)
        const baseFee = student.feeStructureId.totalAmount;
        const additionalFeesTotal = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
        const totalFee = baseFee + additionalFeesTotal;
        console.log(`Total Fee: ${totalFee} (Base: ${baseFee}, Addl: ${additionalFeesTotal})`);

        const installments = plan.installments;
        console.log(`Splitting into ${installments.length} parts:`);
        installments.forEach(inst => {
            const requiredAmount = (totalFee * inst.amountPercentage) / 100;
            console.log(`  - Inst ${inst.sequence} (${inst.amountPercentage}%): ₹${requiredAmount}`);
        });

        console.log('\n--- VERIFICATION SUCCESSFUL ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
