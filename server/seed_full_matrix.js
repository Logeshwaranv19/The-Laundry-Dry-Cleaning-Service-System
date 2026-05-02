const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pricing = require('./models/Pricing');

dotenv.config();

const FABRICS = [
  'Cotton', 'Silk', 'Wool', 'Denim', 'Polyester', 'Linen', 
  'Leather', 'Chiffon', 'Velvet', 'Satin', 'Nylon'
];

const SERVICES = [
  'Wash', 'Dry Clean', 'Iron', 'Steam', 'Premium Wash', 
  'Stain Removal', 'Deep Clean', 'Polishing', 'Whiting'
];

const FABRIC_MULT = {
  'Cotton': 1.0, 'Polyester': 0.9, 'Nylon': 1.0, 'Linen': 1.2, 
  'Denim': 1.3, 'Chiffon': 1.5, 'Satin': 1.6, 'Velvet': 1.7, 
  'Wool': 1.8, 'Silk': 2.0, 'Leather': 4.0
};

const SERVICE_MULT = {
  'Iron': 0.4, 'Steam': 0.6, 'Wash': 1.0, 'Whiting': 1.1, 
  'Stain Removal': 1.3, 'Premium Wash': 1.6, 'Deep Clean': 2.0, 
  'Dry Clean': 2.5, 'Polishing': 3.5
};

const BASE_PRICE = 50;

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB for full matrix seeding...');
    
    let count = 0;
    const items = [];

    for (const f of FABRICS) {
      for (const s of SERVICES) {
        const multF = FABRIC_MULT[f] || 1.0;
        const multS = SERVICE_MULT[s] || 1.0;
        
        // Calculate a logical price, rounded to nearest 5
        let price = Math.round((BASE_PRICE * multF * multS) / 5) * 5;
        
        // Ensure a minimum price
        if (price < 20) price = 20;

        items.push({
          fabricType: f,
          serviceType: s,
          pricePerPiece: price,
          description: `${s} service for ${f} fabric items.`
        });
      }
    }

    // Use bulk write or loop for upsert
    for (const item of items) {
      await Pricing.findOneAndUpdate(
        { fabricType: item.fabricType, serviceType: item.serviceType },
        item,
        { upsert: true }
      );
      count++;
    }

    console.log(`✅ Success! Seeded ${count} pricing combinations.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedAll();
