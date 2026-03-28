const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentType: {
        type: String,
        enum: ['FULL_FEE', 'INSTALLMENT', 'ADDITIONAL_FEE'],
        required: true
    },
    installmentId: { // Optional, if paying specific installment
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InstallmentPlan.installments', // Just a reference logic, not direct DB ref to subdoc usually
        default: null
    },
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    method: {
        type: String,
        default: 'CASH/ONLINE'
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
