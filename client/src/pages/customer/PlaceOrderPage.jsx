import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiX, FiCheckCircle, FiMinus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

import { FABRICS, SERVICES } from '../../constants';

import { QRCodeSVG } from 'qrcode.react';

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pricing, setPricing]     = useState([]);
  const [loyalty, setLoyalty]     = useState(0);
  const [subscription, setSub]    = useState(null);
  const [items, setItems]         = useState([{ fabricType: FABRICS[0], serviceType: SERVICES[0], quantity: 1 }]);
  const [pickupDate, setDate]     = useState('');
  const [pickupTime, setTime]     = useState('09:00');
  const [address, setAddress]     = useState('');
  const [ptsToUse, setPts]        = useState(0);
  const [loading, setLoading]     = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatesModal, setShowRatesModal]     = useState(false);
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
    return p ? p.pricePerPiece : null;
  };

  const addItem = () => setItems([...items, { fabricType: FABRICS[0], serviceType: SERVICES[0], quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, key, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [key]: val };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, it) => {
    const price = getPrice(it.fabricType, it.serviceType);
    return sum + (price || 50) * it.quantity;
  }, 0);
  
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

  const confirmOrder = async (isPaid) => {
    setLoading(true);
    try {
      await api.post('/customer/orders', { items, pickupDate, pickupTime, address, loyaltyPointsToUse: ptsToUse, isPaid });
      
      if (isPaid) {
        setPaymentSuccess(true);
        toast.success('🎉 Payment successful!');
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
          navigate('/customer/orders');
        }, 3000);
      } else {
        toast.success('🎉 Order placed successfully!');
        setShowPaymentModal(false);
        navigate('/customer/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { 
      setLoading(false); 
    }
  };


  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <Layout>
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
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={addItem}><FiPlus /> Add Item</button>
                  </div>
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
                        <div style={{ display:'flex', alignItems:'center', background:'var(--bg-card)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', overflow:'hidden', width:'fit-content' }}>
                          <button type="button" style={{ border:'none', background:'none', padding:'0.5rem 0.75rem', cursor:'pointer', color:'var(--text-secondary)' }} 
                            onClick={() => updateItem(i, 'quantity', Math.max(1, item.quantity - 1))}><FiMinus size={14}/></button>
                          <input type="number" value={item.quantity} 
                            style={{ width:'40px', border:'none', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)', textAlign:'center', fontWeight:700, background:'transparent', color:'var(--text-primary)', outline:'none', padding:'0.25rem 0' }}
                            onChange={e => updateItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))} />
                          <button type="button" style={{ border:'none', background:'none', padding:'0.5rem 0.75rem', cursor:'pointer', color:'var(--text-secondary)' }} 
                            onClick={() => updateItem(i, 'quantity', item.quantity + 1)}><FiPlus size={14}/></button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {getPrice(item.fabricType, item.serviceType) ? (
                          <>₹{getPrice(item.fabricType, item.serviceType)} × {item.quantity} = <strong style={{ color: 'var(--accent)' }}>₹{getPrice(item.fabricType, item.serviceType) * item.quantity}</strong></>
                        ) : (
                          <span style={{ color:'var(--warning)', fontWeight:600 }}>⚠️ Price not set (Defaulting to ₹50)</span>
                        )}
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
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', background:'var(--bg-card)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', overflow:'hidden', width:'fit-content' }}>
                        <button type="button" style={{ border:'none', background:'none', padding:'0.5rem 0.75rem', cursor:'pointer', color:'var(--text-secondary)' }} 
                          onClick={() => setPts(prev => Math.max(0, prev - 10))}><FiMinus size={14}/></button>
                        <input type="number" value={ptsToUse} 
                          style={{ width:'60px', border:'none', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)', textAlign:'center', fontWeight:700, background:'transparent', color:'var(--text-primary)', outline:'none', padding:'0.25rem 0' }}
                          onChange={e => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            setPts(Math.min(Math.max(0, val || 0), loyalty));
                          }} />
                        <button type="button" style={{ border:'none', background:'none', padding:'0.5rem 0.75rem', cursor:'pointer', color:'var(--text-secondary)' }} 
                          onClick={() => setPts(prev => Math.min(loyalty, prev + 10))}><FiPlus size={14}/></button>
                      </div>
                      <button type="button" className="btn btn-outline btn-sm" style={{ whiteSpace:'nowrap', height:'40px' }} onClick={() => setPts(loyalty)}>Use All</button>
                    </div>
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
                  <input id="pickup-time" type="time" className="form-input" required value={pickupTime} onChange={e => setTime(e.target.value)} />
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

                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 0 0 1px #eee' }}>
                    <QRCodeSVG 
                      value={`upi://pay?pa=logeshwaranv19@oksbi&pn=LOGESHWARAN%20V&am=${total.toFixed(2)}&cu=INR&tn=Order%20Payment`}
                      size={220}
                      level="H"
                      includeMargin={true}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '0.5rem', width: '100%', marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>UPI ID</p>
                    <p style={{ fontWeight: 600, color: 'var(--accent)' }}>logeshwaranv19@oksbi</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Amount to Pay</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{total}</h3>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => confirmOrder(false)} disabled={loading}>
                    Pay Later
                  </button>
                  <button className="btn btn-primary" onClick={() => confirmOrder(true)} disabled={loading}>
                    <FiCheckCircle style={{ marginRight: '0.5rem' }} /> I've Paid
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
