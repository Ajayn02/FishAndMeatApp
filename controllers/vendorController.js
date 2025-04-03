const prisma = require('../connection/db')


exports.addVendorApplication = async (req, res) => {
    try {
        const userId = req.payload
        const image = req.file.filename
        const { pan, adhar, shopname, gstNumber, location } = req.body
        const user = await prisma.users.findUnique({
            where: { id: userId }
        })
        const existing = await prisma.vendor.findUnique({
            where: { userId, email: user.email }
        })
        if (existing) {
            return res.status(400).json(`vendor already exist`)
        } else {
            const newVendor = await prisma.vendor.create({
                data: { userId, pan, adhar, shopname, gstNumber, location, email: user.email, name: user.username, mobile: user.mobile, image }
            })
            res.status(200).json({ message: `Application send successfully`, data: newVendor })

        }
    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}



exports.getVendorApplicationStatus = async (req, res) => {
    try {
        const userId = req.payload
        const application = await prisma.vendor.findUnique({
            where: { userId }
        })
        // console.log(application);

        if (!application) { return res.status(404).json(`Application not found`) }
        res.status(200).json(application.status)
    }
    catch (err) {
        console.log(err);
        res.status(400).json(err)
    }
}

exports.sendSpecialOfferNotification = async (req, res) => {
    try {
        const userId = req.payload
        const vendor = await prisma.vendor.findUnique({
            where: { userId }
        })
        if (!vendor) { return res.status(200).json(`vendor not found`) }
        const { title, body, dateTime, productId } = req.body
        const newNotification = await prisma.offerNotifications.create({
            data: { title, body, dateTime, productId, vendorId: vendor.id }
        })
        res.status(201).json({ message: `data added successfully wait for admins approval` })
    } catch (err) {
        console.log(err);
        res.status(400).json(err)
    }

}