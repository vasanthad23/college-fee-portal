const express = require('express');
const installmentController = require('../controllers/installmentPlanController');

const router = express.Router();

router.route('/')
    .get(installmentController.getInstallmentPlans)
    .post(installmentController.createInstallmentPlan);

module.exports = router;
