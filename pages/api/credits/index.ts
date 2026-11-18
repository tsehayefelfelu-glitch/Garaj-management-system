import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const credits = await prisma.customerCredit.findMany({
        include: {
          customer: true,
        },
        orderBy: { remainingDue: 'desc' },
      });
      return res.status(200).json(credits);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const user = getUserFromRequest(req);
    const { creditId, amountPaid, notes } = req.body;

    if (!creditId || !amountPaid) {
      return res.status(400).json({ error: 'Credit ID and payment amount are required' });
    }

    try {
      const credit = await prisma.customerCredit.findUnique({
        where: { id: creditId },
      });

      if (!credit) {
        return res.status(404).json({ error: 'Credit record not found' });
      }

      const payment = parseFloat(amountPaid);
      const newPaid = credit.paidAmount + payment;
      const newDue = Math.max(0, credit.totalCredit - newPaid);

      const updated = await prisma.customerCredit.update({
        where: { id: creditId },
        data: {
          paidAmount: newPaid,
          remainingDue: newDue,
          lastPaymentAt: new Date(),
          notes: notes ? `${credit.notes || ''} | ${notes}` : credit.notes,
        },
        include: {
          customer: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'PAYMENT',
          entity: 'CREDIT',
          entityId: credit.id,
          details: `Recorded payment of ETB ${payment} for customer ${updated.customer.name}. Remaining due: ETB ${newDue}`,
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
