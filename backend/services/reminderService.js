const Student = require('../models/Student');
const Payment = require('../models/Payment');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ReminderType = Object.freeze({
    NORMAL: 'NORMAL',
    IMPORTANT: 'IMPORTANT',
    URGENT: 'URGENT',
    OVERDUE: 'OVERDUE'
});

function startOfDay(date) {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate;
}

function getDaysLeft(dueDate, currentDate = new Date()) {
    const normalizedDueDate = startOfDay(dueDate);
    const normalizedCurrentDate = startOfDay(currentDate);

    return Math.ceil((normalizedDueDate - normalizedCurrentDate) / MS_PER_DAY);
}

function getReminderType(daysLeft) {
    if (daysLeft > 5) return ReminderType.NORMAL;
    if (daysLeft >= 3) return ReminderType.IMPORTANT;
    if (daysLeft >= 0) return ReminderType.URGENT;
    return ReminderType.OVERDUE;
}

function buildReminderMessage(reminderType, daysLeft, studentIdentifier) {
    if (daysLeft < 0) {
        const overdueDays = Math.abs(daysLeft);
        return `${reminderType}: Fee overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'} for Student ID: ${studentIdentifier}`;
    }

    return `${reminderType}: Fee due in ${daysLeft} day${daysLeft === 1 ? '' : 's'} for Student ID: ${studentIdentifier}`;
}

async function checkAndSendReminders(currentDate = new Date()) {
    const students = await Student.find({
        isInstallmentEnabled: true,
        installmentPlanId: { $ne: null }
    })
        .select('_id rollNumber installmentPlanId feeStructureId additionalFees')
        .populate({
            path: 'installmentPlanId',
            select: 'totalAmount installments'
        })
        .populate({
            path: 'feeStructureId',
            select: 'totalAmount'
        })
        .lean();

    if (!students.length) {
        return [];
    }

    const studentIds = students.map(student => student._id);

    const paidPayments = await Payment.find({
        studentId: { $in: studentIds },
        status: 'PAID'
    })
        .select('studentId installmentId amountPaid')
        .lean();

    const paymentsByStudent = new Map();

    for (const payment of paidPayments) {
        const studentKey = payment.studentId.toString();
        const existingPayments = paymentsByStudent.get(studentKey) || [];
        existingPayments.push(payment);
        paymentsByStudent.set(studentKey, existingPayments);
    }

    const reminders = [];

    for (const student of students) {
        const studentIdentifier = student.rollNumber || student._id.toString();
        const installments = student.installmentPlanId?.installments || [];
        const studentPayments = paymentsByStudent.get(student._id.toString()) || [];
        const totalAdditionalFees = (student.additionalFees || []).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
        const totalFee = Number(student.feeStructureId?.totalAmount || 0) + totalAdditionalFees;
        const totalPaid = studentPayments.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);

        if (totalFee > 0 && totalPaid >= totalFee) {
            continue;
        }

        for (const installment of installments) {
            if (!installment?.dueDate) {
                continue;
            }

            const installmentPaidAmount = studentPayments
                .filter(payment => payment.installmentId?.toString() === installment._id.toString())
                .reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);

            const requiredAmount = Number(
                installment.amountValue ||
                (totalFee * Number(installment.amountPercentage || 0)) / 100
            );

            if (requiredAmount <= 0) {
                continue;
            }

            const paymentStatus = installmentPaidAmount >= requiredAmount ? 'PAID' : 'UNPAID';

            if (paymentStatus !== 'UNPAID') {
                continue;
            }

            const daysLeft = getDaysLeft(installment.dueDate, currentDate);
            const reminderType = getReminderType(daysLeft);
            const message = buildReminderMessage(reminderType, daysLeft, studentIdentifier);

            console.log(message);

            reminders.push({
                studentId: studentIdentifier,
                installmentId: installment._id.toString(),
                dueDate: installment.dueDate,
                paymentStatus,
                daysLeft,
                reminderType,
                message
            });
        }
    }

    return reminders;
}

module.exports = {
    ReminderType,
    checkAndSendReminders
};
