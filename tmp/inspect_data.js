const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Student = require('../backend/models/Student');
const User = require('../backend/models/User');
const Semester = require('../backend/models/Semester');
const FeeStructure = require('../backend/models/FeeStructure');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const students = await Student.find()
            .populate('user')
            .populate('semesterId')
            .populate('feeStructureId');
        
        console.log(`Found ${students.length} students`);
        
        students.forEach((s, i) => {
            console.log(`Student ${i+1}:`);
            console.log(`  Name: ${s.user?.name || 'UNKNOWN'}`);
            console.log(`  Roll: ${s.rollNumber}`);
            console.log(`  Semester: ${s.semesterId?.name || 'N/A'}`);
            console.log(`  FeeStructure: ${s.feeStructureId?.name || 'N/A'}`);
            console.log('---');
        });

        const semesters = await Semester.find();
        console.log(`Semesters: ${semesters.map(s => s.name).join(', ')}`);

        const feeStructures = await FeeStructure.find();
        console.log(`Fee Structures: ${feeStructures.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
