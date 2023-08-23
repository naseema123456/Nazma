const express =require("express");
const userRouter=express();
const userController=require("../controller/userController")

userRouter.set('view engine', 'ejs')
userRouter.set('views', './views/users');

const auth=require("../middleware/auth");

userRouter.get('/',userController.landing)
userRouter.get('/landing',userController.home)
userRouter.get('/categories',userController.category)
userRouter.get('/contact',userController.contact)
userRouter.get('/login',userController.login)
userRouter.get('/profile',auth.isLogin,userController.profile)
userRouter.post('/signup',userController.insertUser);
userRouter.post('/login',auth.isLogout,userController.verifyLogin);
userRouter.post('/verify-login',userController.verifyMail)
userRouter.get('/cart',auth.isLogin,userController.cart)
userRouter.get('/product',userController.product)
userRouter.post('/editProfile',userController.editProfile)
userRouter.post('/addAddress',userController.addAddress)
userRouter.get('/removeAddress/:id',userController.removeAddress)
userRouter.get('/removeProduct',userController.removeProduct)
userRouter.get('/checkout',userController.checkout)
userRouter.get('/addquantity/:i',userController.addquantity)







module.exports=userRouter;