import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

const statusColor = {
  'Placed': 'badge-blue', 'Picked Up': 'badge-purple', 'Processing': 'badge-yellow',
  'Ready': 'badge-teal', 'Out for Delivery': 'badge-yellow', 'Delivered': 'badge-green', 'Cancelled': 'badge-red'
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/customer/orders').then(r => { setOrders(r.data); setLoading(false); });
  }, []);

  const filtered = orders.filter(o =>
    o.status.toLowerCase().includes(search.toLowerCase()) ||
    o._id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">View and track all your laundry orders</p>
        </div>
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <input className="form-input" placeholder="Search by status or order ID…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>No orders found</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th><th>Items</th><th>Pickup Date</th><th>Time</th>
                    <th>Total</th><th>Status</th><th>Delivery Agent</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o._id.slice(-8).toUpperCase()}</td>
                      <td>{o.items.length} item(s)</td>
                      <td>{o.pickupDate}</td>
                      <td>{o.pickupTime}</td>
                      <td><strong>₹{o.totalAmount}</strong></td>
                      <td><span className={`badge ${statusColor[o.status] || 'badge-blue'}`}>{o.status}</span></td>
                      <td>{o.deliveryBoyId ? o.deliveryBoyId.name : <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>}</td>
                      <td><Link to={`/customer/orders/${o._id}`} className="btn btn-outline btn-sm">Track</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
