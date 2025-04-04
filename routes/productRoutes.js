const express = require('express')
const productController = require('../controllers/productController')
const multerMiddle = require('../middlewares/multerMiddleware')
const jwtMiddle = require('../middlewares/jwtMiddleware')


const router = express.Router()

router.get('/products', jwtMiddle, productController.getAllProducts)
router.get('/product/:id', jwtMiddle, productController.getUniqueProduct)
router.get('/products/user',jwtMiddle,productController.getUserPosts)
router.post('/products', jwtMiddle, multerMiddle.single('image'), productController.addProduct)
router.put('/product/:id', jwtMiddle, multerMiddle.single('image'), productController.updateUserProducts)
router.delete('/product/:id', jwtMiddle, productController.deleteProduct)
router.put('/product/:id/review',jwtMiddle,productController.addProductReview)

module.exports = router