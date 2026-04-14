const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  photoUrl:    { type: String, default: '' },
  status:      { type: String, enum: ['Open', 'In Review', 'Resolved', 'Rejected'], default: 'Open' },
  ownerNote:   { type: String, default: '' },
  resolvedAt:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
