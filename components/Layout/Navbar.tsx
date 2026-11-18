import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const getBreadcrumbTitle = () => {
    const path = router.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/customer-service')) return 'Customer Service';
    if (path.startsWith('/job-cards/new')) return 'New Job Card';
    if (path.startsWith('/job-cards/terminated')) return 'Terminated Job Cards';
    if (path.startsWith('/job-cards')) return 'Job Cards';
    if (path.startsWith('/proforma/new')) return 'New Proforma';
    if (path.startsWith('/proforma')) return 'Proforma Management';
    if (path.startsWith('/inventory')) return 'Inventory / Store';
    if (path.startsWith('/customer-credits')) return 'Customer Credits';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/audit-logs')) return 'Audit Logs';
    return 'Home';
  };

  return (
    <header className="topbar-wrapper">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-outline-secondary d-md-none"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 py-1" style={{ fontSize: '0.85rem' }}>
            <li className="breadcrumb-item">
              <Link href="/dashboard" className="text-decoration-none text-muted">
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
              {getBreadcrumbTitle()}
            </li>
          </ol>
        </nav>
      </div>

      <div className="d-flex align-items-center gap-2">
        <Link href="/job-cards/new" className="btn btn-sm btn-outline-primary d-none d-sm-inline-flex align-items-center gap-1">
          <i className="bi bi-plus-lg"></i>
          <span>New Job Card</span>
        </Link>

        <Link href="/proforma/new" className="btn btn-sm btn-primary d-none d-sm-inline-flex align-items-center gap-1">
          <i className="bi bi-file-earmark-plus"></i>
          <span>New Proforma</span>
        </Link>

        <div className="dropdown ms-2">
          <button
            className="btn btn-sm btn-light border dropdown-toggle d-flex align-items-center gap-2"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, fontSize: '0.8rem' }}>
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="text-start d-none d-md-block" style={{ lineHeight: 1.1 }}>
              <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>{user?.fullName || 'Guest User'}</div>
              <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>{user?.role || 'STAFF'}</span>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-sm">
            <li>
              <div className="dropdown-item-text">
                <small className="text-muted d-block">Signed in as</small>
                <strong>{user?.username}</strong>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={logout}>
                <i className="bi bi-box-arrow-right"></i>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
