import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getNextJobCardNumber } from '@/lib/sequence';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { status, search } = req.query;

    const user = getUserFromRequest(req);
    if (user?.role === 'STOREKEEPER') {
      return res.status(403).json({ error: 'Access denied: Storekeepers only have access to Inventory/Store' });
    }

    try {
      const whereClause: any = {
        status: status ? String(status).toUpperCase() : undefined,
      };

      if (user?.role === 'MECHANIC') {
        whereClause.mechanicId = user.id;
      }

      if (search) {
        whereClause.OR = [
          { cardNumber: { contains: String(search) } },
          { customer: { name: { contains: String(search) } } },
          { vehicle: { plateNumber: { contains: String(search) } } },
        ];
      }

      const jobCards = await prisma.jobCard.findMany({
        where: whereClause,
        include: {
          customer: true,
          vehicle: true,
          mechanic: true,
          services: true,
          parts: true,
          invoices: true,
        },
        orderBy: { entryDate: 'desc' },
      });

      return res.status(200).json(jobCards);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const user = getUserFromRequest(req);
    const {
      customerId,
      vehicleId,
      mechanicId,
      odoMeter,
      fuelLevel,
      conditionNotes,
      pricingOption,
      services,
      parts,
      skipCardNumber,
      proformaId,
    } = req.body;

    if (!customerId || !vehicleId) {
      return res.status(400).json({ error: 'Customer and vehicle are required' });
    }

    try {
      // 1. Calculate sequence number
      const cardNumber = await getNextJobCardNumber();

      // 2. Calculate service labour subtotal
      let labourSubtotal = 0;
      if (Array.isArray(services)) {
        labourSubtotal = services.reduce((acc: number, s: any) => acc + (parseFloat(s.cost) || 0), 0);
      }

      // 3. Calculate parts subtotal & prepare inventory deduction
      let partsSubtotal = 0;
      const partsToCreate: any[] = [];

      if (Array.isArray(parts)) {
        for (const p of parts) {
          const qty = parseInt(p.quantity, 10) || 1;
          const unitPrice = parseFloat(p.unitPrice) || 0;
          const totalPrice = qty * unitPrice;
          partsSubtotal += totalPrice;

          // Check stock if partId provided
          if (p.partId) {
            const stockItem = await prisma.inventoryPart.findUnique({
              where: { id: p.partId },
            });

            if (stockItem) {
              if (stockItem.quantity < qty) {
                return res.status(400).json({
                  error: `Insufficient stock for "${stockItem.name}". Available: ${stockItem.quantity}, Requested: ${qty}`,
                });
              }

              // Deduct stock
              await prisma.inventoryPart.update({
                where: { id: p.partId },
                data: { quantity: { decrement: qty } },
              });
            }
          }

          partsToCreate.push({
            partId: p.partId || null,
            partName: p.partName || p.name || 'Custom Part',
            partNumber: p.partNumber || '',
            category: p.category || '',
            quantity: qty,
            unitPrice,
            totalPrice,
          });
        }
      }

      const subTotal = labourSubtotal + partsSubtotal;
      const vatAmount = parseFloat((subTotal * 0.15).toFixed(2));
      const grandTotal = subTotal + vatAmount;

      const jobCard = await prisma.jobCard.create({
        data: {
          cardNumber,
          customerId,
          vehicleId,
          mechanicId: mechanicId || null,
          proformaId: proformaId || null,
          odoMeter: parseInt(odoMeter, 10) || 0,
          fuelLevel: fuelLevel || '1/2',
          conditionNotes: conditionNotes || '',
          pricingOption: pricingOption || 'SEPARATE',
          status: 'ACTIVE',
          paymentStatus: 'UNPAID',
          labourSubtotal,
          partsSubtotal,
          subTotal,
          vatAmount,
          grandTotal,
          skipCardNumber: Boolean(skipCardNumber),
          services: {
            create: Array.isArray(services)
              ? services.map((s: any) => ({
                  description: s.description || s.name,
                  category: s.category || '',
                  cost: parseFloat(s.cost) || 0,
                  status: 'PENDING',
                }))
              : [],
          },
          parts: {
            create: partsToCreate,
          },
        },
        include: {
          customer: true,
          vehicle: true,
          mechanic: true,
          services: true,
          parts: true,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'CREATE',
          entity: 'JOB_CARD',
          entityId: jobCard.id,
          details: `Created Job Card ${jobCard.cardNumber} for vehicle ${jobCard.vehicle.plateNumber}`,
        },
      });

      return res.status(201).json(jobCard);
    } catch (error: any) {
      console.error('Create Job Card error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
