import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useToast, confirmModal } from '@/context/ToastContext';

export default function CustomerServicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchTin, setSearchTin] = useState('');
  const [searchPlate, setSearchPlate] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Customer Modal State
  const [showModal, setShowModal] = useState(false);
  const [customerType, setCustomerType] = useState('INDIVIDUAL');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [insuranceBranch, setInsuranceBranch] = useState('');
  const [surveyorName, setSurveyorName] = useState('');
  const [surveyorPhone, setSurveyorPhone] = useState('');
  const [claimNumber, setClaimNumber] = useState('');

  // Vehicle Details
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('Toyota');
  const [customMake, setCustomMake] = useState('');
  const [model, setModel] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<'JOB_CARD' | 'TERMINATED_JOB_CARD' | 'ONLY_REGISTER'>('JOB_CARD');

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const queryTerm = searchName || searchPhone || searchTin || searchPlate;

    try {
      const res = await axios.get('/api/customers', {
        params: { q: queryTerm },
      });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchTin('');
    setSearchPlate('');
    handleSearch();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const finalMake = make === 'Other' ? (customMake.trim() || 'Other') : make;
    let customerAddress = address.trim();

    if (customerType === 'INDIVIDUAL' && nationalId) {
      customerAddress = customerAddress ? `${customerAddress} (ID: ${nationalId})` : `ID: ${nationalId}`;
    } else if (customerType === 'COMPANY' && contactPerson) {
      customerAddress = customerAddress ? `${customerAddress} (Contact: ${contactPerson})` : `Contact: ${contactPerson}`;
    } else if (customerType === 'INSURANCE') {
      const extra = [
        insuranceBranch ? `Branch: ${insuranceBranch}` : '',
        surveyorName ? `Surveyor: ${surveyorName} (${surveyorPhone || '-'})` : '',
        claimNumber ? `Claim No: ${claimNumber}` : '',
      ].filter(Boolean).join(' | ');
      if (extra) {
        customerAddress = customerAddress ? `${customerAddress} [${extra}]` : extra;
      }
    }

    try {
      const res = await axios.post('/api/customers', {
        customerType,
        name,
        phone,
        tinNumber: customerType === 'INDIVIDUAL' ? undefined : tinNumber,
        vatNumber: customerType === 'INDIVIDUAL' ? undefined : vatNumber,
        address: customerAddress,
        vehicle: plateNumber
          ? {
              plateNumber: plateNumber.trim().toUpperCase(),
              make: finalMake,
              model,
              chassisNumber,
              color,
            }
          : undefined,
      });

      setShowModal(false);
      const newCust = res.data;
      const vehicleId = newCust.vehicles?.[0]?.id || '';

      if (modalMode === 'JOB_CARD') {
        router.push(`/job-cards/new?customerId=${newCust.id}&vehicleId=${vehicleId}`);
      } else if (modalMode === 'TERMINATED_JOB_CARD') {
        router.push(`/job-cards/new?customerId=${newCust.id}&vehicleId=${vehicleId}&autoClose=true`);
      } else {
        handleSearch();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error saving customer');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSaving(true);

    try {
      await axios.put(`/api/customers/${editingCustomer.id}`, {
        customerType: editingCustomer.customerType,
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        tinNumber: editingCustomer.tinNumber,
        vatNumber: editingCustomer.vatNumber,
        address: editingCustomer.address,
      });

      toast.success('Customer updated successfully');
      setEditingCustomer(null);
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (cId: string, cName: string) => {
    const ok = await confirmModal(
      `Are you sure you want to delete customer "${cName}"?`,
      'Delete Customer',
      'error',
      'Yes, Delete Customer',
      'Cancel'
    );
    if (!ok) return;

    try {
      await axios.delete(`/api/customers/${cId}`);
      toast.success('Customer deleted successfully');
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  const openNewCustomerModal = (mode: 'JOB_CARD' | 'TERMINATED_JOB_CARD' | 'ONLY_REGISTER') => {
    setModalMode(mode);
    setName(searchName);
    setPhone(searchPhone);
    setTinNumber(searchTin);
    setPlateNumber(searchPlate);
    setShowModal(true);
  };

  return (
    <>
      <Head>
        <title>Customer Service | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0 text-dark">Customer Service</h4>
        </div>

        {/* Customer Search and Add Form (Matching Photo 5 / Photo 7) */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="fw-bold mb-0 text-secondary">
              <i className="bi bi-search me-2 text-primary"></i>
              Customer Search and Add Form
            </h6>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                onClick={() => openNewCustomerModal('JOB_CARD')}
              >
                <i className="bi bi-plus-lg"></i>
                <span>New Customer / Job Card</span>
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm d-flex align-items-center gap-1"
                onClick={() => openNewCustomerModal('TERMINATED_JOB_CARD')}
              >
                <i className="bi bi-check2-circle"></i>
                <span>New Customer / Terminated Job Card</span>
              </button>
            </div>
          </div>

          <div className="card-body p-4 bg-light bg-opacity-50">
            <form onSubmit={handleSearch}>
              <div className="row g-3">
                <div className="col-12 col-md-3">
                  <label className="form-label small fw-semibold text-secondary">Customer name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Enter customer name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small fw-semibold text-secondary">Tin Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. 1027440012"
                    value={searchTin}
                    onChange={(e) => setSearchTin(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. 0911..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small fw-semibold text-secondary">Plate Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. 2-C83862"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary btn-sm px-4 d-flex align-items-center gap-1">
                  <i className="bi bi-search"></i>
                  <span>Search</span>
                </button>
                <button type="button" className="btn btn-danger btn-sm px-4 d-flex align-items-center gap-1" onClick={handleReset}>
                  <i className="bi bi-arrow-counterclockwise"></i>
                  <span>Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Search Results Table */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">Customers Directory</h6>
            <span className="badge bg-secondary-subtle text-secondary">{customers.length} Entries Found</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>TIN Number</th>
                  <th>Plate Number</th>
                  <th>Make / Model</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Searching records...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No matching customer found. Please use the button above to add a new customer.
                    </td>
                  </tr>
                ) : (
                  customers.map((c, idx) => {
                    const primaryVehicle = c.vehicles?.[0];
                    return (
                      <tr key={c.id}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold text-dark">{c.name}</td>
                        <td>{c.phone}</td>
                        <td>{c.tinNumber || '-'}</td>
                        <td>
                          {primaryVehicle ? (
                            <span className="badge bg-light text-dark border">{primaryVehicle.plateNumber}</span>
                          ) : (
                            <span className="text-muted small">No vehicle</span>
                          )}
                        </td>
                        <td>{primaryVehicle ? `${primaryVehicle.make} ${primaryVehicle.model || ''}` : '-'}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            {primaryVehicle && (
                              <Link
                                href={`/job-cards/new?customerId=${c.id}&vehicleId=${primaryVehicle.id}`}
                                className="btn btn-outline-primary"
                                title="Open Job Card"
                              >
                                <i className="bi bi-card-checklist me-1"></i> New Card
                              </Link>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setEditingCustomer(c)}
                              title="Edit Customer"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Customer / Vehicle Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus-fill me-2"></i>
                  {modalMode === 'JOB_CARD' ? 'Register Customer & Start Job Card' : 'Register New Customer & Vehicle'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateCustomer}>
                <div className="modal-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-primary mb-0">1. Customer Information</h6>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className={`btn ${customerType === 'INDIVIDUAL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setCustomerType('INDIVIDUAL')}
                      >
                        <i className="bi bi-person me-1"></i> Individual
                      </button>
                      <button
                        type="button"
                        className={`btn ${customerType === 'COMPANY' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setCustomerType('COMPANY')}
                      >
                        <i className="bi bi-building me-1"></i> Company
                      </button>
                      <button
                        type="button"
                        className={`btn ${customerType === 'INSURANCE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setCustomerType('INSURANCE')}
                      >
                        <i className="bi bi-shield-check me-1"></i> Insurance
                      </button>
                    </div>
                  </div>

                  {/* Customer Type: INDIVIDUAL */}
                  {customerType === 'INDIVIDUAL' && (
                    <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Customer Full Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Ato Abebe Kebede"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Mobile Phone Number *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 0911223344"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">National ID / Driver License No (Optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. ET-ID-882914"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Residence / City Address</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Addis Ababa, Bole Sub-city"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Customer Type: COMPANY */}
                  {customerType === 'COMPANY' && (
                    <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Company / Enterprise Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Dangote Cement Ethiopia PLC"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Contact Person / Representative</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. W/ro Hiwot Mulugeta (Fleet Mgr)"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Company Phone Number *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 0116629900"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Company TIN Number *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 0002938471"
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">VAT Registration No</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 102948201"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Business Head Office / Branch</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Addis Ababa, Gotera"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Customer Type: INSURANCE */}
                  {customerType === 'INSURANCE' && (
                    <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Insurance Company Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Nyala Insurance S.C. / Awash Insurance"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Branch Office *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Kazanchis Branch"
                          value={insuranceBranch}
                          onChange={(e) => setInsuranceBranch(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Claim / Policy Reference No *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. CLM-2026-9082"
                          value={claimNumber}
                          onChange={(e) => setClaimNumber(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Surveyor / Claims Officer Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Eng. Yohannes Bekele"
                          value={surveyorName}
                          onChange={(e) => setSurveyorName(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Surveyor Phone / Contact</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 0911554433"
                          value={surveyorPhone}
                          onChange={(e) => setSurveyorPhone(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">General Phone *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 0115512233"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Insurance TIN Number</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 0001029384"
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Insurance VAT Number</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 99887766"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <h6 className="fw-bold text-primary mb-3">2. Vehicle Details</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Plate Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-uppercase"
                        placeholder="e.g. 2-C83862"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Make / Brand</label>
                      <select
                        className="form-select form-select-sm"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                      >
                        <option value="Toyota">Toyota</option>
                        <option value="Nissan">Nissan</option>
                        <option value="Hyundai">Hyundai</option>
                        <option value="Isuzu">Isuzu</option>
                        <option value="Mitsubishi">Mitsubishi</option>
                        <option value="Ford">Ford</option>
                        <option value="Mercedes-Benz">Mercedes-Benz</option>
                        <option value="Suzuki">Suzuki</option>
                        <option value="Volkswagen">Volkswagen</option>
                        <option value="BYD">BYD</option>
                        <option value="Geely">Geely</option>
                        <option value="Chery">Chery</option>
                        <option value="Sinotruk">Sinotruk</option>
                        <option value="FAW">FAW</option>
                        <option value="Other">Other (Custom Type)</option>
                      </select>
                    </div>

                    {make === 'Other' && (
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-danger">Custom Brand / Make *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm border-danger"
                          placeholder="e.g. Land Rover, Peugeot, etc."
                          value={customMake}
                          onChange={(e) => setCustomMake(e.target.value)}
                          required={make === 'Other'}
                        />
                      </div>
                    )}

                    <div className={make === 'Other' ? 'col-md-12' : 'col-md-4'}>
                      <label className="form-label small fw-semibold">Model</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Hilux / Land Cruiser / Prado"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Chassis Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. MHF21TR..."
                        value={chassisNumber}
                        onChange={(e) => setChassisNumber(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Color</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Silver / White / Black"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                    {saving ? 'Saving...' : 'Save & Proceed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-secondary text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Customer
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingCustomer(null)}></button>
              </div>

              <form onSubmit={handleUpdateCustomer}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone Number *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">TIN Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingCustomer.tinNumber || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, tinNumber: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Address</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingCustomer.address || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingCustomer(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Customer'}
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
