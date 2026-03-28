const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const InstallmentPlan = require('../models/InstallmentPlan');
const Semester = require('../models/Semester');
const Payment = require('../models/Payment');

exports.createStudent = async (req, res) => {
    try {
        const {
            name, email, password, // User details
            rollNumber, semesterId, feeStructureId,
            installmentPlanId, isInstallmentEnabled
        } = req.body;

        // 1. Validate Semester existence
        const semester = await Semester.findById(semesterId);
        if (!semester) return res.status(400).json({ message: 'Invalid Semester ID' });

        // 2. Validate Fee Structure relationship
        const feeStructure = await FeeStructure.findById(feeStructureId);
        if (!feeStructure) return res.status(400).json({ message: 'Invalid Fee Structure ID' });

        if (feeStructure.semesterId.toString() !== semesterId) {
            return res.status(400).json({
                message: 'Strict Violation: Fee Structure does not belong to the selected Semester.'
            });
        }

        // 3. Validate Installment Plan relationship (if enabled)
        if (isInstallmentEnabled) {
            if (!installmentPlanId) {
                return res.status(400).json({ message: 'Installment Plan ID is required when installments are enabled.' });
            }

            const plan = await InstallmentPlan.findById(installmentPlanId);
            if (!plan) return res.status(400).json({ message: 'Invalid Installment Plan ID' });

            if (plan.feeStructureId.toString() !== feeStructureId) {
                return res.status(400).json({
                    message: 'Strict Violation: Installment Plan does not belong to the selected Fee Structure.'
                });
            }
        } else {
            // Ensure no installment plan is set if disabled
            if (installmentPlanId) {
                return res.status(400).json({ message: 'Installment Plan should not be provided when installments are disabled.' });
            }
        }

        // 4. Create User (handled via auth flow usually, but simplifying here for admin creation)
        // Actually, normally specific /register endpoint handles user creation. 
        // But since this is "Admin creating Student", we create User + Student.

        // For now, let's assume the Frontend calls /api/auth/register first to get a User ID, 
        // OR we handle it here. Let's handle it here for atomic operation.
        const User = require('../models/User'); // specific import
        const newUser = await User.create({
            name,
            email,
            password,
            role: 'student'
        });

        // 5. Create Student Record
        const newStudent = await Student.create({
            user: newUser._id,
            rollNumber,
            semesterId,
            feeStructureId,
            installmentPlanId: isInstallmentEnabled ? installmentPlanId : null,
            isInstallmentEnabled
        });

        res.status(201).json({ status: 'success', data: { student: newStudent, user: newUser } });

    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        // Filter by semester if needed
        const students = await Student.find()
            .populate('user', 'name email')
            .populate('semesterId', 'name')
            .populate('feeStructureId', 'name totalAmount')
            .populate('installmentPlanId', 'name');
        res.status(200).json({ status: 'success', results: students.length, data: students });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id })
            .populate('user', '-password')
            .populate('semesterId')
            .populate('feeStructureId')
            .populate('installmentPlanId');

        if (!student) {
            return res.status(404).json({
                status: 'fail',
                message: 'Student profile not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: student
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

exports.updateStudentFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { semesterId, feeStructureId, installmentPlanId, isInstallmentEnabled } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ status: 'fail', message: 'Student not found' });
        }

        // Check for existing payments
        const existingPayments = await Payment.countDocuments({ studentId: id });
        if (existingPayments > 0) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'This student has already made payments. Their fee structure and installment plan are now frozen and cannot be changed.' 
            });
        }

        // Validate Semester
        if (semesterId) {
            const semester = await Semester.findById(semesterId);
            if (!semester) return res.status(400).json({ status: 'fail', message: 'Invalid Semester ID' });
        }

        // Validate Fee Structure relationship
        if (feeStructureId) {
            const feeStructure = await FeeStructure.findById(feeStructureId);
            if (!feeStructure) return res.status(400).json({ status: 'fail', message: 'Invalid Fee Structure ID' });

            const targetSemester = semesterId || student.semesterId;
            if (feeStructure.semesterId.toString() !== targetSemester.toString()) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Fee Structure does not belong to the selected Semester.'
                });
            }
        }

        // Validate Installment Plan relationship
        if (isInstallmentEnabled && installmentPlanId) {
            const plan = await InstallmentPlan.findById(installmentPlanId);
            if (!plan) return res.status(400).json({ status: 'fail', message: 'Invalid Installment Plan ID' });

            const targetFee = feeStructureId || student.feeStructureId;
            if (plan.feeStructureId.toString() !== targetFee.toString()) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Installment Plan does not belong to the selected Fee Structure.'
                });
            }
        }

        // Update fields
        if (semesterId) student.semesterId = semesterId;
        if (feeStructureId) student.feeStructureId = feeStructureId;
        student.isInstallmentEnabled = !!isInstallmentEnabled;
        student.installmentPlanId = isInstallmentEnabled ? (installmentPlanId || null) : null;

        await student.save();

        // Re-fetch with populated fields
        const updated = await Student.findById(id)
            .populate('user', 'name email')
            .populate('semesterId', 'name')
            .populate('feeStructureId', 'name totalAmount')
            .populate('installmentPlanId', 'name');

        res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.addAdditionalFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount } = req.body;

        if (!name || !amount || amount <= 0) {
            return res.status(400).json({ status: 'fail', message: 'Fee name and a positive amount are required.' });
        }

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ status: 'fail', message: 'Student not found' });
        }

        student.additionalFees.push({ name: name.trim(), amount: Number(amount) });
        await student.save();

        const updated = await Student.findById(id)
            .populate('user', 'name email')
            .populate('semesterId', 'name')
            .populate('feeStructureId', 'name totalAmount')
            .populate('installmentPlanId', 'name');

        res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.removeAdditionalFee = async (req, res) => {
    try {
        const { id, feeId } = req.params;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ status: 'fail', message: 'Student not found' });
        }

        student.additionalFees = student.additionalFees.filter(f => f._id.toString() !== feeId);
        await student.save();

        const updated = await Student.findById(id)
            .populate('user', 'name email')
            .populate('semesterId', 'name')
            .populate('feeStructureId', 'name totalAmount')
            .populate('installmentPlanId', 'name');

        res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};
