import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const proformaId = String(id);

  if (req.method === 'GET') {
    try {
      const proforma = await prisma.proforma.findUnique({
        where: { id: proformaId },
        include: {
          customer: true,
          vehicle: true,
          items: true,
          jobCards: true,
        },
      });

      if (!proforma) {
        return res.status(404).json({ error: 'Proforma not found' });
      }

      return res.status(200).json(proforma);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const user = getUserFromRequest(req);
    const { status, notes } = req.body;

    try {
      const updated = await prisma.proforma.update({
        where: { id: proformaId },
        data: {
          status: status || undefined,
          notes: notes !== undefined ? notes : undefined,
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
          action: 'UPDATE',
          entity: 'PROFORMA',
          entityId: updated.id,
          details: `Updated Proforma ${updated.proformaNumber} status to ${updated.status}`,
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
      const proforma = await prisma.proforma.findUnique({
        where: { id: proformaId },
      });

      if (!proforma) {
        return res.status(404).json({ error: 'Proforma not found' });
      }

      await prisma.proformaItem.deleteMany({ where: { proformaId } });
      await prisma.proforma.delete({ where: { id: proformaId } });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'DELETE',
          entity: 'PROFORMA',
          entityId: proformaId,
          details: `Deleted Proforma ${proforma.proformaNumber}`,
        },
      });

      return res.status(200).json({ message: 'Proforma deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
