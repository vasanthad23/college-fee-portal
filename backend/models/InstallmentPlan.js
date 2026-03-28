const mongoose = require('mongoose');

const installmentPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    feeStructureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeStructure',
        required: true
    },
    totalAmount: { // Should match FeeStructure amount, validating on save
        type: Number,
        required: true
    },
    installments: [{
        sequence: Number,
        amountPercentage: Number, // e.g. 30%
        amountValue: Number, // Calculated
        dueDate: Date,
        lateFeePerDay: { type: Number, default: 0 },
        maxLateDays: { type: Number, default: 0 }
    }],
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('InstallmentPlan', installmentPlanSchema);
