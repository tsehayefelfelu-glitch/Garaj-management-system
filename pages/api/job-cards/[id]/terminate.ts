import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getNextInvoiceNumber } from '@/lib/sequence';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const cardId = String(id);
  const user = getUserFromRequest(req);
  const { paymentMethod = 'CASH', paymentStatus = 'PAID', customFsNumber } = req.body;

  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: cardId },
      include: {
        customer: true,
        vehicle: true,
        services: true,
        parts: true,
      },
    });

    if (!jobCard) {
      return res.status(404).json({ error: 'Job Card not found' });
    }

    const { invoiceNumber, fsNumber } = await getNextInvoiceNumber();
    const finalFsNumber = customFsNumber || fsNumber;

    // Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        fsNumber: finalFsNumber,
        jobCardId: jobCard.id,
        customerId: jobCard.customerId,
        vehicleId: jobCard.vehicleId,
        date: new Date(),
        labourTotal: jobCard.labourSubtotal,
        partsTotal: jobCard.partsSubtotal,
        subTotal: jobCard.subTotal,
        vatAmount: jobCard.vatAmount,
        fuelLubricants: jobCard.fuelLubricants,
        grandTotal: jobCard.grandTotal,
        paymentMethod,
        status: paymentStatus,
      },
    });

    // Update Job Card to TERMINATED
    const updatedJobCard = await prisma.jobCard.update({
      where: { id: cardId },
      data: {
        status: 'TERMINATED',
        paymentStatus,
        closedDate: new Date(),
      },
      include: {
        customer: true,
        vehicle: true,
        invoices: true,
      },
    });

    // If paymentStatus is CREDIT, add/update CustomerCredit record
    if (paymentStatus === 'CREDIT' || paymentStatus === 'UNPAID') {
      const existingCredit = await prisma.customerCredit.findFirst({
        where: { customerId: jobCard.customerId },
      });

      if (existingCredit) {
        await prisma.customerCredit.update({
          where: { id: existingCredit.id },
          data: {
            totalCredit: { increment: jobCard.grandTotal },
            remainingDue: { increment: jobCard.grandTotal },
            notes: `Added credit from Job Card ${jobCard.cardNumber}`,
          },
        });
      } else {
        await prisma.customerCredit.create({
          data: {
            customerId: jobCard.customerId,
            totalCredit: jobCard.grandTotal,
            paidAmount: 0.0,
            remainingDue: jobCard.grandTotal,
            notes: `Credit from Job Card ${jobCard.cardNumber}`,
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        username: user?.username || 'system',
        action: 'TERMINATE',
        entity: 'JOB_CARD',
        entityId: jobCard.id,
        details: `Terminated Job Card ${jobCard.cardNumber}, generated invoice ${invoice.invoiceNumber} (FS: ${invoice.fsNumber})`,
      },
    });

    return res.status(200).json({
      message: 'Job Card terminated successfully',
      jobCard: updatedJobCard,
      invoice,
    });
  } catch (error: any) {
    console.error('Termination error:', error);
    return res.status(500).json({ error: error.message });
  }
}
