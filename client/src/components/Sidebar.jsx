import ThemeSwitcher from './ThemeSwitcher';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiPlusCircle, FiList, FiStar, FiCreditCard, FiAlertCircle, FiLogOut, FiTruck, FiSettings, FiDollarSign, FiX } from 'react-icons/fi';

const customerLinks = [
  { to: '/customer/dashboard',    icon: <FiHome />,        label: 'Dashboard' },
  { to: '/customer/place-order',  icon: <FiPlusCircle />,  label: 'Place Order' },
  { to: '/customer/orders',       icon: <FiList />,        label: 'My Orders' },
  { to: '/customer/loyalty',      icon: <FiStar />,        label: 'Loyalty Points' },
  { to: '/customer/subscription', icon: <FiCreditCard />,  label: 'Subscription' },
  { to: '/customer/complaint',    icon: <FiAlertCircle />, label: 'Complaints' },
];

const ownerLinks = [
  { to: '/owner/dashboard',     icon: <FiHome />,       label: 'Dashboard' },
  { to: '/owner/orders',        icon: <FiList />,       label: 'Manage Orders' },
  { to: '/owner/delivery',      icon: <FiTruck />,      label: 'Delivery Staff' },
  { to: '/owner/pricing',       icon: <FiDollarSign />, label: 'Pricing' },
  { to: '/owner/complaints',    icon: <FiAlertCircle />,label: 'Complaints' },
  { to: '/owner/subscriptions', icon: <FiCreditCard />, label: 'Plans' },
];

const deliveryLinks = [
  { to: '/delivery/orders',   icon: <FiTruck />,  label: 'My Deliveries' },
];

const roleLinks = { customer: customerLinks, owner: ownerLinks, delivery: deliveryLinks };

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <span>🧺</span> Laundry
        <button className="sidebar-close" onClick={onClose}>
          <FiX size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {l.icon} {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <ThemeSwitcher />
        <div className="user-pill">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button className="nav-link" style={{ marginTop: '0.5rem', color: 'var(--danger)' }} onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
}
