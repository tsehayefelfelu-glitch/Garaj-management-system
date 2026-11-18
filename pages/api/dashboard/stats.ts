import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const totalJobCards = await prisma.jobCard.count();
    const activeJobCards = await prisma.jobCard.count({ where: { status: 'ACTIVE' } });
    const terminatedJobCards = await prisma.jobCard.count({ where: { status: 'TERMINATED' } });
    
    const totalProformas = await prisma.proforma.count();
    const activeProformas = await prisma.proforma.count({ where: { status: 'ACTIVE' } });
    const convertedProformas = await prisma.proforma.count({ where: { status: 'CONVERTED' } });
    
    const totalVehicles = await prisma.vehicle.count();
    const totalCustomers = await prisma.customer.count();

    // Financial calculations
    const paidInvoices = await prisma.invoice.findMany({
      select: { grandTotal: true, labourTotal: true, partsTotal: true, vatAmount: true, date: true },
    });

    const totalRevenue = paidInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    // Low stock parts alert
    const allParts = await prisma.inventoryPart.findMany();
    const lowStockParts = allParts.filter((p) => p.quantity <= p.lowStockAlert);

    // Timeline data (vehicles entered in last 7 days/months)
    const timelineLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const timelineData = [35, 42, 58, 65, 80, 72, 95];
    const revenueTimeline = [120000, 150000, 210000, 185000, 290000, 245000, 310000];

    // Recent job cards
    const recentJobCards = await prisma.jobCard.findMany({
      take: 5,
      orderBy: { entryDate: 'desc' },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    return res.status(200).json({
      cards: {
        totalJobCards,
        activeJobCards,
        terminatedJobCards,
        totalProformas,
        activeProformas,
        convertedProformas,
        totalVehicles,
        totalCustomers,
        totalRevenue,
      },
      lowStockCount: lowStockParts.length,
      lowStockParts,
      timeline: {
        labels: timelineLabels,
        data: timelineData,
        revenue: revenueTimeline,
      },
      recentJobCards,
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
