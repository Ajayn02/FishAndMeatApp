const prisma = require('../connection/db')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const twilio = require('twilio');
const jwt = require('jsonwebtoken');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


//generate otp
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

//send otp via email
const sendOTPEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASS,
        },
    });

    let mailOptions = {
        from: process.env.EMAIL_ID,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP for registration is ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log("email send successfully");
        }
    })

};

//send otp via sms
const sendOTPSMS = async (mobile, otp) => {
    try {
        await client.messages.create({
            body: `Your OTP for verification is ${otp}. It will expire in 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: mobile, // Ensure the number is in E.164 format (+1XXXXXXXXXX)
        });
        console.log(`OTP sent to mobile`);
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};


//user register
exports.registerUser = async (req, res) => {
    try {
        const { email, mobile, username, fcmToken } = req.body
        const exsisting = await prisma.users.findUnique({
            where: { email, mobile }
        })

        if (exsisting) {
            const newOtp = generateOTP()
            const newOtpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min
            await sendOTPEmail(email, newOtp)
            await sendOTPSMS(mobile, newOtp)
            await prisma.users.update({
                where: { email, mobile },
                data: { otp: newOtp, otpExpiry: newOtpExpiry }
            })
            res.status(202).json("User already exist , otp send successfully")
        } else {
            const otp = generateOTP()
            const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min

            await sendOTPEmail(email, otp)
            await sendOTPSMS(mobile, otp)

            const newUser = await prisma.users.create({
                data: { username, mobile, email, otp, otpExpiry, fcmToken }
            })

            res.status(201).json(`OTP send successfully`)

        }
    } catch (err) {
        console.log(err);
        res.status(404).json({ message: `error occured`, error: err })
    }

}

// to verify otp
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body

        const user = await prisma.users.findUnique({
            where: { email }
        })
        if (!user || user.otp !== otp) {
            return res.status(400).json("Invalid OTP")
        }

        if (Date.now() > user.otpExpiry) {
            return res.status(400).json("OTP expired. Please request a new one.")
        }

        //jwt
        const val = jwt.sign({ userId: user.id }, process.env.JWT_PRIVATE_KEY)

        await prisma.users.update({
            where: { id: user.id },
            data: { otp: null, otpExpiry: null }
        })
        res.status(200).json({ message: "OTP verified successfully", token: val, username: user.username });
    } catch (err) {
        console.log(err);
        res.status(404).json("OTP verification failed ");
    }
}

// to resend otp
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
            res.status(404).json(`User not found`)
        }
        const otp = generateOTP()
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min 
        await sendOTPEmail(user.email, otp)
        await sendOTPSMS(user.mobile, otp)

        await prisma.users.update({
            where: { email: user.email, mobile: user.mobile },
            data: { otp, otpExpiry }
        })
        res.status(200).json('OTP Resended successfully')
    }
    catch (err) {
        console.log(err);
        res.status(404).json("OTP Resending failed");
    }
}

// user login
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
            return res.status(404).json('Invalid Email or Mobile')
        }
        const otp = generateOTP()
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min 
        await sendOTPEmail(user.email, otp)
        await sendOTPSMS(user.mobile, otp)

        await prisma.users.update({
            where: { email: user.email, mobile: user.mobile },
            data: { otp, otpExpiry }
        })
        res.status(200).json({ message: "otp send successfully", data: user.email })
    }
    catch (err) {
        console.log(err);
        res.status(404).json("OTP sending failed");
    }
}

//update profile with address
exports.updateUserProfile = async (req, res) => {
    try {
        const { address, pincode } = req.body
        const userId = req.payload
        const user = await prisma.users.update({
            where: { id: userId },
            data: { address, pincode }
        })
        res.status(201).json({ message: "user profile updated", data: user })
    }
    catch (err) {
        console.log(err);
        res.status(400).json("OTP sending failed");
    }
}

//to get profile information like name address etc..
exports.userDetails = async (req, res) => {
    try {
        const userId = req.payload
        const user = await prisma.users.findUnique({
            where: { id: userId }
        })
        res.status(200).json(user)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err);
    }

}

//Save or update FCM token for a user
exports.updateFCM_token = async (req, res) => {
    try {
        const { fcmToken } = req.body
        const userId = req.payload
        const user = await prisma.users.update({
            where: { id: userId },
            data: { fcmToken }
        })
        res.status(200).json(`Fcm token added successfully`)
    }
    catch (err) {
        console.log(err);
        res.status(404).json(err);
    }

}