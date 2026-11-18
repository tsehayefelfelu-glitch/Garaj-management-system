import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function CustomerCreditsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Modal State
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await axios.get('/api/credits');
      setCredits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !paymentAmount) return;

    setRecording(true);
    try {
      await axios.post('/api/credits', {
        creditId: selectedCredit.id,
        amountPaid: parseFloat(paymentAmount),
        notes: paymentNotes,
      });

      alert('Payment recorded successfully!');
      setSelectedCredit(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchCredits();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setRecording(false);
    }
  };

  const totalOutstanding = credits.reduce((acc, c) => acc + c.remainingDue, 0);
  const totalPaid = credits.reduce((acc, c) => acc + c.paidAmount, 0);

  const filteredCredits = credits.filter((c) => {
    const s = searchTerm.toLowerCase();
    return (
      c.customer?.name.toLowerCase().includes(s) ||
      (c.customer?.phone || '').toLowerCase().includes(s) ||
      (c.customer?.tinNumber || '').toLowerCase().includes(s)
    );
  });

  return (
    <>
      <Head>
        <title>Customer Credits | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Customer Credits & Receivables</h4>
            <p className="text-muted small mb-0">Track credit receivables from corporate clients and insurance companies</p>
          </div>
        </div>

        {/* Credit Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm rounded-3 p-3 text-white" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small text-uppercase fw-semibold">Total Outstanding Due</div>
                  <h3 className="fw-bold my-2">ETB {totalOutstanding.toLocaleString()}</h3>
                  <small className="text-white-75">Uncollected receivables from debtors</small>
                </div>
                <div className="p-3 bg-white bg-opacity-25 rounded-3">
                  <i className="bi bi-wallet2 fs-2"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm rounded-3 p-3 text-white" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small text-uppercase fw-semibold">Total Collected Payments</div>
                  <h3 className="fw-bold my-2">ETB {totalPaid.toLocaleString()}</h3>
                  <small className="text-white-75">Successfully received settlements</small>
                </div>
                <div className="p-3 bg-white bg-opacity-25 rounded-3">
                  <i className="bi bi-cash-coin fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Table */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h6 className="fw-bold mb-0 text-dark">Debtor Clients & Insurances</h6>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Client name, phone..."
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
                  <th>Phone Number</th>
                  <th>TIN Number</th>
                  <th>Total Credit</th>
                  <th>Paid Amount</th>
                  <th>Remaining Due</th>
                  <th>Last Payment</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading Customer Credits...
                    </td>
                  </tr>
                ) : filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No outstanding credit records found.
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-bold text-dark">{c.customer?.name}</td>
                      <td>{c.customer?.phone}</td>
                      <td>{c.customer?.tinNumber || '-'}</td>
                      <td>ETB {c.totalCredit.toLocaleString()}</td>
                      <td className="text-success fw-semibold">ETB {c.paidAmount.toLocaleString()}</td>
                      <td>
                        <span className={`fw-bold ${c.remainingDue > 0 ? 'text-danger' : 'text-success'}`}>
                          ETB {c.remainingDue.toLocaleString()}
                        </span>
                      </td>
                      <td>{c.lastPaymentAt ? new Date(c.lastPaymentAt).toLocaleDateString() : '-'}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedCredit(c);
                            setPaymentAmount('');
                            setPaymentNotes('');
                          }}
                        >
                          <i className="bi bi-cash-stack"></i>
                          <span>Record Payment</span>
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

      {/* Record Payment Modal */}
      {selectedCredit && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-cash-coin me-2"></i> Record Credit Payment
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCredit(null)}></button>
              </div>

              <form onSubmit={handleRecordPayment}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted">Customer Name</label>
                    <div className="fw-bold fs-6">{selectedCredit.customer?.name}</div>
                  </div>

                  <div className="mb-3 p-3 bg-light rounded d-flex justify-content-between">
                    <div>
                      <small className="text-muted d-block">Total Invoiced Credit</small>
                      <strong>ETB {selectedCredit.totalCredit.toLocaleString()}</strong>
                    </div>
                    <div>
                      <small className="text-muted d-block">Current Outstanding Due</small>
                      <strong className="text-danger">ETB {selectedCredit.remainingDue.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Payment Amount (ETB) *</label>
                    <input
                      type="number"
                      step="any"
                      max={selectedCredit.remainingDue}
                      className="form-control"
                      placeholder="Enter amount paid..."
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Payment Notes / Bank Reference</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. CBE Transfer Ref: FT26011..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedCredit(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4 fw-semibold" disabled={recording}>
                    {recording ? 'Recording...' : 'Confirm Payment'}
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
