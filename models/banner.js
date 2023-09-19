const mongoose=require('mongoose')

const bannerSchema = new mongoose.Schema({

    image:String,

    offer:{
        type:String
    },
    title:{
        type:String
    }
})


module.exports= mongoose.model("banner",bannerSchema)