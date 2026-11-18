import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

export default function TerminatedJobCardsPage() {
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTerminatedCards();
  }, []);

  const fetchTerminatedCards = async () => {
    try {
      const res = await axios.get('/api/job-cards', { params: { status: 'TERMINATED' } });
      setJobCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = jobCards.filter((jc) => {
    const s = searchTerm.toLowerCase();
    return (
      jc.cardNumber.toLowerCase().includes(s) ||
      jc.customer?.name.toLowerCase().includes(s) ||
      jc.vehicle?.plateNumber.toLowerCase().includes(s) ||
      jc.paymentStatus.toLowerCase().includes(s)
    );
  });

  const handleExportCSV = () => {
    const headers = ['No,Card Number,Customer,Vehicle,Entry Date,Closed Date,Status,Payment,Grand Total,FS Number'];
    const rows = filteredCards.map((jc, i) =>
      [
        i + 1,
        jc.cardNumber,
        `"${jc.customer?.name || ''}"`,
        jc.vehicle?.plateNumber || '',
        new Date(jc.entryDate).toLocaleDateString(),
        jc.closedDate ? new Date(jc.closedDate).toLocaleDateString() : '',
        jc.status,
        jc.paymentStatus,
        jc.grandTotal,
        jc.invoices?.[0]?.fsNumber || '',
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Terminated_Job_Cards_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Head>
        <title>Terminated Job Cards | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Terminated Job Cards</h4>
            <p className="text-muted small mb-0">Closed job cards with finalized payments and official attachment invoices</p>
          </div>
        </div>

        {/* DataTables Control Bar (Matching Photo 2 exactly) */}
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
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="text-end no-print">Card Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading Terminated Job Cards...
                    </td>
                  </tr>
                ) : filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No terminated cards found.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((jc, idx) => {
                    const invoice = jc.invoices?.[0];
                    return (
                      <tr key={jc.id}>
                        <td>{idx + 1}</td>
                        <td className="fw-bold text-dark">{jc.cardNumber}</td>
                        <td className="fw-semibold">{jc.customer?.name}</td>
                        <td>
                          <span className="badge bg-light text-dark border me-1">{jc.vehicle?.plateNumber}</span>
                        </td>
                        <td>{new Date(jc.entryDate).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-secondary">Terminated</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              jc.paymentStatus === 'PAID'
                                ? 'bg-success'
                                : jc.paymentStatus === 'CREDIT'
                                ? 'bg-info text-dark'
                                : 'bg-warning text-dark'
                            }`}
                          >
                            {jc.paymentStatus}
                          </span>
                        </td>
                        <td className="text-end no-print">
                          <div className="btn-group btn-group-sm">
                            {invoice ? (
                              <Link
                                href={`/invoices/${invoice.id}/print`}
                                className="btn btn-outline-primary"
                                title="Print Attachment Cash Invoice"
                                target="_blank"
                              >
                                <i className="bi bi-printer me-1"></i> Preview Attachment
                              </Link>
                            ) : (
                              <Link
                                href={`/job-cards/${jc.id}`}
                                className="btn btn-outline-secondary"
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i> View
                              </Link>
                            )}
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
            <div>Showing {filteredCards.length} entries</div>
            <div>Wise Digital Garage System</div>
          </div>
        </div>
      </div>
    </>
  );
}
