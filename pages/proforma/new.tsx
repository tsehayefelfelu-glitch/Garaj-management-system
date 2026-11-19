import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useToast } from '@/context/ToastContext';

export default function NewProformaPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { customerId: qCustId, vehicleId: qVehId } = router.query;

  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [inventoryParts, setInventoryParts] = useState<any[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [surveyorName, setSurveyorName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('As Per The Lists Indicate In Insurance Survey Report');

  // Items (Repair & Replace)
  const [items, setItems] = useState<any[]>([]);

  // Form input for new item
  const [newItemType, setNewItemType] = useState<'REPAIR' | 'REPLACE'>('REPAIR');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Body & Painting');
  const [newQty, setNewQty] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (qCustId) setSelectedCustomerId(String(qCustId));
    if (qVehId) setSelectedVehicleId(String(qVehId));
  }, [qCustId, qVehId]);

  const fetchData = async () => {
    try {
      const [custRes, vehRes, invRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/vehicles'),
        axios.get('/api/inventory'),
      ]);
      setCustomers(custRes.data);
      setVehicles(vehRes.data);
      setInventoryParts(invRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    if (!newDesc) return;
    const qty = Number(newQty) || 1;
    const unitPrice = Number(newUnitPrice) || 0;
    const totalPrice = qty * unitPrice;

    setItems([
      ...items,
      {
        itemType: newItemType,
        description: newDesc,
        category: newCategory,
        unit: 'Pcs',
        quantity: qty,
        unitPrice,
        totalPrice,
      },
    ]);

    setNewDesc('');
    setNewUnitPrice(0);
    setNewQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const labourSubtotal = items
    .filter((i) => i.itemType === 'REPAIR')
    .reduce((acc, i) => acc + (parseFloat(i.totalPrice) || 0), 0);

  const replaceSubtotal = items
    .filter((i) => i.itemType === 'REPLACE')
    .reduce((acc, i) => acc + (parseFloat(i.totalPrice) || 0), 0);

  const subTotal = labourSubtotal + replaceSubtotal;
  const vatAmount = parseFloat((subTotal * 0.15).toFixed(2));
  const grandTotal = subTotal + vatAmount;

  const handleSave = async (andPrint = false) => {
    if (!selectedCustomerId || !selectedVehicleId) {
      toast.warning('Please select Customer and Vehicle');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post('/api/proformas', {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        insuranceCompany,
        claimNumber,
        surveyorName,
        validUntil: validUntil || undefined,
        notes,
        items,
      });

      toast.success(`Proforma ${res.data.proformaNumber} generated successfully!`);
      if (andPrint) {
        router.push(`/proforma/${res.data.id}/print`);
      } else {
        router.push('/proforma');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save proforma');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Proforma | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Create New Proforma</h4>
            <p className="text-muted small mb-0">Specially designed for insurance estimations and corporate fleet repairs</p>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
        </div>

        {/* Insurance & Vehicle Metadata */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0 text-primary">
              <i className="bi bi-shield-check me-2"></i>
              Insurance & Vehicle Specifications
            </h6>
          </div>
          <div className="card-body p-4 bg-light bg-opacity-25">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Customer / Insurance *</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Select Customer / Insurance --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Vehicle Plate *</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Insurance Company Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Berhan Insurance S.C"
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Insurance Claim Number</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. 2-B22222"
                  value={claimNumber}
                  onChange={(e) => setClaimNumber(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Surveyor Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Ato Dawit Tilahun"
                  value={surveyorName}
                  onChange={(e) => setSurveyorName(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Valid Until Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Item Form (Photo 7) */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-plus-square me-2 text-success"></i>
              Add Repair or Replace Item
            </h6>
          </div>
          <div className="card-body p-4 bg-light bg-opacity-50">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-2">
                <label className="form-label small fw-semibold">Item Action</label>
                <select
                  className="form-select form-select-sm"
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                >
                  <option value="REPAIR">Repair (Labour)</option>
                  <option value="REPLACE">Replace (Part)</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold">Description</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Rocker Panel RR LHS Light Garnish, AC Belt..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Qty</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  min="1"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Unit Price (ETB)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="col-12 col-md-2">
                <button type="button" className="btn btn-primary btn-sm w-100" onClick={handleAddItem}>
                  <i className="bi bi-plus-lg me-1"></i> Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Proforma Items Table */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">Estimation Items Breakdown</h6>
            <span className="badge bg-primary">{items.length} Items</span>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th style={{ width: '120px' }}>Type</th>
                  <th>Description</th>
                  <th style={{ width: '60px' }}>Unit</th>
                  <th style={{ width: '60px' }}>Qty</th>
                  <th style={{ width: '140px' }}>Unit Price (ETB)</th>
                  <th style={{ width: '150px' }}>Total Amount (ETB)</th>
                  <th style={{ width: '50px' }} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4 small">
                      <i className="bi bi-inbox fs-4 d-block mb-1 text-secondary"></i>
                      No estimation items added yet. Use the form above to add repair or replace items.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className={`badge ${item.itemType === 'REPAIR' ? 'bg-info-subtle text-info-emphasis' : 'bg-warning-subtle text-warning-emphasis'}`}>
                          {item.itemType}
                        </span>
                      </td>
                      <td className="fw-semibold">{item.description}</td>
                      <td>{item.unit}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unitPrice.toLocaleString()}</td>
                      <td className="fw-bold">{item.totalPrice.toLocaleString()}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-1"
                          onClick={() => handleRemoveItem(idx)}
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

        {/* Financial Summary & Actions */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-12 col-md-6 mb-3 mb-md-0">
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-secondary">Labour Cost (Subtotal):</span>
                    <strong>ETB {labourSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-secondary">Replace (Subtotal):</span>
                    <strong>ETB {replaceSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-secondary">Sub Total:</span>
                    <strong>ETB {subTotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">VAT (15%):</span>
                    <strong>ETB {vatAmount.toLocaleString()}</strong>
                  </div>
                  <hr className="my-1" />
                  <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                    <span>Grand Total:</span>
                    <span>ETB {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 text-md-end">
                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-primary px-4 py-2 fw-semibold"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                  >
                    <i className="bi bi-save me-1"></i> Save Proforma
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                  >
                    <i className="bi bi-printer me-1"></i> Save & Preview A4 Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
