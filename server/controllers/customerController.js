const Order = require('../models/Order');
const Pricing = require('../models/Pricing');
const User = require('../models/User');
const UserSubscription = require('../models/UserSubscription');
const Subscription = require('../models/Subscription');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Complaint = require('../models/Complaint');

// ─── Place Order ────────────────────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const { items, pickupDate, pickupTime, address, loyaltyPointsToUse, notes } = req.body;
    if (!items || !items.length || !pickupDate || !pickupTime || !address)
      return res.status(400).json({ message: 'Missing required fields' });

    // Enrich & calculate prices
    let totalAmount = 0;
    const enrichedItems = [];
    for (const item of items) {
      const pricing = await Pricing.findOne({ fabricType: item.fabricType, serviceType: item.serviceType });
      const unitPrice = pricing ? pricing.pricePerPiece : item.unitPrice || 50;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;
      enrichedItems.push({ ...item, unitPrice, totalPrice });
    }

    // Subscription discount
    const customer = await User.findById(req.user._id).populate('activeSubscription');
    let subscriptionDiscount = 0;
    if (customer.activeSubscription && customer.activeSubscription.active) {
      const plan = await Subscription.findById(customer.activeSubscription.planId);
      if (plan) subscriptionDiscount = Math.floor(totalAmount * plan.discountPercent / 100);
    }

    // Loyalty points redemption (100 pts = ₹10)
    let loyaltyDiscount = 0;
    let ptsUsed = 0;
    if (loyaltyPointsToUse && loyaltyPointsToUse > 0) {
      ptsUsed = Math.min(loyaltyPointsToUse, customer.loyaltyPoints);
      loyaltyDiscount = Math.floor(ptsUsed / 10); // 10pts = ₹1
    }

    const finalAmount = Math.max(0, totalAmount - subscriptionDiscount - loyaltyDiscount);
    const pointsEarned = Math.floor(finalAmount / 5); // ₹5 = 1 point (Increased ratio)

    const order = await Order.create({
      customerId: req.user._id,
      items: enrichedItems,
      pickupDate, pickupTime,
      address: address || customer.address,
      totalAmount: finalAmount,
      discountAmount: subscriptionDiscount + loyaltyDiscount,
      loyaltyPointsUsed: ptsUsed,
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsAwarded: req.body.isPaid && pointsEarned > 0,
      subscriptionDiscount,
      paymentStatus: req.body.isPaid ? 'Paid' : 'Pending',
      notes: notes || '',
    });

    // If paid upfront, award loyalty points immediately
    if (req.body.isPaid && pointsEarned > 0) {
      customer.loyaltyPoints += pointsEarned;
      await LoyaltyTransaction.create({
        userId: customer._id, orderId: order._id,
        type: 'earned', points: pointsEarned,
        description: `Earned from paid order #${order._id}`,
        balance: customer.loyaltyPoints,
      });
      await customer.save();
    }

    // Deduct loyalty points used
    if (ptsUsed > 0) {
      customer.loyaltyPoints -= ptsUsed;
      await LoyaltyTransaction.create({
        userId: customer._id, orderId: order._id,
        type: 'redeemed', points: ptsUsed,
        description: `Redeemed for order #${order._id}`,
        balance: customer.loyaltyPoints,
      });
      await customer.save();
    }

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get My Orders ──────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('deliveryBoyId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Get Order By ID ─────────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customerId: req.user._id })
      .populate('deliveryBoyId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Loyalty ─────────────────────────────────────────────────────────────────
exports.getLoyalty = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loyaltyPoints name');
    const history = await LoyaltyTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ balance: user.loyaltyPoints, history });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Subscriptions ───────────────────────────────────────────────────────────
exports.getSubscriptions = async (req, res) => {
  try {
    const plans = await Subscription.find({ active: true });
    res.json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.subscribe = async (req, res) => {
  try {
    const plan = await Subscription.findById(req.body.planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const endDate = new Date(Date.now() + plan.durationDays * 86400000);
    const pointsEarned = Math.floor(plan.price / 5); // ₹5 = 1 point
    const userSub = await UserSubscription.create({
      userId: req.user._id, planId: plan._id, endDate, active: true,
      paymentStatus: req.body.isPaid ? 'Paid' : 'Pending'
    });

    const user = await User.findById(req.user._id);
    user.activeSubscription = userSub._id;
    
    // Award loyalty points for subscription
    if (pointsEarned > 0) {
      user.loyaltyPoints += pointsEarned;
      await LoyaltyTransaction.create({
        userId: user._id,
        type: 'earned', points: pointsEarned,
        description: `Subscribed to ${plan.name}`,
        balance: user.loyaltyPoints,
      });
    }
    await user.save();
    res.status(201).json({ message: `Subscribed to ${plan.name}`, subscription: userSub });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Complaints ──────────────────────────────────────────────────────────────
exports.fileComplaint = async (req, res) => {
  try {
    const { orderId, description } = req.body;
    const order = await Order.findOne({ _id: orderId, customerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const complaint = await Complaint.create({
      orderId, customerId: req.user._id, description, photoUrl
    });
    res.status(201).json({ message: 'Complaint filed', complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ customerId: req.user._id })
      .populate('orderId', 'status createdAt')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Pay Order (Mark as Paid) ────────────────────────────────────────────────
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
