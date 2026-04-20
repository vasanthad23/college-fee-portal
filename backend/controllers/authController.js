const User = require('../models/User');
const Student = require('../models/Student');
const Semester = require('../models/Semester');
const FeeStructure = require('../models/FeeStructure');
const InstallmentPlan = require('../models/InstallmentPlan');
const jwt = require('jsonwebtoken');

const DEMO_ADMIN = {
    name: 'Admin User',
    email: 'admin@college.com',
    password: 'adminpassword',
    role: 'admin'
};

const DEMO_STUDENT = {
    name: 'John Student',
    email: 'student@college.com',
    password: 'studentpassword',
    role: 'student'
};

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined; // Remove password from output

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

const seedDemoData = async ({ reset = false } = {}) => {
    if (reset) {
        await User.deleteMany({});
        await Semester.deleteMany({});
        await FeeStructure.deleteMany({});
        await InstallmentPlan.deleteMany({});
        await Student.deleteMany({});
    }

    const adminUser = await User.findOne({ email: DEMO_ADMIN.email });
    if (adminUser) {
        return adminUser;
    }

    const createdAdmin = await User.create(DEMO_ADMIN);

    let semesters = await Semester.find({}).sort({ createdAt: 1 });
    if (!semesters.length) {
        const today = new Date();
        semesters = [];
        for (let i = 1; i <= 8; i++) {
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() + (i - 1) * 6);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 6);
            const sem = await Semester.create({
                name: `Semester ${i}`,
                startDate,
                endDate,
                isActive: i === 1
            });
            semesters.push(sem);
        }
    }

    let cseFee = await FeeStructure.findOne({ name: 'B.Tech CSE - Semester 1 Fee' });
    if (!cseFee) {
        const departments = ['CSE', 'ECE', 'MECH', 'CIVIL'];
        const feeStructures = [];
        for (const sem of semesters) {
            for (const dept of departments) {
                const fee = await FeeStructure.create({
                    name: `B.Tech ${dept} - ${sem.name} Fee`,
                    semesterId: sem._id,
                    totalAmount: dept === 'CSE' ? 85000 : 75000,
                    isActive: true
                });
                feeStructures.push(fee);
            }
        }
        cseFee = feeStructures[0];
    }

    let standardPlan = await InstallmentPlan.findOne({ name: 'Standard 2-Part Payment' });
    if (!standardPlan && cseFee) {
        standardPlan = await InstallmentPlan.create({
            name: 'Standard 2-Part Payment',
            feeStructureId: cseFee._id,
            totalAmount: cseFee.totalAmount,
            installments: [
                { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
            ]
        });
    }

    let studentUser = await User.findOne({ email: DEMO_STUDENT.email });
    if (!studentUser) {
        studentUser = await User.create(DEMO_STUDENT);
    }

    const existingStudent = await Student.findOne({ user: studentUser._id });
    if (!existingStudent && semesters[0] && cseFee) {
        await Student.create({
            user: studentUser._id,
            rollNumber: 'CSE-101',
            semesterId: semesters[0]._id,
            feeStructureId: cseFee._id,
            installmentPlanId: standardPlan?._id
        });
    }

    return createdAdmin;
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role
        });

        createSendToken(newUser, 201, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        let user = await User.findOne({ email }).select('+password');

        if (!user && email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
            const totalUsers = await User.countDocuments();
            if (totalUsers === 0) {
                await seedDemoData();
                user = await User.findOne({ email }).select('+password');
            }
        }

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        let userObj = user.toObject();
        if (user.role === 'student') {
            const student = await Student.findOne({ user: user._id });
            if (student) {
                userObj.rollNumber = student.rollNumber;
            }
        }

        createSendToken(userObj, 200, res);

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ status: 'success' });
};

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({ message: 'You are not logged in! Please log in to get access.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
        }

        req.user = currentUser;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token or session expired' });
    }
};

exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
            return res.status(401).json({ message: 'Your current password is wrong' });
        }

        user.password = req.body.password;
        await user.save();

        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.seedProduction = async (req, res) => {
    try {
        await seedDemoData({ reset: true });

        res.status(200).json({
            status: 'success',
            message: 'Production database seeded successfully! You can now log in.'
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
