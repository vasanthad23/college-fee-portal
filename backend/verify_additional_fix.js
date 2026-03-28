const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');
const Payment = require('./models/Payment');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find a student with additional fees
        const student = await Student.findOne({ 'additionalFees.0': { $exists: true } }).populate('feeStructureId');
        if (!student) {
            console.log('No student with additional fees found.');
            process.exit(0);
        }

        const additionalFeesTotal = student.additionalFees.reduce((sum, f) => sum + f.amount, 0);
        console.log(`Student: ${student.rollNumber}, Total Addl: ${additionalFeesTotal}`);

        // 2. Mock the dashboard logic
        const mockDashboardLogic = (student, payments) => {
            const baseFee = student.feeStructureId?.totalAmount || 0;
            const additionalFeesTotal = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
            
            const paidSpecificallyForAdditional = payments
                .filter(p => p.paymentType === 'ADDITIONAL_FEE')
                .reduce((sum, p) => sum + p.amountPaid, 0);
            
            const paidThroughFull = payments
                .filter(p => p.paymentType === 'FULL_FEE')
                .reduce((sum, p) => sum + p.amountPaid, 0);
            
            const appliedFromFull = Math.max(0, paidThroughFull - baseFee);
            const totalAppliedToAdditional = paidSpecificallyForAdditional + appliedFromFull;
            const outstandingAdditional = Math.max(0, additionalFeesTotal - totalAppliedToAdditional);
            
            return outstandingAdditional;
        };

        // Before payment
        const paymentsBefore = await Payment.find({ studentId: student._id });
        console.log('Outstanding Before:', mockDashboardLogic(student, paymentsBefore));

        // 3. Create a payment of Type ADDITIONAL_FEE
        const newPayment = await Payment.create({
            studentId: student._id,
            amountPaid: additionalFeesTotal,
            paymentType: 'ADDITIONAL_FEE',
            transactionId: `VERIFY_${Date.now()}`,
            status: 'PAID',
            method: 'VERIFICATION_SCRIPT'
        });
        console.log('Created payment for additional fees.');

        // After payment
        const paymentsAfter = await Payment.find({ studentId: student._id });
        const outstandingAfter = mockDashboardLogic(student, paymentsAfter);
        console.log('Outstanding After:', outstandingAfter);

        if (outstandingAfter === 0) {
            console.log('SUCCESS: Dashboard would hide the notification now.');
        } else {
            console.log('FAILURE: Dashboard would still show the notification.');
        }

        // Cleanup
        await Payment.findByIdAndDelete(newPayment._id);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
