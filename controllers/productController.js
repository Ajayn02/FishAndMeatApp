const prisma = require('../connection/db')


//to add product
exports.addProduct = async (req, res) => {
    try {
        const { title, description, price, availability, category } = req.body
        // Convert availability to an array
        const parsedAvailability = availability
            ? availability.split(',').map(item => Number(item.trim()))
            : [];

        const image = req.file.filename
        const userId = req.payload
        const parsedPrice = parseFloat(price)

        const newProduct = await prisma.products.create({
            data: { title, description, price: parsedPrice, availability: parsedAvailability, category, userId, image }
        })
        res.status(200).json({ message: "Product added", data: newProduct })
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
        const { searchkey, category, price } = req.query;
        
        //availability
        let condition = {}
        if (searchkey && searchkey !== "") {
            condition.title = { contains: searchkey, mode: "insensitive" };
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

//to get product based on category
exports.getProductByCategory = async (req, res) => {
    try {
        const { category } = req.params
        const products = await prisma.products.findMany({
            where: { category }
        })
        res.status(200).json(products)
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
        const vendor = await prisma.vendor.findUnique({
            where: { userId: product.userId }
        })
        res.status(200).json({ product, shopname: vendor.shopname })
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

//delet user added product
exports.deleteUserPost = async (req, res) => {
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

exports.checkAvailability = async (req, res) => {
    try {
        const { id } = req.params
        const { pincode } = req.body
        if (!pincode) { return res.status(400).json(`pincode is required`) }
        const product = await prisma.products.findUnique({
            where: { id }
        })
        if (!product) { return res.status(400).json(`product not found`) }
        if (product.availability.includes(pincode)) {
            res.status(200).json(`product is available at your place`)
        } else {
            res.status(400).json(`product is not available at your place`)
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}


exports.addReviewForProduct = async (req, res) => {
    try {
        const userId = req.payload
        const { productId } = req.params
        const { review, rating } = req.body
        const product = await prisma.products.findUnique({
            where: { id: productId }
        })
        if (!product) { return res.status(400).json(`product not found`) }
        const newReview = { review, rating, userId };
        // Check if the product already has reviews
        let updatedReviews = Array.isArray(product.reviews) ? product.reviews : [];

        updatedReviews.push(newReview);
        await prisma.products.update({
            where: { id: productId },
            data: { reviews: updatedReviews }  
        });

        res.status(201).json({ message: 'Review added successfully', data: updatedReviews });

    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}