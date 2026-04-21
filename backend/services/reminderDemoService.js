const FeeStructure = require('../models/FeeStructure');
const InstallmentPlan = require('../models/InstallmentPlan');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Semester = require('../models/Semester');
const Student = require('../models/Student');
const User = require('../models/User');

const DEMO_PASSWORD = 'demo12345';
const DEMO_TOTAL_AMOUNT = 52000;

const demoReminderProfiles = [
    {
        name: 'Aisha Khan',
        email: 'demo.reminder.aisha@college.com',
        rollNumber: 'REM-201',
        daysOffset: -2,
        reminderType: 'OVERDUE'
    },
    {
        name: 'Rahul Verma',
        email: 'demo.reminder.rahul@college.com',
        rollNumber: 'REM-202',
        daysOffset: 1,
        reminderType: 'URGENT'
    },
    {
        name: 'Neha Reddy',
        email: 'demo.reminder.neha@college.com',
        rollNumber: 'REM-203',
        daysOffset: 4,
        reminderType: 'IMPORTANT'
    },
    {
        name: 'Vikram Singh',
        email: 'demo.reminder.vikram@college.com',
        rollNumber: 'REM-204',
        daysOffset: 8,
        reminderType: 'NORMAL'
    }
];

function getDueDate(daysOffset) {
    const dueDate = new Date();
    dueDate.setHours(0, 0, 0, 0);
    dueDate.setDate(dueDate.getDate() + daysOffset);
    return dueDate;
}

async function ensureReminderSemester() {
    let semester = await Semester.findOne({ name: 'Reminder Demo Semester' });

    if (!semester) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6);

        semester = await Semester.create({
            name: 'Reminder Demo Semester',
            startDate,
            endDate,
            isActive: false
        });
    }

    return semester;
}

async function ensureReminderFeeStructure(semesterId) {
    let feeStructure = await FeeStructure.findOne({
        name: 'Reminder Demo Fee Structure',
        semesterId
    });

    if (!feeStructure) {
        feeStructure = await FeeStructure.create({
            name: 'Reminder Demo Fee Structure',
            semesterId,
            totalAmount: DEMO_TOTAL_AMOUNT,
            breakdown: [
                { headName: 'Tuition', amount: 42000 },
                { headName: 'Lab', amount: 6000 },
                { headName: 'Library', amount: 4000 }
            ]
        });
    }

    return feeStructure;
}

async function upsertReminderPlan(feeStructureId, profile) {
    let plan = await InstallmentPlan.findOne({ name: `${profile.name} Reminder Plan` });

    const dueDate = getDueDate(profile.daysOffset);
    const installments = [
        {
            sequence: 1,
            amountPercentage: 100,
            amountValue: DEMO_TOTAL_AMOUNT,
            dueDate,
            lateFeePerDay: 0,
            maxLateDays: 0
        }
    ];

    if (!plan) {
        plan = await InstallmentPlan.create({
            name: `${profile.name} Reminder Plan`,
            feeStructureId,
            totalAmount: DEMO_TOTAL_AMOUNT,
            installments
        });
    } else {
        plan.feeStructureId = feeStructureId;
        plan.totalAmount = DEMO_TOTAL_AMOUNT;
        plan.installments = installments;
        plan.isArchived = false;
        await plan.save();
    }

    return plan;
}

async function resetDemoPayments(studentId) {
    const payments = await Payment.find({ studentId }).select('_id').lean();
    const paymentIds = payments.map(payment => payment._id);

    if (paymentIds.length) {
        await Receipt.deleteMany({ paymentId: { $in: paymentIds } });
        await Payment.deleteMany({ studentId });
    }
}

async function seedDemoReminderData() {
    const semester = await ensureReminderSemester();
    const feeStructure = await ensureReminderFeeStructure(semester._id);

    const accounts = [];

    for (const profile of demoReminderProfiles) {
        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = await User.create({
                name: profile.name,
                email: profile.email,
                password: DEMO_PASSWORD,
                role: 'student'
            });
        }

        const plan = await upsertReminderPlan(feeStructure._id, profile);

        let student = await Student.findOne({ user: user._id });

        if (!student) {
            student = await Student.create({
                user: user._id,
                rollNumber: profile.rollNumber,
                semesterId: semester._id,
                feeStructureId: feeStructure._id,
                installmentPlanId: plan._id,
                isInstallmentEnabled: true
            });
        } else {
            student.rollNumber = profile.rollNumber;
            student.semesterId = semester._id;
            student.feeStructureId = feeStructure._id;
            student.installmentPlanId = plan._id;
            student.isInstallmentEnabled = true;
            await student.save();
        }

        await resetDemoPayments(student._id);

        accounts.push({
            name: profile.name,
            email: profile.email,
            password: DEMO_PASSWORD,
            rollNumber: profile.rollNumber,
            reminderType: profile.reminderType,
            dueDate: plan.installments[0].dueDate
        });
    }

    return accounts;
}

module.exports = {
    seedDemoReminderData
};
