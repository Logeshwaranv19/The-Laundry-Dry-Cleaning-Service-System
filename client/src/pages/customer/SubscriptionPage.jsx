import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [userSub, setUserSub] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/customer/subscriptions').then(r => setPlans(r.data)),
      api.get('/auth/me').then(r => setUserSub(r.data.activeSubscription))
    ]).finally(() => setLoadingPlans(false));
  }, []);

  const handleSubscribeClick = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const confirmSubscription = async (isPaid) => {
    setSubscribing(true);
    try {
      await api.post('/customer/subscriptions/subscribe', { planId: selectedPlan._id, isPaid });
      
      if (isPaid) {
        setPaymentSuccess(true);
        toast.success(`🎉 Payment for ${selectedPlan.name} successful!`);
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
          api.get('/customer/subscriptions').then(r => setPlans(r.data));
          api.get('/auth/me').then(r => setUserSub(r.data.activeSubscription));
          navigate('/customer/dashboard');
        }, 2000);
      } else {
        toast.success(`🎉 Subscribed to ${selectedPlan.name}!`);
        setShowPaymentModal(false);
        api.get('/customer/subscriptions').then(r => setPlans(r.data));
        api.get('/auth/me').then(r => setUserSub(r.data.activeSubscription));
        navigate('/customer/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally { 
      setSubscribing(false); 
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Choose a plan and save on every order</p>
        </div>

        {loadingPlans ? <p style={{ color: 'var(--text-secondary)' }}>Loading plans…</p> : plans.length === 0 ? (
          <div className="card">
            <div className="empty-state"><div className="icon">📋</div><p>No subscription plans available yet. Check back soon!</p></div>
          </div>
        ) : (
          <div className="grid grid-3">
            {plans.map((plan, i) => (
              <div key={plan._id} className={`plan-card ${i === 1 ? 'featured' : ''}`}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>{plan.name}</div>
                <div className="plan-price">
                  <sup>₹</sup>{plan.price}<sub>/mo</sub>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                  {plan.durationDays} days &nbsp;|&nbsp; <span style={{ color: 'var(--success)', fontWeight: 600 }}>{plan.discountPercent}% off</span> every order
                </div>
                <ul className="plan-features">
                  {plan.freePickups > 0 && <li>{plan.freePickups} free pickups</li>}
                  {plan.features.map((f, fi) => <li key={fi}>{f}</li>)}
                </ul>
                {userSub && userSub.planId === plan._id ? (
                  <button className="btn btn-success btn-full" disabled style={{ opacity: 1, cursor: 'default' }}>
                    <FiCheckCircle style={{ marginRight: '0.5rem' }} /> Current Plan
                  </button>
                ) : (
                  <button
                    id={`subscribe-${plan._id}`}
                    className="btn btn-primary btn-full"
                    disabled={subscribing}
                    onClick={() => handleSubscribeClick(plan)}
                  >
                    {subscribing && selectedPlan?._id === plan._id ? 'Subscribing…' : 'Subscribe Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showPaymentModal && selectedPlan && (
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
                <p style={{ color: 'var(--text-secondary)' }}>Your payment of <strong>₹{selectedPlan.price}</strong> for the <strong>{selectedPlan.name}</strong> was successful.</p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>Taking you to your dashboard...</p>
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
                      value={`upi://pay?pa=logeshwaranv19@oksbi&pn=LOGESHWARAN%20V&am=${selectedPlan.price.toFixed(2)}&cu=INR&tn=Subscription%3A%20${selectedPlan.name}`}
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Plan Price</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedPlan.price}</h3>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => confirmSubscription(false)} disabled={subscribing}>
                    Pay Later
                  </button>
                  <button className="btn btn-primary" onClick={() => confirmSubscription(true)} disabled={subscribing}>
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
    </div>
  );
}
