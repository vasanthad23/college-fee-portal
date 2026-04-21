const { checkAndSendReminders } = require('../services/reminderService');
const { seedDemoReminderData } = require('../services/reminderDemoService');

// @desc    Run fee reminder check on demand
// @route   POST /api/reminders/run
// @access  Private (Admin)
exports.runReminderCheck = async (req, res) => {
    try {
        const reminders = await checkAndSendReminders();

        res.status(200).json({
            status: 'success',
            message: `Reminder check completed. ${reminders.length} reminder${reminders.length === 1 ? '' : 's'} generated.`,
            data: {
                runAt: new Date(),
                total: reminders.length,
                reminders
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
};

// @desc    Seed demo reminder accounts and dues
// @route   POST /api/reminders/demo-data
// @access  Private (Admin)
exports.seedReminderDemoData = async (req, res) => {
    try {
        const accounts = await seedDemoReminderData();

        res.status(200).json({
            status: 'success',
            message: `Demo reminder data is ready. ${accounts.length} account${accounts.length === 1 ? '' : 's'} prepared.`,
            data: {
                total: accounts.length,
                accounts
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
};
