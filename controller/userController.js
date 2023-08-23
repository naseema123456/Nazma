const express = require("express");
const app = express()
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");


const User = require('../models/usermodel');
const Category = require('../models/categorymodel')
const Product = require('../models/productmodel')
const UserOTPVerification = require('../models/userOTPVerification')
const { name } = require("ejs");
const { default: mongoose } = require("mongoose");
const { render } = require("../router/userRouter");

const landing = async (req, res) => {
    try {

        res.render('landing')
    } catch (error) {
        console.log(error.message);
    }
}
const category = async (req, res) => {
    try {
        const categories = await Category.find()
        let products = await Product.find()
        let user = await User.find({ name: req.session.user_name })
        const category = req.query.category

        if (category) {
            console.log('hi');
            products = products.filter(product => product.category == category);


        }




        res.render('categories', {
            List: categories,
            product: products,

        })
    } catch (error) {
        console.log(error.message);
    }
}
const contact = async (req, res) => {
    try {
        res.render('contact')
    } catch (error) {
        console.log(error.message);
    }
}
const cart = async (req, res) => {
    try {
        // console.log(req.query);
        const productdata = await Product.find({ _id: req.query.id })
        // console.log( req.session.user_name);
        // Assuming you have the authenticated user's ID available in req.user
        const user = await User.findOne({ name: req.session.user_name });
        // Add the product to the user's cart
        const a = User.findOne({ name: req.session.user_name }, { cart: productdata });
        // console.log(a);

        User.findOne({ name: req.session.user_name }, { cart: productdata })
        if (user) {



            if (user.cart) {
                let found = false; // Flag to track if the product was found in the cart

                user.cart.forEach(item => {
                    if (item.product && item.product.toString() === req.query.id) {
                        found = true;
                        item.quantity++; // Increment the quantity if the product is found
                    }
                });

                if (!found) {
                    // If the product was not found, add it to the cart with quantity 1
                    user.cart.push({
                        product: productdata[0],
                        quantity: 1
                    });
                }


            }


        }

        await user.save();
        // const carts=await User.findOne({name:req.session.user_name},{cart:1})
        const carts = await User.aggregate([
            { $match: { name: req.session.user_name } },
            {
                $unwind: "$cart"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "cart.product",
                    foreignField: "_id",
                    as: "cartProduct"

                }
            },
            {
                $unwind: "$cartProduct"
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    "cart.quantity":1,
                    "cartProduct._id": 1,
                    "cartProduct.productName": 1,
                    "cartProduct.imageUrl": 1,
                    "cartProduct.count": 1,
                    "cartProduct.amount": 1,
                }
            }
        ])



        res.render('cart', { List: carts })
    } catch (error) {
        console.log(error.message);
    }
}




const home = async (req, res) => {
    try {
        res.render('landing')
    } catch (error) {
        console.log(error.message);
    }
}




const login = async (req, res) => {
    try {

        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}




const insertUser = async (req, res) => {
    console.log(req.body);

    try {

        const user = new User({
            name: req.body.name,
            mobile: req.body.mno,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, 2),
            is_admin: 0,
            is_verified: 0,
        })

        const userData = await user.save();
        if (userData) {
            console.log(userData);
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('verification', { userId: userData._id });

        }
        else {
            res.render('login', { message: "Your registration has been failed." })

        }
    } catch (error) {
        console.log(error.message);
    }
}
//login verify
const verifyLogin = async (req, res) => {
    try {

        const check = await User.findOne({ email: req.body.email });
        //   console.log(check);
        const userData = await bcrypt.compare(req.body.password, check.password)
        //   console.log(userData);
        if (userData) {

            if (check.is_verify == 1) {
                req.session.user_name = check.name
                req.session._id = check._id
                res.cookie('user_name', check.name)
                console.log(check.name + " logged in");
                res.render('landing')
            } else {
                res.render('login', { message: "Email is not verified" })

            }
        } else {
            res.render('login', { message: "Email or password is incorrect" })

        }
    } catch (error) {
        res.render('login', { message: "Email or password is incorrect" })
    }

}
const sendVerifyMail = async (name, email, user_id) => {
    console.log(name);
    try {
        const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        // Convert the OTP to a string
        const otpString = otp.toString();

        //hash the otp
        const saltRound = 2;
        const hashOTP = await bcrypt.hash(otpString, saltRound);

        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: 'naseemam131@gmail.com',
                pass: 'qdengqdpeluoeewo'
            }
        });
        const mailOption = {
            from: 'naseemam131@gmail.com',
            to: email,
            subject: 'For verification mail',
            html: `Haii ` + name + ` Your OTP is: ${otp}`
        };


        const newOTPVerification = await new UserOTPVerification({
            userId: user_id,
            otp: hashOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        })
        //save otp record
        await newOTPVerification.save();
        transporter.sendMail(mailOption, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been send:- ", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}


const verifyMail = async (req, res) => {
    try {
        const userId = req.body.userId; // Get the user's ID from the request
        const enteredOTP = req.body.otp; // Get the entered OTP from the request

        // Find the OTP verification record for the user
        const otpRecord = await UserOTPVerification.findOne({ userId });

        if (!otpRecord) {
            return res.render('login', { message: "Invalid code passed. Check your inbox" });
        }

        // Check if the OTP has expired
        const now = new Date();
        if (now > otpRecord.expiresAt) {
            return res.render('login', { message: "The OTP has expired. Please request a new one." });
        }

        // Compare the entered OTP with the stored hashed OTP
        const isOTPValid = await bcrypt.compare(enteredOTP, otpRecord.otp);
        console.log(enteredOTP, otpRecord);

        if (isOTPValid) {
            // Update user's verification status
            await User.updateOne({ _id: userId }, { $set: { is_verify: 1 } });

            // Render success message or redirect to a success page
            res.render('login', { message: "Your registration has been successfully verified." });
        } else {
            res.render('login', { message: "Invalid code passed. Check your inbox" });
        }
    } catch (error) {
        console.log(error.message);
        res.render('login', { message: "An error occurred while verifying the OTP." });
    }
}
const product = async (req, res) => {
    try {
        console.log(req.query);
        const productdata = await Product.find({ _id: req.query.id })
        res.render('product', { List: productdata })

    } catch (error) {
        console.log(error.message);
    }
}

const profile = async (req, res) => {
    try {
        // console.log(  req.session.user_name);
        const check = await User.findOne({ _id: req.session._id });
        // console.log(check)
        res.render('profile', { profile: check })
    } catch (error) {
        console.log(error.message);
    }
}
const editProfile = async (req, res) => {
    console.log(req.session._id );
    try {
        // const user = new User({
        //     name: req.body.name,
        //     email: req.body.email,
        //     mobile:req.body.mobile
        // })
        const userData = await User.updateOne({ _id: req.session._id}, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile } });
        //  await User.save();
        if (userData) {
            console.log(userData);
            res.redirect('/profile')

        }
        else {
            res.render('profile', { message: "Your registration has been failed." })

        }
    } catch (error) {
        console.log(error.message);
    }
}
const addAddress = async (req, res) => {

    try {
        console.log(req.body);
        const productdata = await User.find({ _id: req.query.id })

        const hai = await User.updateOne({ _id: productdata }, {
            $push: {
                address: {
                    name: req.body.name,
                    place: req.body.place,
                    mobile: req.body.mobile,
                    district: req.body.district,
                    post: req.body.post,
                    state: req.body.state,

                }
            }
        });
        res.redirect('/profile')
    } catch (error) {
        console.log(error.message);
    }
}
const removeAddress = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ _id: req.session._id })
         console.log(id);
         console.log(user);
        const remove = await User.updateOne(
            { _id: user._id },
            { $pull: { address: { _id: id } } }
        );
            console.log(remove)
        if (remove) res.json()

    } catch (error) {
        console.log(error.message);
    }
}
const removeProduct = async (req, res) => {
    try {
        // console.log(req.query.id);
        const user = await User.findOne({ _id: req.session._id });
        const productId = req.query.id
        console.log(productId);
        const remove = await User.updateOne(
            { _id: user._id },
            { $pull: { cart: { product: productId } } }
        );
      
        if(remove)res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
        // Handle the error, maybe send an error response to the client
    }
}


const checkout=async(req,res)=>{
    try {
        res.render('checkout')
    } catch (error) {
        console.log(error.message);
    }
}
const addquantity=async(req,res)=>{
    try {
        const id = req.params.i;
        const user = await User.findOne({ _id: req.session._id })
        console.log(user);
        // const update = await User.updateOne(
        //     { _id: user._id },
        //     { $set: { cart: { quantity:id } } }
        // );
        //     console.log(update)
        // if (update) res.json()
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    landing,
    category,
    contact,
    home,
    login,
    insertUser,
    verifyLogin,
    sendVerifyMail,
    verifyMail,
    cart,
    product,
    profile,
    editProfile,
    addAddress,
    removeAddress,
    removeProduct,
    checkout,
    addquantity

}