const nodemailer = require('nodemailer')


const emailService = async (email, subject, data) => {
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
        subject,
        text: data
        // subject: "Your OTP Code",
        // text: `Your OTP for registration is ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log("email send successfully");
        }
    })

};

module.exports = emailService