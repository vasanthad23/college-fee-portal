const User = require('../models/User');
const Student = require('../models/Student');
const Semester = require('../models/Semester');
const FeeStructure = require('../models/FeeStructure');
const InstallmentPlan = require('../models/InstallmentPlan');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true
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

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Basic validation: Check if user exists
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

        // Debug Logs
        console.log('--- Login Request Debug ---');
        console.log('Request Body:', JSON.stringify(req.body));
        console.log('Email Type:', typeof email, 'Value:', email);
        console.log('Password Type:', typeof password, 'Length:', password ? password.length : 0);

        // 1) Check if email and password exist
        console.log('Login Attempt:', { email, passwordProvided: !!password }); // Debug log
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // 2) Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');

        console.log('Login Attempt:', { email, userFound: !!user });

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        // 3) If everything ok, populate student details if applicable
        let userObj = user.toObject();
        if (user.role === 'student') {
            const student = await Student.findOne({ user: user._id });
            if (student) {
                userObj.rollNumber = student.rollNumber;
            }
        }

        // 4) Send token to client
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
        httpOnly: true
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

        // 2) Verification token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
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
        // 1) Get user from collection
        const user = await User.findById(req.user.id).select('+password');

        // 2) Check if posted current password is correct
        if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
            return res.status(401).json({ message: 'Your current password is wrong' });
        }

        // 3) If so, update password
        user.password = req.body.password;
        await user.save();

        // 4) Log user in, send JWT
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.seedProduction = async (req, res) => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Semester.deleteMany({});
        await FeeStructure.deleteMany({});
        await InstallmentPlan.deleteMany({});
        await Student.deleteMany({});

        // 1. Create Admin
        await User.create({
            name: 'Admin User',
            email: 'admin@college.com',
            password: 'adminpassword',
            role: 'admin'
        });

        // 2. Create Semesters
        const semesters = [];
        const today = new Date();
        for (let i = 1; i <= 8; i++) {
            const startDate = new Date(today);
            startDate.setMonth(today.getMonth() + (i - 1) * 6);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 6);
            const sem = await Semester.create({
                name: `Semester ${i}`,
                startDate: startDate,
                endDate: endDate,
                isActive: i === 1
            });
            semesters.push(sem);
        }

        // 3. Create Fee Structures
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

        // 4. Create Installment Plan for CSE
        const cseFee = feeStructures[0];
        const standardPlan = await InstallmentPlan.create({
            name: 'Standard 2-Part Payment',
            feeStructureId: cseFee._id,
            totalAmount: cseFee.totalAmount,
            installments: [
                { sequence: 1, amountPercentage: 50, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
                { sequence: 2, amountPercentage: 50, dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
            ]
        });

        // 5. Create Student User
        const studentUser = await User.create({
            name: 'John Student',
            email: 'student@college.com',
            password: 'studentpassword',
            role: 'student'
        });

        // 6. Link Student Data
        await Student.create({
            user: studentUser._id,
            rollNumber: 'CSE-101',
            semesterId: semesters[0]._id,
            feeStructureId: cseFee._id,
            installmentPlanId: standardPlan._id
        });

        res.status(200).json({
            status: 'success',
            message: 'Production database seeded successfully! You can now log in.'
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
