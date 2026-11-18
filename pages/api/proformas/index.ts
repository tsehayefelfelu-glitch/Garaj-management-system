import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getNextProformaNumber } from '@/lib/sequence';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { status, search } = req.query;

    try {
      const proformas = await prisma.proforma.findMany({
        where: {
          status: status ? String(status).toUpperCase() : undefined,
          OR: search
            ? [
                { proformaNumber: { contains: String(search) } },
                { customer: { name: { contains: String(search) } } },
                { vehicle: { plateNumber: { contains: String(search) } } },
                { insuranceCompany: { contains: String(search) } },
                { claimNumber: { contains: String(search) } },
              ]
            : undefined,
        },
        include: {
          customer: true,
          vehicle: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(proformas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const user = getUserFromRequest(req);
    const {
      customerId,
      vehicleId,
      insuranceCompany,
      claimNumber,
      surveyorName,
      validUntil,
      notes,
      items,
    } = req.body;

    if (!customerId || !vehicleId) {
      return res.status(400).json({ error: 'Customer and vehicle are required' });
    }

    try {
      const proformaNumber = await getNextProformaNumber();

      let labourSubtotal = 0;
      let partsSubtotal = 0;

      const itemsToCreate = Array.isArray(items)
        ? items.map((it: any) => {
            const qty = parseInt(it.quantity, 10) || 1;
            const unitPrice = parseFloat(it.unitPrice) || 0;
            const totalPrice = qty * unitPrice;

            if (it.itemType === 'REPLACE') {
              partsSubtotal += totalPrice;
            } else {
              labourSubtotal += totalPrice;
            }

            return {
              itemType: it.itemType || 'REPAIR',
              description: it.description,
              category: it.category || '',
              unit: it.unit || 'Pcs',
              quantity: qty,
              unitPrice,
              totalPrice,
            };
          })
        : [];

      const subTotal = labourSubtotal + partsSubtotal;
      const vatAmount = parseFloat((subTotal * 0.15).toFixed(2));
      const grandTotal = subTotal + vatAmount;

      const proforma = await prisma.proforma.create({
        data: {
          proformaNumber,
          customerId,
          vehicleId,
          insuranceCompany: insuranceCompany || '',
          claimNumber: claimNumber || '',
          surveyorName: surveyorName || '',
          status: 'ACTIVE',
          validUntil: validUntil ? new Date(validUntil) : null,
          labourSubtotal,
          partsSubtotal,
          subTotal,
          vatAmount,
          grandTotal,
          notes: notes || '',
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          customer: true,
          vehicle: true,
          items: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'CREATE',
          entity: 'PROFORMA',
          entityId: proforma.id,
          details: `Created Proforma ${proforma.proformaNumber} for Claim #${proforma.claimNumber || 'N/A'}`,
        },
      });

      return res.status(201).json(proforma);
    } catch (error: any) {
      console.error('Create proforma error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
