const FeeRequest = require('../models/FeeRequest');
const Student = require('../models/Student');

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
        const { status, adminComments } = req.body;
        
        const request = await FeeRequest.findByIdAndUpdate(
            req.params.id, 
            { status, adminComments },
            { new: true, runValidators: true }
        );

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Installment approval is now just an approval record.
        // It must not auto-assign or auto-enable any 2-part / 3-part payment split.

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
