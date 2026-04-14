const Order = require('../models/Order');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Pricing = require('../models/Pricing');
const Subscription = require('../models/Subscription');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');

// ─── Orders ──────────────────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email phone')
      .populate('deliveryBoyId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryBoyId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status) order.status = status;
    if (deliveryBoyId) order.deliveryBoyId = deliveryBoyId;

    // Award loyalty on delivery
    if (status === 'Delivered' && order.loyaltyPointsEarned > 0) {
      const customer = await User.findById(order.customerId);
      if (customer) {
        customer.loyaltyPoints += order.loyaltyPointsEarned;
        await customer.save();
        await LoyaltyTransaction.create({
          userId: customer._id, orderId: order._id,
          type: 'earned', points: order.loyaltyPointsEarned,
          description: `Earned for order delivered`,
          balance: customer.loyaltyPoints,
        });
      }
    }

    await order.save();
    res.json({ message: 'Order updated', order });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDeliveryBoys = async (req, res) => {
  try {
    const boys = await User.find({ role: 'delivery' }).select('name email phone');
    res.json(boys);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Pricing ─────────────────────────────────────────────────────────────────
exports.createOrUpdatePricing = async (req, res) => {
  try {
    const { fabricType, serviceType, pricePerPiece, description } = req.body;
    const pricing = await Pricing.findOneAndUpdate(
      { fabricType, serviceType },
      { pricePerPiece, description },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Pricing saved', pricing });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.find().sort({ fabricType: 1, serviceType: 1 });
    res.json(pricing);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Complaints ──────────────────────────────────────────────────────────────
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('customerId', 'name email')
      .populate('orderId', 'status totalAmount')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { status, ownerNote } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, ownerNote, resolvedAt: status === 'Resolved' ? new Date() : null },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint updated', complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Subscriptions ───────────────────────────────────────────────────────────
exports.createSubscription = async (req, res) => {
  try {
    const { name, price, durationDays, discountPercent, freePickups, features } = req.body;
    const plan = await Subscription.create({ name, price, durationDays, discountPercent, freePickups, features });
    res.status(201).json({ message: 'Plan created', plan });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const plans = await Subscription.find().sort({ price: 1 });
    res.json(plans);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateSubscription = async (req, res) => {
  try {
    const plan = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan updated', plan });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Stats ───────────────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const delivered = await Order.countDocuments({ status: 'Delivered' });
    const revenue = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const openComplaints = await Complaint.countDocuments({ status: 'Open' });
    const customers = await User.countDocuments({ role: 'customer' });
    res.json({
      totalOrders, delivered,
      revenue: revenue[0]?.total || 0,
      openComplaints, customers
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
