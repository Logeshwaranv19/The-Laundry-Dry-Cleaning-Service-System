import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiCheckCircle } from 'react-icons/fi';

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

  const [payingOrderId, setPayingOrderId] = useState(null);

  const initiatePayment = async (order) => {
    setPayingOrderId(order._id);
    try {
      // 1. Create Razorpay order
      const { data: ord } = await api.post('/customer/razorpay/order', {
        amount: order.totalAmount,
        receipt: `ord_${order._id.slice(-10)}_${Date.now()}`
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Seykv3v4fWQhAc',
        amount: ord.amount,
        currency: ord.currency,
        name: "The Laundry Service",
        description: `Order Payment #${order._id.slice(-6)}`,
        order_id: ord.id,
        handler: async (response) => {
          await verifyPayment(response, order._id);
        },
        prefill: {
          name: "Customer Name",
          email: "customer@example.com",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => setPayingOrderId(null)
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
      setPayingOrderId(null);
    }
  };

  const verifyPayment = async (paymentResponse, orderId) => {
    try {
      // 1. Verify payment on backend
      const { data: verification } = await api.post('/customer/razorpay/verify', paymentResponse);

      if (verification.success) {
        // 2. Update order status to Paid
        await api.patch(`/customer/orders/${orderId}/pay`);
        toast.success('🎉 Payment successful!');
        
        // Refresh orders
        const r = await api.get('/customer/orders');
        setOrders(r.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setPayingOrderId(null);
    }
  };

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
                    <th>Total</th><th>Payment</th><th>Status</th><th>Delivery Agent</th><th>Action</th>
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
                      <td>
                        <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td><span className={`badge ${statusColor[o.status] || 'badge-blue'}`}>{o.status}</span></td>
                      <td>{o.deliveryBoyId ? o.deliveryBoyId.name : <span style={{ color: 'var(--text-secondary)' }}>Unassigned</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/customer/orders/${o._id}`} className="btn btn-outline btn-sm">Track</Link>
                          {o.paymentStatus === 'Pending' && (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => initiatePayment(o)}
                              disabled={payingOrderId === o._id}
                            >
                              {payingOrderId === o._id ? '...' : 'Pay Now'}
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
      </main>
    </div>
  );
}
