import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/reports');
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const invoices = reportData?.invoices || [];
  const mechanics = reportData?.mechanicPerformance || [];

  const totalLabour = invoices.reduce((acc: number, i: any) => acc + i.labourTotal, 0);
  const totalParts = invoices.reduce((acc: number, i: any) => acc + i.partsTotal, 0);
  const totalVAT = invoices.reduce((acc: number, i: any) => acc + i.vatAmount, 0);
  const totalGross = invoices.reduce((acc: number, i: any) => acc + i.grandTotal, 0);

  const handleExportCSV = () => {
    const headers = ['Invoice No,FS No,Date,Customer,Plate,Labour (ETB),Parts (ETB),VAT 15% (ETB),Grand Total (ETB),Payment Method,Status'];
    const rows = invoices.map((inv: any) =>
      [
        inv.invoiceNumber,
        inv.fsNumber,
        new Date(inv.date).toLocaleDateString(),
        `"${inv.customer?.name || ''}"`,
        inv.vehicle?.plateNumber || '',
        inv.labourTotal,
        inv.partsTotal,
        inv.vatAmount,
        inv.grandTotal,
        inv.paymentMethod,
        inv.status,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wise_Digital_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Head>
        <title>Reports & Analytics | Wise Digital Garage System</title>
      </Head>

      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Reports & Analytics</h4>
            <p className="text-muted small mb-0">Financial revenue breakdown, mechanic throughput, and official invoice records</p>
          </div>
          <div className="d-flex gap-2 no-print">
            <button className="btn btn-outline-secondary btn-sm" onClick={handleExportCSV}>
              <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export to CSV
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> Print Report
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
              <div className="small text-muted text-uppercase fw-semibold">Labour Revenue</div>
              <h3 className="fw-bold text-primary my-2">ETB {totalLabour.toLocaleString()}</h3>
              <small className="text-secondary">Mechanic labour billed</small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
              <div className="small text-muted text-uppercase fw-semibold">Parts Revenue</div>
              <h3 className="fw-bold text-success my-2">ETB {totalParts.toLocaleString()}</h3>
              <small className="text-secondary">Inventory spare parts billed</small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
              <div className="small text-muted text-uppercase fw-semibold">15% VAT Collected</div>
              <h3 className="fw-bold text-warning my-2">ETB {totalVAT.toLocaleString()}</h3>
              <small className="text-secondary">Official tax remittance value</small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-3 p-3 text-white" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
              <div className="small text-white-50 text-uppercase fw-semibold">Gross Revenue</div>
              <h3 className="fw-bold my-2">ETB {totalGross.toLocaleString()}</h3>
              <small className="text-white-75">All closed invoices total</small>
            </div>
          </div>
        </div>

        {/* Mechanic Performance Report */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-tools text-primary me-2"></i>
              Mechanic Performance Report
            </h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Mechanic Name</th>
                  <th>Phone</th>
                  <th>Active Cards</th>
                  <th>Completed Cards</th>
                  <th>Labour Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {mechanics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-3 text-muted">No mechanics data available.</td>
                  </tr>
                ) : (
                  mechanics.map((m: any, idx: number) => (
                    <tr key={m.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-bold text-dark">{m.name}</td>
                      <td>{m.phone || '-'}</td>
                      <td>
                        <span className="badge bg-primary">{m.activeCards} Active</span>
                      </td>
                      <td>
                        <span className="badge bg-success">{m.completedCards} Completed</span>
                      </td>
                      <td className="fw-bold text-primary">ETB {m.totalLabourGenerated.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Invoices Ledger */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold mb-0 text-dark">
              <i className="bi bi-receipt text-success me-2"></i>
              Official Attachment Invoices Ledger
            </h6>
            <span className="badge bg-secondary-subtle text-secondary">{invoices.length} Invoices</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th>Invoice Number</th>
                  <th>FS Number</th>
                  <th>Customer</th>
                  <th>Vehicle Plate</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any, idx: number) => (
                  <tr key={inv.id}>
                    <td>{idx + 1}</td>
                    <td className="fw-bold text-dark">{inv.invoiceNumber}</td>
                    <td>
                      <span className="badge bg-danger-subtle text-danger fw-bold">{inv.fsNumber}</span>
                    </td>
                    <td className="fw-semibold">{inv.customer?.name}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{inv.vehicle?.plateNumber}</span>
                    </td>
                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                    <td>{inv.paymentMethod}</td>
                    <td className="fw-bold text-primary">ETB {inv.grandTotal.toLocaleString()}</td>
                    <td>
                      <span className="badge bg-success">{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
