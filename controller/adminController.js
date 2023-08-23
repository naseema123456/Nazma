const express = require("express");
const app = express()
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const User = require("../models/usermodel");
const products = require("../models/productmodel");
// const products = require("../models/productmodel");
const category = require("../models/categorymodel")

const login = async (req, res) => {
    try {

        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}

// const editPrdt = async (req, res) => {
//     try {

//         res.render('editPrdt')
//     } catch (error) {
//         console.log(error.message);
//     }
// }
const dashboard = async (req, res) => {
    try {

        res.render('dashboard')
    } catch (error) {
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
                res.cookie('user_name', user.name);
                console.log(user.name + " logged in");
                const allData = await User.find();
                console.log(user);
                res.render('dashboard', { users: allData });
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
       const categoryData= await category.find()
        res.render('addProduct',{ List : categoryData})
    } catch (error) {
        console.log(error.message);
    }
}
const insertProduct = async (req, res) => {
    console.log(req.body);
  
   
    try {
        let images = [];
        if (req.files) {

            images = req.files.map(file =>file.filename);}


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
            const categoryData= await category.find()
            res.render('addproduct', { message: "Product added successfully." ,List:categoryData});
        } else {
            res.render('addproduct', { message: "Failed to add product." });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const editproduct = async (req, res) => {
    try {
        const productId = req.body 
        // console.log(productId)
        res.render('editPrdt',{productId})
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
        const categoryData= await category.find()
        res.render('editCategory',{List:categoryData})
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
const blockUser=async(req,res)=>{
    try {
        const users = req.body;
       await User.updateOne({email:users.name},{$set:{is_blocked:true}})

        res.redirect('/admin/listOfUser'); 

        
    } catch (error) {
        console.log(error.message);
}
}
const Unblock=async(req,res)=>{
    try {
        const users = req.body;
       await User.updateOne({email:users.name},{$set:{is_blocked:false}})

        res.redirect('/admin/listOfUser'); 

        
    } catch (error) {
        console.log(error.message);
}
}
const deleteproduct=async(req,res)=>{
    try {
        console.log(req.body);
        const id = req.body.productId;
        await products.deleteOne({ _id: id })
        console.log('hi');
        res.redirect('/admin/editProduct')
    } catch (error) {
        console.log(error.message);
    }
}
const  editProduct=async (req, res) => {
    try {
        const productList = await products.find(); 
        res.render('editProduct', { productList });
    } catch (error) {
        console.log(error.message);
    }
};
const deleteCategory=async(req,res)=>{
    try {
        console.log(req.body);
        const id = req.body._id;
        await category.deleteOne({ _id: id })
        console.log('hi');
        res.redirect('/admin/editCategory')
    } catch (error) {
        console.log(error.message);
    }
}
const editcategory=async(req,res)=>{
    try {   console.log('hi');
        const categoryId = req.body.oldCategoryId;
        const newCategoryName = req.body.newCategoryName;

        // Update the category in the database
        const updatedCategory = await category.updateOne({_id:categoryId},{ $set: {categoryName: newCategoryName} });
        if(updatedCategory)res.redirect('/admin/editCategory')
        else throw Error
    } catch (error) {
        console.log(error.message);
    }
}
const updateProduct = async (req, res) => {

    const Id=req.body._id
    console.log(Id);
  
   
    try {
        let images = [];
        if (req.files) {
            images = req.files.map(file => file.filename);}


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
            { _id:Id },
            { $set:Product }
       
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
    updateProduct
}