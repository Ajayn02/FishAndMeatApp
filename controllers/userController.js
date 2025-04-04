const prisma = require('../config/db')

//update profile with address
exports.updateUserProfile = async (req, res) => {
    try {
        const { address, pincode, fcmToken } = req.body
        const userId = req.payload
        const user = await prisma.users.update({
            where: { id: userId },
            data: { address, pincode, fcmToken }
        })
        res.status(201).json({ message: "user profile updated", data: user })
    }
    catch (err) {
        console.log(err);
        res.status(400).json("OTP sending failed");
    }
}

//to get profile information like name address etc..
exports.getUserDetails = async (req, res) => {
    try {
        const userId = req.payload
        const user = await prisma.users.findUnique({
            where: { id: userId }
        })
        res.json(user)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err);
    }

}

//Save or update FCM token for a user
// exports.updateFCM_token = async (req, res) => {
//     try {
//         const { fcmToken } = req.body
//         const userId = req.payload
//         const user = await prisma.users.update({
//             where: { id: userId },
//             data: { fcmToken }
//         })
//         res.status(200).json(`Fcm token added successfully`)
//     }
//     catch (err) {
//         console.log(err);
//         res.status(404).json(err);
//     }

// }