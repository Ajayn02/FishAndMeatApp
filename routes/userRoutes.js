const express=require('express')
const userController=require('../controllers/userController')
const jwtMiddle=require('../middlewares/jwtMiddleware')

const router=express.Router()

router.put('/users',jwtMiddle,userController.updateUserProfile)
router.get('/users',jwtMiddle,userController.getUserDetails)


module.exports=router