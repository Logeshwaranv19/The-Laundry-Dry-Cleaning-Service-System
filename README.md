# Laundry — Smart Dry Cleaning & Laundry Management System

Laundry is a modern, mobile-responsive web application designed to streamline the operations of a laundry and dry cleaning business. It provides a seamless experience for customers, owners, and delivery staff.

## 🚀 Features

### For Customers
- **Mobile-Responsive Interface**: A premium, mobile-first design for easy use on any device.
- **Easy Ordering**: Simple multi-item order placement with fabric and service selection.
- **Live Order Tracking**: Track the status of your laundry from pickup to delivery.
- **Subscription Plans**: Save money with tiered subscription packages (Gold, Silver, etc.).
- **Loyalty Program**: Earn points on every order and redeem them for discounts.
- **Secure UPI Payments**: Manual UPI payment flow via QR code generation.
- **Quality Complaints**: File and track quality-related complaints with photo evidence.

### For Owners
- **Comprehensive Dashboard**: Overview of total orders, revenue, customers, and active complaints.
- **Order Management**: Update order statuses and assign delivery personnel.
- **Delivery Staff Control**: Securely create and manage delivery staff accounts.
- **Pricing Manager**: Set fabric-wise and service-wise pricing dynamically.
- **Subscription Manager**: Create and toggle tiered membership plans.
- **Complaint Resolution**: Review customer feedback and provide official responses.

### For Delivery Staff
- **Assigned Tasks**: View all assigned pickups and final deliveries.
- **Quick Status Updates**: Mark orders as Picked Up, Out for Delivery, or Delivered.
- **Navigation Info**: Access customer contact and address details easily.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router, Axios, React Hot Toast, React Icons, QRCode.react.
- **Backend**: Node.js, Express, JWT Authentication, Multer (File Uploads).
- **Database**: MongoDB (Mongoose).
- **Styling**: Vanilla CSS (Mobile-first grid system).

## 📦 Installation & Setup

### Prerequisites
- Node.js installed
- MongoDB installed (Local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/Logeshwaranv19/The-Laundry-Dry-Cleaning-Service-System.git
cd The-Laundry-Dry-Cleaning-Service-System
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
```
Run the server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
Run the development server:
```bash
npm run dev
```

## 🔐 Default Credentials (Owner)
- **Email**: `owner@gmail.com`
- **Password**: `Owner@2026`

## 📄 License
This project is for educational purposes as part of a Full Stack Development course.
