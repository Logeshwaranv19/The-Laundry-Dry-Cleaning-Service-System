const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllOrders, updateOrderStatus, getDeliveryBoys, createDeliveryBoy, deleteDeliveryBoy,
  createOrUpdatePricing, getPricing, deletePricing,
  getAllComplaints, resolveComplaint,
  createSubscription, getSubscriptions, updateSubscription,
  getDashboardStats
} = require('../controllers/ownerController');

router.use(protect, authorize('owner'));

router.get('/dashboard', getDashboardStats);

router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrderStatus);
router.get('/delivery-boys', getDeliveryBoys);
router.post('/delivery-boys', createDeliveryBoy);
router.delete('/delivery-boys/:id', deleteDeliveryBoy);

router.post('/pricing', createOrUpdatePricing);
router.get('/pricing', getPricing);
router.delete('/pricing/:id', deletePricing);

router.get('/complaints', getAllComplaints);
router.put('/complaints/:id', resolveComplaint);

router.post('/subscriptions', createSubscription);
router.get('/subscriptions', getSubscriptions);
router.put('/subscriptions/:id', updateSubscription);

module.exports = router;
