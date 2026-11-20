import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

// Convert number to English words
function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function below1000(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '') + ' ';
    return ones[Math.floor(num / 100)] + ' Hundred ' + below1000(num % 100);
  }

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;

  let result = '';
  if (millions) result += below1000(millions) + 'Million ';
  if (thousands) result += below1000(thousands) + 'Thousand ';
  if (remainder) result += below1000(remainder);
  return result.trim();
}

function amountInWords(total: number): string {
  const intPart = Math.floor(total);
  const cents = Math.round((total - intPart) * 100);
  let words = numberToWords(intPart);
  if (cents > 0) words += ` and ${numberToWords(cents)} Cents`;
  return words;
}

// Split amount into integer and cents parts for the two-cell display
function splitAmount(val: number): { intPart: string; cents: string } {
  const intPart = Math.floor(val).toLocaleString('en-US');
  const cents = String(Math.round((val - Math.floor(val)) * 100)).padStart(2, '0');
  return { intPart, cents };
}

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

  const labourSubtotal: number = proforma.labourSubtotal ?? 0;
  const partsSubtotal: number = proforma.partsSubtotal ?? 0;
  const subTotal: number = proforma.subTotal ?? 0;
  const vatAmount: number = proforma.vatAmount ?? 0;
  const grandTotal: number = proforma.grandTotal ?? 0;
  const fuelLubricants: number = proforma.fuelLubricants ?? 0;
  const netTotal: number = grandTotal + fuelLubricants;

  const dateStr = proforma.createdAt
    ? new Date(proforma.createdAt).toISOString().slice(0, 10)
    : '';

  const garageName =
    process.env.NEXT_PUBLIC_GARAGE_NAME || 'Wise Digital Motors Engineering';
  const tinNumber = process.env.NEXT_PUBLIC_TIN || '0033301934';
  const phone = process.env.NEXT_PUBLIC_PHONE || '011-465 15 53';
  const fax = process.env.NEXT_PUBLIC_FAX || '011-466 14 46';

  // Shared cell style for two-part amounts
  const amtCellStyle: React.CSSProperties = {
    textAlign: 'right',
    whiteSpace: 'nowrap',
    padding: '2px 4px',
  };
  const centsCellStyle: React.CSSProperties = {
    textAlign: 'center',
    width: '30px',
    padding: '2px 4px',
    borderLeft: '1px solid #999',
  };

  function AmtRow({ label, val, bold }: { label: string; val: number; bold?: boolean }) {
    const { intPart, cents } = splitAmount(val);
    return (
      <tr style={bold ? { fontWeight: 'bold' } : {}}>
        <td style={{ textAlign: 'right', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px' }}>
          {label}
        </td>
        <td style={amtCellStyle}>{intPart}</td>
        <td style={centsCellStyle}>{cents}</td>
      </tr>
    );
  }

  return (
    <>
      <Head>
        <title>Proforma - {proforma.proformaNumber}</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            .print-page {
              box-shadow: none !important;
              border: none !important;
            }
          }
          body { background: #e5e7eb; }
          .print-page {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 14mm 14mm 10mm 14mm;
            box-sizing: border-box;
          }
          table { border-collapse: collapse; width: 100%; }
          .main-table th, .main-table td { border: 1px solid #555; padding: 2px 5px; }
          .main-table thead th { background: #fff; font-weight: bold; text-align: center; }
          .group-header td { background: #d9d9d9; font-weight: bold; padding: 2px 6px; }
          .summary-table td { border: none; font-size: 11px; }
          .logo-circle {
            width: 64px; height: 64px;
            border: 2px solid #555;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden;
          }
        `}</style>
      </Head>

      {/* Screen-only controls */}
      <div className="no-print" style={{ background: '#f3f4f6', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => router.back()}
          style={{ padding: '6px 14px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #aaa', background: '#fff' }}
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          style={{ padding: '6px 20px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 'bold' }}
        >
          🖨 Print Proforma (A4)
        </button>
      </div>

      <div className="print-page">

        {/* ══════════════ HEADER ══════════════ */}
        <table style={{ marginBottom: '4px' }}>
          <tbody>
            <tr>
              {/* Logo */}
              <td style={{ width: '80px', verticalAlign: 'middle' }}>
                <div className="logo-circle">
                  <img
                    src="/images/garage-workshop.jpg"
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<svg width="40" height="40" viewBox="0 0 24 24" fill="#555"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5zm-8-4c-.83 0-1.5.67-1.5 1.5S10.17 16 11 16s1.5-.67 1.5-1.5S11.83 13 11 13zm6 0c-.83 0-1.5.67-1.5 1.5S16.17 16 17 16s1.5-.67 1.5-1.5S17.83 13 17 13z"/></svg>';
                    }}
                  />
                </div>
              </td>
              {/* Company info — center/right */}
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                  {/* Amharic company name */}
                  ዋይዝ ዲጂታል ሞተርስ ኢንጅነሪንግ
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{garageName}</div>
                <div style={{ fontSize: '10px' }}>
                  ☎ {phone} &nbsp; Fax {fax}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TIN  |  Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
          <span>Tin Number: {tinNumber}</span>
          <span>Date: &nbsp; {dateStr}</span>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', marginBottom: '2px' }}>
          Proforma
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', marginBottom: '4px' }}>
          No: &nbsp; {proforma.proformaNumber}
        </div>

        {/* To / Plate */}
        <div style={{ marginBottom: '4px', fontSize: '11px' }}>
          <div>
            <strong>To:</strong> {proforma.insuranceCompany || proforma.customer?.name}
          </div>
          <div>
            <strong>Plate Number:</strong> {proforma.vehicle?.plateNumber}
          </div>
        </div>

        {/* ══════════════ MAIN ITEMS TABLE ══════════════ */}
        <table className="main-table" style={{ marginBottom: '0' }}>
          <thead>
            <tr>
              <th style={{ width: '32px' }}>S/N</th>
              <th>Description</th>
              <th style={{ width: '40px' }}>Unit</th>
              <th style={{ width: '34px' }}>Qty</th>
              <th style={{ width: '70px' }}>Unit Price</th>
              <th style={{ width: '20px', borderRight: 'none', borderLeft: 'none', padding: '2px 1px' }}></th>
              <th style={{ width: '70px' }}>Total Amount</th>
              <th style={{ width: '20px', borderLeft: 'none', padding: '2px 1px' }}></th>
            </tr>
          </thead>
          <tbody>
            {/* ── REPAIR GROUP ── */}
            <tr className="group-header">
              <td colSpan={8}>Repair</td>
            </tr>
            {repairItems.length > 0 ? (
              repairItems.map((item: any, idx: number) => {
                const up = splitAmount(item.unitPrice ?? 0);
                const tp = splitAmount(item.totalPrice ?? 0);
                return (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit || 'Pcs'}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{up.intPart}</td>
                    <td style={{ textAlign: 'center', borderLeft: '1px solid #555' }}>{up.cents}</td>
                    <td style={{ textAlign: 'right' }}>{tp.intPart}</td>
                    <td style={{ textAlign: 'center', borderLeft: '1px solid #555' }}>{tp.cents}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#888' }}>No repair items</td>
              </tr>
            )}
            {/* Labour subtotal row */}
            <tr>
              <td colSpan={5} style={{ border: 'none' }}></td>
              <td colSpan={1} style={{ border: 'none' }}></td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }} colSpan={1}>
                Labour Cost (Subtotal)
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', borderLeft: '1px solid #555' }}>
                {splitAmount(labourSubtotal).intPart}
              </td>
            </tr>

            {/* ── REPLACE GROUP ── */}
            <tr className="group-header">
              <td colSpan={8}>Replace</td>
            </tr>
            {replaceItems.length > 0 ? (
              replaceItems.map((item: any, idx: number) => {
                const up = splitAmount(item.unitPrice ?? 0);
                const tp = splitAmount(item.totalPrice ?? 0);
                return (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit || 'Pcs'}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{up.intPart}</td>
                    <td style={{ textAlign: 'center', borderLeft: '1px solid #555' }}>{up.cents}</td>
                    <td style={{ textAlign: 'right' }}>{tp.intPart}</td>
                    <td style={{ textAlign: 'center', borderLeft: '1px solid #555' }}>{tp.cents}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td style={{ textAlign: 'center' }}>1</td>
                <td colSpan={3} style={{ fontStyle: 'italic' }}>
                  {proforma.notes || 'As Per The lists Indicate In Insurance Survey Report'}
                </td>
                <td style={{ textAlign: 'right' }}>0</td>
                <td style={{ textAlign: 'center', borderLeft: '1px solid #555' }}>00</td>
                <td style={{ textAlign: 'right' }}>0</td>
                <td style={{ textAlign: 'center', borderLeft: '1px solid #555' }}>00</td>
              </tr>
            )}
            {/* Replace subtotal row */}
            <tr>
              <td colSpan={5} style={{ border: 'none' }}></td>
              <td colSpan={1} style={{ border: 'none' }}></td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }} colSpan={1}>
                Replace (Subtotal)
              </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', borderLeft: '1px solid #555' }}>
                {splitAmount(partsSubtotal).intPart}
              </td>
            </tr>

            {/* ══ SUMMARY ROWS — right-aligned, 3-col: label | amount | 00 ══ */}
            {[
              { label: 'ድምር / Sub Total', val: subTotal },
              { label: 'ተ.እ.ታ / VAT (15%)', val: vatAmount },
              { label: 'ጠቅላላ ዋጋ / Grand Total', val: grandTotal },
              { label: 'ዘይትና ቅብቶች / Fuel & Lubricants', val: fuelLubricants },
              { label: 'የተጣራ ክፍያ', val: netTotal },
            ].map(({ label, val }) => {
              const { intPart, cents } = splitAmount(val);
              return (
                <tr key={label}>
                  <td
                    colSpan={5}
                    style={{ border: 'none', textAlign: 'right', paddingRight: '6px', fontWeight: label.includes('Grand') || label.includes('ጠቅላላ') || label.includes('የተጣራ') ? 'bold' : 'normal' }}
                  >
                    {label}
                  </td>
                  <td style={{ border: '1px solid #555', textAlign: 'right', paddingRight: '4px', fontWeight: 'bold' }} colSpan={2}>
                    {intPart}
                  </td>
                  <td style={{ border: '1px solid #555', textAlign: 'center', fontWeight: 'bold' }}>
                    {cents}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ══════════════ FOOTER ══════════════ */}
        <div style={{ marginTop: '12px', fontSize: '11px' }}>
          <p style={{ margin: '0 0 2px' }}>
            <strong>Amount in words:</strong>{' '}
            {amountInWords(Math.floor(netTotal))} birr
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Delivery Days:</strong> {proforma.deliveryDays ?? 0}
          </p>

          <p style={{ margin: '0 0 2px' }}>
            <strong>Prepared By:</strong>{' '}
            {proforma.createdBy?.fullName || proforma.createdBy?.username || ''}
          </p>
          <p style={{ margin: '0 0 20px' }}>
            <strong>Signature:</strong>{' '}
            <span style={{ display: 'inline-block', width: '120px', borderBottom: '1px solid #000', marginLeft: '4px' }}></span>
          </p>

          <div>
            <strong>NB:</strong>
            <ol style={{ margin: '2px 0 0 18px', padding: 0 }}>
              <li>The validity of this proforma invoice is for 15 days</li>
              <li>
                The price of the spare parts will be provided as per the invoice of authorized
                dealers and it will be prepared with our company name and TIN No
              </li>
            </ol>
          </div>
        </div>

      </div>
    </>
  );
}
