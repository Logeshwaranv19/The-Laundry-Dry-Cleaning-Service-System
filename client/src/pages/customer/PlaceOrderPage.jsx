import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiX, FiCheckCircle } from 'react-icons/fi';

const FABRICS  = ['Cotton','Silk','Wool','Denim','Polyester','Linen','Leather'];
const SERVICES = ['Wash','Dry Clean','Iron','Steam','Premium Wash','Stain Removal'];

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const [pricing, setPricing]     = useState([]);
  const [loyalty, setLoyalty]     = useState(0);
  const [subscription, setSub]    = useState(null);
  const [items, setItems]         = useState([{ fabricType: 'Cotton', serviceType: 'Wash', quantity: 1 }]);
  const [pickupDate, setDate]     = useState('');
  const [pickupTime, setTime]     = useState('09:00');
  const [address, setAddress]     = useState('');
  const [ptsToUse, setPts]        = useState(0);
  const [loading, setLoading]     = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    api.get('/pricing').then(r => setPricing(r.data));
    api.get('/customer/loyalty').then(r => setLoyalty(r.data.balance));
    api.get('/auth/me').then(r => {
      if (r.data.activeSubscription && r.data.activeSubscription.active) {
        setSub(r.data.activeSubscription);
      }
    });
  }, []);

  const getPrice = (fabric, service) => {
    const p = pricing.find(x => x.fabricType === fabric && x.serviceType === service);
    return p ? p.pricePerPiece : 50;
  };

  const addItem = () => setItems([...items, { fabricType: 'Cotton', serviceType: 'Wash', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [key]: val };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, it) => sum + getPrice(it.fabricType, it.serviceType) * it.quantity, 0);
  
  // Calculate subscription discount
  let subscriptionDiscount = 0;
  if (subscription && subscription.planId) {
    subscriptionDiscount = Math.floor(subtotal * (subscription.planId.discountPercent || 0) / 100);
  }

  const loyaltyDiscount = Math.floor(Math.min(ptsToUse, loyalty) / 10);
  const total = Math.max(0, subtotal - subscriptionDiscount - loyaltyDiscount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) return toast.error('Please enter a pickup address');
    setShowPaymentModal(true);
  };

  const initiatePayment = async () => {
    setLoading(true);
    try {
      // 1. Create order on backend
      const { data: ord } = await api.post('/customer/razorpay/order', {
        amount: total,
        receipt: `ord_${Date.now()}`
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Seykv3v4fWQhAc',
        amount: ord.amount,
        currency: ord.currency,
        name: "The Laundry Service",
        description: "Laundry Order Payment",
        order_id: ord.id,
        handler: async (response) => {
          await verifyAndPlaceOrder(response);
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => setLoading(false)
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI / Google Pay',
                instruments: [{ method: 'upi' }]
              }
            },
            sequence: ['block.upi', 'card', 'netbanking', 'wallet']
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const verifyAndPlaceOrder = async (paymentResponse) => {
    try {
      // 1. Verify payment on backend
      const { data: verification } = await api.post('/customer/razorpay/verify', paymentResponse);

      if (verification.success) {
        // 2. Finalize order
        await api.post('/customer/orders', { items, pickupDate, pickupTime, address, loyaltyPointsToUse: ptsToUse, isPaid: true });
        
        setPaymentSuccess(true);
        toast.success('🎉 Payment successful!');
        
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
          navigate('/customer/orders');
        }, 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (isPaid) => {
    setLoading(true);
    try {
      await api.post('/customer/orders', { items, pickupDate, pickupTime, address, loyaltyPointsToUse: ptsToUse, isPaid });
      
      toast.success('🎉 Order placed successfully!');
      setShowPaymentModal(false);
      navigate('/customer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { 
      setLoading(false); 
    }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Place New Order</h1>
          <p className="page-subtitle">Schedule your laundry pickup</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            {/* Items Card */}
            <div>
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Laundry Items</h2>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addItem}><FiPlus /> Add Item</button>
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '0.75rem' }}>
                    <div className="grid grid-3" style={{ gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Fabric</label>
                        <select className="form-select" value={item.fabricType} onChange={e => updateItem(i, 'fabricType', e.target.value)}>
                          {FABRICS.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Service</label>
                        <select className="form-select" value={item.serviceType} onChange={e => updateItem(i, 'serviceType', e.target.value)}>
                          {SERVICES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Qty</label>
                        <input type="number" className="form-input" min={1} value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        ₹{getPrice(item.fabricType, item.serviceType)} × {item.quantity} = <strong style={{ color: 'var(--accent)' }}>₹{getPrice(item.fabricType, item.serviceType) * item.quantity}</strong>
                      </span>
                      {items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}><FiTrash2 /></button>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Loyalty */}
              {loyalty > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>🏆 Use Loyalty Points</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    Balance: <strong style={{ color: 'var(--warning)' }}>{loyalty} pts</strong> &nbsp;|&nbsp; 10 pts = ₹1 discount
                  </p>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Points to Use</label>
                    <input type="number" className="form-input" min={0} max={loyalty} value={ptsToUse}
                      onChange={e => setPts(Math.min(parseInt(e.target.value) || 0, loyalty))} />
                  </div>
                  {ptsToUse > 0 && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Save ₹{loyaltyDiscount} with {ptsToUse} points
                  </p>}
                </div>
              )}
            </div>

            {/* Pickup & Summary */}
            <div>
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Pickup Schedule</h2>
                <div className="form-group">
                  <label className="form-label">Pickup Date</label>
                  <input id="pickup-date" type="date" className="form-input" required min={minDate} value={pickupDate} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Time</label>
                  <select id="pickup-time" className="form-select" value={pickupTime} onChange={e => setTime(e.target.value)}>
                    {['07:00','08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00','19:00'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Address</label>
                  <textarea id="pickup-address" className="form-textarea" rows={3} required placeholder="Full address with landmark" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              {/* Summary */}
              <div className="card">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {subscriptionDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--success)' }}>Subscription Discount ({subscription.planId.discountPercent}%)</span>
                      <span style={{ color: 'var(--success)' }}>-₹{subscriptionDiscount}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--success)' }}>Loyalty Discount</span>
                      <span style={{ color: 'var(--success)' }}>-₹{loyaltyDiscount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--accent)' }}>₹{total}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  🏆 You will earn <strong style={{ color: 'var(--warning)' }}>{Math.floor(total / 10)} loyalty points</strong> on delivery!
                </p>
                <button id="place-order-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Placing Order…' : '✅ Confirm & Place Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            {paymentSuccess ? (
              <div style={{ padding: '2rem 0' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: 'var(--success)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.5rem',
                  fontSize: '2.5rem',
                  boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
                }}>
                  <FiCheckCircle />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Payment Completed!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Your payment of <strong>₹{total}</strong> for this order was successful.</p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>Redirecting to your orders...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Complete Payment</h2>
                  <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><FiX size={20} /></button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Amount to Pay</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{total}</h3>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => confirmOrder(false)} disabled={loading}>
                    Pay Later
                  </button>
                  <button className="btn btn-primary" onClick={initiatePayment} disabled={loading}>
                    <FiCheckCircle style={{ marginRight: '0.5rem' }} /> Pay Now
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Secure payment via Razorpay
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
