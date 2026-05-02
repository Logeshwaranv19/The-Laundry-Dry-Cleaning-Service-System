import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { FiCheck, FiClock, FiTruck } from 'react-icons/fi';

const STEPS = ['Placed','Picked Up','Processing','Ready','Out for Delivery','Delivered'];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customer/orders/${id}`).then(r => { setOrder(r.data); setLoading(false); });
  }, [id]);

  if (loading) return <Layout><p style={{ color: 'var(--text-secondary)' }}>Loading order details…</p></Layout>;
  if (!order) return <Layout><p>Order not found</p></Layout>;

  const currentIdx = STEPS.indexOf(order.status);

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">Order Tracking</h1>
          <p className="page-subtitle">Order #{order._id.slice(-8).toUpperCase()}</p>
        </div>

        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          {/* Tracking Steps */}
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Live Status</h2>
            <div className="tracking-steps">
              {STEPS.map((step, i) => {
                const done   = i < currentIdx || order.status === 'Delivered';
                const active = i === currentIdx && order.status !== 'Delivered';
                const icon   = done ? <FiCheck /> : active ? <FiTruck /> : <FiClock />;
                return (
                  <div key={step} className="step">
                    <div className="step-icon-wrap">
                      <div className={`step-icon ${done ? 'done' : active ? 'active' : ''}`}>{icon}</div>
                      {i < STEPS.length - 1 && <div className={`step-line ${done ? 'done' : ''}`} />}
                    </div>
                    <div className="step-content">
                      <div className="step-title" style={{ color: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--text-secondary)' }}>{step}</div>
                      {active && <div className="step-date">Currently at this stage</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details */}
          <div>
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Order Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Pickup Date</span><span>{order.pickupDate}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Pickup Time</span><span>{order.pickupTime}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Address</span><span style={{ textAlign: 'right', maxWidth: '55%' }}>{order.address}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Total Amount</span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{order.totalAmount}</span></div>
                {order.loyaltyPointsEarned > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Points Earned</span><span style={{ color: 'var(--warning)' }}>🏆 {order.loyaltyPointsEarned}</span></div>}
                {order.deliveryBoyId && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Delivery Agent</span><span>🚴 {order.deliveryBoyId.name}</span></div>}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="card">
              <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Items</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Fabric</th><th>Service</th><th>Qty</th><th>Price</th></tr></thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={i}>
                        <td><span className="badge badge-purple">{item.fabricType}</span></td>
                        <td>{item.serviceType}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
