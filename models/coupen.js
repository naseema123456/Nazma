const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: null, // Unlimited usage if null
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  minimumPurchaseAmount: {
    type: Number,
    default: 0,
  },
  productRestrictions: [String], // Array of product IDs or categories
  userRestrictions: [String],   // Array of user IDs or restrictions
  isActive: {
    type: Boolean,
    default: true,
  },
  description: String,
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
