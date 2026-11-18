import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function JobCardDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const isMechanic = user?.role === 'MECHANIC';

  const [jobCard, setJobCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [customFsNumber, setCustomFsNumber] = useState('');
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    if (id) fetchCardDetails();
  }, [id]);

  useEffect(() => {
    if (router.query.action === 'close') {
      setShowTerminateModal(true);
    }
  }, [router.query]);

  const fetchCardDetails = async () => {
    try {
      const res = await axios.get(`/api/job-cards/${id}`);
      setJobCard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setTerminating(true);

    try {
      const res = await axios.post(`/api/job-cards/${id}/terminate`, {
        paymentMethod,
        paymentStatus,
        customFsNumber: customFsNumber || undefined,
      });

      alert('Job Card successfully terminated & Official Attachment Cash Invoice generated!');
      setShowTerminateModal(false);
      fetchCardDetails();
      if (res.data.invoice?.id) {
        router.push(`/invoices/${res.data.invoice.id}/print`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to terminate card');
    } finally {
      setTerminating(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Are you sure you want to delete this Job Card? Any requisitioned parts will be refunded to store.')) return;
    try {
      await axios.delete(`/api/job-cards/${id}`);
      alert('Job Card deleted successfully');
      router.push('/job-cards');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete card');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading Job Card...</p>
      </div>
    );
  }

  if (!jobCard) {
    return <div className="alert alert-danger">Job Card not found.</div>;
  }

  const invoice = jobCard.invoices?.[0];

  return (
    <>
      <Head>
        <title>{jobCard.cardNumber} | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <Link href="/job-cards" className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div>
              <h4 className="fw-bold mb-0 text-dark">
                Job Card: {jobCard.cardNumber}
                <span className={`badge ms-2 ${jobCard.status === 'ACTIVE' ? 'bg-primary' : 'bg-secondary'}`}>
                  {jobCard.status}
                </span>
                <span className={`badge ms-1 ${jobCard.paymentStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {jobCard.paymentStatus}
                </span>
              </h4>
              <small className="text-muted">Entry Date: {new Date(jobCard.entryDate).toLocaleString()}</small>
            </div>
          </div>

          <div className="d-flex gap-2">
            {invoice ? (
              <Link href={`/invoices/${invoice.id}/print`} className="btn btn-primary btn-sm" target="_blank">
                <i className="bi bi-printer me-1"></i> Preview Attachment Cash Invoice
              </Link>
            ) : !isMechanic ? (
              <button
                type="button"
                className="btn btn-success btn-sm d-flex align-items-center gap-1"
                onClick={() => setShowTerminateModal(true)}
              >
                <i className="bi bi-check2-circle"></i>
                <span>Terminate & Issue Invoice</span>
              </button>
            ) : null}
            {!isMechanic && (
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDeleteCard} title="Delete Card">
                <i className="bi bi-trash"></i>
              </button>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Information Header */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-white py-2 fw-bold text-secondary">
                <i className="bi bi-person me-2 text-primary"></i> Customer Details
              </div>
              <div className="card-body">
                <p className="mb-1"><strong>Name:</strong> {jobCard.customer?.name}</p>
                <p className="mb-1"><strong>Phone:</strong> {jobCard.customer?.phone}</p>
                <p className="mb-1"><strong>TIN Number:</strong> {jobCard.customer?.tinNumber || 'N/A'}</p>
                <p className="mb-0"><strong>Address:</strong> {jobCard.customer?.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-header bg-white py-2 fw-bold text-secondary">
                <i className="bi bi-car-front me-2 text-primary"></i> Vehicle & Intake Specs
              </div>
              <div className="card-body">
                <p className="mb-1"><strong>Plate Number:</strong> <span className="badge bg-light text-dark border">{jobCard.vehicle?.plateNumber}</span></p>
                <p className="mb-1"><strong>Make & Model:</strong> {jobCard.vehicle?.make} {jobCard.vehicle?.model}</p>
                <p className="mb-1"><strong>Chassis No:</strong> {jobCard.vehicle?.chassisNumber || 'N/A'}</p>
                <p className="mb-0"><strong>Odometer / Fuel:</strong> {jobCard.odoMeter} KM | {jobCard.fuelLevel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 fw-bold">
            <i className="bi bi-wrench-adjustable me-2 text-primary"></i> Labour Services
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Description</th>
                  <th>Category</th>
                  {!isMechanic && <th>Cost (ETB)</th>}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobCard.services?.map((s: any, idx: number) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td className="fw-semibold">{s.description}</td>
                    <td>{s.category || 'General'}</td>
                    {!isMechanic && <td>ETB {s.cost.toLocaleString()}</td>}
                    <td>
                      <span className="badge bg-success-subtle text-success">{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Parts Requisition Table */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 fw-bold">
            <i className="bi bi-box-seam me-2 text-success"></i> Requisitioned Parts
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Part Name</th>
                  <th>Part Number</th>
                  <th>Quantity</th>
                  {!isMechanic && <th>Unit Price</th>}
                  {!isMechanic && <th>Total Price</th>}
                </tr>
              </thead>
              <tbody>
                {jobCard.parts?.length === 0 ? (
                  <tr>
                    <td colSpan={isMechanic ? 4 : 6} className="text-center py-3 text-muted">No store parts requisitioned for this card.</td>
                  </tr>
                ) : (
                  jobCard.parts?.map((p: any, idx: number) => (
                    <tr key={p.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{p.partName}</td>
                      <td>{p.partNumber || '-'}</td>
                      <td>{p.quantity}</td>
                      {!isMechanic && <td>ETB {p.unitPrice.toLocaleString()}</td>}
                      {!isMechanic && <td className="fw-bold">ETB {p.totalPrice.toLocaleString()}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Calculation Card - Hidden for mechanics */}
        {!isMechanic && (
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-body p-4 bg-light">
              <div className="row justify-content-end">
                <div className="col-12 col-md-5">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Labour Subtotal:</span>
                    <strong>ETB {jobCard.labourSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Parts Subtotal:</span>
                    <strong>ETB {jobCard.partsSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Subtotal:</span>
                    <strong>ETB {jobCard.subTotal.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">15% VAT:</span>
                    <strong>ETB {jobCard.vatAmount.toLocaleString()}</strong>
                  </div>
                  <hr className="my-1" />
                  <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                    <span>Grand Total:</span>
                    <span>ETB {jobCard.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminate Modal */}
      {showTerminateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-receipt me-2"></i> Terminate Job Card & Generate Invoice
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTerminateModal(false)}></button>
              </div>

              <form onSubmit={handleTerminateCard}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Terminating this card will close operations and generate the official <strong>Attachment Cash Invoice</strong>.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Payment Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <option value="PAID">PAID - Fully Settled</option>
                      <option value="CREDIT">CREDIT - Add to Customer Credits</option>
                      <option value="UNPAID">UNPAID - Pending</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Payment Method</label>
                    <select
                      className="form-select form-select-sm"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK">Bank Transfer / Telebirr / CBE</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Custom FS Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Leave blank for automatic FS sequence"
                      value={customFsNumber}
                      onChange={(e) => setCustomFsNumber(e.target.value)}
                    />
                  </div>

                  <div className="p-3 bg-light rounded text-center">
                    <div className="small text-muted">Amount to Invoice</div>
                    <h4 className="fw-bold text-success mb-0">ETB {jobCard.grandTotal.toLocaleString()}</h4>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTerminateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4 fw-semibold" disabled={terminating}>
                    {terminating ? 'Processing...' : 'Terminate & Print Invoice'}
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
