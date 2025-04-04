const express=require('express')
const cartController=require('../controllers/cartController')
const jwtMiddle=require('../middlewares/jwtMiddleware')

const router=express.Router()

router.post('/carts',jwtMiddle,cartController.addToCart)
router.get('/carts',jwtMiddle,cartController.getCartProducts)
router.delete('/carts/:id',jwtMiddle,cartController.removeFromCart)
router.get('/carts/:id/increase',jwtMiddle,cartController.increaseQuantity)
router.get('/carts/:id/decrease',jwtMiddle,cartController.decreaseQuantity)

module.exports=router