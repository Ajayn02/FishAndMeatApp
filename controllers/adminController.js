const prisma = require('../connection/db')
const admin = require('../firebase')
const cron = require('node-cron')

exports.getVendorApplications = async (req, res) => {
    try {
        const data = await prisma.vendor.findMany({
            where: { status: "pending" }
        })
        res.status(200).json(data)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

exports.verifyVendorApplication = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        if (!status) { return res.status(400).json(`status required`) }
        // if (status === `reject`) {
        //     const data = await prisma.vendor.delete({
        //         where: { id }
        //     })
        //     res.status(200).json({ message: "Application rejected", data })
        // }
        const application = await prisma.vendor.update({
            where: { id },
            data: { status }
        })
        res.status(200).json(`Application status updated`)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

exports.getOfferNotificationRequest = async (req, res) => {
    try {
        const notifications = await prisma.offerNotifications.findMany({
            where: { status: "pending" }
        })
        res.status(200).json(notifications)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

exports.verifyVendorNotificationRequest = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        const notification = await prisma.offerNotifications.update({
            where: { id },
            data: { status }
        })
        res.status(200).json(notification)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }

}

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

exports.getSalesReport = async (req, res) => {
    try {
        const orders = await prisma.orders.findMany({
            select: { discountAmount: true }
        })
        const totalRevenue = orders.reduce((prev, next) => prev + next.discountAmount, 0)
        const totalOrders = orders.length
        res.status(200).json({ totalRevenue, totalOrders })
    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}