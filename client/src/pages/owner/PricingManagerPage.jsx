import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import toast from 'react-hot-toast';

import { FABRICS, SERVICES } from '../../constants';

export default function PricingManagerPage() {
  const [pricing, setPricing] = useState([]);
  const [form, setForm]       = useState({ fabricType: FABRICS[0], serviceType: SERVICES[0], pricePerPiece:'', description:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get('/owner/pricing').then(r => { setPricing(r.data); setLoading(false); });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.pricePerPiece || form.pricePerPiece <= 0) return toast.error('Enter a valid price');
    setSaving(true);
    try {
      await api.post('/owner/pricing', form);
      toast.success('Pricing saved!');
      const { data } = await api.get('/owner/pricing');
      setPricing(data);
      setForm({ fabricType: FABRICS[0], serviceType: SERVICES[0], pricePerPiece:'', description:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const editPrice = (p) => setForm({ fabricType: p.fabricType, serviceType: p.serviceType, pricePerPiece: p.pricePerPiece, description: p.description || '' });

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">Fabric-wise Pricing</h1>
          <p className="page-subtitle">Set prices per fabric type and service</p>
        </div>

        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Add / Update Price</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Fabric Type</label>
                <select className="form-select" value={form.fabricType} onChange={e => setForm({ ...form, fabricType: e.target.value })}>
                  {FABRICS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <select className="form-select" value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price per Piece (₹)</label>
                <input id="price-input" className="form-input" type="number" min={1} placeholder="e.g. 80" required
                  value={form.pricePerPiece} onChange={e => setForm({ ...form, pricePerPiece: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" placeholder="e.g. includes fabric softener"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button id="save-price-btn" type="submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Price'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Pricing Table</h2>
            {loading ? <p style={{ color:'var(--text-secondary)' }}>Loading…</p> : pricing.length === 0 ? (
              <div className="empty-state"><div className="icon">💰</div><p>No pricing set yet</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Fabric</th><th>Service</th><th>Price/pc</th><th>Edit</th></tr></thead>
                  <tbody>
                    {pricing.map(p => (
                      <tr key={p._id}>
                        <td><span className="badge badge-purple">{p.fabricType}</span></td>
                        <td>{p.serviceType}</td>
                        <td><strong style={{ color:'var(--accent)' }}>₹{p.pricePerPiece}</strong></td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => editPrice(p)}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }
