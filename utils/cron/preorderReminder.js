const cron = require('node-cron')
const notificationController = require('../../controllers/notificationController')


const schedulePreorderReminder = () => {
    cron.schedule("00 11 * * *", async () => {
        console.log(" Running daily preorder check at 11:00 AM...");
        await notificationController.checkUpcomingPreorders();
    });
};

module.exports = schedulePreorderReminder