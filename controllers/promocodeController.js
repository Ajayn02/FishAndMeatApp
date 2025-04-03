const prisma = require('../connection/db')

const generatePromocode = () => {
    const length = 8
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let promocode = "PROMO";
    for (let i = 0; i < length; i++) {
        promocode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return promocode;
}

// Function to Convert "DD/MM/YYYY" to ISO 8601
const convertToISO = (dateStr) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
};


exports.createPromocode = async (req, res) => {
    try {
        const { discount, expiry } = req.body
        const userId = req.payload

        if (!discount || !expiry) { return res.status(404).json({ error: "Discount percentage and expiry date are required" }) }

        const vendor = await prisma.vendor.findUnique({
            where: { userId }
        })
        if (!vendor) { return res.status(404).json(`vendor not found`) }

        const expiryDate = convertToISO(expiry)

        const code = generatePromocode();
        const promocode = await prisma.promocodes.create({
            data: { discountPercentage: discount, expiry: expiryDate, code, vendorId: vendor.id }
        })
        res.status(200).json({
            message: `promocode created successfully`,
            promo: promocode
        })
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

exports.applyPromocode = async (req, res) => {
    try {
        const { code } = req.body
        const promocode = await prisma.promocodes.findUnique({
            where: { code }
        })

        if (!promocode) {
            return res.status(404).json(`Invalid promo code`)
        } else if (new Date() > promocode?.expiry) {
            return res.status(404).json(`Expired promo code`)
        } else {
            return res.status(200).json({ message: "Valid promo code ", discount: promocode.discountPercentage })
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}

exports.getVendorPromocode = async (req, res) => {
    try {
        const userId = req.payload
        const vendor = await prisma.vendor.findUnique({
            where: { userId }
        })
        if (!vendor) { return res.status(400).json(`Vendor not found`) }
        const promocodes = await prisma.promocodes.findMany({
            where: {
                vendorId: vendor.id
            }
        })
        res.status(200).json(promocodes)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}

exports.editVendorPromocode = async (req, res) => {
    try {
        const { id } = req.params
        const { discount, expiry } = req.body
        const expiryDate = convertToISO(expiry)
        const promocode = await prisma.promocodes.update({
            where: { id },
            data: { discountPercentage: discount, expiry:expiryDate }
        })
        res.status(200).json(promocode)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }

}