const prisma = require('../config/db')


//to add product
exports.addProduct = async (req, res) => {
    try {
        const { title, description, price, stock, offerPrice, availability, category } = req.body

        const parsedAvailability = availability
            ? availability.split(',').map(item => Number(item.trim()))
            : [];

        const image = req.file.filename
        const userId = req.payload
        const parsedPrice = parseFloat(price)
        const parsedOfferPrice = parseFloat(offerPrice)

        const newProduct = await prisma.products.create({
            data: { title, description, price: parsedPrice, offerPrice: parsedOfferPrice, availability: parsedAvailability, stock: Number(stock), category, userId, image }
        })
        res.status(201).json({ message: "Product added", data: newProduct })
        console.log(`product added`);

    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

//to get all products
exports.getAllProducts = async (req, res) => {
    try {
        // const searchkey = req.query.searchkey
        const { search, category, price } = req.query;

        //availability
        let condition = {}
        if (search && search !== "") {
            condition.title = { contains: search, mode: "insensitive" };
        }
        if (category && category.trim() !== "") {
            condition.category = { contains: category, mode: "insensitive" };
        }
        if (price && price.trim() !== "") {
            const parsedPrice = parseFloat(price);
            condition.price = { lte: parsedPrice };
        }

        const products = await prisma.products.findMany({
            where: condition
        })

        res.status(200).json(products)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

//to get a user added product
exports.getUserPosts = async (req, res) => {
    try {
        const userId = req.payload
        const products = await prisma.products.findMany({
            where: { userId }
        })
        console.log(`userpost request`);

        res.status(200).json(products)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}

//to update user products

exports.updateUserProducts = async (req, res) => {
    try {
        const { id } = req.params
        let { title, description, price, availability, category, image } = req.body;
        if (req.file) {
            image = req.file.filename;
        }
        const updatedProduct = await prisma.products.update({
            where: { id },
            data: { title, description, price, availability, category, image }
        })
        res.status(200).json(updatedProduct)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}
//to get one product
exports.getUniqueProduct = async (req, res) => {
    try {
        const { id } = req.params
        const product = await prisma.products.findUnique({
            where: { id }
        })
        let totalRating = 0;
        product.reviews.map((item) => {
            totalRating += item.rating
        })
        const averageRating = totalRating / product.reviews.length
        const vendor = await prisma.vendor.findUnique({
            where: { userId: product.userId }
        })

        res.status(200).json({ product, shopname: vendor.shopname, rating: averageRating })
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

//delet user added product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params
        const product = await prisma.products.delete({
            where: { id }
        })
        res.status(200).json(product)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}

//check product availability
// exports.checkAvailability = async (req, res) => {
//     try {
//         const { id } = req.params
//         const { pincode } = req.body
//         if (!pincode) { return res.status(400).json(`pincode is required`) }
//         const product = await prisma.products.findUnique({
//             where: { id }
//         })
//         if (!product) { return res.status(400).json(`product not found`) }
//         if (product.availability.includes(pincode)) {
//             res.status(200).json(`product is available at your place`)
//         } else {
//             res.status(400).json(`product is not available at your place`)
//         }
//     }
//     catch (err) {
//         console.log(err);
//         res.status(404).json(err)
//     }
// }


exports.addProductReview = async (req, res) => {
    try {
        const userId = req.payload
        const { id } = req.params
        const { review, rating } = req.body
        const product = await prisma.products.findUnique({
            where: { id }
        })
        if (!product) { return res.status(400).json(`product not found`) }
        const newReview = { review, rating, userId };
        // Check if the product already has reviews
        let updatedReviews = Array.isArray(product.reviews) ? product.reviews : [];

        updatedReviews.push(newReview);
        await prisma.products.update({
            where: { id },
            data: { reviews: updatedReviews }
        });

        res.status(201).json({ message: 'Review added successfully', data: updatedReviews });

    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}