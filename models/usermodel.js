const mongoose = require("mongoose");

const userSchema = mongoose.Schema({

    name: {
        type: String,
        require: true
    },


    mobile: {
        type: String,
        require: true
    },

    email: {
        type: String,
        require: true,
        unique:true,
    },
    password: {
        type: String,
        require: true
    },
    refferel: { type: String },
    is_admin: {
        type: Number,
        require: true
    },
    is_verify: {
        type: Number,
        default: 0
    },
    is_blocked: {
        type: Boolean,
        default: 0
    },
    address: [{
        name: {
            type: String,

        },
        place: {
            type: String,

        },
        mobile: {
            type: Number,

        },
        district: {
            type: String,

        },
        post: {
            type: String,

        },
        state: {
            type: String,

        },
    }],
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
        }
    ],
    wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    wallet: {
        balance: {
            type: Number,
            default: 0,
        },
        transactions: [{
            date: {
                type: Date,
                default: Date.now(),
            },
            type: {
                type: String,
               
            },
            Description: {
                type: String,
                default: "credit"
            },
            amount: {
                type: Number,
            },


        }],
    }
}, { timestamps: true });



module.exports = mongoose.model('user', userSchema);


