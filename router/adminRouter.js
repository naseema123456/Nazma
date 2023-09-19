const express =require("express");
const adminRouter=express();
const adminController=require("../controller/adminController")

adminRouter.set('view engine', 'ejs')
adminRouter.set('views', './views/admin');

const auth=require("../middleware/auth");


const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null,uniqueSuffix );
  }
});
const upload = multer({ storage:storage});

// const bannerupload = multer.diskStorage({
//   destination: 'public/banner/',
//   filename: function (req, file, cb) {
//     const uniqueSuffix = `${Date.now()}-${file.originalname}`;
//     cb(null,uniqueSuffix );
//   }
// });
// const bannerimg = multer({ storage:bannerupload});


adminRouter.get('/',auth.isLogout,adminController.login)
adminRouter.post('/login',adminController.verifyLogin)
adminRouter.get('/dashboard',auth.isLogin,adminController.dashboard)




adminRouter.get('/alerts',auth.isLogin,adminController.alerts)


adminRouter.get('/listOfUser',auth.isLogin,adminController.listOfUser)
adminRouter.post('/deleteUser',auth.isLogin,adminController.deleteUser)
adminRouter.post('/blockUser',auth.isLogin,adminController.blockUser)
adminRouter.post('/UnblockUser',auth.isLogin,adminController.Unblock)



adminRouter.get('/addProduct',auth.isLogin,adminController.addProduct)
adminRouter.post('/addProduct',auth.isLogin,upload.array('files',5),adminController.insertProduct)
adminRouter.post('/delete-product',auth.isLogin,adminController.deleteproduct)
adminRouter.get('/editProduct',auth.isLogin,adminController.editProduct)
adminRouter.post('/edit-product',auth.isLogin,adminController.editproduct)
adminRouter.post('/updateProduct',auth.isLogin,upload.array('files',5),adminController.updateProduct)
adminRouter.post('/deleteImage',auth.isLogin,adminController.deleteImage)




adminRouter.get('/addCategory',auth.isLogin,adminController.addCategory)
adminRouter.post('/insertCategory',auth.isLogin,adminController.insertCategory)
adminRouter.get('/editCategory',auth.isLogin,adminController.editCategory)
adminRouter.post('/deletecategory',auth.isLogin,adminController.deleteCategory)
adminRouter.post('/editcategory',auth.isLogin,adminController.editcategory)



adminRouter.get('/OrderList',auth.isLogin,adminController.OrderList)
adminRouter.post('/updateStatus',auth.isLogin,adminController.updateStatus)


adminRouter.get('/coupon',auth.isLogin,adminController.coupon)
adminRouter.post('/submitCoupon',auth.isLogin,adminController.submitCoupon)
adminRouter.get('/listofCoupon',auth.isLogin,adminController.listofCoupon)
adminRouter.post('/removeCoupon',adminController.removeCoupon)
adminRouter.post('/editCoupon',auth.isLogin,adminController.editCoupon)



adminRouter.get('/salesReport',auth.isLogin,adminController.salesReport)
adminRouter.get('/banner',auth.isLogin,adminController.banner)
adminRouter.get('/addbanner',auth.isLogin,adminController.addbanner)
adminRouter.post('/addBanner',auth.isLogin,upload.single('files'),adminController.addBanner)
adminRouter.post('/editBanner',auth.isLogin,upload.single('files'),adminController.editBanner)


// adminRouter.get('*',function(req,res){
//     res.redirect('/admin');
// })

module.exports=adminRouter;