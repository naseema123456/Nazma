const User=require("../models/usermodel")


const isLogin=async(req,res,next)=>{
    try{

        if(req.session.user_name){
            const activeuser=await User.findOne({$and:[{_id:req.session._id},{is_blocked:true}]})
            if(activeuser){
                return res.render('login',{message:'User blocked by admin'})
            }
            next();
        }else{
            res.clearCookie();
            res.redirect('/login');
            res.json({result:"false"})
        }
     
     
    }catch(error){
        console.log(error.message);
    }
}
const isLogout=async(req,res,next)=>{
    try{
        if(req.session.user_name && req.session.is_blocked===false){
            res.redirect('/landing');
        }
        next();

    }catch(error){
        console.log(error.message);
    }
}

module.exports={
    isLogin,
    isLogout,
  
}