const express = require("express");
const app = express()
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config()


const User = require('../models/usermodel');
const Category = require('../models/categorymodel')
const Product = require('../models/productmodel')
const UserOTPVerification = require('../models/userOTPVerification')
const order = require('../models/order');
const Razorpay = require('razorpay');





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
            // console.log('hi');
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
                    "cart.quantity": 1,
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
                user: process.env.auth_email,
                pass: process.env.auth_pass,
            }
        });
        const mailOption = {
            from: 'naseemam131@gmail.com',
            to: email,
            subject: 'For verification mail',
            html: `Haii ` + name + ` Your OTP is: ${otp}`
        };
        await UserOTPVerification.deleteOne({ userId: user_id })

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
        // console.log(enteredOTP, otpRecord);

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
    console.log(req.session._id);
    try {

        const userData = await User.updateOne({ _id: req.session._id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile } });
        //  await User.save();
        if (userData) {
            // console.log(userData);
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
        // console.log(req.body);
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
        //  console.log(id);
        //  console.log(user);
        const remove = await User.updateOne(
            { _id: user._id },
            { $pull: { address: { _id: id } } }
        );
        // console.log(remove)
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
        // console.log(productId);
        const remove = await User.updateOne(
            { _id: user._id },
            { $pull: { cart: { product: productId } } }
        );

        if (remove) res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
        // Handle the error, maybe send an error response to the client
    }
}


const checkout = async (req, res) => {
    try {
        console.log(req.query);
        const productdata = await Product.find({ _id: req.query.id })
        const check = await User.findOne({ _id: req.session._id });
        // console.log(check);
        if (check) res.render('checkout', { profile: check, List: productdata })
    } catch (error) {
        console.log(error.message);
    }
}
const addquantity = async (req, res) => {
    try {
        console.log(req.body);
        const id = req.body.id;
        const update = await User.updateOne(
            { _id: req.session._id, 'cart.product': req.body.id },
            {
                $inc: {
                    'cart.$.quantity': 1,
                }

            }
        );

        if (update) res.json()

    } catch (error) {
        console.log(error.message);
    }
}


const otplogin = async (req, res) => {
    try {
        res.render('otplogin')
    } catch (error) {
        console.log(error.message);
    }
}
const requestotp = async (req, res) => {
    try {
        //   console.log(req.body.email);
        const email = req.body.email;
        const Match = await User.findOne({ email });
        const name = await Match.name;
        const userId = await Match._id
        if (!Match) { // find exisitng user or not
            return res.render('otpLogin', {
                message: 'No user found with provided email',
            })
        };
        sendVerifyMail(name, email, userId);

        res.render('otpLogin', {
            message: "OTP send to Email", userId
        })
    }

    catch (error) {
        console.log(error.message);
    }
}
const otpverify = async (req, res) => {
    try {
        const useremail = req.body.email; // Get the user's ID from the request
        const userId = await User.findOne({ email: useremail }, { name: 1 })
        const enteredOTP = req.body.otp; // Get the entered OTP from the request
        // console.log(userId._id);
        // Find the OTP verification record for the user
        const otpRecord = await UserOTPVerification.findOne({ userId: userId._id });
        // console.log(otpRecord)
        if (!otpRecord) {
            return res.render('otplogin', { message: "Invalid code passed. Check your inbox 11" });
        }

        // Check if the OTP has expired
        const now = new Date();
        if (now > otpRecord.expiresAt) {
            return res.render('otplogin', { message: "The OTP has expired. Please request a new one." });
        }

        // Compare the entered OTP with the stored hashed OTP
        const isOTPValid = await bcrypt.compare(enteredOTP, otpRecord.otp);
        // console.log(enteredOTP, otpRecord);

        if (isOTPValid) {
            // Update user's verification status
            const check = await User.updateOne({ _id: userId }, { $set: { is_verify: 1 } });

            // Render success message or redirect to a success page
            req.session.user_name = check.name
            req.session._id = check._id
            res.cookie('user_name', check.name)
            console.log(check.name + " logged in");
            res.render('landing')
        } else {
            res.render('otplogin', { message: "Invalid code passed. Check your inbox" });
        }

    } catch (error) {
        console.log(error.message);
        res.render('otplogin', { message: "An error occurred while verifying the OTP." });
    }
}

const editAddress = async (req, res) => {
    try {
        const addressId = (req.query.id);
        //  console.log(req.session._id);

        const { name, place, mobile, district, post, state } = req.body
        const userData = await User.updateOne({ "address._id": addressId }, { $set: { 'address.$.name': name, 'address.$.place': place, 'address.$.mobile': mobile, ' address.$.district': district, 'address.$.post': post, 'address.$.state': state } });
        //  await User.save();
        if (userData) {
            // console.log(userData);
            res.redirect('/profile')

        }
        else {
            res.render('profile', { message: "Your registration has been failed." })

        }
    } catch (error) {
        console.log(error.message);
    }
}
const orderManagement = async (req, res) => {
    try {
        // console.log(req.query);
        // const productdata = await Product.find({ _id: req.query.id })
        // const check = await User.findOne({ _id: req.session._id });
        // console.log(check);
        // res.render('orderManagement',{profile:check,List:productdata})
        const orders = await order.find({ user: req.session.user_name })
        res.render('orderManagement', { List: orders })
    } catch (error) {
        console.log(error.message);
    }
}
const confirmorder = async (req, res) => {
    try {

        function generateRandomString(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = '';

            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                result += characters[randomIndex];
            }

            return result;
        }

        function generateRandomDigits(length) {
            let result = '';

            for (let i = 0; i < length; i++) {
                const randomDigit = Math.floor(Math.random() * 10);
                result += randomDigit;
            }

            return result;
        }

        const letters = generateRandomString(2);
        const digits = generateRandomDigits(4);

        const result = `${letters}${digits}`;
        ; // Output: Something like "RA0449"


        const productId = req.body.productId;
        const addressId = req.body.addressId;

        console.log(req.body.payment_method);

        const user = await User.findOne({ _id: req.session._id })
        const product = await Product.findOne({ _id: productId })
        const addres = await User.findOne(
            { _id: req.session._id },
            { address: { $elemMatch: { _id: req.body.selectedAddress } } }
        );

        // console.log(product);
        const selectedAddress = addres.address[0];

        if (req.body.payment_method == 'COD') {
            const Order = await new order({
                user: user.name,
                orderNumber: result,
                products: [{ product: product.productName, quantity: 1 }],
                orderdate: Date.now(),
                payement: req.body.payment_method,
                orderaddress: selectedAddress,
                totalprice: product.amount,
                paymentstatus: "pending",
            })

            await Order.save();
            const a = await User.updateOne({ _id: req.session._id }, {
                $unset: { cart: { _id: productId } }
            })
            console.log(Order);
            res.json({ codSuccess: true })
            //   await res.render('success')
            console.log("hi");
        }
        else {


            const Orderdata = {
                user: user.name,
                orderNumber: result,
                products: [{ product: product.productName, quantity: 1 }],
                orderdate: Date.now(),
                payement: req.body.payment_method,
                orderaddress: selectedAddress,
                totalprice: product.amount,
                paymentstatus: "pending",
            }

            req.session.orderdata = Orderdata

            console.log(product.amount, product.id);
            var instance = new Razorpay({ key_id: 'rzp_test_SjV1e91e6tjlz9', key_secret: 'L2LBZfROmXevVTyzHeMBQms2' })

            instance.orders.create({
                amount: product.amount,
                currency: "INR",
                receipt: product._id,



            }); console.log('hi');
            res.status(200).send({
                razorSuccess: true,
                amount: product.amount * 100, id: 'rzp_test_SjV1e91e6tjlz9'
            })

            // res.json({id,amount})

        }
    } catch (error) {
        console.log(error.message);
    }
}

// const search=async(req,res)=>{
//     try {
//         // const categories = await Category.find()
//         // let products = await Product.find()
//         // console.log(req.query.category);
//         // const category = await Category.find({categoryName:req.query.category})

//        const  product = await Product.find({category:category._id});
//         console.log(product);
//         res.render('categories', {
//             List: category,
//             product: product,

//         })
//     } catch (error) {
//         console.log(error.message);
//     }
// }
const cancelOrder = async (req, res) => {
    try {
        console.log(req.query.id);

        const orders = await order.updateOne({ _id: req.query.id }, { $set: { orderstatus: "cancel" } })
        res.redirect('/orderManagement')
    } catch (error) {
        console.log(error.message);
    }
}
const refund = async (req, res) => {
    try {
        const orders = await order.updateOne({ _id: req.query.id }, { $set: { orderstatus: "refund" } })
        res.redirect('/orderManagement')
    } catch (error) {
        console.log(error.message);
    }
}
const addwish = async (req, res) => {
    try {
        // console.log("reached");
        // console.log(req.body);
        const user = await User.findOne({ _id: req.session._id });
        // console.log(user);
        if (user) {
            const updateData = await User.updateOne(
                {
                  _id: req.session._id,
                  'wishList.product': { $ne: req.body.id } // Check if req.body.id is not in the wishList.product array
                },
                {
                  $addToSet: { 'wishList': req.body.id }
                },
                { upsert: true }
              );
                console.log(updateData);
                res.json()
            // }
        // }
    }
    
 } catch (error) {
    console.log(error.message);
}
}
const verifyPayment = async (req, res) => {
    try {

        let orderdata = req.session.orderdata
        const Order = await new order({
            user: orderdata.user.name,
            orderNumber: orderdata.result,
            products: [{ product: orderdata.products.product, quantity: 1 }],
            orderdate: Date.now(),
            payement: orderdata.payment_method,
            orderaddress: orderdata.orderaddress,
            totalprice: orderdata.totalprice,
            paymentstatus: "success",
        })

        await Order.save();
        res.status(200).json({ success: true })
        // res.render('succes');
    } catch (error) {
        console.log(error.message);
    }
}
const success = async (req, res) => {
    try {

        res.render('success');
    } catch (error) {
        console.log(error.message);
    }
}
const wishList= async (req, res) => {
    try {
        // const wishListData = await User.find({ _id: req.session._id },{wishList:{product:1}});
        // let wish = []
        // if (wishListData && wishListData.wishList) {
        //     for (let i = 0; i < wishListData.wishList.length; i++) {
        //         let data = await Product.find(
        //             { _id: wishListData.wishList[i] },
        //             {
        //                 productName: 1,
        //                 amount: 1,
        //                 imageUrl: 1,
        //                 details: 1
        //             }
        //         );
        //         wish.push(data);
        //     }}
        // console.log(wishListData.wishList);


        const user = req.session._id
        const  wish = await User.findOne({_id:user}).populate("wishList")
       

        res.render('wishList', { List: wish.wishList })
        
    } catch (error) {
        console.log(error.message);
    }
}
const removeWish=async (req,res)=>{
    try {
        console.log(req.body.id);
        const removeWish = await User.updateOne(
            { _id: req.session._id },
            {
              $pull: { wishList: req.body.id }
            }
          );
          if(removeWish)res.json()
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    landing,
    category,
    contact,
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
    addquantity,
    otplogin,
    requestotp,
    otpverify,
    editAddress,
    orderManagement,
    confirmorder,
    // search
    cancelOrder,
    refund,
    addwish,
    verifyPayment,
    success,
    wishList,
    removeWish

}