const express = require("express");
const app= express();
const session = require("express-session");
const nodemailer = require("nodemailer");

const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/NAZMA").then(()=>console.log("connected")).catch((error)=> console.log(error.message))

app.use(express.static('public'));

const config = require("./config/config")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set("Cache-control", "no-store,no-cache");
    next();
  });
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
}));

const userRouter=require("./router/userRouter")
app.use('/',userRouter)

const adminRouter=require("./router/adminRouter")
app.use('/admin',adminRouter)

app.listen(3000, () => { console.log("Server started on : http://localhost:3000") });