import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useToast, confirmModal } from '@/context/ToastContext';

export default function VehiclesPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Vehicle Modal State
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setSaving(true);

    try {
      await axios.put(`/api/vehicles/${editingVehicle.id}`, {
        plateNumber: editingVehicle.plateNumber,
        make: editingVehicle.make,
        model: editingVehicle.model,
        chassisNumber: editingVehicle.chassisNumber,
        color: editingVehicle.color,
      });

      toast.success('Vehicle updated successfully');
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vId: string, plate: string) => {
    const ok = await confirmModal(
      `Are you sure you want to delete vehicle "${plate}"?`,
      'Delete Vehicle',
      'error',
      'Yes, Delete Vehicle',
      'Cancel'
    );
    if (!ok) return;

    try {
      await axios.delete(`/api/vehicles/${vId}`);
      toast.success(`Vehicle ${plate} deleted successfully`);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const s = searchTerm.toLowerCase();
    return (
      v.plateNumber.toLowerCase().includes(s) ||
      (v.make || '').toLowerCase().includes(s) ||
      (v.model || '').toLowerCase().includes(s) ||
      (v.chassisNumber || '').toLowerCase().includes(s) ||
      (v.customer?.name || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <Head>
        <title>Vehicles | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Vehicles Registry</h4>
            <p className="text-muted small mb-0">Directory of registered fleet and client vehicles</p>
          </div>
          <Link href="/customer-service" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-plus-circle"></i>
            <span>+ Register New Vehicle</span>
          </Link>
        </div>

        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="fw-bold mb-0 text-dark">Registered Vehicles</h6>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Plate #, make, model, chassis..."
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
                  <th>Plate Number</th>
                  <th>Make / Brand</th>
                  <th>Model</th>
                  <th>Chassis Number</th>
                  <th>Color</th>
                  <th>Owner / Customer</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading vehicles...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, idx) => (
                    <tr key={v.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="badge bg-light text-dark border fs-6">{v.plateNumber}</span>
                      </td>
                      <td className="fw-semibold">{v.make}</td>
                      <td>{v.model || '-'}</td>
                      <td>
                        <small className="text-muted font-monospace">{v.chassisNumber || '-'}</small>
                      </td>
                      <td>{v.color || '-'}</td>
                      <td className="fw-semibold text-primary">{v.customer?.name}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/job-cards/new?customerId=${v.customerId}&vehicleId=${v.id}`}
                            className="btn btn-outline-primary"
                            title="Open Job Card"
                          >
                            <i className="bi bi-card-checklist me-1"></i> New Card
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setEditingVehicle(v)}
                            title="Edit Vehicle"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteVehicle(v.id, v.plateNumber)}
                            title="Delete Vehicle"
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

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-secondary text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Vehicle: {editingVehicle.plateNumber}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingVehicle(null)}></button>
              </div>

              <form onSubmit={handleUpdateVehicle}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Plate Number *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm text-uppercase"
                      value={editingVehicle.plateNumber}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, plateNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Make</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editingVehicle.make}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Model</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editingVehicle.model || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Chassis Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editingVehicle.chassisNumber || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, chassisNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Color</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editingVehicle.color || ''}
                        onChange={(e) => setEditingVehicle({ ...editingVehicle, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingVehicle(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Vehicle'}
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
