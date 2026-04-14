const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name:            { type: String, required: true, unique: true },
  price:           { type: Number, required: true },
  durationDays:    { type: Number, required: true },
  discountPercent: { type: Number, required: true, min: 0, max: 100 },
  freePickups:     { type: Number, default: 0 },
  features:        [{ type: String }],
  active:          { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
