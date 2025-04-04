const prisma = require('../config/db')
const Razorpay = require("razorpay")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const puppeteer = require('puppeteer')
const fs = require("fs-extra")
const path = require("path")
const nodemailer = require('nodemailer')
const cron = require('node-cron')
const admin = require('../firebase')


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

exports.checkoutCart = async (req, res) => {
    try {
        const { discountAmount, address, pincode, preOrder } = req.body
        const userId = req.payload

        const cartItems = await prisma.cart.findMany({ where: { userId } });
        if (cartItems.length === 0) {
            return res.status(400).json(`Cart is empty`);
        }
        const totalAmount = cartItems.reduce((prev, item) => prev + item.price * item.quantity, 0);
        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: discountAmount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        if (preOrder) {

            const [day, month, year] = preOrder.split("/").map(Number);
            // Create a Date object (Month is 0-based in JavaScript)
            const deliveryDate = new Date(year, month - 1, day);
            // Convert to ISO format and extract YYYY-MM-DD
            const actualDate = deliveryDate.toISOString().split("T")[0];

            const newOrder = await prisma.orders.create({
                data: {
                    preOrder: actualDate, userId, amount: totalAmount, discountAmount, status: "PENDING", address, pincode, items: cartItems, razorpayOrderId: razorpayOrder.id
                }
            })
            res.status(201).json({ message: `order added successfully`, data: newOrder })
        } else {
            const newOrder = await prisma.orders.create({
                data: {
                    userId, amount: totalAmount, discountAmount, status: "PENDING", address, pincode, items: cartItems, razorpayOrderId: razorpayOrder.id
                }
            })
            res.status(201).json({ message: `order added successfully`, data: newOrder })
        }

    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

exports.conformPayment = async (req, res) => {
    try {
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
            await sendInvoiceEmail(user, updatedOrder, pdfPath);
            // await prisma.cart.deleteMany({ where: { userId: updatedOrder.userId } });
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
                    console.log(`no products `);
                }
            }

            await prisma.cart.deleteMany({ where: { userId: updatedOrder.userId } });
        }
        res.status(200).json({ message: `payment conformed`, order: updatedOrder });
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

exports.cancelOrder = async (req, res) => {
    const { orderId } = req.body
    const order = await prisma.orders.findUnique({
        where: {
            id: orderId
        }
    })
    if (!order) { return res.status(404).json(`order not found`) }
}

const checkUpcomingPreorders = async () => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const isoString = tomorrow.toISOString(); // Convert to ISO 8601
        const datePart = isoString.split("T")[0];
        // console.log(datePart);


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



const generateInvoicePDF = async (order, user) => {
    const invoiceHTML = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table, th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h2>Invoice for Order #${order.id}</h2>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${user.username}</p>
      <p><strong>Transaction ID:</strong> ${order.paymentId}</p>
      <p><strong>Shipping Address:</strong> ${order.address}, ${order.pincode}</p>
      <h3>Items:</h3>
      <table>
        <tr><th></th><th>Product</th><th>Quantity</th><th>Price</th></tr>
        ${order.items
            .map(
                (item, index) => `<tr><td>${index + 1}</td><td>${item.title}</td><td>${item.quantity}</td><td>₹${item.price * item.quantity}</td></tr>`
            )
            .join("")}
      </table>

      <p><strong>Total Amount:</strong> ₹${order.amount}</p>
      <p><strong>Payable Amount:</strong> ₹${order.discountAmount}</p>
      <p><strong>Payment Status:</strong> ${order.status}</p>
    </body>
    </html>
  `;
    // Define PDF path
    const pdfPath = path.join(__dirname, `../invoices/invoice_${order.id}.pdf`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(invoiceHTML);
    await page.pdf({ path: pdfPath, format: "A4" })

    await browser.close();
    return pdfPath;
}

const sendInvoiceEmail = async (user, order, pdfPath) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_ID,
        to: user.email,
        subject: `Invoice for Your Order #${order.id}`,
        text: `Hello ${user.username}, please find your invoice for Order #${order.id} attached.`,
        attachments: [
            {
                filename: `invoice_${order.id}.pdf`,
                path: pdfPath,
            },
        ],
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Invoice email sended successfully`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}





