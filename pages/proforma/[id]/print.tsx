import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function ProformaPrintPage() {
  const router = useRouter();
  const { id } = router.query;
  const [proforma, setProforma] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios
        .get(`/api/proformas/${id}`)
        .then((res) => setProforma(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Preparing Proforma Print Layout...</p>
      </div>
    );
  }

  if (!proforma) {
    return <div className="alert alert-danger m-4">Proforma not found.</div>;
  }

  const repairItems = proforma.items?.filter((i: any) => i.itemType === 'REPAIR') || [];
  const replaceItems = proforma.items?.filter((i: any) => i.itemType === 'REPLACE') || [];

  return (
    <>
      <Head>
        <title>Proforma Print - {proforma.proformaNumber}</title>
      </Head>

      <div className="bg-light py-2 min-vh-100">
        {/* Floating Print Control for Screen */}
        <div className="container no-print mb-2 d-flex justify-content-between align-items-center">
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i> Back
          </button>
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm px-4 fw-semibold" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> Print Proforma (A4 1-Page)
            </button>
          </div>
        </div>

        {/* 1-Page Strict A4 Printable Sheet (Photo 10 Reference Layout) */}
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
          {/* Header with Logo and Company Credentials */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle border border-2 border-primary d-flex align-items-center justify-content-center text-primary"
                style={{ width: '56px', height: '56px' }}
              >
                <i className="bi bi-gear-wide-connected fs-2"></i>
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <h5 className="fw-bold text-dark mb-0">Wise Digital Motors Engineering</h5>
                <small className="text-secondary d-block" style={{ fontSize: '11px' }}>
                  <i className="bi bi-telephone-fill me-1"></i> 011-465 15 53 &nbsp;|&nbsp; Fax: 011-466 14 46 &nbsp;|&nbsp; P.O.Box: 13115
                </small>
                <small className="text-dark d-block" style={{ fontSize: '11px' }}>
                  Supplier's TIN: 0003301934 &nbsp;|&nbsp; Supplier's VAT: 1027440012
                </small>
              </div>
            </div>

            <div className="text-end" style={{ lineHeight: 1.3 }}>
              <h4 className="fw-bold text-dark text-uppercase mb-0" style={{ letterSpacing: '1px' }}>
                PROFORMA
              </h4>
              <div className="fw-bold text-danger fs-6">No: {proforma.proformaNumber}</div>
              <div className="text-secondary small">
                Date: {new Date(proforma.createdAt).toISOString().slice(0, 10)}
              </div>
            </div>
          </div>

          {/* Client & Insurance Details */}
          <div className="row g-2 mb-2" style={{ fontSize: '11px', lineHeight: 1.3 }}>
            <div className="col-6">
              <div className="p-2 bg-light border rounded">
                <div><strong>Customer / Insurance:</strong> {proforma.insuranceCompany || proforma.customer?.name}</div>
                <div><strong>Claim / Policy No:</strong> {proforma.claimNumber || 'N/A'}</div>
                <div><strong>Surveyor:</strong> {proforma.surveyorName || 'N/A'}</div>
              </div>
            </div>

            <div className="col-6">
              <div className="p-2 bg-light border rounded">
                <div><strong>Plate Number:</strong> <span className="badge bg-dark">{proforma.vehicle?.plateNumber}</span></div>
                <div><strong>Vehicle Make & Model:</strong> {proforma.vehicle?.make} {proforma.vehicle?.model}</div>
                <div><strong>Chassis No:</strong> {proforma.vehicle?.chassisNumber || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Items Table Matching Photo 10 */}
          <div className="table-responsive mb-2">
            <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '11px', borderColor: '#475569' }}>
              <thead className="table-light">
                <tr className="text-center">
                  <th style={{ width: '35px' }}>No</th>
                  <th>Description</th>
                  <th style={{ width: '45px' }}>Unit</th>
                  <th style={{ width: '40px' }}>Qty</th>
                  <th style={{ width: '110px' }}>Unit Price (ETB)</th>
                  <th style={{ width: '120px' }}>Total Amount (ETB)</th>
                </tr>
              </thead>
              <tbody>
                {/* Repair Work Section */}
                <tr className="table-secondary fw-bold">
                  <td colSpan={6} style={{ fontSize: '11px', padding: '3px 8px' }}>REPAIR</td>
                </tr>
                {repairItems.length > 0 ? (
                  repairItems.map((item: any, idx: number) => (
                    <tr key={item.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{item.description}</td>
                      <td className="text-center">{item.unit || 'Pcs'}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="text-end fw-semibold">{item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-muted text-center py-1">No repair items</td>
                  </tr>
                )}

                {/* Replace Parts Section */}
                <tr className="table-secondary fw-bold">
                  <td colSpan={6} style={{ fontSize: '11px', padding: '3px 8px' }}>REPLACE</td>
                </tr>
                {replaceItems.length > 0 ? (
                  replaceItems.map((item: any, idx: number) => (
                    <tr key={item.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{item.description}</td>
                      <td className="text-center">{item.unit || 'Pcs'}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="text-end fw-semibold">{item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center">1</td>
                    <td colSpan={5} className="text-muted font-italic">
                      {proforma.notes || 'As Per The Lists Indicate In Insurance Survey Report'}
                    </td>
                  </tr>
                )}

                {/* Summary Totals */}
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">Labour Cost (Subtotal):</td>
                  <td className="text-end fw-bold">{proforma.labourSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">Replace (Subtotal):</td>
                  <td className="text-end fw-bold">{proforma.partsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">Sub Total:</td>
                  <td className="text-end fw-bold">{proforma.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">VAT (15%):</td>
                  <td className="text-end fw-bold">{proforma.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold">Fuel & Lubricants:</td>
                  <td className="text-end fw-bold">0.00</td>
                </tr>
                <tr className="table-light">
                  <td colSpan={4} className="border-0"></td>
                  <td className="text-end fw-bold text-dark fs-6">Grand Total:</td>
                  <td className="text-end fw-bold text-primary fs-6">{proforma.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="row text-center mt-4 pt-3 border-top" style={{ fontSize: '11px' }}>
            <div className="col-4">
              <div className="border-top pt-1">
                <div className="fw-bold">Prepared by</div>
                <div style={{ height: '30px' }}></div>
                <div className="text-secondary small">Service Advisor</div>
              </div>
            </div>
            <div className="col-4">
              <div className="border-top pt-1">
                <div className="fw-bold">Checked by</div>
                <div style={{ height: '30px' }}></div>
                <div className="text-secondary small">Chief Mechanic</div>
              </div>
            </div>
            <div className="col-4">
              <div className="border-top pt-1">
                <div className="fw-bold">Approved by</div>
                <div style={{ height: '30px' }}></div>
                <div className="text-secondary small">General Manager</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
