const FeeRequest = require('../models/FeeRequest');
const Student = require('../models/Student');
const InstallmentPlan = require('../models/InstallmentPlan');
const Payment = require('../models/Payment');

// @desc    Submit a new request
// @route   POST /api/requests
// @access  Private (Student)
exports.createRequest = async (req, res) => {
    try {
        const { type, reason, incomeCertificateUrl, previousMarksUrl } = req.body;
        
        const student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Check for existing payments if requesting installment plan
        if (type === 'INSTALLMENT') {
            const existingPayments = await Payment.countDocuments({ studentId: student._id });
            if (existingPayments > 0) {
                return res.status(400).json({ 
                    status: 'fail', 
                    message: 'Installment plans cannot be requested after a payment has been made.' 
                });
            }
        }

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

        // If request is for installment and is approved, assign the plan
        if (status === 'APPROVED' && request.type === 'INSTALLMENT') {
            console.log(`Processing approved installment request for student ${request.studentId}, type: ${installmentType}`);
            const student = await Student.findById(request.studentId);
            if (student) {
                const planNameMatch = installmentType === '3-Part' ? /3-Part/i : /2-Part/i;
                console.log(`Searching for plan matching: ${planNameMatch} for FeeStructure: ${student.feeStructureId}`);
                
                const plan = await InstallmentPlan.findOne({
                    feeStructureId: student.feeStructureId,
                    name: { $regex: planNameMatch },
                    isArchived: false
                });

                if (plan) {
                    console.log(`Found plan: ${plan.name} (${plan._id}). Updating student...`);
                    student.installmentPlanId = plan._id;
                    student.isInstallmentEnabled = true;
                    await student.save();
                    console.log(`Student ${student.rollNumber} updated successfully.`);
                } else {
                    console.error(`ERROR: No matching ${installmentType} plan found for student ${student.rollNumber} (FeeStructure: ${student.feeStructureId})`);
                }
            } else {
                console.error(`ERROR: Student ${request.studentId} not found during request approval.`);
            }
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
