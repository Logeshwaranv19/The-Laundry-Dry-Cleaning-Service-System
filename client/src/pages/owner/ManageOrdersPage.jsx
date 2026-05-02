import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Placed','Picked Up','Processing','Ready','Out for Delivery','Delivered','Cancelled'];
const statusColor = {
  'Placed':'badge-blue','Picked Up':'badge-purple','Processing':'badge-yellow',
  'Ready':'badge-teal','Out for Delivery':'badge-yellow','Delivered':'badge-green','Cancelled':'badge-red'
};

export default function ManageOrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [boys, setBoys]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/owner/orders').then(r => setOrders(r.data)),
      api.get('/owner/delivery-boys').then(r => setBoys(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const updateOrder = async (orderId, payload) => {
    setUpdating(orderId);
    try {
      const { data } = await api.put(`/owner/orders/${orderId}`, payload);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...data.order } : o));
      toast.success('Order updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(null); }
  };

  const filtered = orders.filter(o =>
    !filter || o.status === filter
  );

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">Manage Orders</h1>
          <p className="page-subtitle">Update order status and assign delivery boys</p>
        </div>

        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <select className="form-select" style={{ maxWidth: '220px' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Orders</option>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>No orders found</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Pickup</th><th>Payment</th><th>Status</th><th>Delivery Boy</th><th>Update</th></tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{o._id.slice(-8).toUpperCase()}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{o.customerId?.name}</div>
                        <div style={{ color:'var(--text-secondary)', fontSize:'0.78rem' }}>{o.customerId?.phone}</div>
                      </td>
                      <td>{o.items.length}</td>
                      <td>₹{o.totalAmount}</td>
                      <td style={{ fontSize:'0.85rem' }}>{o.pickupDate}<br /><span style={{ color:'var(--text-secondary)' }}>{o.pickupTime}</span></td>
                      <td>
                        <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td><span className={`badge ${statusColor[o.status]}`}>{o.status}</span></td>
                      <td>
                        <select className="form-select" style={{ fontSize: '0.82rem', padding:'0.4rem 0.6rem' }}
                          value={o.deliveryBoyId?._id || o.deliveryBoyId || ''}
                          onChange={e => updateOrder(o._id, { deliveryBoyId: e.target.value })}>
                          <option value="">Unassigned</option>
                          {boys.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                          <select className="form-select" style={{ fontSize: '0.82rem', padding:'0.4rem 0.6rem' }}
                            value={o.status}
                            onChange={e => updateOrder(o._id, { status: e.target.value })}
                            disabled={updating === o._id}>
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                          
                          {o.status === 'Picked Up' && (
                            <button className="btn btn-primary btn-sm" style={{ fontSize:'0.7rem', padding:'0.2rem' }} onClick={() => updateOrder(o._id, { status: 'Processing' })}>
                              Start Washing 🫧
                            </button>
                          )}
                          {o.status === 'Processing' && (
                            <button className="btn btn-success btn-sm" style={{ fontSize:'0.7rem', padding:'0.2rem' }} onClick={() => updateOrder(o._id, { status: 'Ready' })}>
                              Mark Ready ✨
                            </button>
                          )}
                        </div>
                      </td>
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
