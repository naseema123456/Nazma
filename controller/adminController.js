const express = require("express");
const app = express()
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const User = require("../models/usermodel");
const products = require("../models/productmodel");
// const products = require("../models/productmodel");
const category = require("../models/categorymodel")
const order = require('../models/order');
const Coupon = require('../models/coupen');
const banners=require('../models/banner');
const { product } = require("./userController");
const login = async (req, res) => {
    try {

        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

const dashboard = async (req, res) => {
    try {
        if(req.session._id){ 
            const monthSales = await order.aggregate([
            {
              $match: {
      orderstatus:"Delivered"
              }
            },
            {
              $unwind: "$products"
            },
            {
              $project: {
                year: { $year: "$orderdate" },
                month: { $month: "$orderdate" },
                monthlySales: {
                  $multiply: ["$products.amount", "$products.quantity"]
                }
              }
            },
            {
              $group: {
                _id: {
                  year: "$year",
                  month: "$month",
                },
                monthlySales: { $sum: "$monthlySales" }
              }
            },
            {
              $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                monthlySales: 1
              }
            },
            {
              $sort: {
                year: 1,
                month: 1,
        
              }
            }
          ]);
    
          
        //   console.log(monthSales);
          const totalSalesAmount = monthSales.reduce((total, sale) => total + sale.monthlySales, 0);
      const orderCount = await order.countDocuments({ orderstatus: "Delivered" });
    //   console.log(orderCount);
    //   console.log('Total Sales Amount:', totalSalesAmount);

    // const categories = await category.find({}, {categoryName:1, _id: 1 });
    const categories = await category.find({}, 'categoryName');
    // const  cat = await products.find({}).populate("category");console.log(cat);

    res.render("dashboard", {
       category: categories,
        monthSales,
        totalSalesAmount,
        orderCount,
   // Pass these counts to the template
      })


        }else{
            res.redirect('/admin/login')
        }
   
      }  
    catch (error) {
        console.log(error.message);
    }
}
const deleteUser = async (req, res) => {
    try {
        // if(req.body._id) await User.deleteOne(_id)
        const id = req.body._id;
        // console.log(id);
        await User.deleteOne({ _id: id })
        //    res.session.destroy()
        //    res.clearCookie('id');
        res.redirect('listOfUser')
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (user) {
            const passwordMatch = await bcrypt.compare(req.body.password, user.password);
            if (passwordMatch && user.is_admin == 1) {
                console.log(passwordMatch);
                req.session.user_name = user.name;
                req.session._id = user._id;
                res.cookie('user_name', user.name);
                console.log(user.name + " logged in");
                const allData = await User.find();
                // console.log(user);


                    res.redirect("/admin/dashboard")

            } else {
                res.render('login', { message: "Email, password, or admin status is incorrect" });
            }
        } else {
            res.render('login', { message: "Email or password is incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }
};
const alerts = async (req, res) => {
    try {

        res.render('alerts')
    } catch (error) {
        console.log(error.message);
    }
}
const listOfUser = async (req, res) => {
    try {
        const allData = await User.find();
        res.render('listOfUser', { users: allData })
    } catch (error) {
        console.log(error.message);
    }
}
const addProduct = async (req, res) => {
    try {
        const categoryData = await category.find()
        res.render('addProduct', { List: categoryData })
    } catch (error) {
        console.log(error.message);
    }
}
const insertProduct = async (req, res) => {
    console.log(req.body);


    try {
        let images = [];
        if (req.files) {

            images = req.files.map(file => file.filename);
        }


        const Product = new products({
            category: req.body.category,
            productName: req.body.productName,
            brandName: req.body.brandName,
            imageUrl: images,
            details: req.body.details,
            count: req.body.count,
            amount: req.body.amount
        });

        const productData = await Product.save();
        if (productData) {
            console.log(productData);
            const categoryData = await category.find()
            res.render('addproduct', { message: "Product added successfully.", List: categoryData });
        } else {
            res.render('addproduct', { message: "Failed to add product." });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const editproduct = async (req, res) => {
    try {
        const productId = req.body.productId
        console.log(productId)

        const product = await products.findOne({ _id: productId })
        console.log(product)
console.log(product);
        res.render('editPrdt', { product })
    } catch (error) {
        console.log(error.message);
    }
}
const addCategory = async (req, res) => {
    try {

        res.render('addCategory')
    } catch (error) {
        console.log(error.message);
    }
}
const editCategory = async (req, res) => {
    try {
        const categoryData = await category.find()
        res.render('editCategory', { List: categoryData })
    } catch (error) {
        console.log(error.message);
    }
}
const insertCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName;

        // Using a regular expression to find categories that match partially
        const regex = new RegExp(categoryName, 'i');
        const Match = await category.findOne({ categoryName: regex });
        // const Match = await category.find({ categoryName: req.body.categoryName })
        if (Match) {
            res.render('addCategory', { message: "Duplicate Category found." });
        } else {

            const Category = new category({
                categoryName: req.body.categoryName
            })

            console.log(Category);
            const categoryData = await Category.save();
            if (categoryData) {
                console.log(categoryData);
                res.render('addCategory', { message: "Product added successfully." });
            } else {
                res.render('addCategory', { message: "Failed to add category." });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}
const blockUser = async (req, res) => {
    try {
        const users = req.body;
        await User.updateOne({ email: users.name }, { $set: { is_blocked: true } })

        res.redirect('/admin/listOfUser');


    } catch (error) {
        console.log(error.message);
    }
}
const Unblock = async (req, res) => {
    try {
        const users = req.body;
        await User.updateOne({ email: users.name }, { $set: { is_blocked: false } })

        res.redirect('/admin/listOfUser');


    } catch (error) {
        console.log(error.message);
    }
}
const deleteproduct = async (req, res) => {
    try {
        console.log(req.body);
        const id = req.body.productId;
        await products.deleteOne({ _id: id })

        res.redirect('/admin/editProduct')
    } catch (error) {
        console.log(error.message);
    }
}
const editProduct = async (req, res) => {
    try {
        const productList = await products.find();
        res.render('editProduct', { productList });
    } catch (error) {
        console.log(error.message);
    }
};
const deleteCategory = async (req, res) => {
    try {
       
        const id = req.body._id;
console.log(id);

// Step 1: Delete the category
await category.deleteOne({ _id: id });

// Step 2: Find products belonging to the deleted category
const productsToDelete = await products.find({ category: id });

// Step 3: Delete the products
for (const product of productsToDelete) {
  await products.deleteOne({ _id: product._id });
}

console.log(`Category with ID ${id} and its associated products have been deleted.`);
console.log(products);
        console.log('hi');
        res.redirect('/admin/editCategory')
    } catch (error) {
        console.log(error.message);
    }
}
const editcategory = async (req, res) => {
    try {
        console.log('hi');
        const categoryId = req.body.oldCategoryId;
        const newCategoryName = req.body.newCategoryName;

        // Update the category in the database
        const updatedCategory = await category.updateOne({ _id: categoryId }, { $set: { categoryName: newCategoryName } });
        if (updatedCategory) res.redirect('/admin/editCategory')
        else throw Error
    } catch (error) {
        console.log(error.message);
    }
}
const updateProduct = async (req, res) => {

    const Id = req.body.productId
    console.log(Id);


    try {
        let images = [];
        if (req.files) {
            images = req.files.map(file => file.filename);
        }


        const Product = ({
            productName: req.body.productName,
            brandName: req.body.brandName,
            imageUrl: images,
            details: req.body.details,
            count: req.body.count,
            amount: req.body.amount
        });
        console.log(Product);
        const productData = await products.updateOne(
            { _id: Id },
            { $set: Product }

        );
        if (productData) {
            console.log(productData);
            // const categoryData= await category.find()
            // const productList = await products.find();
            res.redirect('/admin/editProduct');
        } else {
            res.render('editProduct', { message: "Failed to add product." });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const OrderList = async (req, res) => {
    try {
        const orders   = await order.find({ user: req.session.user_name })
        res.render('orders', { List: orders })
    } catch (error) {
        console.log(error.message);
    }
}
const updateStatus = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id);
        const status = req.body.status;
        const orders = await order.updateOne({ _id: id }, { $set: { orderstatus: status } });
        res.redirect('/admin/OrderList')
        const update = await order.find
    } catch (error) {
        console.log(error.message);
    }
}
const coupon = async (req, res) => {
    try {
        res.render('coupon')
    } catch (error) {
        console.log(error.message);
    }
}
const submitCoupon = async (req, res) => {
    try {console.log(req.body);
        // console.log(req.body);
        const coupon = new Coupon({
            code: req.body.code,
            discountAmount: req.body.discountAmount,
            minimumPurchaseAmount:req.body.minAmount,
            maximumPurchaseAmount:req.body.maxAmount,
            expiryDate: req.body.expiryDate,
        type:req.body.type
        });
        // console.log(coupon);
        const couponData = await coupon.save();
        res.redirect('/admin/coupon')
        // console.log(couponData);
    } catch (error) {
        console.log(error.message);
    }
}
const listofCoupon=async(req,res)=>{
    try {
        const coupons = await Coupon.find();
        res.render('listofCoupon',{coupons:coupons})
    } catch (error) {
        console.log(error.message);
    }
}
const removeCoupon=async(req,res)=>{
    try {
        const id = req.body.id;
        await Coupon.deleteOne({ _id: id })
        console.log('hi');
        res.json()
    } catch (error) {
        console.log(error.message);
    }
}
const editCoupon=async(req,res)=>{
    try {console.log(req.query.id);
        console.log(req.body);
        const coupon = await Coupon.updateOne({ _id: req.query.id }, { $set: { code: req.body.code, discountAmount: req.body.discountAmount, expiryDate: req.body.expiryDate } });
        //  await User.save();
        if (coupon) {
            // console.log(userData);
            res.redirect('/admin/listofCoupon')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const salesReport=async(req,res)=>{
    try {
        const orders   = await order.find({ user: req.session.user_name })
        res.render('salesReport',{List:orders})
    } catch (error) {
        console.log(error.message);
    }
}



const deleteImage=async(req,res)=>{
    try {
        console.log(req.body);
        const index=req.body.index;
        const product=await products.findOne({ _id: req.body.Id })
        product.imageUrl.splice(index, 1);

        // Update the document with the modified array
        await products.updateOne({ _id: req.body.Id }, { $set: { imageUrl: product.imageUrl } });
        // const product = await products.findOne({_id:req.body.Id},{$pull:{imageUrl:index}});
        console.log(product);
         res.json()
           
    } catch (error) {
        console.log(error.message);
    }
}
const banner=async(req,res)=>{
    try {
        const banner = await banners.find();
        res.render('banner',{banner:banner})
    } catch (error) {
        console.log(error.message);
    }
}
const addBanner=async(req,res)=>{
    try {
        let image;
        console.log(req.file);

        if (req.file) {
            image = req.file.filename
        }

        const baner = new banners({
            image: image,
            offer: req.body.offer,
            title: req.body.title,
        });

        const bannerData = await baner.save();
        console.log(bannerData);
        res.redirect('/admin/banner')
    } catch (error) {
        console.log(error.message);
    }
}
const editBanner=async(req,res)=>{
    try {console.log('hi');
    let image;
    console.log(req.file);

    if (req.file) {
        image = req.file.filename
    }

    const baner = new banners({
        image: image,
        offer: req.body.offer,
        title: req.body.title,
    });
    const id=req.body.bannerID
    console.log(id);
    const updatedbanner = await banners.updateOne({ _id:id}, { $set: { title:req.body.title,offer:req.body.offer,image:req.file.filename } });
        console.log(updatedbanner);
        res.redirect('/admin/banner')
    } catch (error) {
        console.log(error.message);
    }
}
const addbanner=async(req,res)=>{
    try {
        res.render('addbanner')
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    login,
    verifyLogin,
    alerts,
    listOfUser,
    addProduct,
    editProduct,
    addCategory,
    editCategory,
    dashboard,
    deleteUser,
    insertProduct,
    insertCategory,
    blockUser,
    Unblock,
    deleteproduct,
    editproduct,
    deleteCategory,
    editcategory,
    updateProduct,
    OrderList,
    updateStatus,
    coupon,
    submitCoupon,
    listofCoupon,
    removeCoupon,
    editCoupon,
    salesReport,
    deleteImage,
    banner,
    addBanner,
    editBanner,
    addbanner
}