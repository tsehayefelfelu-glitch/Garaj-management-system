import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useToast } from '@/context/ToastContext';

export default function NewJobCardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { customerId: qCustId, vehicleId: qVehId } = router.query;

  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [inventoryParts, setInventoryParts] = useState<any[]>([]);

  // Selected Entities
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  // Customer Autocomplete Search
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Vehicle Details
  const [chassisNumber, setChassisNumber] = useState('');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('');

  // Job Card Details (Photos 3 & 4)
  const [pricingOption, setPricingOption] = useState('Separate pricing for each Services and Parts');
  const [skipCardNumber, setSkipCardNumber] = useState(false);
  const [odoMeter, setOdoMeter] = useState('0');
  const [fuelLevel, setFuelLevel] = useState('1/2');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  // Active Tab
  const [activeTab, setActiveTab] = useState<'CONDITIONS' | 'SERVICES' | 'PARTS'>('CONDITIONS');

  // Tab 1: Conditions
  const [conditionChecklist, setConditionChecklist] = useState({
    spareWheel: true,
    jackAndHandle: true,
    wheelSpanner: true,
    scratchesNoted: false,
    radioWorking: true,
    notes: '',
  });

  // Tab 2: Services
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceCost, setNewServiceCost] = useState('');

  // Tab 3: Part Requisitions (Photo 3 / Photo 4)
  const [partsList, setPartsList] = useState<any[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partUnitPrice, setPartUnitPrice] = useState(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (qCustId) setSelectedCustomerId(String(qCustId));
    if (qVehId) setSelectedVehicleId(String(qVehId));
  }, [qCustId, qVehId]);

  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const v = vehicles.find((veh) => veh.id === selectedVehicleId);
      if (v) {
        setChassisNumber(v.chassisNumber || '');
        setMake(v.make || 'Toyota');
        setModel(v.model || '');
        if (!selectedCustomerId && v.customerId) {
          setSelectedCustomerId(v.customerId);
        }
      }
    }
  }, [selectedVehicleId, vehicles]);

  const fetchInitialData = async () => {
    try {
      const [custRes, vehRes, invRes, repRes] = await Promise.all([
        axios.get('/api/customers'),
        axios.get('/api/vehicles'),
        axios.get('/api/inventory'),
        axios.get('/api/reports'),
      ]);
      setCustomers(custRes.data);
      setVehicles(vehRes.data);
      setInventoryParts(invRes.data);
      setMechanics(repRes.data?.mechanicPerformance || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const handleSelectPart = (partId: string) => {
    setSelectedPartId(partId);
    const p = inventoryParts.find((item) => item.id === partId);
    if (p) {
      setPartUnitPrice(p.sellingPrice);
    }
  };

  const handleAddPart = () => {
    if (!selectedPartId) {
      toast.warning('Please select a spare part from the inventory list');
      return;
    }
    const part = inventoryParts.find((p) => p.id === selectedPartId);
    if (!part) return;

    if (part.quantity < partQty) {
      toast.error(`Stock shortage: Only ${part.quantity} ${part.unit} available in stock! Cannot requisition ${partQty}.`);
      return;
    }

    const newItem = {
      partId: part.id,
      partName: part.name,
      partNumber: part.partNumber,
      category: part.category,
      quantity: Number(partQty),
      unitPrice: Number(partUnitPrice),
      totalPrice: Number(partQty) * Number(partUnitPrice),
    };

    setPartsList([...partsList, newItem]);
    setSelectedPartId('');
    setPartQty(1);
    setPartUnitPrice(0);
  };

  const handleRemovePart = (index: number) => {
    setPartsList(partsList.filter((_, i) => i !== index));
  };

  const handleAddService = () => {
    if (!newServiceDesc) return;
    setServicesList([
      ...servicesList,
      {
        description: newServiceDesc,
        category: 'Workshop Service',
        cost: parseFloat(newServiceCost) || 0,
      },
    ]);
    setNewServiceDesc('');
    setNewServiceCost('');
  };

  const handleRemoveService = (index: number) => {
    setServicesList(servicesList.filter((_, i) => i !== index));
  };

  // Totals
  const labourSubtotal = servicesList.reduce((acc, s) => acc + (parseFloat(s.cost) || 0), 0);
  const partsSubtotal = partsList.reduce((acc, p) => acc + (parseFloat(p.totalPrice) || 0), 0);
  const subTotal = labourSubtotal + partsSubtotal;
  const vatAmount = parseFloat((subTotal * 0.15).toFixed(2));
  const grandTotal = subTotal + vatAmount;

  const handleSaveCard = async (andClear = false) => {
    if (!selectedCustomerId || !selectedVehicleId) {
      toast.warning('Please select both Customer and Vehicle');
      return;
    }

    setSaving(true);
    try {
      const conditionSummary = `Spare Wheel: ${conditionChecklist.spareWheel ? 'Yes' : 'No'}, Tools: ${
        conditionChecklist.wheelSpanner ? 'Yes' : 'No'
      }, Jack: ${conditionChecklist.jackAndHandle ? 'Yes' : 'No'}. Notes: ${conditionChecklist.notes}`;

      const res = await axios.post('/api/job-cards', {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        mechanicId: selectedMechanicId || null,
        odoMeter: parseInt(odoMeter, 10) || 0,
        fuelLevel,
        conditionNotes: conditionSummary,
        pricingOption,
        skipCardNumber,
        services: servicesList,
        parts: partsList,
      });

      toast.success(`Job Card ${res.data.cardNumber} created successfully and stock updated!`);

      if (andClear) {
        setSelectedVehicleId('');
        setServicesList([]);
        setPartsList([]);
      } else {
        router.push(`/job-cards/${res.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save Job Card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Job Card | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Job Card Information</h4>
            <p className="text-muted small mb-0">Record vehicle intake condition, service items, and store part requisitions</p>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i> Back to Cards
          </button>
        </div>

        {/* Top Header Card Information (Matching Photos 3 & 4) */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0 text-primary">
              <i className="bi bi-car-front-fill me-2"></i>
              Vehicle & Client Information
            </h6>
          </div>
          <div className="card-body p-4 bg-light bg-opacity-25">
            <div className="row g-3">
              {/* Customer Autocomplete Search Field */}
              <div className="col-12 col-md-5 position-relative">
                <label className="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center">
                  <span>Customer *</span>
                  <Link href="/customer-service" className="text-primary text-decoration-none small" target="_blank">
                    <i className="bi bi-person-plus-fill me-1"></i> Register New
                  </Link>
                </label>

                {selectedCustomerId ? (
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-success-subtle text-success border-success">
                      <i className="bi bi-check-circle-fill"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light fw-bold"
                      value={customers.find((c) => c.id === selectedCustomerId)?.name || customerSearchQuery}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerSearchQuery('');
                        setShowCustomerDropdown(true);
                      }}
                      title="Change Customer"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i> Change
                    </button>
                  </div>
                ) : (
                  <div className="position-relative">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search 10,000+ customers by name, phone, plate..."
                        value={customerSearchQuery}
                        onChange={(e) => {
                          setCustomerSearchQuery(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                      />
                      {customerSearchQuery && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setCustomerSearchQuery('')}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>

                    {showCustomerDropdown && (
                      <div
                        className="card border shadow-lg position-absolute w-100 mt-1"
                        style={{ zIndex: 1050, maxHeight: '280px', overflowY: 'auto' }}
                      >
                        <div className="list-group list-group-flush small">
                          {customers
                            .filter((c) => {
                              const q = customerSearchQuery.toLowerCase().trim();
                              if (!q) return true;
                              const nameMatch = c.name?.toLowerCase().includes(q);
                              const phoneMatch = c.phone?.toLowerCase().includes(q);
                              const tinMatch = (c.tinNumber || '').toLowerCase().includes(q);
                              const plateMatch = c.vehicles?.some((v: any) => v.plateNumber?.toLowerCase().includes(q));
                              return nameMatch || phoneMatch || tinMatch || plateMatch;
                            })
                            .slice(0, 15)
                            .map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="list-group-item list-group-item-action py-2 text-start d-flex justify-content-between align-items-center"
                                onClick={() => {
                                  setSelectedCustomerId(c.id);
                                  setCustomerSearchQuery(c.name);
                                  setShowCustomerDropdown(false);
                                  if (c.vehicles && c.vehicles.length > 0) {
                                    const v = c.vehicles[0];
                                    setSelectedVehicleId(v.id);
                                    setChassisNumber(v.chassisNumber || '');
                                    setMake(v.make || 'Toyota');
                                    setModel(v.model || '');
                                  } else {
                                    setSelectedVehicleId('');
                                  }
                                }}
                              >
                                <div>
                                  <div className="fw-bold text-dark">{c.name}</div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-telephone me-1"></i>
                                    {c.phone} {c.tinNumber ? `| TIN: ${c.tinNumber}` : ''}
                                  </div>
                                </div>
                                <div className="text-end">
                                  <span className="badge bg-secondary-subtle text-secondary me-1">
                                    {c.customerType || 'INDIVIDUAL'}
                                  </span>
                                  {c.vehicles?.[0] && (
                                    <span className="badge bg-primary-subtle text-primary border">
                                      {c.vehicles[0].plateNumber}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          {customers.filter((c) => {
                            const q = customerSearchQuery.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              c.name?.toLowerCase().includes(q) ||
                              c.phone?.toLowerCase().includes(q) ||
                              (c.tinNumber || '').toLowerCase().includes(q) ||
                              c.vehicles?.some((v: any) => v.plateNumber?.toLowerCase().includes(q))
                            );
                          }).length === 0 && (
                            <div className="p-3 text-center text-muted">
                              No customer found.
                              <div className="mt-2">
                                <Link href="/customer-service" className="btn btn-sm btn-primary" target="_blank">
                                  <i className="bi bi-plus-circle me-1"></i> Add New Customer
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vehicle Select */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary">Vehicle Plate *</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    const vehId = e.target.value;
                    setSelectedVehicleId(vehId);
                    const v = vehicles.find((item) => item.id === vehId);
                    if (v) {
                      setChassisNumber(v.chassisNumber || '');
                      setMake(v.make || 'Toyota');
                      setModel(v.model || '');
                      if (!selectedCustomerId && v.customerId) {
                        setSelectedCustomerId(v.customerId);
                      }
                    }
                  }}
                >
                  <option value="">-- Select Vehicle Plate --</option>
                  {(selectedCustomerId
                    ? vehicles.filter((v) => v.customerId === selectedCustomerId)
                    : vehicles
                  ).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.make} {v.model})
                    </option>
                  ))}
                  {selectedCustomerId &&
                    vehicles.filter((v) => v.customerId === selectedCustomerId).length === 0 && (
                      <option disabled value="">
                        (No vehicle registered for this customer)
                      </option>
                    )}
                </select>
              </div>

              {/* Assigned Mechanic */}
              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Assigned Mechanic</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedMechanicId}
                  onChange={(e) => setSelectedMechanicId(e.target.value)}
                >
                  <option value="">-- Select Mechanic --</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Chassis Number</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value)}
                  placeholder="e.g. MHF21TR..."
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Make</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Model</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Pricing Options</label>
                <select
                  className="form-select form-select-sm"
                  value={pricingOption}
                  onChange={(e) => setPricingOption(e.target.value)}
                >
                  <option value="Separate pricing for each Services and Parts">
                    Separate pricing for each Services and Parts
                  </option>
                  <option value="Aggregate pricing for Services and Separated">
                    Aggregate pricing for Services and Separated
                  </option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <div className="form-check mt-md-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="skipCardCheck"
                    checked={skipCardNumber}
                    onChange={(e) => setSkipCardNumber(e.target.checked)}
                  />
                  <label className="form-check-label small fw-semibold text-secondary" htmlFor="skipCardCheck">
                    Skip Card Number
                  </label>
                </div>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Odo Meter (KM)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={odoMeter}
                  onChange={(e) => setOdoMeter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Fuel Level</label>
                <select
                  className="form-select form-select-sm"
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                >
                  <option value="Empty">Empty</option>
                  <option value="1/4">1/4</option>
                  <option value="1/2">1/2</option>
                  <option value="3/4">3/4</option>
                  <option value="Full">Full</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-secondary">Entry Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Conditions, Services, Part Requisitions (Photos 3 & 4) */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white border-bottom p-0">
            <ul className="nav nav-tabs card-header-tabs m-0 px-3 pt-2">
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold ${activeTab === 'CONDITIONS' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('CONDITIONS')}
                >
                  <i className="bi bi-ui-checks me-1"></i> Conditions
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold ${activeTab === 'SERVICES' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('SERVICES')}
                >
                  <i className="bi bi-tools me-1"></i> Services ({servicesList.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold ${activeTab === 'PARTS' ? 'active text-primary' : 'text-secondary'}`}
                  onClick={() => setActiveTab('PARTS')}
                >
                  <i className="bi bi-box-seam me-1"></i> Part Requisitions ({partsList.length})
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-4">
            {/* Tab 1: Conditions */}
            {activeTab === 'CONDITIONS' && (
              <div>
                <h6 className="fw-bold text-secondary mb-3">Vehicle Incoming Checklist & Accessories</h6>
                <div className="row g-3 mb-3">
                  <div className="col-6 col-md-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="spareWheel"
                        checked={conditionChecklist.spareWheel}
                        onChange={(e) => setConditionChecklist({ ...conditionChecklist, spareWheel: e.target.checked })}
                      />
                      <label className="form-check-label small" htmlFor="spareWheel">
                        Spare Wheel
                      </label>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="jack"
                        checked={conditionChecklist.jackAndHandle}
                        onChange={(e) => setConditionChecklist({ ...conditionChecklist, jackAndHandle: e.target.checked })}
                      />
                      <label className="form-check-label small" htmlFor="jack">
                        Jack & Handle
                      </label>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="spanner"
                        checked={conditionChecklist.wheelSpanner}
                        onChange={(e) => setConditionChecklist({ ...conditionChecklist, wheelSpanner: e.target.checked })}
                      />
                      <label className="form-check-label small" htmlFor="spanner">
                        Wheel Spanner
                      </label>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="radio"
                        checked={conditionChecklist.radioWorking}
                        onChange={(e) => setConditionChecklist({ ...conditionChecklist, radioWorking: e.target.checked })}
                      />
                      <label className="form-check-label small" htmlFor="radio">
                        Radio / Sound System
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Body Scratches & Defect Notes
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe any pre-existing dents, scratches, missing hubcaps, fuel caps..."
                    value={conditionChecklist.notes}
                    onChange={(e) => setConditionChecklist({ ...conditionChecklist, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Tab 2: Services */}
            {activeTab === 'SERVICES' && (
              <div>
                <h6 className="fw-bold text-secondary mb-3">Labour Services & Operations</h6>
                <div className="row g-2 mb-3">
                  <div className="col-md-7">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Service description (e.g. LHS Fender Strip & Rebuild, Brake Overhaul...)"
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="Labour Cost (ETB)"
                      value={newServiceCost}
                      onChange={(e) => setNewServiceCost(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button type="button" className="btn btn-primary btn-sm w-100" onClick={handleAddService}>
                      <i className="bi bi-plus-lg"></i> Add Service
                    </button>
                  </div>
                </div>

                <table className="table table-bordered table-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}>No</th>
                      <th>Service Description</th>
                      <th style={{ width: '180px' }}>Labour Cost (ETB)</th>
                      <th style={{ width: '60px' }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3 small">
                          <i className="bi bi-inbox me-1"></i> No labour services added yet. Enter service description and cost above, then click <strong>Add Service</strong>.
                        </td>
                      </tr>
                    ) : (
                      servicesList.map((s, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{s.description}</td>
                          <td className="fw-semibold">{(parseFloat(s.cost) || 0).toLocaleString()}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-1"
                              onClick={() => handleRemoveService(idx)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="text-end fw-bold">Labour Subtotal:</td>
                      <td className="fw-bold text-primary">ETB {labourSubtotal.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Tab 3: Part Requisitions (Photo 3 / Photo 4) */}
            {activeTab === 'PARTS' && (
              <div>
                <div className="card bg-light border-0 p-3 mb-3">
                  <h6 className="fw-bold text-dark mb-3">Store Requisition Form</h6>
                  <div className="row g-2 align-items-end">
                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-semibold text-secondary">Part from Inventory *</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedPartId}
                        onChange={(e) => handleSelectPart(e.target.value)}
                      >
                        <option value="">-- Choose Spare Part --</option>
                        {inventoryParts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.category} - {p.name} ({p.partNumber}) [Stock: {p.quantity} {p.unit}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6 col-md-2">
                      <label className="form-label small fw-semibold text-secondary">Quantity</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="1"
                        value={partQty}
                        onChange={(e) => setPartQty(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>

                    <div className="col-6 col-md-3">
                      <label className="form-label small fw-semibold text-secondary">Unit Price (ETB)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={partUnitPrice}
                        onChange={(e) => setPartUnitPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="col-12 col-md-2">
                      <button type="button" className="btn btn-success btn-sm w-100" onClick={handleAddPart}>
                        <i className="bi bi-cart-plus me-1"></i> Add Part
                      </button>
                    </div>
                  </div>
                </div>

                <table className="table table-bordered table-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}>No</th>
                      <th>Part Category & Name</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                      <th style={{ width: '60px' }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-muted">
                          No requisitioned parts added yet.
                        </td>
                      </tr>
                    ) : (
                      partsList.map((p, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{p.partName}</strong>
                            {p.partNumber && <small className="text-muted d-block">{p.partNumber}</small>}
                          </td>
                          <td>{p.quantity}</td>
                          <td>ETB {p.unitPrice.toLocaleString()}</td>
                          <td className="fw-semibold">ETB {p.totalPrice.toLocaleString()}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-1"
                              onClick={() => handleRemovePart(idx)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="text-end fw-bold">Parts Subtotal:</td>
                      <td className="fw-bold text-success">ETB {partsSubtotal.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Summary & Action Buttons */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-12 col-md-6 mb-3 mb-md-0">
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-secondary">Labour Subtotal:</span>
                    <strong>ETB {labourSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-secondary">Parts Subtotal:</span>
                    <strong>ETB {partsSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-secondary">Sub Total:</span>
                    <strong>ETB {subTotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-secondary">15% VAT:</span>
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
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    onClick={() => handleSaveCard(false)}
                    disabled={saving}
                  >
                    <i className="bi bi-save me-1"></i> Save Card
                  </button>

                  <button
                    type="button"
                    className="btn btn-info text-white px-3 py-2 fw-semibold"
                    onClick={() => handleSaveCard(true)}
                    disabled={saving}
                  >
                    <i className="bi bi-check-all me-1"></i> Save And Clear
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
