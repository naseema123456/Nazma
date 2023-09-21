const User=require("../models/usermodel")
const Product=require("../models/productmodel")

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

const productSearch = async (req, res, next) => {
  try {
    const searchTerm = req.query.product;

    // Check if searchTerm exists and is a string before using it
    if (typeof searchTerm === 'string') {
      // Use regex to perform a case-insensitive search on the productName field
      const searchResults = await Product.find({
        productName: { $regex: searchTerm, $options: 'i' }
      });

      req.searchResults = searchResults; // Attach the search results to the request object
    } else {
      // Handle the case when searchTerm is not a string or undefined
      req.searchResults = [];
    }

    next(); // Move on to the next middleware or route
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = productSearch;

module.exports={
    isLogin,
    isLogout,
    productSearch
  
}