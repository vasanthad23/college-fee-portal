const FeeRequest = require('../models/FeeRequest');
const Student = require('../models/Student');
const InstallmentPlan = require('../models/InstallmentPlan');

const buildInstallmentsForType = (installmentType) => {
    if (installmentType === '3-Part') {
        return [
            { sequence: 1, amountPercentage: 40, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
            { sequence: 2, amountPercentage: 30, dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
            { sequence: 3, amountPercentage: 30, dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
        ];
    }

    return [
        { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
        { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
    ];
};

// @desc    Submit a new request
// @route   POST /api/requests
// @access  Private (Student)
exports.createRequest = async (req, res) => {
    try {
        const { type, reason, incomeCertificateUrl, previousMarksUrl } = req.body;
        
        const student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const newRequest = await FeeRequest.create({
            studentId: student._id,
            type,
            reason,
            incomeCertificateUrl,
            previousMarksUrl
        });

        res.status(201).json({ status: 'success', data: newRequest });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get my requests
// @route   GET /api/requests/me
// @access  Private (Student)
exports.getMyRequests = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const requests = await FeeRequest.find({ studentId: student._id }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: requests });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// @desc    Get all requests
// @route   GET /api/requests
// @access  Private (Admin)
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await FeeRequest.find()
            .populate({ path: 'studentId', populate: { path: 'user', select: 'name email' } })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ status: 'success', data: requests });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// @desc    Update request status
// @route   PATCH /api/requests/:id
// @access  Private (Admin)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status, adminComments, installmentType } = req.body;
        
        const request = await FeeRequest.findByIdAndUpdate(
            req.params.id, 
            { status, adminComments },
            { new: true, runValidators: true }
        );

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // For approved installment requests, the admin-selected split must be
        // assigned immediately so the student sees the matching payment schedule.
        if (status === 'APPROVED' && request.type === 'INSTALLMENT') {
            if (!installmentType || !['2-Part', '3-Part'].includes(installmentType)) {
                return res.status(400).json({ message: 'Please choose either 2-Part or 3-Part for installment approval.' });
            }

            const student = await Student.findById(request.studentId).populate('feeStructureId');
            if (!student) {
                return res.status(404).json({ message: 'Student not found during installment approval.' });
            }

            const planNameMatch = installmentType === '3-Part' ? /3-Part/i : /2-Part/i;
            let plan = await InstallmentPlan.findOne({
                feeStructureId: student.feeStructureId._id,
                name: { $regex: planNameMatch },
                isArchived: false
            });

            if (!plan) {
                plan = await InstallmentPlan.create({
                    name: `Standard ${installmentType} Payment`,
                    feeStructureId: student.feeStructureId._id,
                    totalAmount: student.feeStructureId.totalAmount,
                    installments: buildInstallmentsForType(installmentType)
                });
            }

            student.installmentPlanId = plan._id;
            student.isInstallmentEnabled = true;
            await student.save();
        }

        res.status(200).json({ status: 'success', data: request });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
// @desc    Get pending requests count
// @route   GET /api/requests/pending-count
// @access  Private (Admin)
exports.getPendingCount = async (req, res) => {
    try {
        const count = await FeeRequest.countDocuments({ status: 'PENDING' });
        res.status(200).json({ status: 'success', data: { count } });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};
