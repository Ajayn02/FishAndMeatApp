const prisma = require('../config/db')
const generatePromocode = require('../utils/generatePromocode')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const sendResponse = require('../utils/sendResponse')


const convertToISO = (dateStr) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}


exports.createPromocode = catchAsync(async (req, res, next) => {
    const { discount, expiry } = req.body
    const userId = req.payload

    const vendor = await prisma.vendor.findUnique({
        where: { userId }
    })
    const expiryDate = convertToISO(expiry)
    const code = generatePromocode();

    const promocode = await prisma.promocodes.create({
        data: { discountPercentage: discount, expiry: expiryDate, code, vendorId: vendor.id }
    })
    sendResponse(res, 201, true, `promocode created successfully`, promocode)
})

exports.applyPromocode = catchAsync(async (req, res, next) => {
    const { code } = req.body
    const promocode = await prisma.promocodes.findUnique({
        where: { code }
    })
    if (!promocode) {
       return next(new AppError(`Invalid promo code`, 404))
    } else if (new Date() > promocode?.expiry) {
       return next(new AppError(`Expired promo code`, 404))
    }
    sendResponse(res, 200, true, "Valid promo code ", promocode)
})

exports.getVendorPromocode = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const vendor = await prisma.vendor.findUnique({
        where: { userId }
    })
    if (!vendor) { return next(new AppError(`Vendor not found`, 404)) }
    const promocodes = await prisma.promocodes.findMany({
        where: {
            vendorId: vendor.id
        }
    })
    sendResponse(res, 200, true, '', promocodes)
})

exports.editVendorPromocode = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const { discount, expiry } = req.body
    const expiryDate = convertToISO(expiry)
    const promocode = await prisma.promocodes.update({
        where: { id },
        data: { discountPercentage: discount, expiry: expiryDate }
    })
    sendResponse(res,200,true,'promocode updated',promocode)
})