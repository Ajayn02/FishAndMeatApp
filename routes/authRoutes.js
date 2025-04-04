const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/auth/register', authController.registerUser)
router.post('/auth/verify', authController.verifyOTP)
router.post('/auth/resend', authController.resendOtp)
router.post('/auth/login', authController.loginUser)

module.exports = router