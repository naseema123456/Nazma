const mongoose = require('mongoose');
const order = mongoose.Schema({
    user: {
        type: String,
        ref:'users'
    },
    orderNumber:{ type: String},
    products: [{
        product: {
            type: String,
            ref: 'product'
        },
        quantity: {
            type: Number
        },
        amount: {
            type: Number
        },
        offer:{
            status:{
                type:Boolean,
                default:false
            },
            price:{
                type:Number
            }
        }
    }],
    orderdate: {
        type: Date
    },
    payement: {
        type: String
    },
    orderstatus: {
        type:String,
        default:"pending"
},  
    orderaddress: {
        name: { type: String },
        place: { type: String },
        mobile: { type: Number },
        district: { type: String },
        post: { type: String },
        state: { type: String },
    },
    totalprice: {
        type: Number
    },
    paymentstatus:{
        type:String,
        default:"pending"
    }
})
module.exports = mongoose.model('order', order)