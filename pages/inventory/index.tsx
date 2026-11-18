import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function InventoryPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // New Part Modal State
  const [showModal, setShowModal] = useState(false);
  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('AC System');
  const [quantity, setQuantity] = useState(10);
  const [buyingPrice, setBuyingPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [unit, setUnit] = useState('Pcs');
  const [saving, setSaving] = useState(false);

  // Edit / Restock Modal State
  const [editingPart, setEditingPart] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/inventory');
      setParts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.post('/api/inventory', {
        partNumber,
        name,
        category,
        quantity,
        buyingPrice,
        sellingPrice,
        lowStockAlert,
        unit,
      });

      alert('Spare part registered in store successfully!');
      setShowModal(false);
      setPartNumber('');
      setName('');
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add spare part');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;
    setSaving(true);

    try {
      await axios.put(`/api/inventory/${editingPart.id}`, {
        name: editingPart.name,
        category: editingPart.category,
        sellingPrice: editingPart.sellingPrice,
        buyingPrice: editingPart.buyingPrice,
        lowStockAlert: editingPart.lowStockAlert,
        adjustQuantity: adjustQty ? parseInt(adjustQty, 10) : undefined,
      });

      alert('Part updated and stock adjusted successfully!');
      setEditingPart(null);
      setAdjustQty('');
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update part');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePart = async (pId: string, pName: string) => {
    if (!confirm(`Are you sure you want to delete "${pName}" from the store catalog?`)) return;

    try {
      await axios.delete(`/api/inventory/${pId}`);
      alert('Spare part deleted successfully');
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete part');
    }
  };

  const categories = ['ALL', ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean)))];

  const filteredParts = parts.filter((p) => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesLowStock = !showLowStockOnly || p.quantity <= p.lowStockAlert;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      p.partNumber.toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s);

    return matchesCat && matchesLowStock && matchesSearch;
  });

  const lowStockCount = parts.filter((p) => p.quantity <= p.lowStockAlert).length;

  return (
    <>
      <Head>
        <title>Inventory / Store | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Inventory / Store Management</h4>
            <p className="text-muted small mb-0">Track spare parts, stock levels, selling prices, auto-deduction, and reorders</p>
          </div>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle"></i>
            <span>+ Add Spare Part</span>
          </button>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i>
              <div>
                <strong>Low Stock Notice:</strong> {lowStockCount} items have reached or fallen below safety reorder threshold!
              </div>
            </div>
            <button
              className={`btn btn-sm ${showLowStockOnly ? 'btn-warning text-dark fw-bold' : 'btn-outline-dark'}`}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              {showLowStockOnly ? 'Show All Parts' : 'Show Low Stock Only'}
            </button>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="small text-secondary fw-semibold">Category:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '160px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Part name, code, category..."
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
                  <th>Part Number / Code</th>
                  <th>Part Name</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Unit</th>
                  <th>Buying Price</th>
                  <th>Selling Price</th>
                  <th>Alert Level</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading inventory parts...
                    </td>
                  </tr>
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-muted">
                      No inventory parts found.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p, idx) => {
                    const isLow = p.quantity <= p.lowStockAlert;
                    return (
                      <tr key={p.id} className={isLow ? 'table-warning bg-opacity-25' : ''}>
                        <td>{idx + 1}</td>
                        <td className="fw-bold text-dark">{p.partNumber}</td>
                        <td className="fw-semibold">{p.name}</td>
                        <td>
                          <span className="badge bg-light text-secondary border">{p.category}</span>
                        </td>
                        <td>
                          <span className={`fw-bold fs-6 ${isLow ? 'text-danger' : 'text-success'}`}>
                            {p.quantity}
                          </span>
                        </td>
                        <td>{p.unit}</td>
                        <td>ETB {p.buyingPrice.toLocaleString()}</td>
                        <td className="fw-semibold text-primary">ETB {p.sellingPrice.toLocaleString()}</td>
                        <td className="text-muted">{p.lowStockAlert}</td>
                        <td>
                          {isLow ? (
                            <span className="badge bg-danger">Low Stock</span>
                          ) : (
                            <span className="badge bg-success">In Stock</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setEditingPart(p);
                                setAdjustQty('');
                              }}
                              title="Edit / Restock"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDeletePart(p.id, p.name)}
                              title="Delete Part"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center small text-muted">
            <div>Showing {filteredParts.length} parts</div>
            <div>Wise Digital Inventory & Auto-Deduction Engine</div>
          </div>
        </div>
      </div>

      {/* Add Part Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-box-seam me-2"></i> Register New Spare Part
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleAddPart}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Part Number / Code *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 97139-06080"
                        value={partNumber}
                        onChange={(e) => setPartNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="AC System">AC System</option>
                        <option value="Brake">Brake</option>
                        <option value="Engine">Engine</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Lubricants">Lubricants</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Body">Body</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Part Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. AC Air Cleaner Filter"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-6">
                      <label className="form-label small fw-semibold">Initial Quantity</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                      />
                    </div>

                    <div className="col-6 col-md-6">
                      <label className="form-label small fw-semibold">Unit</label>
                      <select
                        className="form-select form-select-sm"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Set">Set</option>
                        <option value="Lit">Lit</option>
                        <option value="Kg">Kg</option>
                      </select>
                    </div>

                    <div className="col-6 col-md-6">
                      <label className="form-label small fw-semibold">Buying Price (ETB)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={buyingPrice}
                        onChange={(e) => setBuyingPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="col-6 col-md-6">
                      <label className="form-label small fw-semibold">Selling Price (ETB) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Low Stock Alert Limit</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={lowStockAlert}
                        onChange={(e) => setLowStockAlert(parseInt(e.target.value, 10) || 5)}
                      />
                      <small className="text-muted">Will trigger an alert when stock reaches or drops below this number.</small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Part'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Restock Modal */}
      {editingPart && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-secondary text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Part / Adjust Stock: {editingPart.partNumber}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingPart(null)}></button>
              </div>

              <form onSubmit={handleUpdatePart}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Part Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingPart.name}
                      onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Current In-Stock</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light"
                        value={`${editingPart.quantity} ${editingPart.unit}`}
                        disabled
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-primary">
                        Stock Adjustment (+/-)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm border-primary"
                        placeholder="e.g. +10 or -2"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Buying Price (ETB)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={editingPart.buyingPrice}
                        onChange={(e) => setEditingPart({ ...editingPart, buyingPrice: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Selling Price (ETB)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={editingPart.sellingPrice}
                        onChange={(e) => setEditingPart({ ...editingPart, sellingPrice: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Low Stock Alert Limit</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={editingPart.lowStockAlert}
                      onChange={(e) => setEditingPart({ ...editingPart, lowStockAlert: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingPart(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                    {saving ? 'Updating...' : 'Update & Adjust Stock'}
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
