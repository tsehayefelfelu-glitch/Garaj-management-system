import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const cardId = String(id);

  if (req.method === 'GET') {
    const user = getUserFromRequest(req);
    if (user?.role === 'STOREKEEPER') {
      return res.status(403).json({ error: 'Access denied: Storekeepers only have access to Inventory/Store' });
    }

    try {
      const jobCard = await prisma.jobCard.findUnique({
        where: { id: cardId },
        include: {
          customer: true,
          vehicle: true,
          mechanic: true,
          services: true,
          parts: true,
          invoices: true,
          proforma: true,
        },
      });

      if (!jobCard) {
        return res.status(404).json({ error: 'Job Card not found' });
      }

      if (user?.role === 'MECHANIC' && jobCard.mechanicId !== user.id) {
        return res.status(403).json({ error: 'Access denied: You can only view job cards assigned to you' });
      }

      return res.status(200).json(jobCard);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const user = getUserFromRequest(req);
    const { status, paymentStatus, conditionNotes, odoMeter, fuelLevel, mechanicId } = req.body;

    try {
      const updated = await prisma.jobCard.update({
        where: { id: cardId },
        data: {
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          conditionNotes: conditionNotes !== undefined ? conditionNotes : undefined,
          odoMeter: odoMeter ? parseInt(odoMeter, 10) : undefined,
          fuelLevel: fuelLevel || undefined,
          mechanicId: mechanicId || undefined,
        },
        include: {
          customer: true,
          vehicle: true,
          mechanic: true,
          services: true,
          parts: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'UPDATE',
          entity: 'JOB_CARD',
          entityId: updated.id,
          details: `Updated Job Card ${updated.cardNumber}`,
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const user = getUserFromRequest(req);
    try {
      const jobCard = await prisma.jobCard.findUnique({
        where: { id: cardId },
        include: { parts: true },
      });

      if (!jobCard) {
        return res.status(404).json({ error: 'Job Card not found' });
      }

      // RESTORE inventory stock for any deducted parts
      for (const p of jobCard.parts) {
        if (p.partId) {
          await prisma.inventoryPart.update({
            where: { id: p.partId },
            data: { quantity: { increment: p.quantity } },
          });
        }
      }

      // Delete child services, parts, and invoices
      await prisma.jobCardService.deleteMany({ where: { jobCardId: cardId } });
      await prisma.jobCardPart.deleteMany({ where: { jobCardId: cardId } });
      await prisma.invoice.deleteMany({ where: { jobCardId: cardId } });

      await prisma.jobCard.delete({
        where: { id: cardId },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'DELETE',
          entity: 'JOB_CARD',
          entityId: cardId,
          details: `Deleted Job Card ${jobCard.cardNumber} and restored parts back to inventory`,
        },
      });

      return res.status(200).json({ message: 'Job Card deleted successfully and stock refunded' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
