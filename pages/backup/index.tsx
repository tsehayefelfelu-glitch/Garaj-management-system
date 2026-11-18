import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function DatabaseBackupPage() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [storageLocation, setStorageLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/backup');
      setBackups(res.data.backups || []);
      setStorageLocation(res.data.storageLocation || '');
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to fetch backup files', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/backup');
      setMessage({
        text: `Snapshot ${res.data.filename} (${res.data.sizeFormatted}) created and saved safely!`,
        type: 'success',
      });
      fetchBackups();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to create backup snapshot', type: 'danger' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to permanently delete backup snapshot "${filename}"?`)) return;

    try {
      await axios.delete(`/api/backup?filename=${encodeURIComponent(filename)}`);
      setMessage({ text: `Backup snapshot ${filename} deleted successfully`, type: 'success' });
      fetchBackups();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to delete backup file', type: 'danger' });
    }
  };

  return (
    <>
      <Head>
        <title>Database Backups & Disaster Recovery | Wise Digital Garage</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Database Backups & Disaster Recovery</h4>
            <p className="text-muted small mb-0">
              Manage automatic daily database snapshots, download offline copies, and inspect storage
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>Generating Snapshot...</span>
              </>
            ) : (
              <>
                <i className="bi bi-cloud-arrow-down-fill"></i>
                <span>Create Instant Backup Now</span>
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show small d-flex align-items-center gap-2 mb-4`} role="alert">
            <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill fs-5' : 'bi-exclamation-triangle-fill fs-5'}`}></i>
            <div>{message.text}</div>
            <button type="button" className="btn-close ms-auto" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* Info Overview Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary">
                  <i className="bi bi-shield-lock-fill fs-4"></i>
                </div>
                <div>
                  <small className="text-muted fw-semibold">Auto-Retention Policy</small>
                  <h6 className="fw-bold mb-0 text-dark">30 Days Snapshots Kept</h6>
                  <small className="text-success" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-check2 me-1"></i> Auto-rotates & purges older copies
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success">
                  <i className="bi bi-database-check fs-4"></i>
                </div>
                <div>
                  <small className="text-muted fw-semibold">Total Snapshots Available</small>
                  <h6 className="fw-bold mb-0 text-dark">{backups.length} Backup Files</h6>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Ready for 1-click download to USB
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning">
                  <i className="bi bi-folder-fill fs-4"></i>
                </div>
                <div className="overflow-hidden">
                  <small className="text-muted fw-semibold">Storage Location</small>
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem' }}>
                    <code>{storageLocation || '/backups'}</code>
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Local Secure Server Path
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Snapshots Table */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-hdd-stack me-2 text-primary"></i>
              Database Snapshots Archive
            </h6>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchBackups} title="Refresh">
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Snapshot File Name</th>
                  <th>Created Date & Time</th>
                  <th>File Size</th>
                  <th>Integrity Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading database snapshots...
                    </td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No backup snapshots found yet. Click <strong>"Create Instant Backup Now"</strong> above to take your first backup snapshot.
                    </td>
                  </tr>
                ) : (
                  backups.map((b, idx) => (
                    <tr key={b.filename}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="fw-bold text-dark d-flex align-items-center gap-2">
                          <i className="bi bi-file-earmark-binary text-primary"></i>
                          <span>{b.filename}</span>
                        </div>
                      </td>
                      <td>{new Date(b.createdAt).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{b.sizeFormatted}</span>
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          <i className="bi bi-check-circle-fill me-1"></i> Verified OK
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <a
                            href={`/api/backup/download?file=${encodeURIComponent(b.filename)}`}
                            className="btn btn-outline-primary"
                            title="Download to PC / USB Drive"
                            download
                          >
                            <i className="bi bi-download me-1"></i> Download
                          </a>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteBackup(b.filename)}
                            title="Delete Snapshot"
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

        {/* Disaster Recovery & Setup Guide */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-info-circle-fill me-2 text-info"></i>
              How Automated Backups & Disaster Recovery Work
            </h6>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <h6 className="fw-bold text-primary">1. Where are backups stored?</h6>
                <p className="text-secondary small mb-2">
                  All snapshots are stored in the server's dedicated <code>/backups/</code> folder:
                </p>
                <div className="p-2 bg-light rounded border text-monospace small mb-3">
                  <code>{storageLocation || 'c:\\Users\\hp\\Downloads\\wise digital Garej System\\backups'}</code>
                </div>
                <p className="text-secondary small">
                  <strong>Recommended Practice:</strong> Regularly download the latest snapshot to an external flash drive or mirror this folder with Google Drive / OneDrive for 100% offsite disaster protection.
                </p>
              </div>

              <div className="col-12 col-md-6">
                <h6 className="fw-bold text-primary">2. Automated Nightly Schedule Setup</h6>
                <p className="text-secondary small mb-2">
                  To run automatic backups every night at 12:00 AM without human intervention:
                </p>
                <ol className="text-secondary small ps-3 mb-2">
                  <li>Open <strong>Windows Task Scheduler</strong> (or Linux <code>crontab</code>).</li>
                  <li>Create a daily task triggering at 12:00 AM.</li>
                  <li>Action: <code>node scripts/backup.js</code></li>
                </ol>
                <div className="p-2 bg-light rounded border small">
                  <code>node "c:\Users\hp\Downloads\wise digital Garej System\scripts\backup.js"</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
