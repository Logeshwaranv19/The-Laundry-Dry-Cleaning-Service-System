import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { FiPackage, FiStar, FiCreditCard, FiAlertCircle, FiPlusCircle, FiArrowRight } from 'react-icons/fi';

const statusColor = {
  'Placed': 'badge-blue', 'Picked Up': 'badge-purple', 'Processing': 'badge-yellow',
  'Ready': 'badge-teal', 'Out for Delivery': 'badge-yellow', 'Delivered': 'badge-green', 'Cancelled': 'badge-red'
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loyalty, setLoyalty] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      api.get('/customer/orders').then(r => setOrders(r.data)),
      api.get('/customer/loyalty').then(r => setLoyalty(r.data.balance)),
    ]).finally(() => setLoading(false));
  }, []);

  const active = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">Welcome back, <span className="gradient-text">{user?.name}!</span> 👋</h1>
          <p className="page-subtitle">Here's what's happening with your laundry today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(79,156,249,0.15)' }}><FiPackage style={{ color: 'var(--accent)' }} /></div>
            <div>
              <div className="card-title">Active Orders</div>
              <div className="card-value">{loading ? '–' : active.length}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(46,213,115,0.15)' }}><FiPackage style={{ color: 'var(--success)' }} /></div>
            <div>
              <div className="card-title">Total Orders</div>
              <div className="card-value">{loading ? '–' : orders.length}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,184,56,0.15)' }}><FiStar style={{ color: 'var(--warning)' }} /></div>
            <div>
              <div className="card-title">Loyalty Points</div>
              <div className="card-value">{loading ? '–' : loyalty}</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(0,212,180,0.15)' }}><FiCreditCard style={{ color: 'var(--teal)' }} /></div>
            <div>
              <div className="card-title">Plan Status</div>
              <div className="card-value" style={{ fontSize: '1rem', color: 'var(--teal)' }}>
                {user?.activeSubscription ? 'Active' : 'Free'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2.5rem 0 1rem', color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-4" style={{ marginBottom: '2.5rem' }}>
          <Link to="/customer/place-order" className="card" style={{ textAlign:'center', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div className="stat-icon" style={{ background:'#eff6ff', marginBottom:'1rem', color:'#2563eb' }}><FiPlusCircle /></div>
            <div style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'1.05rem' }}>Place Order</div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginTop:'0.25rem' }}>Schedule a pickup</div>
          </Link>
          <Link to="/customer/orders" className="card" style={{ textAlign:'center', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div className="stat-icon" style={{ background:'#f0fdfa', marginBottom:'1rem', color:'#0d9488' }}><FiPackage /></div>
            <div style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'1.05rem' }}>My Orders</div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginTop:'0.25rem' }}>Track your laundry</div>
          </Link>
          <Link to="/customer/loyalty" className="card" style={{ textAlign:'center', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div className="stat-icon" style={{ background:'#fffbeb', marginBottom:'1rem', color:'#d97706' }}><FiStar /></div>
            <div style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'1.05rem' }}>Loyalty</div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginTop:'0.25rem' }}>View your points</div>
          </Link>
          <Link to="/customer/complaint" className="card" style={{ textAlign:'center', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div className="stat-icon" style={{ background:'#fef2f2', marginBottom:'1rem', color:'#dc2626' }}><FiAlertCircle /></div>
            <div style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'1.05rem' }}>Support</div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginTop:'0.25rem' }}>File a complaint</div>
          </Link>
        </div>


        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Orders</h2>
            <Link to="/customer/orders" className="btn btn-outline btn-sm">View All <FiArrowRight /></Link>
          </div>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : orders.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <p>No orders yet. Place your first order!</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Items</th><th>Pickup</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{o._id.slice(-8).toUpperCase()}</td>
                      <td>{o.items.length} item(s)</td>
                      <td>{o.pickupDate} {o.pickupTime}</td>
                      <td style={{ fontWeight: 600 }}>₹{o.totalAmount}</td>
                      <td>
                        <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td><span className={`badge ${statusColor[o.status] || 'badge-blue'}`}>{o.status}</span></td>
                      <td><Link to={`/customer/orders/${o._id}`} className="btn btn-outline btn-sm">Track</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    );
  }
