const express=require('express')
const orderController=require('../controllers/orderController')
const jwtMiddle=require('../middlewares/jwtMiddleware')

const router=express.Router()

router.get('/orders',jwtMiddle,orderController.getUserOrderHistory)
router.get('/order/:id',jwtMiddle,orderController.getUniqueOrder)


module.exports=router