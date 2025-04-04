const prisma = require('../config/db')

exports.getUserOrderHistory = async (req, res) => {
    try {
        const userId = req.payload
        const orderHistory = await prisma.orders.findMany({
            where: { userId }
        })
        res.json(orderHistory)
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ error: err })
    }
}

exports.getUniqueOrder = async (req, res) => {
    try {
        const { id } = req.params
        const order = await prisma.orders.findUnique({
            where: { id }
        })
        res.json(order.status)
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ error: err })
    }
}