import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const isActive = (path: string) => {
    if (path === '/dashboard' && currentPath === '/dashboard') return true;
    if (path !== '/dashboard' && currentPath.startsWith(path)) return true;
    return false;
  };

  const showDashboard = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const showCustomerService = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const showJobCards = ['ADMIN', 'MANAGER', 'CASHIER', 'MECHANIC'].includes(role);
  const isMechanic = role === 'MECHANIC';
  const showCredits = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const showProforma = ['ADMIN', 'MANAGER'].includes(role);
  const showRegistries = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const showInventory = ['ADMIN', 'MANAGER', 'STOREKEEPER'].includes(role);
  const showReports = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role);
  const showStaffMgmt = ['ADMIN'].includes(role);
  const showAuditLogs = ['ADMIN'].includes(role);

  return (
    <aside
      className={`sidebar-wrapper ${isOpen ? 'd-block' : 'd-none d-md-block'}`}
      style={{
        transform: isOpen ? 'translateX(0)' : undefined,
      }}
    >
      <div className="sidebar-brand">
        <div className="rounded-2 bg-primary bg-opacity-25 p-2 text-info d-flex align-items-center justify-content-center">
          <i className="bi bi-gear-wide-connected fs-5"></i>
        </div>
        <div>
          <div className="fw-bold text-white lh-1 fs-6">WISE DIGITAL</div>
          <small className="text-secondary" style={{ fontSize: '0.65rem' }}>GARAGE SYSTEM</small>
        </div>
      </div>

      <ul className="sidebar-menu">
        {showDashboard && (
          <li className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <Link href="/dashboard">
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </Link>
          </li>
        )}

        {showCustomerService && (
          <li className={`sidebar-item ${isActive('/customer-service') ? 'active' : ''}`}>
            <Link href="/customer-service">
              <i className="bi bi-person-lines-fill"></i>
              <span>Customer Service</span>
            </Link>
          </li>
        )}

        {showJobCards && (
          <>
            <li className="sidebar-header">{isMechanic ? 'MY WORKSHOP TASKS' : 'WORKSHOP OPERATIONS'}</li>
            <li className={`sidebar-item ${isActive('/job-cards') ? 'active' : ''}`}>
              <Link href="/job-cards">
                <i className="bi bi-card-checklist"></i>
                <span>{isMechanic ? 'My Assigned Cards' : 'Job Cards'}</span>
              </Link>
              {!isMechanic && (
                <ul className="sidebar-submenu">
                  <li className={currentPath === '/job-cards/new' ? 'active' : ''}>
                    <Link href="/job-cards/new">
                      <i className="bi bi-plus-circle me-1"></i> New Job Card
                    </Link>
                  </li>
                  <li className={currentPath === '/job-cards' ? 'active' : ''}>
                    <Link href="/job-cards">
                      <i className="bi bi-clock-history me-1"></i> Active Cards
                    </Link>
                  </li>
                  <li className={currentPath === '/job-cards/terminated' ? 'active' : ''}>
                    <Link href="/job-cards/terminated">
                      <i className="bi bi-check-circle me-1"></i> Terminated Cards
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </>
        )}

        {showCredits && (
          <li className={`sidebar-item ${isActive('/customer-credits') ? 'active' : ''}`}>
            <Link href="/customer-credits">
              <i className="bi bi-wallet2"></i>
              <span>Customer Credits</span>
            </Link>
          </li>
        )}

        {showProforma && (
          <li className={`sidebar-item ${isActive('/proforma') ? 'active' : ''}`}>
            <Link href="/proforma">
              <i className="bi bi-file-earmark-spreadsheet"></i>
              <span>Proforma</span>
            </Link>
            <ul className="sidebar-submenu">
              <li className={currentPath === '/proforma/new' ? 'active' : ''}>
                <Link href="/proforma/new">
                  <i className="bi bi-plus-circle me-1"></i> New Proforma
                </Link>
              </li>
              <li className={currentPath === '/proforma' ? 'active' : ''}>
                <Link href="/proforma">
                  <i className="bi bi-folder2-open me-1"></i> Proformas List
                </Link>
              </li>
            </ul>
          </li>
        )}

        {showRegistries && (
          <>
            <li className="sidebar-header">REGISTRIES</li>

            <li className={`sidebar-item ${isActive('/vehicles') ? 'active' : ''}`}>
              <Link href="/vehicles">
                <i className="bi bi-car-front"></i>
                <span>Vehicles</span>
              </Link>
            </li>

            <li className={`sidebar-item ${isActive('/customers') ? 'active' : ''}`}>
              <Link href="/customers">
                <i className="bi bi-people"></i>
                <span>Customers</span>
              </Link>
            </li>
          </>
        )}

        {showInventory && (
          <>
            <li className="sidebar-header">INVENTORY</li>
            <li className={`sidebar-item ${isActive('/inventory') ? 'active' : ''}`}>
              <Link href="/inventory">
                <i className="bi bi-boxes"></i>
                <span>Inventory / Store</span>
              </Link>
            </li>
          </>
        )}

        <li className="sidebar-header">REPORTS & SECURITY</li>

        {showReports && (
          <li className={`sidebar-item ${isActive('/reports') ? 'active' : ''}`}>
            <Link href="/reports">
              <i className="bi bi-graph-up-arrow"></i>
              <span>Reports & Analytics</span>
            </Link>
          </li>
        )}

        {showStaffMgmt && (
          <>
            <li className={`sidebar-item ${isActive('/users') ? 'active' : ''}`}>
              <Link href="/users">
                <i className="bi bi-person-gear"></i>
                <span>Staff Management</span>
              </Link>
            </li>
            <li className={`sidebar-item ${isActive('/backup') ? 'active' : ''}`}>
              <Link href="/backup">
                <i className="bi bi-cloud-arrow-down"></i>
                <span>Database Backup</span>
              </Link>
            </li>
          </>
        )}

        {showAuditLogs && (
          <li className={`sidebar-item ${isActive('/audit-logs') ? 'active' : ''}`}>
            <Link href="/audit-logs">
              <i className="bi bi-shield-check"></i>
              <span>Audit Logs</span>
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;
