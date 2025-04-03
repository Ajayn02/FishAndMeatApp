const prisma = require('../connection/db')


exports.addToCart = async (req, res) => {
    try {
        const userId = req.payload
        const { productId, title,offerPrice, description, price, image, reviews, availability, category } = req.body

        const existing = await prisma.cart.findFirst({
            where: { userId, productId }
        })
        if (existing) {
            const increaseQuantity = await prisma.cart.update({
                where: { id: existing.id },
                data: { quantity: { increment: 1 } }
            })
            res.status(200).json("Quantity Updated")
        } else {
            const cartProduct = await prisma.cart.create({
                data: { productId, quantity: 1, title, description, price, image, reviews, availability, category, userId,offerPrice }
            })
            res.status(201).json(cartProduct)
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

exports.getCartProducts = async (req, res) => {
    try {
        const userId = req.payload
        const product = await prisma.cart.findMany({
            where: { userId }
        })
        res.status(200).json(product)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}

exports.removeFromCart = async (req, res) => {
    try {
        const { id } = req.params
        const item = await prisma.cart.delete({
            where: { id }
        })
        res.status(200).json(item)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}

exports.increaseQuantity = async (req, res) => {
    try {
        const { id } = req.params
        const cartItem = await prisma.cart.update({
            where: { id },
            data: { quantity: { increment: 1 } }
        })
        res.status(200).json("Quantity Increased")
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

exports.decreaseQuantity = async (req, res) => {
    try {
        const { id } = req.params
        const quantityCount = await prisma.cart.findUnique({
            where: { id }
        })
        if (quantityCount.quantity == 1) {
            await prisma.cart.delete({
                where: { id }
            })
            res.status(200).json('item removed from cart')
        } else {
            const cartItem = await prisma.cart.update({
                where: { id },
                data: { quantity: { decrement: 1 } }
            })
            res.status(200).json("Quantity Decreased")
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

