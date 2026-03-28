const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Student = require('./models/Student');
const FeeRequest = require('./models/FeeRequest');
const InstallmentPlan = require('./models/InstallmentPlan');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find a pending installment request
        const request = await FeeRequest.findOne({ type: 'INSTALLMENT', status: 'PENDING' });
        if (!request) {
            console.log('No pending installment request found to test.');
            process.exit(0);
        }

        console.log(`Found request: ${request._id} for student: ${request.studentId}`);

        // 2. Simulate Admin Approval for 3-Part
        const { updateRequestStatus } = require('./controllers/requestController');
        
        const req = {
            params: { id: request._id },
            body: { status: 'APPROVED', installmentType: '3-Part' }
        };

        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { this.data = data; return this; }
        };

        await updateRequestStatus(req, res);

        if (res.statusCode === 200) {
            console.log('Approval API call successful');
            
            // 3. Verify Student Record
            const student = await Student.findById(request.studentId).populate('installmentPlanId');
            if (student.isInstallmentEnabled && student.installmentPlanId) {
                console.log(`Success: Student ${student.rollNumber} now has plan: ${student.installmentPlanId.name}`);
                if (student.installmentPlanId.name.includes('3-Part')) {
                    console.log('Verified: Plan is indeed 3-Part');
                } else {
                    console.log('Error: Plan is NOT 3-Part');
                }
            } else {
                console.log('Error: Student record not updated correctly');
            }
        } else {
            console.log('Error in API call:', res.data);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
