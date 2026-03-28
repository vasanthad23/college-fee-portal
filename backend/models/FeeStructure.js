const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    semesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    breakdown: [{
        headName: String, // e.g., Tuition, Lab, Library
        amount: Number
    }],
    isArchived: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Ensure unique name per semester if needed, or just generally
feeStructureSchema.index({ name: 1, semesterId: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
