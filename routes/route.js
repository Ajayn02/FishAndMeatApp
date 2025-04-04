const express = require('express')
const jwtMiddle = require('../middlewares/jwtMiddleware')
const multerMiddle = require('../middlewares/multerMiddleware')
const userController = require('../controllers/userController')
const orderController = require("../controllers/orderController")
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const checkoutController = require('../controllers/checkoutController')
const vendorController = require('../controllers/vendorController')
const promocodeController = require('../controllers/promocodeController')
const adminController = require('../controllers/adminController')

const router = express.Router()





// user
// router.post("/reg", userController.registerUser)
// router.post("/verifyotp", userController.verifyOTP)
// router.post("/resendotp", userController.resendOtp)
// router.post('/log', userController.loginUser)
router.put("/updateuser", jwtMiddle, userController.updateUserProfile)
router.get("/userdetails", jwtMiddle, userController.getUserDetails)
// router.put("/updatefcm", jwtMiddle, userController.updateFCM_token)

// router.post("/addorderhistory",jwtMiddle,orderController.addOrderhistory)
router.get('/getorderhistory', jwtMiddle, orderController.getUserOrderHistory)
router.get('/getorderstatus/:orderId', jwtMiddle, orderController.getUniqueOrder)

// product
// router.post("/addproduct", jwtMiddle, multerMiddle.single('image'), productController.addProduct)
// router.get("/allproducts", jwtMiddle, productController.getAllProducts)
// router.get("/userproducts", jwtMiddle, productController.getUserPosts)
// router.get("/getoneproduct/:id", jwtMiddle, productController.getUniqueProduct)
// router.put("/updateproduct/:id", jwtMiddle, multerMiddle.single('image'), productController.updateUserProducts)
// router.delete("/deleteproduct/:id", jwtMiddle, productController.deleteUserPost)
// // router.post("/checkavailability/:id", jwtMiddle, productController.checkAvailability)
// router.put('/product/:id/review', jwtMiddle, productController.addProductReview)


//cart
router.post("/addtocart", jwtMiddle, cartController.addToCart)
router.get("/productfromcart", jwtMiddle, cartController.getCartProducts)
router.delete("/removefromcart", jwtMiddle, cartController.removeFromCart)
router.get("/increcart/:id", jwtMiddle, cartController.increaseQuantity)
router.get("/decrecart/:id", jwtMiddle, cartController.decreaseQuantity)

// promocode
router.post("/createpromo", jwtMiddle, promocodeController.createPromocode)
router.post("/applypromo", jwtMiddle, promocodeController.applyPromocode)
router.get("/getvendorpromo", jwtMiddle, promocodeController.getVendorPromocode)
router.put("/updatepromo/:id", jwtMiddle, promocodeController.editVendorPromocode)

//checkout
router.post("/checkout", jwtMiddle, checkoutController.checkoutCart)
router.post('/conformpayment', jwtMiddle, checkoutController.conformPayment)

//vendor
router.post("/vendorapplication", jwtMiddle, multerMiddle.single(`image`), vendorController.addVendorApplication)
router.get('/getapplicationstatus', jwtMiddle, vendorController.getVendorApplicationStatus)
router.post('/specialoffer', jwtMiddle, vendorController.sendSpecialOfferNotification)

//admin
router.get("/getvendorapplication", jwtMiddle, adminController.getVendorApplications)
router.put('/verifyvendor/:id', jwtMiddle, adminController.verifyVendorApplication)
router.get("/notificationrequest", jwtMiddle, adminController.getOfferNotificationRequest)
router.put("/verifynotification/:id", jwtMiddle, adminController.verifyVendorNotificationRequest)
router.get('/salesreport', jwtMiddle, adminController.getSalesReport)
router.get('/allusers', jwtMiddle, adminController.getUsersList)
router.get('/allvendors', jwtMiddle, adminController.getVendorList)
router.post("/getoneuser", jwtMiddle, adminController.getOneUser)
router.post('/deactivateaccount', jwtMiddle, adminController.deactivateUser)
router.post('/activateaccount', jwtMiddle, adminController.activateAccount)
router.get("/topselling/:period", jwtMiddle, adminController.topSellingProduct)
router.get("/topvendor/:period", jwtMiddle, adminController.topRevenueGeneratingVendor)


module.exports = router