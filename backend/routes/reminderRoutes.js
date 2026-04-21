const express = require('express');
const { runReminderCheck, seedReminderDemoData } = require('../controllers/reminderController');
const { protect, admin } = require('../controllers/authController');

const router = express.Router();

router.use(protect);
router.use(admin);

router.post('/demo-data', seedReminderDemoData);
router.post('/run', runReminderCheck);

module.exports = router;
