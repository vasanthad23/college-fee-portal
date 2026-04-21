const express = require('express');
const { runReminderCheck } = require('../controllers/reminderController');
const { protect, admin } = require('../controllers/authController');

const router = express.Router();

router.use(protect);
router.use(admin);

router.post('/run', runReminderCheck);

module.exports = router;
