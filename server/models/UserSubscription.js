const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date, required: true },
  active:    { type: Boolean, default: true },
  usedPickups: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Verification Required'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
