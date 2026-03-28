const mongoose = require('mongoose');

const feeRequestSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    type: {
        type: String,
        enum: ['EXTENSION', 'INSTALLMENT'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    reason: {
        type: String, // Used for Emergency Extension
    },
    incomeCertificateUrl: {
        type: String, // Used for Installment Plan Request
    },
    previousMarksUrl: {
        type: String, // Used for Installment Plan Request
    },
    adminComments: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('FeeRequest', feeRequestSchema);
