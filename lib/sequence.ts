import prisma from './prisma';

export async function getNextJobCardNumber(): Promise<string> {
  const cards = await prisma.jobCard.findMany({
    select: { cardNumber: true },
  });

  let maxNum = 1620;
  for (const c of cards) {
    if (c.cardNumber) {
      const match = c.cardNumber.match(/SY_(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    }
  }

  return `SY_${maxNum + 1}`;
}

export async function getNextProformaNumber(): Promise<string> {
  const proformas = await prisma.proforma.findMany({
    select: { proformaNumber: true },
  });

  let maxNum = 38690;
  for (const p of proformas) {
    if (p.proformaNumber) {
      const match = p.proformaNumber.match(/PRF-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    }
  }

  return `PRF-${maxNum + 1}`;
}

export async function getNextInvoiceNumber(): Promise<{ invoiceNumber: string; fsNumber: string }> {
  const invoices = await prisma.invoice.findMany({
    select: { invoiceNumber: true, fsNumber: true },
  });

  let maxInv = 1000;
  let maxFs = 319;

  for (const inv of invoices) {
    if (inv.invoiceNumber) {
      const match = inv.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxInv) maxInv = val;
      }
    }
    if (inv.fsNumber) {
      const val = parseInt(inv.fsNumber, 10);
      if (!isNaN(val) && val > maxFs) maxFs = val;
    }
  }

  return {
    invoiceNumber: `INV-${maxInv + 1}`,
    fsNumber: String(maxFs + 1).padStart(8, '0'),
  };
}
