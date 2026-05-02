const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  fabricType:  { type: String, required: true },
  serviceType: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true },
  totalPrice:  { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:        [orderItemSchema],
  pickupDate:   { type: String, required: true },
  pickupTime:   { type: String, required: true },
  address:      { type: String, required: true },
  status: {
    type: String,
    enum: ['Placed', 'Picked Up', 'Processing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  deliveryBoyId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalAmount:        { type: Number, required: true },
  discountAmount:     { type: Number, default: 0 },
  loyaltyPointsUsed:  { type: Number, default: 0 },
  loyaltyPointsEarned:{ type: Number, default: 0 },
  subscriptionDiscount:{ type: Number, default: 0 },
  loyaltyPointsAwarded:{ type: Boolean, default: false },
  paymentStatus:      { type: String, enum:['Pending','Paid','Verification Required'], default:'Pending' },
  notes:              { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
