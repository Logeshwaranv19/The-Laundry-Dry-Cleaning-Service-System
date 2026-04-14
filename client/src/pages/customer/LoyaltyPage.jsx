import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

export default function LoyaltyPage() {
  const [data, setData] = useState({ balance: 0, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/customer/loyalty').then(r => { setData(r.data); setLoading(false); });
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Loyalty Points</h1>
          <p className="page-subtitle">Earn points on every order &amp; redeem at checkout</p>
        </div>

        <div className="points-hero">
          {loading ? <div className="points-value">–</div> : <div className="points-value">{data.balance}</div>}
          <div className="points-label">🏆 Available Points &nbsp;|&nbsp; ₹{Math.floor(data.balance / 10)} redeemable value</div>
        </div>

        <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Earn Points</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Earn 1 point for every ₹10 spent on orders</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Redeem Savings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Use 10 pts to get ₹1 discount at checkout</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Never Expires</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Your points remain valid as long as your account is active</p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Transaction History</h2>
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading…</p> : data.history.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No transactions yet. Place an order to start earning!</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Type</th><th>Points</th><th>Balance</th><th>Description</th></tr></thead>
                <tbody>
                  {data.history.map(t => (
                    <tr key={t._id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td><span className={`badge ${t.type === 'earned' ? 'badge-green' : 'badge-red'}`}>{t.type === 'earned' ? '+ Earned' : '- Redeemed'}</span></td>
                      <td style={{ fontWeight: 700, color: t.type === 'earned' ? 'var(--success)' : 'var(--danger)' }}>
                        {t.type === 'earned' ? '+' : '-'}{t.points}
                      </td>
                      <td>{t.balance}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.description}</td>
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
