const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const Semester = require('./models/Semester');
        const FeeStructure = require('./models/FeeStructure');
        const InstallmentPlan = require('./models/InstallmentPlan');

        const activeSemester = await Semester.findOne({ isActive: true });
        console.log('ACTIVE SEMESTER:', JSON.stringify(activeSemester, null, 2));

        if (activeSemester) {
            const depts = await FeeStructure.find({ semesterId: activeSemester._id });
            console.log('CURRENT DEPARTMENTS:', JSON.stringify(depts, null, 2));

            for (const dept of depts) {
                const plans = await InstallmentPlan.find({ feeStructureId: dept._id });
                console.log(`PLANS FOR ${dept.name}:`, JSON.stringify(plans, null, 2));
            }
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
