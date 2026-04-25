const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const UserSubscription = require('../models/UserSubscription');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    console.log('Creating Razorpay order for amount:', amount);
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // amount in the smallest currency unit (paise)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order.id);
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Order Error Details:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order', error: error.message });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ message: "Payment verified successfully", success: true });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!", success: false });
    }
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

exports.payOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    order.paymentStatus = 'Paid';
    
    // Award loyalty points if not already awarded
    if (!order.loyaltyPointsAwarded && order.loyaltyPointsEarned > 0) {
      const User = require('../models/User');
      const LoyaltyTransaction = require('../models/LoyaltyTransaction');
      
      const customer = await User.findById(req.user._id);
      customer.loyaltyPoints += order.loyaltyPointsEarned;
      order.loyaltyPointsAwarded = true;

      await LoyaltyTransaction.create({
        userId: customer._id, orderId: order._id,
        type: 'earned', points: order.loyaltyPointsEarned,
        description: `Earned from paid order #${order._id}`,
        balance: customer.loyaltyPoints,
      });
      await customer.save();
    }

    await order.save();
    res.json({ message: 'Payment status updated to Paid', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
