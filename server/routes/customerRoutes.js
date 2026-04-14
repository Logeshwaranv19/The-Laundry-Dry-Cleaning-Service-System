const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  placeOrder, getMyOrders, getOrderById,
  getLoyalty,
  getSubscriptions, subscribe,
  fileComplaint, getMyComplaints
} = require('../controllers/customerController');

router.use(protect, authorize('customer'));

router.post('/orders', placeOrder);
router.get('/orders', getMyOrders);
router.get('/orders/:id', getOrderById);

router.get('/loyalty', getLoyalty);

router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions/subscribe', subscribe);

router.post('/complaints', upload.single('photo'), fileComplaint);
router.get('/complaints', getMyComplaints);

module.exports = router;
