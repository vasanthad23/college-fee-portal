const { checkAndSendReminders } = require('../services/reminderService');

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
