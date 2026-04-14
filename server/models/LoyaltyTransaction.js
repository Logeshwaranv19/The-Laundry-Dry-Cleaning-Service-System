const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  type:        { type: String, enum: ['earned', 'redeemed'], required: true },
  points:      { type: Number, required: true },
  description: { type: String, default: '' },
  balance:     { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyTransaction', loyaltySchema);
