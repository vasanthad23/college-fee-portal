const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/pay', paymentController.processPayment);
router.get('/my-history', paymentController.getMyPayments);
router.get('/all', paymentController.getAllPayments); // Admin only route

module.exports = router;
