const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    category: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref:'categorymodel'
    },
    productName: {
        type: String,
        required: true
    },
    brandName: {
        type: String,
        required: true
    },
    imageUrl: [String]
    ,
    details: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);
