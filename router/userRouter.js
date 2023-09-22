const express =require("express");
const userRouter=express();
const userController=require("../controller/userController")


userRouter.set('view engine', 'ejs')
userRouter.set('views', './views/users');

const auth=require("../middleware/auth");

userRouter.get('/',userController.landing)
userRouter.get('/landing',userController.landing)



userRouter.get('/login',auth.isLogout,userController.login)
userRouter.post('/signup',userController.insertUser);
userRouter.post('/login',auth.isLogout,userController.verifyLogin);
userRouter.post('/verify-login',userController.verifyMail)
// userRouter.get('/forgotpassword',userController.forgotpassword)
userRouter.get('/otplogin',auth.isLogout,userController.otplogin)
userRouter.post('/otplogin',auth.isLogout,userController.requestotp)
userRouter.post('/otpLoginVerify',auth.isLogout,userController.otpverify)
userRouter.post('/editAddress',auth.isLogout,userController.editAddress)
userRouter.post('/resend-otp',auth.isLogout,userController.resend_Otp)




userRouter.get('/categories',userController.category)
userRouter.post('/search',userController.search)
// userRouter.get('/search',userController.search)
userRouter.get('/contact',auth.isLogin,userController.contact)



userRouter.get('/cart',auth.isLogin,userController.cart)
userRouter.get('/removeProduct',auth.isLogin,userController.removeProduct)
userRouter.post('/addquantity',auth.isLogin,userController.addquantity)



userRouter.get('/product',userController.product)




userRouter.get('/profile',auth.isLogin,auth.isLogin,userController.profile)
userRouter.post('/editProfile',auth.isLogin,userController.editProfile)
userRouter.post('/addAddress',auth.isLogin,userController.addAddress)
userRouter.get('/removeAddress/:id',auth.isLogin,userController.removeAddress)

userRouter.get('/checkout',auth.isLogin,userController.checkout)
userRouter.get('/orderManagement',auth.isLogin,userController.orderManagement)
userRouter.post('/confirm-order',auth.isLogin,userController.confirmorder)
userRouter.get('/cancelOrder',auth.isLogin,userController.cancelOrder)
userRouter.get('/return',auth.isLogin,userController.returns)
userRouter.get('/success',auth.isLogin,userController.success)
userRouter.post('/applyCoupon',auth.isLogin,userController.applyCoupon)
userRouter.get('/faiure',auth.isLogin,userController.faiure)




userRouter.post("/verify-payment",auth.isLogin,userController.verifyPayment)





userRouter.post('/addwish',auth.isLogin,userController.addwish)
userRouter.get('/wishList',auth.isLogin,userController.wishList)
userRouter.post('/removeWish',auth.isLogin,userController.removeWish)

userRouter.get('/invoice',userController.invoice)



userRouter.get('/wallet',auth.isLogin,userController.wallet)
userRouter.post('/applywallet',auth.isLogin,userController.applywallet)


userRouter.get('/userLogout',auth.isLogin,userController.userLogout)



userRouter.post('/resetpassword',auth.isLogin,userController.resetpassword)




module.exports=userRouter;