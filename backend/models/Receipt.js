const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    receiptNumber: {
        type: String,
        unique: true,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    pdfUrl: { // In a real app, path to stored PDF
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
