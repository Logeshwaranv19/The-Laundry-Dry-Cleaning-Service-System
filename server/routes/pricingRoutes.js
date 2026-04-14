const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');

// Public pricing list
router.get('/', async (req, res) => {
  try {
    const pricing = await Pricing.find().sort({ fabricType: 1, serviceType: 1 });
    res.json(pricing);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
