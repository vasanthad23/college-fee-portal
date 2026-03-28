const mongoose = require('mongoose');
require('dotenv').config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const path = require('path');
        const InstallmentPlan = require(path.join(__dirname, 'models', 'InstallmentPlan'));
        const Student = require(path.join(__dirname, 'models', 'Student'));
        const FeeRequest = require(path.join(__dirname, 'models', 'FeeRequest'));
        const approvedInstRequests = await FeeRequest.find({ type: 'INSTALLMENT', status: 'APPROVED' }).limit(5);
        
        for (const req of approvedInstRequests) {
            const student = await Student.findById(req.studentId).populate('feeStructureId');
            console.log(`Request ${req._id} for Student ${student?.rollNumber}:`);
            console.log(`  FS_ID: ${student?.feeStructureId?._id} (${student?.feeStructureId?.name})`);
            console.log(`  Plan ID in Student: ${student?.installmentPlanId}`);
            
            // Try matching logic
            const typeToCheck = '2-Part'; // Default for testing
            const planNameMatch = /2-Part/i;
            const plan = await InstallmentPlan.findOne({
                feeStructureId: student.feeStructureId?._id,
                name: { $regex: planNameMatch },
                isArchived: false
            });
            console.log(`  Manual Search Result (2-Part regex): ${plan ? plan.name : 'NOT FOUND'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
