import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const s = searchTerm.toLowerCase();
    return (
      (l.username || '').toLowerCase().includes(s) ||
      (l.action || '').toLowerCase().includes(s) ||
      (l.entity || '').toLowerCase().includes(s) ||
      (l.details || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <Head>
        <title>Audit Logs | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Security & Activity Audit Trail</h4>
            <p className="text-muted small mb-0">Immutable records of user actions, record creations, updates, and deletions</p>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="fw-bold mb-0 text-dark">System Action Logs</h6>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="User, action, entity, details..."
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
                  <th>Timestamp</th>
                  <th>Staff / User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Activity Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.id}>
                      <td>{idx + 1}</td>
                      <td className="small text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                          {log.username || 'System'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            log.action === 'CREATE'
                              ? 'bg-success'
                              : log.action === 'DELETE'
                              ? 'bg-danger'
                              : log.action === 'TERMINATE'
                              ? 'bg-dark'
                              : log.action === 'CONVERT'
                              ? 'bg-primary'
                              : 'bg-info text-dark'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="fw-semibold text-dark">{log.entity}</td>
                      <td className="small">{log.details}</td>
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
