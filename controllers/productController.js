const prisma = require('../config/db')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')
const sendResponse = require('../utils/sendResponse')

exports.addProduct = catchAsync(async (req, res, next) => {
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
    sendResponse(res, 201, true, "Product added", newProduct)
})

exports.getAllProducts = catchAsync(async (req, res, next) => {

    const { search, category, price } = req.query;
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
    sendResponse(res, 200, true, '', products)
})

exports.getUserPosts = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const products = await prisma.products.findMany({
        where: { userId }
    })
    if (!products) {
        next(new AppError(`product not found `, 404))
    }
    sendResponse(res, 200, true, '', products)
})

exports.updateUserProducts = catchAsync(async (req, res, next) => {
    const { id } = req.params
    let { title, description, price, availability, category, image } = req.body;
    if (req.file) {
        image = req.file.filename;
    }
    const updatedProduct = await prisma.products.update({
        where: { id },
        data: { title, description, price, availability, category, image }
    })
    sendResponse(res, 200, true, 'product updated successfully', updatedProduct)
})

exports.getUniqueProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params
    
    const product = await prisma.products.findUnique({
        where: { id }
    })
    let totalRating = 0;
    var averageRating=0;
    if(product.reviews && product.reviews.length>0){
        product.reviews.map((item) => {
            totalRating += item.rating
        })
        averageRating = totalRating / product.reviews.length
    }
   
    const vendor = await prisma.vendor.findUnique({
        where: { userId: product.userId }
    })
    sendResponse(res, 200, true, '', { product, shopname: vendor.shopname, rating: averageRating })
})

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const product = await prisma.products.delete({
        where: { id }
    })
    sendResponse(res, 200, true, 'product deleted', product)
})

exports.addProductReview =catchAsync( async (req, res,next) => {
    const userId = req.payload
    const { id } = req.params
    const { review, rating } = req.body
    const product = await prisma.products.findUnique({
        where: { id }
    })
    if (!product) { return next(new AppError(`product not found`,404)) }
    const newReview = { review, rating, userId };
    // Check if the product already has reviews
    let updatedReviews = Array.isArray(product.reviews) ? product.reviews : [];

    updatedReviews.push(newReview);
    await prisma.products.update({
        where: { id },
        data: { reviews: updatedReviews }
    });
    sendResponse(res,201,true, 'Review added successfully',)
})
