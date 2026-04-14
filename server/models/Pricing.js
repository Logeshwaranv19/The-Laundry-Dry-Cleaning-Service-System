const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  fabricType:  { type: String, required: true },
  serviceType: { type: String, required: true },
  pricePerPiece: { type: Number, required: true },
  description: { type: String, default: '' },
}, { timestamps: true });

pricingSchema.index({ fabricType: 1, serviceType: 1 }, { unique: true });

module.exports = mongoose.model('Pricing', pricingSchema);
