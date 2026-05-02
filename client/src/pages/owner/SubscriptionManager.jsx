import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function SubscriptionManager() {
  const [plans, setPlans] = useState([]);
  const [form, setForm]   = useState({ name:'', price:'', durationDays:30, discountPercent:10, freePickups:0, features:'' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get('/owner/subscriptions').then(r => setPlans(r.data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        discountPercent: Number(form.discountPercent),
        freePickups: Number(form.freePickups),
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      };
      await api.post('/owner/subscriptions', payload);
      toast.success('Plan created!');
      const { data } = await api.get('/owner/subscriptions');
      setPlans(data);
      setForm({ name:'', price:'', durationDays:30, discountPercent:10, freePickups:0, features:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally { setSaving(false); }
  };

  const toggleActive = async (plan) => {
    try {
      await api.put(`/owner/subscriptions/${plan._id}`, { active: !plan.active });
      setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, active: !p.active } : p));
      toast.success(`Plan ${plan.active ? 'deactivated' : 'activated'}!`);
    } catch { toast.error('Update failed'); }
  };

  return (
    <Layout>
      <div className="page-header">
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Create and manage customer subscription packages</p>
        </div>

        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ fontWeight:700, marginBottom:'1.25rem' }}>Create New Plan</h2>
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Plan Name</label>
                <input className="form-input" placeholder="e.g. Gold Plan" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="grid grid-2">
                <div className="form-group"><label className="form-label">Price (₹)</label>
                  <input className="form-input" type="number" min={1} required value={form.price} onChange={e => set('price', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Duration (days)</label>
                  <input className="form-input" type="number" min={1} value={form.durationDays} onChange={e => set('durationDays', e.target.value)} /></div>
              </div>
              <div className="grid grid-2">
                <div className="form-group"><label className="form-label">Discount (%)</label>
                  <input className="form-input" type="number" min={0} max={100} value={form.discountPercent} onChange={e => set('discountPercent', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Free Pickups</label>
                  <input className="form-input" type="number" min={0} value={form.freePickups} onChange={e => set('freePickups', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Features (comma-separated)</label>
                <input className="form-input" placeholder="Priority support, Express delivery, …" value={form.features} onChange={e => set('features', e.target.value)} /></div>
              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving ? 'Creating…' : '✨ Create Plan'}</button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ fontWeight:700, marginBottom:'1.25rem' }}>Existing Plans</h2>
            {plans.length === 0 ? (
              <div className="empty-state"><div className="icon">📋</div><p>No plans created yet</p></div>
            ) : plans.map(p => (
              <div key={p._id} style={{ background:'var(--bg-secondary)', borderRadius:'var(--radius-sm)', padding:'1rem', marginBottom:'0.75rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <div style={{ fontWeight:700 }}>{p.name}</div>
                  <span className={`badge ${p.active ? 'badge-green' : 'badge-red'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:'0.5rem' }}>
                  ₹{p.price} / {p.durationDays} days &nbsp;·&nbsp; {p.discountPercent}% off &nbsp;·&nbsp; {p.freePickups} free pickups
                </div>
                {p.features?.length > 0 && <div style={{ fontSize:'0.82rem', color:'var(--teal)', marginBottom:'0.5rem' }}>{p.features.join(', ')}</div>}
                <button className={`btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(p)}>
                  {p.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }
