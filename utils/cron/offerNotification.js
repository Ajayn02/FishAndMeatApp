const cron = require('node-cron')
const notificationController = require('../../controllers/notificationController')

const scheduleOfferNotifications = () => {
    cron.schedule("0 * * * *", async () => {
        // cron.schedule("* * * * *", async () => {
        console.log("Checking for new offer notifications...");
        await notificationController.sendScheduledNotifications();
    });
};

module.exports = scheduleOfferNotifications;