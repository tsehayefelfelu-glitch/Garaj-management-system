import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useToast, confirmModal } from '@/context/ToastContext';

export default function ActiveJobCardsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMechanic = user?.role === 'MECHANIC';
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    try {
      const res = await axios.get('/api/job-cards', { params: { status: 'ACTIVE' } });
      setJobCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJobCard = async (jcId: string, cardNum: string) => {
    const ok = await confirmModal(
      `Are you sure you want to delete Job Card "${cardNum}"? Any requisitioned parts will be automatically refunded back to inventory.`,
      'Delete Job Card',
      'error',
      'Yes, Delete Job Card',
      'Cancel'
    );
    if (!ok) return;

    try {
      await axios.delete(`/api/job-cards/${jcId}`);
      toast.success(`Job Card ${cardNum} deleted and parts restored to store.`);
      fetchJobCards();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete Job Card');
    }
  };

  const filteredCards = jobCards.filter((jc) => {
    const s = searchTerm.toLowerCase();
    return (
      jc.cardNumber.toLowerCase().includes(s) ||
      jc.customer?.name.toLowerCase().includes(s) ||
      jc.vehicle?.plateNumber.toLowerCase().includes(s) ||
      (jc.mechanic?.fullName || '').toLowerCase().includes(s)
    );
  });

  const handleExportCSV = () => {
    const headers = ['No,Card Number,Customer,Vehicle,Entry Date,Mechanic,Status,Payment,Labour Subtotal,Parts Subtotal,Grand Total'];
    const rows = filteredCards.map((jc, i) =>
      [
        i + 1,
        jc.cardNumber,
        `"${jc.customer?.name || ''}"`,
        jc.vehicle?.plateNumber || '',
        new Date(jc.entryDate).toLocaleDateString(),
        `"${jc.mechanic?.fullName || 'Unassigned'}"`,
        jc.status,
        jc.paymentStatus,
        jc.labourSubtotal,
        jc.partsSubtotal,
        jc.grandTotal,
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Active_Job_Cards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Head>
        <title>{isMechanic ? 'My Assigned Cards' : 'Active Job Cards'} | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">{isMechanic ? 'My Assigned Job Cards' : 'Active Job Cards'}</h4>
            <p className="text-muted small mb-0">
              {isMechanic
                ? 'Vehicles and repair tasks currently assigned to you'
                : 'Currently ongoing repair, inspection, and maintenance cards in workshop'}
            </p>
          </div>
          {!isMechanic && (
            <Link href="/job-cards/new" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <i className="bi bi-plus-circle"></i>
              <span>+ New Job Card</span>
            </Link>
          )}
        </div>

        {/* DataTables Control Bar (Matching Photo 2 & 3) */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex gap-1 no-print">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(filteredCards, null, 2))}
              >
                <i className="bi bi-clipboard me-1"></i> Copy
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleExportCSV}>
                <i className="bi bi-file-earmark-spreadsheet me-1"></i> CSV
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
                <i className="bi bi-printer me-1"></i> Print
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 no-print">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Card #, customer, plate..."
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
                  <th>Card Number</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Entry Date</th>
                  <th>Mechanic</th>
                  <th>Status</th>
                  {!isMechanic && <th>Payment</th>}
                  <th className="text-end no-print">{isMechanic ? 'Actions' : 'Card Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isMechanic ? 8 : 9} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading job cards...
                    </td>
                  </tr>
                ) : filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={isMechanic ? 8 : 9} className="text-center py-4 text-muted">
                      No job cards found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((jc, idx) => (
                    <tr key={jc.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <Link href={`/job-cards/${jc.id}`} className="fw-bold text-primary text-decoration-none">
                          {jc.cardNumber}
                        </Link>
                      </td>
                      <td className="fw-semibold">{jc.customer?.name}</td>
                      <td>
                        <span className="badge bg-light text-dark border me-1">{jc.vehicle?.plateNumber}</span>
                        <small className="text-muted">{jc.vehicle?.make} {jc.vehicle?.model}</small>
                      </td>
                      <td>{new Date(jc.entryDate).toLocaleDateString()}</td>
                      <td>{jc.mechanic?.fullName || <span className="text-muted small">Unassigned</span>}</td>
                      <td>
                        <span className="badge bg-primary">ACTIVE</span>
                      </td>
                      {!isMechanic && (
                        <td>
                          <span className={`badge ${jc.paymentStatus === 'PAID' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {jc.paymentStatus}
                          </span>
                        </td>
                      )}
                      <td className="text-end no-print">
                        <div className="btn-group btn-group-sm">
                          <Link href={`/job-cards/${jc.id}`} className="btn btn-outline-primary" title={isMechanic ? 'View Assigned Tasks' : 'View / Edit'}>
                            <i className="bi bi-eye"></i> {isMechanic ? 'View Tasks' : ''}
                          </Link>
                          {!isMechanic && (
                            <>
                              <Link href={`/job-cards/${jc.id}?action=close`} className="btn btn-outline-success" title="Terminate & Issue Invoice">
                                <i className="bi bi-check2-circle"></i> Terminate
                              </Link>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteJobCard(jc.id, jc.cardNumber)}
                                title="Delete Card"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center small text-muted">
            <div>Showing {filteredCards.length} entries</div>
            <div>Wise Digital Workshop Operations</div>
          </div>
        </div>
      </div>
    </>
  );
}
