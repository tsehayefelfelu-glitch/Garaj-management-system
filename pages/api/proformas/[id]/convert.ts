import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getNextJobCardNumber } from '@/lib/sequence';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const proformaId = String(id);
  const user = getUserFromRequest(req);
  const { mechanicId, odoMeter, fuelLevel } = req.body;

  try {
    const proforma = await prisma.proforma.findUnique({
      where: { id: proformaId },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });

    if (!proforma) {
      return res.status(404).json({ error: 'Proforma not found' });
    }

    if (proforma.status === 'CONVERTED') {
      return res.status(400).json({ error: 'This Proforma has already been converted to a Job Card' });
    }

    const cardNumber = await getNextJobCardNumber();

    // Map repair items to JobCardService
    const repairServices = proforma.items
      .filter((i) => i.itemType === 'REPAIR')
      .map((i) => ({
        description: i.description,
        category: i.category || 'Repair Work',
        cost: i.totalPrice,
        status: 'PENDING',
      }));

    // Map replace items to JobCardPart
    const replaceParts = proforma.items
      .filter((i) => i.itemType === 'REPLACE')
      .map((i) => ({
        partName: i.description,
        category: i.category || 'Replacement Part',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      }));

    // Create Job Card
    const jobCard = await prisma.jobCard.create({
      data: {
        cardNumber,
        proformaId: proforma.id,
        customerId: proforma.customerId,
        vehicleId: proforma.vehicleId,
        mechanicId: mechanicId || null,
        odoMeter: odoMeter ? parseInt(odoMeter, 10) : 0,
        fuelLevel: fuelLevel || '1/2',
        conditionNotes: `Converted from Proforma ${proforma.proformaNumber} (Claim: ${proforma.claimNumber || 'N/A'})`,
        pricingOption: 'SEPARATE',
        status: 'ACTIVE',
        paymentStatus: 'UNPAID',
        labourSubtotal: proforma.labourSubtotal,
        partsSubtotal: proforma.partsSubtotal,
        subTotal: proforma.subTotal,
        vatAmount: proforma.vatAmount,
        fuelLubricants: proforma.fuelLubricants,
        grandTotal: proforma.grandTotal,
        services: {
          create: repairServices,
        },
        parts: {
          create: replaceParts,
        },
      },
      include: {
        customer: true,
        vehicle: true,
        services: true,
        parts: true,
      },
    });

    // Mark Proforma as CONVERTED
    await prisma.proforma.update({
      where: { id: proformaId },
      data: { status: 'CONVERTED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        username: user?.username || 'system',
        action: 'CONVERT',
        entity: 'PROFORMA',
        entityId: proforma.id,
        details: `Converted Proforma ${proforma.proformaNumber} to Job Card ${jobCard.cardNumber}`,
      },
    });

    return res.status(200).json({
      message: 'Proforma converted successfully to Job Card',
      jobCard,
    });
  } catch (error: any) {
    console.error('Convert proforma error:', error);
    return res.status(500).json({ error: error.message });
  }
}
