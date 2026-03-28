const FeeStructure = require('../models/FeeStructure');

// Get all fee structures, OPTIONALLY filtered by semesterId
exports.getFeeStructures = async (req, res) => {
    try {
        const { semesterId } = req.query;
        const query = { isArchived: false };

        // Strict filtering: If semesterId provided, filter by it
        if (semesterId) {
            query.semesterId = semesterId;
        }

        const feeStructures = await FeeStructure.find(query).populate('semesterId', 'name');

        res.status(200).json({ status: 'success', results: feeStructures.length, data: feeStructures });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.createFeeStructure = async (req, res) => {
    try {
        // Validate semantic logic if needed (e.g. check if semester exists and is active)
        const newFeeStructure = await FeeStructure.create(req.body);
        res.status(201).json({ status: 'success', data: newFeeStructure });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
