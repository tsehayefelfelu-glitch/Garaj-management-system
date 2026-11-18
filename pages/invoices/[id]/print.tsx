import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function AttachmentCashInvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios
        .get(`/api/reports`)
        .then((res) => {
          const inv = res.data.invoices?.find((i: any) => i.id === id);
          if (inv) {
            setInvoice(inv);
          } else {
            axios.get(`/api/job-cards/${id}`).then((cRes) => {
              if (cRes.data?.invoices?.[0]) {
                setInvoice({
                  ...cRes.data.invoices[0],
                  jobCard: cRes.data,
                  customer: cRes.data.customer,
                  vehicle: cRes.data.vehicle,
                });
              }
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Preparing Attachment Cash Invoice Print Layout...</p>
      </div>
    );
  }

  if (!invoice) {
    return <div className="alert alert-danger m-4">Invoice record not found.</div>;
  }

  const jobCard = invoice.jobCard;
  const services = jobCard?.services || [];
  const parts = jobCard?.parts || [];

  return (
    <>
      <Head>
        <title>Attachment Cash Invoice - FS {invoice.fsNumber}</title>
      </Head>

      <div className="bg-light py-2 min-vh-100">
        {/* Floating Print Control Bar */}
        <div className="container no-print mb-2 d-flex justify-content-between align-items-center">
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
          <button className="btn btn-primary btn-sm px-4 fw-semibold" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i> Print Invoice (A4 1-Page)
          </button>
        </div>

        {/* 1-Page Strict A4 Sheet (Photo 1 Reference Layout) */}
        <div
          className="container bg-white shadow-sm p-4 print-page"
          style={{
            maxWidth: '820px',
            minHeight: '1050px',
            maxHeight: '1120px',
            border: '1px solid #cbd5e1',
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
            fontSize: '12px',
          }}
        >
          {/* Header Row */}
          <div className="d-flex justify-content-between align-items-start border-bottom pb-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle border border-2 border-dark d-flex align-items-center justify-content-center text-primary"
                style={{ width: '56px', height: '56px' }}
              >
                <i className="bi bi-gear-wide-connected fs-2"></i>
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <h5 className="fw-bold text-dark mb-0">Wise Digital Motors Engineering (P.L.C)</h5>
                <div className="text-secondary small">
                  Phone: 011-465 15 53 &nbsp;|&nbsp; Fax: 011-466 14 46 &nbsp;|&nbsp; P.O.Box: 13115
                </div>
                <div className="text-secondary small">
                  Address S/c: Bole &nbsp; Kebele: 03 &nbsp; H.No: 592
                </div>
                <div className="text-dark small">
                  <strong>Supplier's Vat Reg. No.:</strong> 1027440012 &nbsp;|&nbsp; <strong>TIN:</strong> 0003301934
                </div>
                <div className="text-muted" style={{ fontSize: '10px' }}>
                  Date of Registration: 01/09/2001
                </div>
              </div>
            </div>

            <div className="text-end" style={{ lineHeight: 1.3 }}>
              <div className="text-muted small">No. 17076</div>
              <div className="fw-bold text-danger fs-6">Fs No: {invoice.fsNumber}</div>
              <div><strong>Date:</strong> {new Date(invoice.date).toISOString().slice(0, 10)}</div>
              <div><strong>Card No:</strong> {jobCard?.cardNumber || 'N/A'}</div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-2">
            <h5 className="fw-bold text-uppercase text-decoration-underline mb-0" style={{ letterSpacing: '1px' }}>
              Attachment Cash Invoice
            </h5>
          </div>

          {/* Buyer Details Grid (Photo 1) */}
          <div className="row g-1 mb-2 p-2 bg-light border" style={{ fontSize: '11px', lineHeight: 1.3 }}>
            <div className="col-6">
              <div><strong>Buyer's Name:</strong> {invoice.customer?.name}</div>
              <div><strong>Plate No:</strong> <span className="badge bg-dark">{invoice.vehicle?.plateNumber}</span></div>
              <div><strong>Vehicle Make/Model:</strong> {invoice.vehicle?.make} {invoice.vehicle?.model}</div>
            </div>
            <div className="col-6">
              <div><strong>Buyer's TIN:</strong> {invoice.customer?.tinNumber || 'N/A'}</div>
              <div><strong>Buyer's VAT:</strong> {invoice.customer?.vatNumber || 'N/A'}</div>
              <div><strong>Address:</strong> {invoice.customer?.address || 'Zone/Ketema: Kebele: House No:'}</div>
            </div>
          </div>

          {/* Invoice Table Matching Photo 1 */}
          <div className="table-responsive mb-2">
            <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '11px', borderColor: '#475569' }}>
              <thead className="table-light text-center">
                <tr>
                  <th style={{ width: '35px' }}>No.</th>
                  <th>Description</th>
                  <th style={{ width: '55px' }}>Unit</th>
                  <th style={{ width: '45px' }}>Qty</th>
                  <th style={{ width: '110px' }}>Unit Price (ETB)</th>
                  <th style={{ width: '120px' }}>Total Amount (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {/* Services Section */}
                {services.length > 0 ? (
                  services.map((s: any, idx: number) => (
                    <tr key={s.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>
                        <strong>Repair:</strong> {s.description}
                      </td>
                      <td className="text-center">Job</td>
                      <td className="text-center">1</td>
                      <td className="text-end">{s.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="text-end fw-semibold">{s.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center">1</td>
                    <td>Estimation for labour cost</td>
                    <td className="text-center">Job</td>
                    <td className="text-center">1</td>
                    <td className="text-end">{invoice.labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-end fw-semibold">{invoice.labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}

                {/* Parts Section */}
                {parts.map((p: any, idx: number) => (
                  <tr key={p.id}>
                    <td className="text-center">{services.length + idx + 1}</td>
                    <td>
                      <strong>Part:</strong> {p.partName} {p.partNumber ? `(${p.partNumber})` : ''}
                    </td>
                    <td className="text-center">Pcs</td>
                    <td className="text-center">{p.quantity}</td>
                    <td className="text-end">{p.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-end fw-semibold">{p.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}

                {/* Subtotals & Totals Matching Photo 1 */}
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">Labour Cost (Subtotal):</td>
                  <td className="text-end fw-bold">{invoice.labourTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                {invoice.partsTotal > 0 && (
                  <tr>
                    <td colSpan={4} className="border-0"></td>
                    <td className="text-end fw-bold">Parts Cost (Subtotal):</td>
                    <td className="text-end fw-bold">{invoice.partsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">Sub Total:</td>
                  <td className="text-end fw-bold">{invoice.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">VAT (15%):</td>
                  <td className="text-end fw-bold">{invoice.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="table-light">
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold text-dark fs-6">Grand Total:</td>
                  <td className="text-end fw-bold text-primary fs-6">{invoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Terms & Signature Footer */}
          <div className="row align-items-end mt-4 pt-2 border-top" style={{ fontSize: '11px' }}>
            <div className="col-7">
              <div><strong>Payment Method:</strong> {invoice.paymentMethod}</div>
              <div><strong>Payment Status:</strong> <span className="badge bg-success">{invoice.status}</span></div>
              <small className="text-muted mt-1 d-block">
                Official computerized invoice generated by Wise Digital Garage Management System.
              </small>
            </div>
            <div className="col-5 text-end">
              <div className="border-bottom d-inline-block pb-1" style={{ width: '180px' }}>
                &nbsp;
              </div>
              <div className="small fw-bold text-dark mt-1">Cashier / Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
