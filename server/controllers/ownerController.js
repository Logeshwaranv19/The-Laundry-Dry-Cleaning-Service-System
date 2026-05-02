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

    if (req.body.paymentStatus) {
      const oldPayment = order.paymentStatus;
      order.paymentStatus = req.body.paymentStatus;

      // Award loyalty if status changes to Paid
      if (oldPayment !== 'Paid' && order.paymentStatus === 'Paid' && !order.loyaltyPointsAwarded && order.loyaltyPointsEarned > 0) {
        const customer = await User.findById(order.customerId);
        if (customer) {
          customer.loyaltyPoints += order.loyaltyPointsEarned;
          order.loyaltyPointsAwarded = true;
          await customer.save();
          await LoyaltyTransaction.create({
            userId: customer._id, orderId: order._id,
            type: 'earned', points: order.loyaltyPointsEarned,
            description: `Earned from paid order #${order._id.toString().slice(-6)}`,
            balance: customer.loyaltyPoints,
          });
        }
      }
    }

    // Award loyalty on delivery (legacy/fallback if not paid yet)
    if (status === 'Delivered' && order.loyaltyPointsEarned > 0 && !order.loyaltyPointsAwarded && order.paymentStatus === 'Paid') {
       // Points already handled above if marked as Paid, but this ensures they get points on delivery if paid then
    }

    await order.save();
    res.json({ message: 'Order updated', order });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!['Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Only delivered or cancelled orders can be deleted from history' });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted from records' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteAllFinishedOrders = async (req, res) => {
  try {
    const result = await Order.deleteMany({ status: { $in: ['Delivered', 'Cancelled'] } });
    res.json({ message: `${result.deletedCount} orders deleted from records` });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDeliveryBoys = async (req, res) => {
  try {
    const boys = await User.find({ role: 'delivery' }).select('name email phone');
    res.json(boys);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createDeliveryBoy = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone)
      return res.status(400).json({ message: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role: 'delivery' });
    res.status(201).json({ message: 'Delivery staff created', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteDeliveryBoy = async (req, res) => {
  try {
    const boy = await User.findOneAndDelete({ _id: req.params.id, role: 'delivery' });
    if (!boy) return res.status(404).json({ message: 'Delivery staff not found' });
    res.json({ message: 'Delivery staff removed' });
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

exports.deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findByIdAndDelete(req.params.id);
    if (!pricing) return res.status(404).json({ message: 'Pricing not found' });
    res.json({ message: 'Pricing deleted successfully' });
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
