const prisma = require('../config/db')
const jwt = require('jsonwebtoken');
const generateOTP = require('../utils/otpGenerating')
const emailService = require('../utils/emailService')
const smsService = require('../utils/smsService')


exports.registerUser = async (req, res) => {
    try {
        const { email, mobile, username, fcmToken } = req.body
        const exsisting = await prisma.users.findUnique({
            where: { email, mobile }
        })

        if (exsisting) {
            const newOtp = generateOTP()
            const newOtpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min
            const subject = `Your OTP Code`
            const data = `Your OTP for registration is ${newOtp}. It will expire in 5 minutes.`
            await emailService(email, subject, data)
            await smsService(mobile, data)
            await prisma.users.update({
                where: { email, mobile },
                data: { otp: newOtp, otpExpiry: newOtpExpiry }
            })
            res.status(202).json("User already exist , otp send successfully")
        } else {
            const otp = generateOTP()
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min
            const subject = `Your OTP Code`
            const data = `Your OTP for registration is ${newOtp}. It will expire in 5 minutes.`
            await emailService(email, subject, data)
            await smsService(mobile, data)

            const newUser = await prisma.users.create({
                data: { username, mobile, email, otp, otpExpiry, fcmToken }
            })
            res.status(201).json({ message: `OTP send successfully` })
        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: `error occured`, error: err })
    }

}

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await prisma.users.findUnique({
            where: { email }
        })

        if (!user || user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" })
        }

        if (Date.now() > user.otpExpiry) {
            return res.status(400).json({ message: "OTP expired. Please request a new one." })
        }

        //jwt
        const val = jwt.sign({ userId: user.id }, process.env.JWT_PRIVATE_KEY)

        await prisma.users.update({
            where: { id: user.id },
            data: { otp: null, otpExpiry: null }
        })

        res.status(200).json({ message: "OTP verified successfully", data: { token: val, username: user.username } });

    } catch (err) {
        console.log(err);
        res.status(404).json({ message: "OTP verification failed " });
    }
}

exports.resendOtp = async (req, res) => {
    try {
        const { email, mobile } = req.body

        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    email ? { email } : {},  // Check if email exists
                    mobile ? { mobile } : {} // Check if mobile exists
                ]
            }
        });

        if (!user) {
            res.status(404).json({ message: `User not found` })
        }
        const otp = generateOTP()
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min 
        const subject = `Your OTP Code`
        const data = `Your OTP for registration is ${otp}. It will expire in 5 minutes.`
        await emailService(user.email, subject, data)
        await smsService(user.mobile, data)

        await prisma.users.update({
            where: { email: user.email, mobile: user.mobile },
            data: { otp, otpExpiry }
        })
        res.status(200).json({ message: 'OTP Resended successfully' })
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: "OTP Resending failed" });
    }
}

exports.loginUser = async (req, res) => {
    try {
        const { email, mobile } = req.body
        const user = await prisma.users.findFirst({
            where: {
                isActive: true,
                OR: [
                    email ? { email } : {},  // Check if email exists
                    mobile ? { mobile } : {} // Check if mobile exists
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Invalid Email or Mobile' })
        }
        const otp = generateOTP()
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min 
        const subject = `Your OTP Code`
        const data = `Your OTP for registration is ${otp}. It will expire in 5 minutes.`
        await emailService(user.email, subject, data)
        await smsService(user.mobile, data)

        await prisma.users.update({
            where: { email: user.email, mobile: user.mobile },
            data: { otp, otpExpiry }
        })
        res.status(200).json({ message: "otp send successfully", data: user.email })
    }
    catch (err) {
        console.log(err);
        res.status(404).json({ message: "OTP sending failed" });
    }
}