const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    semesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    feeStructureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeStructure',
        required: true
    },
    installmentPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InstallmentPlan',
        default: null // Can be null if paying full
    },
    isInstallmentEnabled: {
        type: Boolean,
        default: false
    },
    additionalFees: [{
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        addedDate: { type: Date, default: Date.now }
    }],
    admissionDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
