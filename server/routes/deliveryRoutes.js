const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAssignedOrders, updateDeliveryStatus, getDeliveryDashboard, deleteOrder } = require('../controllers/deliveryController');

router.use(protect, authorize('delivery'));

router.get('/dashboard', getDeliveryDashboard);
router.get('/assigned', getAssignedOrders);
router.put('/orders/:id/status', updateDeliveryStatus);
router.delete('/orders/:id', deleteOrder);

module.exports = router;
