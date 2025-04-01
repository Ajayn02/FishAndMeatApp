const prisma = require('../connection/db')

exports.getUserOrderHistory = async (req, res) => {
    try {
        const userId = req.payload
        const orderHistory = await prisma.orders.findMany({
            where: { userId }
        })
        res.status(200).json(orderHistory)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}

exports.getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await prisma.orders.findUnique({
            where: { id: orderId }
        })
        res.status(200).json(order.status)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}



// exports.addOrderhistory = async (req, res) => {
//     try {
//         const userId = req.payload

//         const { amount, date, status, items, address, pincode } = req.body
//         const newOrderHistory = await prisma.orders.create({
//             data: { amount, date, status, userId, items, address, pincode }
//         })
//         res.status(200).json(newOrderHistory)
//     }
//     catch (err) {
//         console.log(err);
//         res.status(404).json(err)
//     }
// }

// exports.addPreOrder=async(req,res)=>{
//     const
// }



