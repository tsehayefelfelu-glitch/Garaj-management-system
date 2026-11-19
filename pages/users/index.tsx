import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useToast, confirmModal } from '@/context/ToastContext';

export default function UsersManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.warning('Access restricted: Only Admin can access Staff Management');
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.post('/api/users', {
        username,
        password,
        fullName,
        role,
        phone,
      });

      toast.success(`Staff user "${username}" created successfully!`);
      setShowModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      setPhone('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (uId: string, uName: string) => {
    const confirmed = await confirmModal(
      `Are you sure you want to permanently delete user "${uName}"?`,
      'Delete Staff Account',
      'error',
      'Yes, Delete User',
      'Cancel'
    );
    if (!confirmed) return;

    try {
      await axios.delete(`/api/users/${uId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (u: any) => {
    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axios.put(`/api/users/${u.id}`, { status: nextStatus });
      toast.info(`User status updated to ${nextStatus}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user status');
    }
  };

  return (
    <>
      <Head>
        <title>Staff & Role Management | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Staff & Role Management</h4>
            <p className="text-muted small mb-0">Create, configure permissions, and manage workshop personnel</p>
          </div>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus-fill"></i>
            <span>+ Create Staff Member</span>
          </button>
        </div>

        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">Staff Accounts & Access Roles</h6>
            <span className="badge bg-secondary-subtle text-secondary">{users.length} Users</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">Loading staff accounts...</td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold text-dark">{u.fullName}</td>
                      <td><code>{u.username}</code></td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'ADMIN'
                              ? 'bg-danger'
                              : u.role === 'MANAGER'
                              ? 'bg-primary'
                              : u.role === 'CASHIER'
                              ? 'bg-success'
                              : u.role === 'STOREKEEPER'
                              ? 'bg-warning text-dark'
                              : 'bg-info text-dark'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm py-0 px-2 badge ${u.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}
                          onClick={() => handleToggleStatus(u)}
                          title="Click to toggle active status"
                        >
                          {u.status}
                        </button>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={u.id === user?.id}
                          title="Delete user"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus-fill me-2"></i> Create Staff Member
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Abebe Balcha"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Username *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. abebe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Password *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="Enter initial password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Role *</label>
                    <select
                      className="form-select form-select-sm"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="ADMIN">ADMIN - Full system control</option>
                      <option value="MANAGER">MANAGER - Approvals & reports</option>
                      <option value="CASHIER">CASHIER - Cash invoices & credits</option>
                      <option value="STOREKEEPER">STOREKEEPER - Inventory & requisitions</option>
                      <option value="MECHANIC">MECHANIC - Workshop job card operations</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. 0911223344"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
