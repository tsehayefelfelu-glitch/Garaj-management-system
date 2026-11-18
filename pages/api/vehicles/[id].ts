import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const vehicleId = String(id);
  const user = getUserFromRequest(req);

  if (req.method === 'GET') {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { customer: true, jobCards: true, proformas: true },
      });
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
      return res.status(200).json(vehicle);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { plateNumber, make, model, chassisNumber, year, color } = req.body;
    try {
      const updated = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          plateNumber: plateNumber ? String(plateNumber).toUpperCase().trim() : undefined,
          make: make || undefined,
          model: model !== undefined ? model : undefined,
          chassisNumber: chassisNumber !== undefined ? chassisNumber : undefined,
          year: year ? parseInt(year, 10) : undefined,
          color: color !== undefined ? color : undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'UPDATE',
          entity: 'VEHICLE',
          entityId: vehicleId,
          details: `Updated vehicle ${updated.plateNumber}`,
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { jobCards: { where: { status: 'ACTIVE' } } },
      });

      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
      if (vehicle.jobCards.length > 0) {
        return res.status(400).json({ error: 'Cannot delete vehicle currently in workshop with active job card' });
      }

      await prisma.vehicle.delete({ where: { id: vehicleId } });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'DELETE',
          entity: 'VEHICLE',
          entityId: vehicleId,
          details: `Deleted vehicle ${vehicle.plateNumber}`,
        },
      });

      return res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
