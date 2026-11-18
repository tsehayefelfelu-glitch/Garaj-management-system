import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';

export default function ProformaListPage() {
  const [proformas, setProformas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProformas();
  }, []);

  const fetchProformas = async () => {
    try {
      const res = await axios.get('/api/proformas');
      setProformas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (proformaId: string) => {
    if (!confirm('Are you sure you want to convert this Proforma into an Active Job Card? All items will be cloned to the new card.')) return;

    try {
      const res = await axios.post(`/api/proformas/${proformaId}/convert`, {});
      alert(`Successfully converted to Job Card ${res.data.jobCard.cardNumber}!`);
      fetchProformas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to convert proforma');
    }
  };

  const handleDeleteProforma = async (pId: string, pNum: string) => {
    if (!confirm(`Are you sure you want to delete Proforma "${pNum}"?`)) return;

    try {
      await axios.delete(`/api/proformas/${pId}`);
      alert(`Proforma ${pNum} deleted successfully`);
      fetchProformas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete proforma');
    }
  };

  const filteredProformas = proformas.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      p.proformaNumber.toLowerCase().includes(s) ||
      (p.customer?.name || '').toLowerCase().includes(s) ||
      (p.insuranceCompany || '').toLowerCase().includes(s) ||
      (p.claimNumber || '').toLowerCase().includes(s) ||
      (p.vehicle?.plateNumber || '').toLowerCase().includes(s);

    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['No,Proforma Number,Customer / Insurance,Claim Number,Plate Number,Date,Status,Labour Subtotal,Replace Subtotal,Grand Total'];
    const rows = filteredProformas.map((p, i) =>
      [
        i + 1,
        p.proformaNumber,
        `"${p.insuranceCompany || p.customer?.name || ''}"`,
        p.claimNumber || '',
        p.vehicle?.plateNumber || '',
        new Date(p.createdAt).toLocaleDateString(),
        p.status,
        p.labourSubtotal,
        p.partsSubtotal,
        p.grandTotal,
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Proformas_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Head>
        <title>Proforma Management | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Proforma Management</h4>
            <p className="text-muted small mb-0">Prepare estimations for insurance claims, corporate fleets, and private repairs</p>
          </div>
          <Link href="/proforma/new" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-plus-circle"></i>
            <span>+ New Proforma</span>
          </Link>
        </div>

        {/* Filter & Control Bar (Matching Photo 6) */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All ({proformas.length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('ACTIVE')}
                >
                  Active ({proformas.filter((p) => p.status === 'ACTIVE').length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'CONVERTED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('CONVERTED')}
                >
                  Converted ({proformas.filter((p) => p.status === 'CONVERTED').length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'TERMINATED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('TERMINATED')}
                >
                  Terminated
                </button>
              </div>

              <div className="d-flex gap-1 no-print">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(filteredProformas, null, 2))}
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
            </div>

            <div className="d-flex align-items-center gap-2 no-print">
              <label className="small text-secondary fw-semibold mb-0">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Proforma #, claim, insurance, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '230px' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Proforma Number</th>
                  <th>Customer / Insurance</th>
                  <th>Claim Number</th>
                  <th>Plate Number</th>
                  <th>Date</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th className="text-end no-print">Card Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      Loading Proformas...
                    </td>
                  </tr>
                ) : filteredProformas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No proforma records found.
                    </td>
                  </tr>
                ) : (
                  filteredProformas.map((p, idx) => (
                    <tr key={p.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="fw-bold text-dark">{p.proformaNumber}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">{p.insuranceCompany || p.customer?.name}</div>
                        {p.surveyorName && <small className="text-muted d-block">Surveyor: {p.surveyorName}</small>}
                      </td>
                      <td>{p.claimNumber || '-'}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{p.vehicle?.plateNumber}</span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="fw-bold text-primary">ETB {p.grandTotal.toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'ACTIVE'
                              ? 'bg-warning text-dark'
                              : p.status === 'CONVERTED'
                              ? 'bg-success'
                              : 'bg-secondary'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="text-end no-print">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/proforma/${p.id}/print`}
                            className="btn btn-outline-secondary"
                            title="Print A4 Layout"
                            target="_blank"
                          >
                            <i className="bi bi-printer"></i> Print
                          </Link>

                          {p.status === 'ACTIVE' && (
                            <button
                              type="button"
                              className="btn btn-primary d-inline-flex align-items-center gap-1"
                              onClick={() => handleConvert(p.id)}
                              title="One-Click Convert to Job Card"
                            >
                              <i className="bi bi-arrow-repeat"></i>
                              <span>Convert</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteProforma(p.id, p.proformaNumber)}
                            title="Delete Proforma"
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
          <div className="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center small text-muted">
            <div>Showing {filteredProformas.length} entries</div>
            <div>Wise Digital Proforma System</div>
          </div>
        </div>
      </div>
    </>
  );
}
