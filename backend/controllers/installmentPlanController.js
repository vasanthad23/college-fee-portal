const InstallmentPlan = require('../models/InstallmentPlan');

exports.getInstallmentPlans = async (req, res) => {
    try {
        const { feeStructureId } = req.query;
        const query = { isArchived: false };

        // Strict filtering
        if (feeStructureId) {
            query.feeStructureId = feeStructureId;
        }

        const plans = await InstallmentPlan.find(query).populate('feeStructureId', 'name totalAmount');
        res.status(200).json({ status: 'success', results: plans.length, data: plans });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.createInstallmentPlan = async (req, res) => {
    try {
        // TODO: Add validation to ensure plan total equals fee structure total
        const newPlan = await InstallmentPlan.create(req.body);
        res.status(201).json({ status: 'success', data: newPlan });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
