const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://the-laundry-dry-cleaning-service-sy.vercel.app'
  ], 
  credentials: true 
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/owner', require('./routes/ownerRoutes'));
app.use('/api/delivery', require('./routes/deliveryRoutes'));
app.use('/api/pricing', require('./routes/pricingRoutes'));

const connectDB = async () => {
  try {
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected (Atlas)');
  } catch (err) {
    console.error('⚠️ Atlas connection failed:', err.message);
    console.log('Trying local MongoDB...');
    try {
      
      await mongoose.connect('mongodb://127.0.0.1:27017/laundry');
      console.log('✅ MongoDB Connected (Local - 127.0.0.1)');
    } catch (localErr1) {
      try {
      
        await mongoose.connect('mongodb://localhost:27017/laundry');
        console.log('✅ MongoDB Connected (Local - localhost)');
      } catch (localErr2) {
        console.error('⚠️ Both Atlas and Local MongoDB connections failed. Starting In-Memory DB...');
        try {
         
          const { MongoMemoryServer } = require('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          const uri = mongod.getUri();
          await mongoose.connect(uri);
          console.log('✅ MongoDB Connected (In-Memory - Zero-Config)');
          console.log('💡 Note: This is temporary. Start your local MongoDB service to use Compass!');
        } catch (memErr) {
          console.error('❌ All MongoDB connection attempts failed.');
          console.error('Error:', memErr.message);
          process.exit(1);
        }
      }
    }
  }
};

connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
  );
});
