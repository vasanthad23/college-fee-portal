const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Student = require('../models/Student');
const User = require('../models/User');

exports.processPayment = async (req, res) => {
    try {
        const { amount, paymentMethod, paymentType, installmentId } = req.body;
        const studentUser = req.user.id;

        // 1. Find Student Profile with Fee Structure
        const student = await Student.findOne({ user: studentUser }).populate('feeStructureId');
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Validate Total Overpayment
        const baseFee = student.feeStructureId.totalAmount;
        const additionalFeesTotal = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
        const totalFee = baseFee + additionalFeesTotal;
        
        const previousPayments = await Payment.find({ studentId: student._id, status: 'PAID' });
        const totalPaid = previousPayments.reduce((sum, p) => sum + p.amountPaid, 0);

        const newAmount = Number(amount);
        if (totalPaid + newAmount > totalFee) {
            return res.status(400).json({ 
                message: `Payment of ₹${newAmount} exceeds your outstanding balance of ₹${Math.max(0, totalFee - totalPaid)}` 
            });
        }

        // Validate Installment Overpayment
        if (paymentType === 'INSTALLMENT' && installmentId) {
            await student.populate('installmentPlanId');
            const inst = student.installmentPlanId?.installments?.find(i => i._id.toString() === installmentId);
            if (!inst) return res.status(400).json({ message: 'Installment not found in plan' });

            const reqAmt = (totalFee * inst.amountPercentage) / 100;
            const instPaid = previousPayments
                .filter(p => p.installmentId?.toString() === installmentId)
                .reduce((sum, p) => sum + p.amountPaid, 0);
            
            if (instPaid + newAmount > reqAmt) {
                return res.status(400).json({ 
                    message: `Payment exceeds this installment's outstanding balance of ₹${Math.max(0, reqAmt - instPaid)}` 
                });
            }
        }

        // 2. Create Payment Record
        const newPayment = await Payment.create({
            studentId: student._id,
            amountPaid: amount,
            paymentType: paymentType || 'FULL_FEE',
            installmentId: installmentId || null,
            transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`, // Dummy Transaction ID
            status: 'PAID',
            method: paymentMethod || 'ONLINE'
        });

        // 3. Generate Receipt
        const newReceipt = await Receipt.create({
            paymentId: newPayment._id,
            receiptNumber: `REC_${Date.now()}`,
            generatedAt: Date.now()
        });

        res.status(201).json({
            status: 'success',
            data: {
                payment: newPayment,
                receipt: newReceipt
            }
        });

    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getMyPayments = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const payments = await Payment.find({ studentId: student._id }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: payments
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const { studentId } = req.query;
        let query = {};
        if (studentId) query.studentId = studentId;

        const payments = await Payment.find(query)
            .populate({ path: 'studentId', populate: { path: 'user', select: 'name email' } })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: payments.length,
            data: payments
        });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};
