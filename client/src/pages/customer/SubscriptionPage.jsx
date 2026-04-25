import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiX, FiCheckCircle } from 'react-icons/fi';
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
    initiatePayment(plan);
  };

  const initiatePayment = async (plan) => {
    setSubscribing(true);
    try {
      // 1. Create order on backend
      const { data: order } = await api.post('/customer/razorpay/order', {
        amount: plan.price,
        receipt: `sub_${plan._id.slice(-10)}_${Date.now()}`
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Seykv3v4fWQhAc',
        amount: order.amount,
        currency: order.currency,
        name: "The Laundry Service",
        description: `Subscription: ${plan.name}`,
        order_id: order.id,
        handler: async (response) => {
          await verifyAndSubscribe(response, plan);
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => setSubscribing(false)
        },
        // Force UPI/GPay to show up prominently
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
      setSubscribing(false);
    }
  };

  const verifyAndSubscribe = async (paymentResponse, plan) => {
    try {
      // 1. Verify payment on backend
      const { data: verification } = await api.post('/customer/razorpay/verify', paymentResponse);

      if (verification.success) {
        // 2. Finalize subscription
        await api.post('/customer/subscriptions/subscribe', { planId: plan._id, isPaid: true });
        
        setPaymentSuccess(true);
        setShowPaymentModal(true); // Show success modal
        toast.success(`🎉 Payment for ${plan.name} successful!`);
        
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
          api.get('/customer/subscriptions').then(r => setPlans(r.data));
          api.get('/auth/me').then(r => setUserSub(r.data.activeSubscription));
          navigate('/customer/dashboard');
        }, 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setSubscribing(false);
    }
  };

  const confirmSubscription = async (isPaid) => {
    // This is now purely for reference if needed, but initiatePayment is the main path.
    // We could remove this if we are certain only Razorpay is allowed.
    setSubscribing(true);
    try {
      await api.post('/customer/subscriptions/subscribe', { planId: selectedPlan._id, isPaid });
      
      toast.success(`🎉 Subscribed to ${selectedPlan.name}!`);
      api.get('/customer/subscriptions').then(r => setPlans(r.data));
      api.get('/auth/me').then(r => setUserSub(r.data.activeSubscription));
      navigate('/customer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally { 
      setSubscribing(false); 
    }
  };

  // Helper to compare plan IDs
  const isCurrentPlan = (plan) => {
    if (!userSub) return false;
    const subPlanId = userSub.planId?._id || userSub.planId;
    return subPlanId === plan._id;
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
            {plans.map((plan, i) => {
              const active = isCurrentPlan(plan);
              return (
                <div key={plan._id} className={`plan-card ${i === 1 ? 'featured' : ''} ${active ? 'active' : ''}`}>
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
                  {active ? (
                    <div style={{ marginTop: '1rem' }}>
                      <button className="btn btn-success btn-full" disabled style={{ opacity: 1, cursor: 'default', marginBottom: '0.5rem' }}>
                        <FiCheckCircle style={{ marginRight: '0.5rem' }} /> Current Plan
                      </button>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Expires on: <strong>{new Date(userSub.endDate).toLocaleDateString()}</strong>
                      </p>
                    </div>
                  ) : (
                    <button
                      id={`subscribe-${plan._id}`}
                      className="btn btn-primary btn-full"
                      disabled={subscribing}
                      onClick={() => handleSubscribeClick(plan)}
                    >
                      {subscribing && selectedPlan?._id === plan._id ? 'Subscribing…' : (userSub ? 'Switch Plan' : 'Subscribe Now')}
                    </button>
                  )}
                </div>
              );
            })}
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Plan Price</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedPlan.price}</h3>
                </div>

                <div className="grid grid-1">
                  <button className="btn btn-primary btn-full" onClick={() => initiatePayment(selectedPlan)} disabled={subscribing}>
                    <FiCheckCircle style={{ marginRight: '0.5rem' }} /> Subscribe & Pay Now
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
