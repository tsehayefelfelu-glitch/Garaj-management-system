import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { plate } = req.query;
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: plate
          ? {
              plateNumber: { contains: String(plate) },
            }
          : undefined,
        include: {
          customer: true,
        },
        orderBy: { plateNumber: 'asc' },
      });
      return res.status(200).json(vehicles);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { customerId, plateNumber, make, model, chassisNumber, year, color } = req.body;
    if (!customerId || !plateNumber || !make) {
      return res.status(400).json({ error: 'Customer, Plate number, and Make are required' });
    }

    try {
      const vehicle = await prisma.vehicle.create({
        data: {
          customerId,
          plateNumber: plateNumber.toUpperCase().trim(),
          make,
          model: model || '',
          chassisNumber: chassisNumber || '',
          year: year ? parseInt(year, 10) : undefined,
          color: color || '',
        },
        include: { customer: true },
      });
      return res.status(201).json(vehicle);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
