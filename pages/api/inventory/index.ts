import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { search, category, lowStock } = req.query;

    try {
      const parts = await prisma.inventoryPart.findMany({
        where: {
          category: category ? String(category) : undefined,
          OR: search
            ? [
                { partNumber: { contains: String(search) } },
                { name: { contains: String(search) } },
                { category: { contains: String(search) } },
              ]
            : undefined,
        },
        orderBy: { name: 'asc' },
      });

      const filtered = lowStock === 'true' ? parts.filter((p) => p.quantity <= p.lowStockAlert) : parts;

      return res.status(200).json(filtered);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const user = getUserFromRequest(req);
    const { partNumber, name, category, quantity, buyingPrice, sellingPrice, lowStockAlert, unit } = req.body;

    if (!partNumber || !name) {
      return res.status(400).json({ error: 'Part Number and Name are required' });
    }

    try {
      const part = await prisma.inventoryPart.create({
        data: {
          partNumber: String(partNumber).trim(),
          name: String(name).trim(),
          category: category || 'General',
          quantity: parseInt(quantity, 10) || 0,
          buyingPrice: parseFloat(buyingPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          lowStockAlert: parseInt(lowStockAlert, 10) || 5,
          unit: unit || 'Pcs',
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'CREATE',
          entity: 'INVENTORY',
          entityId: part.id,
          details: `Added new inventory part ${part.partNumber} - ${part.name}`,
        },
      });

      return res.status(201).json(part);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
