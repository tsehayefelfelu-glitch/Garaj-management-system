import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        vehicle: true,
        jobCard: {
          include: {
            mechanic: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const mechanics = await prisma.user.findMany({
      where: { role: 'MECHANIC' },
      include: {
        jobCards: {
          include: {
            services: true,
          },
        },
      },
    });

    const mechanicPerformance = mechanics.map((m) => {
      const completedCards = m.jobCards.filter((jc) => jc.status === 'TERMINATED').length;
      const activeCards = m.jobCards.filter((jc) => jc.status === 'ACTIVE').length;
      const totalLabourGenerated = m.jobCards.reduce((acc, jc) => acc + jc.labourSubtotal, 0);

      return {
        id: m.id,
        name: m.fullName,
        phone: m.phone,
        completedCards,
        activeCards,
        totalLabourGenerated,
      };
    });

    return res.status(200).json({
      invoices,
      mechanicPerformance,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
