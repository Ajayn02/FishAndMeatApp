const prisma=require('../connection/db')

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

        if (!discount || !expiry) { res.status(404).json({ error: "Discount percentage and expiry date are required" }) }

        const expiryDate = convertToISO(expiry)

        const code = generatePromocode();
        const promocode = await prisma.promocodes.create({
            data: { discountPercentage: discount, expiry: expiryDate, code }
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
            res.status(404).json(`Invalid promo code`)
        } else if (new Date() > promocode?.expiry) {
            res.status(404).json(`Expired promo code`)
        } else {
            res.status(200).json({ message: "Valid promo code ", discount: promocode.discountPercentage })
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err)
    }
}