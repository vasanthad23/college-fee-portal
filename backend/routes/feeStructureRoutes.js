const express = require('express');
const feeStructureController = require('../controllers/feeStructureController');

const router = express.Router();

router.route('/')
    .get(feeStructureController.getFeeStructures)
    .post(feeStructureController.createFeeStructure);

module.exports = router;
