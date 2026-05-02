const Order = require('../models/Order');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const User = require('../models/User');

exports.getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoyId: req.user._id })
      .populate('customerId', 'name phone address')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Picked Up', 'Out for Delivery', 'Delivered'];
    
    const order = await Order.findOne({ _id: req.params.id, deliveryBoyId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found or not assigned to you' });

    if (!allowedStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status for delivery update' });
    
    if (order.status === 'Cancelled' || order.status === 'Delivered') {
      return res.status(400).json({ message: `Cannot update status of a ${order.status} order` });
    }

    order.status = status;

    // Award loyalty points on delivery (only if not already awarded during placement)
    if (status === 'Delivered' && order.loyaltyPointsEarned > 0 && !order.loyaltyPointsAwarded) {
      const customer = await User.findById(order.customerId);
      if (customer) {
        customer.loyaltyPoints += order.loyaltyPointsEarned;
        await customer.save();
        await LoyaltyTransaction.create({
          userId: customer._id, orderId: order._id,
          type: 'earned', points: order.loyaltyPointsEarned,
          description: 'Order delivered successfully',
          balance: customer.loyaltyPoints,
        });
      }
    }

    await order.save();
    res.json({ message: `Status updated to ${status}`, order });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDeliveryDashboard = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const deliveryBoyId = new mongoose.Types.ObjectId(req.user._id);
    console.log('Fetching dashboard for delivery boy:', deliveryBoyId);

    const stats = await Order.aggregate([
      { $match: { deliveryBoyId: deliveryBoyId } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
          activeTasks: { $sum: { $cond: [{ $nin: ['$status', ['Delivered', 'Cancelled']] }, 1, 0] } },
          totalValue: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, '$totalAmount', 0] } }
        }
      }
    ]);
    console.log('Aggregation result:', stats);

    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = await Order.countDocuments({
      deliveryBoyId: deliveryBoyId,
      status: 'Delivered',
      updatedAt: { $gte: new Date(today) }
    });
    console.log('Today completed:', todayCompleted);

    const recentTasks = await Order.find({ deliveryBoyId: deliveryBoyId })
      .populate('customerId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);
    console.log('Recent tasks count:', recentTasks.length);

    res.json({
      totalDeliveries: stats[0]?.totalDeliveries || 0,
      activeTasks: stats[0]?.activeTasks || 0,
      totalValue: stats[0]?.totalValue || 0,
      todayCompleted,
      recentTasks
    });
  } catch (err) {
    console.error('CRITICAL Delivery Dashboard Error:', err);
    res.status(500).json({ message: err.message });
  }
};
