const prisma = require('../config/db')
const cron = require('node-cron')
const admin = require('../utils/firebase')
const paymentService = require('../utils/paymentService')
const generateInvoicePDF = require('../utils/invoiceService')
const sendInvoiceEmail = require('../utils/emailService')
const sendResponse = require('../utils/sendResponse')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')



exports.checkoutCart = catchAsync(async (req, res, next) => {
    const { discountAmount, address, pincode, preOrder } = req.body
    const userId = req.payload

    const cartItems = await prisma.cart.findMany({ where: { userId } });
    if (cartItems.length === 0) {
       return next(new AppError(`Cart is empty`, 404))
    }
    const totalAmount = cartItems.reduce((prev, item) => prev + item.price * item.quantity, 0);
    // Create Razorpay order
    await paymentService(discountAmount);
    if (preOrder) {

        const [day, month, year] = preOrder.split("/").map(Number);
        // Create a Date object (Month is 0-based in JavaScript)
        const deliveryDate = new Date(year, month - 1, day);
        // Convert to ISO format and extract YYYY-MM-DD
        const actualDate = deliveryDate.toISOString().split("T")[0];

        var newOrder = await prisma.orders.create({
            data: {
                preOrder: actualDate, userId, amount: totalAmount, discountAmount, status: "PENDING", address, pincode, items: cartItems, razorpayOrderId: razorpayOrder.id
            }
        })
    } else {
        var newOrder = await prisma.orders.create({
            data: {
                userId, amount: totalAmount, discountAmount, status: "PENDING", address, pincode, items: cartItems, razorpayOrderId: razorpayOrder.id
            }
        })
    }
    sendResponse(res, 201, true, `order added successfully`, newOrder)
})

exports.confirmPayment = catchAsync(async (req, res, next) => {
    const { orderId, paymentId, status } = req.body;
    //orderId= rayzorpayid
    const updatedOrder = await prisma.orders.update({
        where: { razorpayOrderId: orderId },
        data: { status, paymentId },
    });
    const user = await prisma.users.findUnique({
        where: { id: updatedOrder.userId }
    })
    const userId = req.payload
    if (status === "PAID") {
        const pdfPath = await generateInvoicePDF(updatedOrder, user);
        const emailSub = `Invoice for Your Order #${updatedOrder.id}`
        const emailData = `Hello ${user.username}, please find your invoice for Order #${updatedOrder.id} attached.`
        const orderId = updatedOrder.id
        await sendInvoiceEmail(user.email, emailSub, emailData, orderId, pdfPath);
        const checkoutProducts = await prisma.cart.findMany({ where: { userId } });

        for (let i = 0; i < checkoutProducts.length; i++) {
            const product = await prisma.products.findUnique({
                where: { id: checkoutProducts[i].productId }
            })
            if (product) {
                const newStock = product.stock - checkoutProducts[i].quantity

                await prisma.products.update({
                    where: { id: checkoutProducts[i].productId },
                    data: { stock: newStock }
                })
            } else {
                console.log(`no products`);
            }
        }

        await prisma.cart.deleteMany({ where: { userId: updatedOrder.userId } });
    }
    sendResponse(res, 200, true, `payment conformed`, updatedOrder)
})

const checkUpcomingPreorders = async () => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const isoString = tomorrow.toISOString();
        const datePart = isoString.split("T")[0];

        const preOrders = await prisma.orders.findMany({
            where: {
                preOrder: datePart
            },
        })
        console.log(`Found ${preOrders.length} preorders for tomorrow.`);

        if (preOrders.length > 0) {

            for (let i = 0; i < preOrders.length; i++) {

                if (preOrders[i].userId) {
                    const user = await prisma.users.findUnique({
                        where: { id: preOrders[i].userId }
                    })

                    if (user.fcmToken) {
                        const message = {
                            notification: {
                                title: "Reminder: Your preorder is coming!",
                                body: `Your preorder (#${preOrders[i].id}) will be delivered tomorrow.`,
                            },
                            token: user.fcmToken,
                        };
                        await admin.messaging().send(message);
                        console.log(`Notification sent for preorder #${preOrders[i].id}`);
                    } else {
                        console.log(`fcmToken not found`);
                    }
                } else {
                    console.log(`user not found`);
                }
            }
        } else {
            console.log(`No pre-orders for tomorrow`);
        }
    } catch (err) {
        console.log(err);
    }
}

// Schedule a cron job to run daily at 11 AM
cron.schedule("00 11 * * *", async () => {
    console.log("Running daily preorder check at 11:00 AM...");
    await checkUpcomingPreorders();
});




// const sendInvoiceEmail = async (user, order, pdfPath) => {
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             user: process.env.EMAIL_ID,
//             pass: process.env.EMAIL_PASS,
//         },
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_ID,
//         to: user.email,
//         subject: `Invoice for Your Order #${order.id}`,
//         text: `Hello ${user.username}, please find your invoice for Order #${order.id} attached.`,
//         attachments: [
//             {
//                 filename: `invoice_${order.id}.pdf`,
//                 path: pdfPath,
//             },
//         ],
//     };
//     try {
//         await transporter.sendMail(mailOptions);
//         console.log(`Invoice email sended successfully`);
//     } catch (error) {
//         console.error("Error sending email:", error);
//     }
// }





