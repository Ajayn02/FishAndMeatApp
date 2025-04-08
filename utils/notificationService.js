const prisma = require("../config/db")
const admin = require('./firebase')
const cron = require('node-cron')

const sendScheduledNotifications = async () => {
    try {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        const current = `${day}-${month}-${year}:${hours}.${minutes}`;
        const notifications = await prisma.offerNotifications.findMany({
            where: { status: "success", dateTime: current }
        })
        if (notifications.length === 0) {
            console.log('No scheduled notifications at this time.');
            return;
        }
        for (let i = 0; i < notifications.length; i++) {
            const users = await prisma.users.findMany({
                select: { fcmToken: true },
                where: { fcmToken: { not: null } }
            });

            if (users.length === 0) {
                console.log(`no users found`);
                return;
            }
            var message;
            for (let j = 0; j < users.length; j++) {
                message = {
                    token: users[j].fcmToken,
                    notification: {
                        title: notifications[i].title,
                        body: notifications[i].body
                    },
                    data: {
                        productId: notifications[i].productId
                    }
                };
                await admin.messaging().send(message)
                console.log(`message sended to users`);
                message = {}
            }
        }

    } catch (err) {
        console.log(err);
    }
}

// cron.schedule("* * * * *", async () => {
//     console.log("checking for new notifications");
//     await sendScheduledNotifications();
// })