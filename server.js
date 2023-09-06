const express = require("express");
const app= express();
const session = require("express-session");
const nodemailer = require("nodemailer");
// const PORT=process.env.PORT||5000;

const mongoose = require("mongoose");
const dotenv = require("dotenv").config()
mongoose.connect(process.env.MongoDB_Link).then(()=>console.log("connected")).catch((error)=> console.log(error.message))


app.use(express.static('public'));
const config = require("./config/config")

const PORT=process.env.PORT||4000
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

const errorRouter=require("./router/errorRouter")
app.use('/*',errorRouter)

app.listen(PORT, () => { console.log(`Server started on : http://localhost:${PORT}`) });