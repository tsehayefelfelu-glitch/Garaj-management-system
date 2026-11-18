import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const partId = String(id);
  const user = getUserFromRequest(req);

  if (req.method === 'GET') {
    try {
      const part = await prisma.inventoryPart.findUnique({
        where: { id: partId },
      });
      if (!part) return res.status(404).json({ error: 'Part not found' });
      return res.status(200).json(part);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { name, category, quantity, buyingPrice, sellingPrice, lowStockAlert, unit, adjustQuantity } = req.body;

    try {
      const existing = await prisma.inventoryPart.findUnique({ where: { id: partId } });
      if (!existing) return res.status(404).json({ error: 'Part not found' });

      let finalQty = existing.quantity;
      if (adjustQuantity !== undefined) {
        finalQty = Math.max(0, existing.quantity + parseInt(adjustQuantity, 10));
      } else if (quantity !== undefined) {
        finalQty = parseInt(quantity, 10);
      }

      const updated = await prisma.inventoryPart.update({
        where: { id: partId },
        data: {
          name: name ? String(name).trim() : undefined,
          category: category || undefined,
          quantity: finalQty,
          buyingPrice: buyingPrice !== undefined ? parseFloat(buyingPrice) : undefined,
          sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
          lowStockAlert: lowStockAlert !== undefined ? parseInt(lowStockAlert, 10) : undefined,
          unit: unit || undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'UPDATE',
          entity: 'INVENTORY',
          entityId: partId,
          details: `Updated part ${updated.partNumber} (${updated.name}). Quantity set to ${updated.quantity}`,
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const part = await prisma.inventoryPart.findUnique({ where: { id: partId } });
      if (!part) return res.status(404).json({ error: 'Part not found' });

      await prisma.inventoryPart.delete({ where: { id: partId } });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'DELETE',
          entity: 'INVENTORY',
          entityId: partId,
          details: `Deleted spare part ${part.partNumber} - ${part.name}`,
        },
      });

      return res.status(200).json({ message: 'Part deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
