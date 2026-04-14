const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pricing = require('./models/Pricing');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const items = [
      { fabricType: 'Cotton', serviceType: 'Wash', pricePerPiece: 40, description: 'Standard machine wash and fold' },
      { fabricType: 'Silk', serviceType: 'Dry Clean', pricePerPiece: 120, description: 'Gentle dry cleaning for delicate silk' },
      { fabricType: 'Wool', serviceType: 'Iron', pricePerPiece: 20, description: 'Professional steam ironing' }
    ];

    for (const item of items) {
      await Pricing.findOneAndUpdate(
        { fabricType: item.fabricType, serviceType: item.serviceType },
        item,
        { upsert: true }
      );
    }

    console.log('✅ Seeded initial pricing data successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
