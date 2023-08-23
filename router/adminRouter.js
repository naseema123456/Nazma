const express =require("express");
const adminRouter=express();
const adminController=require("../controller/adminController")

adminRouter.set('view engine', 'ejs')
adminRouter.set('views', './views/admin');



const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${file.originalname}`;
    cb(null,uniqueSuffix );
  }
});
const upload = multer({ storage: storage });


adminRouter.get('/',adminController.login)
adminRouter.post('/login',adminController.verifyLogin)
adminRouter.get('/dashboard',adminController.dashboard)
// adminRouter.get('/editPrdt',adminController.editPrdt)
adminRouter.get('/alerts',adminController.alerts)
adminRouter.get('/listOfUser',adminController.listOfUser)
adminRouter.get('/addProduct',adminController.addProduct)
adminRouter.post('/addProduct',upload.array('files',5),adminController.insertProduct)
adminRouter.get('/addCategory',adminController.addCategory)
adminRouter.post('/insertCategory',adminController.insertCategory)
adminRouter.get('/editCategory',adminController.editCategory)
adminRouter.post('/deleteUser',adminController.deleteUser)
adminRouter.post('/blockUser',adminController.blockUser)
adminRouter.post('/UnblockUser',adminController.Unblock)
adminRouter.post('/delete-product',adminController.deleteproduct)
adminRouter.get('/editProduct',adminController.editProduct)
adminRouter.post('/edit-product',adminController.editproduct)
adminRouter.post('/updateProduct',upload.array('files',5),adminController.updateProduct)
adminRouter.post('/deletecategory',adminController.deleteCategory)
adminRouter.post('/editcategory',adminController.editcategory)


adminRouter.get('*',function(req,res){
    res.redirect('/admin');
})

module.exports=adminRouter;