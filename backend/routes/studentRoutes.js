const express = require('express');
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes
router.use(authController.protect);

router.get('/me', studentController.getStudentProfile);

router.route('/')
    .get(studentController.getAllStudents)
    .post(studentController.createStudent);

router.patch('/:id/fee', studentController.updateStudentFee);
router.post('/:id/additional-fee', studentController.addAdditionalFee);
router.delete('/:id/additional-fee/:feeId', studentController.removeAdditionalFee);

module.exports = router;
