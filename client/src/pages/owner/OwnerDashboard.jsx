import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { FiPackage, FiDollarSign, FiUsers, FiAlertCircle } from 'react-icons/fi';

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/owner/dashboard').then(r => setStats(r.data)),
      api.get('/owner/orders').then(r => setOrders(r.data.slice(0, 5))),
    ]).finally(() => setLoading(false));
  }, []);

  const statusColor = {
    'Placed':'badge-blue','Picked Up':'badge-purple','Processing':'badge-yellow',
    'Ready':'badge-teal','Out for Delivery':'badge-yellow','Delivered':'badge-green','Cancelled':'badge-red'
  };

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">Owner <span className="gradient-text">Dashboard</span></h1>
          <p className="page-subtitle">Overview of your laundry business operations</p>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff' }}><FiPackage style={{ color: '#2563eb' }} /></div>
            <div><div className="card-title">Total Orders</div><div className="card-value">{loading ? '–' : stats?.totalOrders}</div></div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#ecfdf5' }}><FiDollarSign style={{ color: '#059669' }} /></div>
            <div><div className="card-title">Total Revenue</div><div className="card-value" style={{ fontSize: '1.4rem' }}>₹{loading ? '–' : stats?.revenue.toLocaleString()}</div></div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#f0fdfa' }}><FiUsers style={{ color: '#0d9488' }} /></div>
            <div><div className="card-title">Customers</div><div className="card-value">{loading ? '–' : stats?.customers}</div></div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: '#fef2f2' }}><FiAlertCircle style={{ color: '#dc2626' }} /></div>
            <div><div className="card-title">Open Complaints</div><div className="card-value">{loading ? '–' : stats?.openComplaints}</div></div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Orders</h2>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Pickup</th><th>Payment</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{o._id.slice(-8).toUpperCase()}</td>
                      <td>{o.customerId?.name || 'N/A'}</td>
                      <td>{o.items.length}</td>
                      <td><strong>₹{o.totalAmount}</strong></td>
                      <td>{o.pickupDate} {o.pickupTime}</td>
                      <td>
                        <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td><span className={`badge ${statusColor[o.status]}`}>{o.status}</span></td>
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
