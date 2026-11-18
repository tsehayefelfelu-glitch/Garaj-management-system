import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (cId: string, cName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${cName}"?`)) return;

    try {
      await axios.delete(`/api/customers/${cId}`);
      alert('Customer deleted successfully');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const s = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      (c.phone || '').toLowerCase().includes(s) ||
      (c.tinNumber || '').toLowerCase().includes(s) ||
      (c.customerType || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <Head>
        <title>Customers | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Customers Directory</h4>
            <p className="text-muted small mb-0">Directory of corporate, individual, and insurance clients</p>
          </div>
          <Link href="/customer-service" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-plus-circle"></i>
            <span>+ Add New Customer</span>
          </Link>
        </div>

        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="fw-bold mb-0 text-dark">Client Accounts</h6>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Name, phone, TIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '220px' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Customer Name</th>
                  <th>Type</th>
                  <th>Phone Number</th>
                  <th>TIN Number</th>
                  <th>Registered Vehicles</th>
                  <th>Address</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-bold text-dark">{c.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            c.customerType === 'INSURANCE'
                              ? 'bg-info text-dark'
                              : c.customerType === 'COMPANY'
                              ? 'bg-secondary'
                              : 'bg-light text-dark border'
                          }`}
                        >
                          {c.customerType}
                        </span>
                      </td>
                      <td>{c.phone}</td>
                      <td>{c.tinNumber || '-'}</td>
                      <td>
                        {c.vehicles?.map((v: any) => (
                          <span key={v.id} className="badge bg-light text-dark border me-1">
                            {v.plateNumber}
                          </span>
                        ))}
                      </td>
                      <td>{c.address || '-'}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/job-cards/new?customerId=${c.id}&vehicleId=${c.vehicles?.[0]?.id || ''}`}
                            className="btn btn-outline-primary"
                          >
                            <i className="bi bi-card-checklist me-1"></i> New Card
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            title="Delete Customer"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
