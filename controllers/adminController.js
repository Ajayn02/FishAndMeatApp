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

exports.getUsersList = async (req, res) => {
    try {
        const { search } = req.query;
        const users = await prisma.users.findMany({
            where: {
                vendor: false,
                ...(search && {
                    OR: [
                        { username: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } }
                    ]
                })
            }
        })

        res.status(200).json(users)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

exports.getVendorList = async (req, res) => {
    try {
        const { search } = req.query;
        const vendors = await prisma.vendor.findMany({
            where: {
                status: "success",
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } }
                    ]
                })
            }
        })
        res.status(200).json(vendors)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }

}

exports.getOneUser = async (req, res) => {
    try {
        const { role, id } = req.body

        if (role == 'user') {
            const user = await prisma.users.findUnique({
                where: { id }
            })
            return res.status(200).json(user)
        } else if (role == 'vendor') {
            const vendor = await prisma.vendor.findUnique({
                where: { id }
            })
            return res.status(200).json(vendor)
        } else {
            return res.status(400).json('not found')
        }
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}


exports.deactivateUser = async (req, res) => {
    try {
        const { id, role } = req.body
        if (role == 'user') {
            const user = await prisma.users.update({
                where: { id },
                data: { isActive: false }
            })
            return res.status(200).json(user)
        } else if (role == 'vendor') {
            const vendor = await prisma.vendor.update({
                where: { id },
                data: { isActive: false }
            })
            return res.status(200).json(vendor)
        }
        else {
            return res.status(400).json('not found')
        }

    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

exports.activateAccount = async (req, res) => {
    try {
        const { id, role } = req.body
        if (role == 'user') {
            const user = await prisma.users.update({
                where: { id },
                data: { isActive: true }
            })
            return res.status(200).json(user)
        } else if (role == 'vendor') {
            const vendor = await prisma.vendor.update({
                where: { id },
                data: { isActive: true }
            })
            return res.status(200).json(vendor)
        }
        else {
            return res.status(400).json('not found')
        }

    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}


exports.topSellingProduct = async (req, res) => {
    try {
        const { period } = req.query;
        const startDate = new Date();
        if (period === "week") {
            startDate.setDate(startDate.getDate() - 7); // Last 7 days
        } else if (period === "month") {
            startDate.setMonth(startDate.getMonth() - 1); // Last 30 days
        } else {
            return res.status(400).json({ message: "Invalid period. Use week or month" });
        }

        const allOrders = await prisma.orders.findMany()
        var products = []
        const addProduct = allOrders.map((i) => {
            products.push(i.items)
        })

        const productDetails = []
        // products.map((val) => {
        //     productDetails.push({productId:val[0].productId,quantity:val[0].quantity})
        // }
        for (let i = 0; i < products.length; i++) {
            for (let j = 0; j < products[i].length; j++) {
                productDetails.push({ productId: products[i][j].productId, quantity: products[i][j].quantity })
            }
        }
        // console.log(productDetails);
        const salesSummary = productDetails.reduce((acc, { productId, quantity }) => {
            acc[productId] = (acc[productId] || 0) + quantity;
            return acc;
        }, {});
        const topProduct = Object.entries(salesSummary).reduce((top, [productId, quantity]) => {
            return quantity > top.quantity ? { productId, quantity } : top;
        }, { productId: null, quantity: 0 });
        // console.log(topProduct);
        res.status(200).json(topProduct)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

