const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pricing = require('./models/Pricing');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const items = [
      { fabricType: 'Cotton', serviceType: 'Wash', pricePerPiece: 40, description: 'Standard machine wash' },
      { fabricType: 'Cotton', serviceType: 'Iron', pricePerPiece: 15, description: 'Steam press' },
      { fabricType: 'Cotton', serviceType: 'Dry Clean', pricePerPiece: 80, description: 'Dry cleaning for cotton' },
      { fabricType: 'Silk', serviceType: 'Wash', pricePerPiece: 60, description: 'Gentle wash' },
      { fabricType: 'Silk', serviceType: 'Dry Clean', pricePerPiece: 150, description: 'Premium dry cleaning' },
      { fabricType: 'Silk', serviceType: 'Steam', pricePerPiece: 40, description: 'Delicate steam' },
      { fabricType: 'Wool', serviceType: 'Dry Clean', pricePerPiece: 180, description: 'Deep dry clean' },
      { fabricType: 'Wool', serviceType: 'Iron', pricePerPiece: 30, description: 'Wool press' },
      { fabricType: 'Denim', serviceType: 'Wash', pricePerPiece: 50, description: 'Heavy duty wash' },
      { fabricType: 'Denim', serviceType: 'Iron', pricePerPiece: 20, description: 'Jeans press' },
      { fabricType: 'Leather', serviceType: 'Dry Clean', pricePerPiece: 350, description: 'Special leather care' },
      { fabricType: 'Linen', serviceType: 'Dry Clean', pricePerPiece: 110, description: 'Linen treatment' },
      { fabricType: 'Polyester', serviceType: 'Wash', pricePerPiece: 35, description: 'Fast wash' },
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
