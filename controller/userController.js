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
const Coupon = require('../models/coupen')
const banner=require('../models/banner')




const landing = async (req, res) => {
    try {
        const userId=req.session._id
        const user=await User.findOne({_id:userId})
        const ban=await banner.find();
        res.render('landing',{banner:ban,user:user||false})
    } catch (error) {
        console.log(error.message);
    }
}



// const category = async (req, res) => {
//     try {

//         console.log(req.query);

//      const page = parseInt(req.query.page) || 1; 
//     const perPage = 8; 
//     const skip = (page - 1) * perPage;

 
//         const categories = await Category.find();
//         let products = await Product.find()
//         .skip(skip)
//         .limit(perPage)
//         .exec(); 

//         const totalProducts = await Product.countDocuments();
//         const totalPages = Math.ceil(totalProducts / perPage);
//   // Load male and female categories
//   // const totalPages =parseInt(Math.ceil( totalCount/ perPage)); 
  
//   const currentPage = page; // Set current page
 

//         let user = await User.findOne({ _id: req.session._id });
//         const categoryFilter = req.query.category;
//         const amount=req.query.amount
//         if(req.query.amount){
//             const filterValue = req.query.amount; // Get the selected filter value as a string, e.g., "0,99"
//             const [minAmount, maxAmount] = filterValue.split(',').map(Number); // Split and convert to numbers
//             console.log(minAmount,maxAmount);

        
//         if (!isNaN(minAmount) && !isNaN(maxAmount)) {
//             // Filter products with a price within the specified range
//             products = products.filter(product => product.amount >= minAmount && product.amount <= maxAmount);
//         }
//     }

        
//         if (categoryFilter) {
//             // Filter products by category
//             // const catObjectId = new mongoose.Types.ObjectId(categoryFilter);
//             products = products.filter(products => products.category == categoryFilter);
//         }
     
//         res.render('categories', {
//             List: categories,
//             product: products,
//             totalPages,
//             currentPage,user:user||false,
      
//         });
//     } catch (error) {
//         console.log(error.message);
//     }
// };


const category = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 8;
        const skip = (page - 1) * perPage;

        const searchTerm = req.query.product;
        const categoryFilter = req.query.category;
        const amount = req.query.amount;

        const categories = await Category.find();
        let products;
        let selected="";
        let selectedamount;
        let selectedcategory;


        // Fetch all products or filter them based on search and amount criteria
        if (!categoryFilter) {
            products = await Product.find()
                .skip(skip)
                .limit(perPage)
                .exec();
        } else {
            products = await Product.find({ category: categoryFilter });
          const name=await  Category.findOne({ _id: categoryFilter}, { categoryName: 1, _id: 0 });console.log(name.categoryName);
            selectedcategory=name.categoryName;

        }

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / perPage);
        const currentPage = page;

        let user = await User.findOne({ _id: req.session._id });

        // Search Products
        if (typeof searchTerm === 'string') {
            const searchResults = await Product.find({
                productName: { $regex: searchTerm, $options: 'i' }
            });
            products = searchResults;
            selected=searchTerm;
        }

        // Filter by Amount
        if (amount) {
            const filterValue = amount;
            const [minAmount, maxAmount] = filterValue.split(',').map(Number);

            if (!isNaN(minAmount) && !isNaN(maxAmount)) {
                products = products.filter(product => product.amount >= minAmount && product.amount <= maxAmount);
                selectedamount=amount;
            }
        }

        res.render('categories', {
            List: categories,
            product: products,
            totalPages,
            currentPage,
            user: user || false,
            selected,selectedamount,selectedcategory
        });
    } catch (error) {
        console.log(error.message);
    }
};


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
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const codeLength = 8;
        let referralCode = '';

        for (let i = 0; i < codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            referralCode += characters.charAt(randomIndex);
        }

        const user = new User({
            name: req.body.name,
            mobile: req.body.mno,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, 2),
            is_admin: 0,
            is_verified: 0,
            refferel:referralCode
        })

        const userData = await user.save();
        
        if (userData) {
           if(req.body.referralCode){
           const a= await User.updateOne({ refferel:req.body.referralCode}, { $inc: { "wallet.balance": 100 } } ,{upsert:true}) 
           await User.updateOne({ refferel:req.body.referralCode}, { $push: { "wallet.transactions":{amount:100, type: "referral"}} }) 
           console.log(a);
        }
            // console.log(userData);
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

        const user = await User.findOne({ email: req.body.email });
        //   console.log(user);
        const userData = await bcrypt.compare(req.body.password, user.password)
        //   console.log(userData);
        if (userData) {

            if (user.is_verify == 1) {
                req.session.user_name = user.name
                req.session._id = user._id
                res.cookie('user_name', user.name)
                console.log(user.name + " logged in");
                res.redirect('/landing')
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
            await User.updateOne({ _id: userId }, {  $inc: { 'wallet.balance': 100 } },{upsert:true}); 
            await User.updateOne({  _id: userId }, { $push: { "wallet.transactions":{amount:100 ,type:"initial" }} })  
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


const resend_Otp = async (req,res) => {
 
   try {
    
    res.send(200).json({respons:"ok"})

   } catch (error) {
    
   }
}



const product = async (req, res) => {
    try {
        // console.log(req.query);
        const userId=req.session._id
        const user=await User.findOne({_id:userId})
        const productdata = await Product.find({ _id: req.query.id })
        res.render('product', { List: productdata,user:user||false })

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
        const cart = await User.findOne(
            { _id: req.session._id, 'cart.product': req.query.id },
            { 'cart.$': 1 } // Use the $ projection to return only the matched cart item
          );
          
          if (cart && cart.cart && cart.cart.length > 0) {
            const quantity = cart.cart[0].quantity;console.log(quantity);
        // console.log(check);
        if (check) res.render('checkout', { profile: check, List: productdata,quantity:quantity })}
    } catch (error) {
        console.log(error.message);
    }
}
const addquantity = async (req, res) => {
    try {
   
        const productId = req.body.id;
        const action=req.body.action;
        const user=await User.findOne({_id:req.session._id})
        const cartItems = user.cart.find((item) => item.product.toString() === productId)
        console.log(cartItems);
        if(action=='increase'){

            const update = await User.updateOne(
                { _id: req.session._id, 'cart.product': req.body.id },
                {
                    $inc: {
                        'cart.$.quantity': 1,
                    }
    
                }
            );
    
            if (update) res.json()
        }else if(action=='decrease' && cartItems.quantity > 1){
            const update = await User.updateOne(
                { _id: req.session._id, 'cart.product': req.body.id },
                {
                    $inc: {
                        'cart.$.quantity':- 1,
                    }
    
                }
            );
    
            if (update) res.json()
    }else{

}



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
            res.redirect('/landing')
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
        const wallet=req.body.wallet

        console.log(req.body.payment_method);

        const user = await User.findOne({ _id: req.session._id })
        const product = await Product.findOne({ _id: productId });
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
                products: [{ product: product.productName, quantity: 1, amount: product.amount }],
                orderdate: Date.now(),
                payement: req.body.payment_method,
                orderaddress: selectedAddress,
                totalprice: product.amount,
                paymentstatus: "pending",
            })

            await Order.save();
            if (product && product.count >= 1) {
                // Subtract the ordered quantity from the product's stock
                product.count -= 1;

                // Save the updated product back to the database
                await product.save();
            }
            const user = await User.updateOne({ _id: req.session._id }, {
                $unset: { cart: { _id: productId } }
            })
            console.log(Order);
            res.json({ codSuccess: true })
            //   await res.render('success')
            // console.log("hi");
        }else if(req.body.payment_method == 'wallet'){
            const Order = await new order({
                user: user.name,
                orderNumber: result,
                products: [{ product: product.productName, quantity: 1, amount: product.amount }],
                orderdate: Date.now(),
                payement: req.body.payment_method,
                orderaddress: selectedAddress,
                totalprice: product.amount,
                paymentstatus: "success",
            })

            await Order.save();
            console.log("Wotking wallettttttttttttttt");
            const isupdated = await  User.updateOne({ _id:req.session._id }, {  $inc: { 'wallet.balance':-(product.amount)} },{upsert:true}); 
            await User.updateOne(
                { _id: req.session._id },
                {
                  $push: {
                    "wallet.transactions": {
                      amount: product.amount,
                      Description: "debit" ,
                      type: "purchase"// Replace with your actual description
                    }
                  }
                }
              );;
            if (product && product.count >= 1) {
                // Subtract the ordered quantity from the product's stock
                product.count -= 1;

                // Save the updated product back to the database
                await product.save();
            }
            const a = await User.updateOne({ _id: req.session._id }, {
                $unset: { cart: { _id: productId } }
            })
            console.log(Order);
            res.json({ codSuccess: true })

        }

        else {
    

            const Orderdata = {
                user: user.name,
                orderNumber: result,
                products: [{ product: product.productName, quantity: 1 }],
                orderdate: Date.now(),
                payement: req.body.payment_method,
                orderaddress: selectedAddress,
                totalprice:product.amount,
                paymentstatus: "pending",
            }

            req.session.orderdata = Orderdata

            // console.log(product.amount, product.id);
            var instance = new Razorpay({ key_id: process.env.id, key_secret: process.env.secret })

            instance.orders.create({
                amount:product.amount,
                currency: "INR",
                receipt: product._id,



            }); console.log('hi');
            res.status(200).send({
                razorSuccess: true,
                amount:product.amount * 100, id: process.env.id,
            })

            // res.json({id,amount})

        }
    } catch (error) {
        console.log(error.message);
    }
}

const search = async (req, res) => {
    try {
        const categories = await Category.find()
        let products = await Product.find();
        const product = req.body.product;
console.log(req.body);
        if (product) {
            products = await Product.find({productName:product})
            // products.filter(product => product.category == category);
        }
console.log(products);
        // Render the 'categories' view with the filtered products
        res.render('categories', {
            product: products,
            List:categories,
        });
    } catch (error) {
        console.log(error.message);
    }
};

const cancelOrder = async (req, res) => {
    try {
        console.log(req.query.id);

        // Retrieve order data
        const orderdata = await order.findOne({ _id: req.query.id }); // Assuming you want to find a single order by ID
        if (!orderdata) {
            return res.status(404).send("Order not found");
        }

        // Update order status
        const updatedOrder = await order.updateOne({ _id: req.query.id }, { $set: { orderstatus: "cancel" } });

        if (orderdata.payment === "RazorPay") {
            // Update user wallet balance
            await User.updateOne(
                { _id: req.session._id },
                { $inc: { 'wallet.balance': orderdata.totalprice } },
                { upsert: true }
            );

            // Add transaction record to user's wallet
            await User.updateOne(
                { _id: req.session._id },
                { $push: { "wallet.transactions": { amount: orderdata.totalprice, type: 'credit' ,
                type: "cancel order", } } }
            );
        }

        res.redirect('/orderManagement');
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error"); // Send an error response to the client
    }
};

const returns = async (req, res) => {
    try {
        console.log(req.query);
        console.log('hi');

        // Find a single order by ID
        const orderdata = await order.findOne({ _id: req.query.id });

        if (!orderdata) {
            return res.status(404).send("Order not found");
        }

        // Update order status
        const updatedOrder = await order.updateOne({ _id: req.query.id }, { $set: { orderstatus: "return" } });

        // Assuming orderdata.totalprice is the price of this single order
        const amount=parseInt(orderdata.totalprice)
        // Update user wallet balance
        await User.updateOne(
            { _id: req.session._id },
            { $inc: { 'wallet.balance': amount } },
            { upsert: true }
        );

        // Add transaction record to user's wallet
        await User.updateOne(
            { _id: req.session._id },
            { $push: { "wallet.transactions": { amount: amount,type: 'credit' ,
            type: "return order"} } }
        );

        res.redirect('/orderManagement');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

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
        if (product && product.count >= 1) {
            // Subtract the ordered quantity from the product's stock
            product.count -= 1;

            // Save the updated product back to the database
            await product.save();
            res.status(200).json({ success: true })
        } else {
            res.status(200).json({ success: false })
        }
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
const faiure = async (req, res) => {
    try {

        res.render('failure');
    } catch (error) {
        console.log(error.message);
    }
}
const wishList = async (req, res) => {
    try {
       
        const user = req.session._id
        const wish = await User.findOne({ _id: user }).populate("wishList")


        res.render('wishList', { List: wish.wishList })

    } catch (error) {
        console.log(error.message);
    }
}
const removeWish = async (req, res) => {
    try {
        console.log(req.body.id);
        const removeWish = await User.updateOne(
            { _id: req.session._id },
            {
                $pull: { wishList: req.body.id }
            }
        );
        if (removeWish) res.json()
    } catch (error) {
        console.log(error.message);
    }
}

const applyCoupon = async (req, res) => {
    const total = req.body.total

    try {
        // Check if the coupon code exists in the database
        const coupon = await Coupon.findOne({ code: req.body.couponCode }); console.log(coupon);

        if (coupon) {
            // Check if the coupon has expired
            const currentDate = new Date();
            if (currentDate > coupon.expiryDate) {
                res.json({ success: false, message: 'Coupon has expired' });
                return;
            }
            if (
                (coupon.minAmount && total < coupon.minAmount) ||
                (coupon.maxAmount && total > coupon.maxAmount)
            ) {
                res.json({
                    success: false,
                    message: 'Coupon cannot be applied. Purchase amount does not meet the criteria.',
                });
                return;
            }

            console.log(total)


            const discount = coupon.discountAmount;
            let discountedPrice;

            if (coupon.type === "OFF") {
                const discounted = total * (discount / 100);
                discountedPrice = Math.floor(total - discounted);
            } else if (coupon.type === "FLAT") {
                discountedPrice = total - discount;
            }
            console.log(discountedPrice);
            // Respond with the discounted price
            res.json({ success: true, discountedPrice, message: 'Coupon added' });

        }
        else {
            res.json({ success: false, message: 'Coupon limit exceeded' });
        }




    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
const invoice=async(req,res)=>{
    try {
        // console.log(req.query.id);
        const orders = await order.findOne({ _id: req.query.id})
        
        console.log(orders)
        res.render('invoice',{orders})
    } catch (error) {
        console.log(error.message);
    }
}
const wallet=async(req,res)=>{
    try {
        const user = await User.findOne({ _id: req.session._id });console.log(user.wallet);
        res.render('wallet',{user:user.wallet})
    } catch (error) {
        console.log(error.message);
    }
}


const applywallet=(req,res)=>{
    try {
        const total = req.body.total

        console.log(req.body);
    } catch (error) {
        console.log(error.message);
    }
}
const userLogout=async(req,res)=>{
    try{ 
        req.session.destroy();
        res.clearCookie('_id');
        // res.render('/',{message:"Logout Successfuly!!!!...."})
        res.redirect('/')

    }catch(error){
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
    resend_Otp,
    editAddress,
    orderManagement,
    confirmorder,
    search,
    cancelOrder,
    returns,
    addwish,
    verifyPayment,
    success,
    wishList,
    removeWish,
    applyCoupon,
    faiure,
    invoice,
    wallet,
 
    applywallet,
    userLogout

}