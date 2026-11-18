import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { q, type } = req.query;
    const queryStr = typeof q === 'string' ? q.trim() : '';

    try {
      const customers = await prisma.customer.findMany({
        where: queryStr
          ? {
              OR: [
                { name: { contains: queryStr } },
                { phone: { contains: queryStr } },
                { tinNumber: { contains: queryStr } },
                {
                  vehicles: {
                    some: {
                      plateNumber: { contains: queryStr },
                    },
                  },
                },
              ],
            }
          : undefined,
        include: {
          vehicles: true,
          jobCards: {
            take: 3,
            orderBy: { entryDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(customers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const user = getUserFromRequest(req);
    const { customerType, name, phone, tinNumber, vatNumber, address, kebele, houseNo, vehicle } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    try {
      const customer = await prisma.customer.create({
        data: {
          customerType: customerType || 'INDIVIDUAL',
          name,
          phone,
          tinNumber: tinNumber || null,
          vatNumber: vatNumber || null,
          address: address || null,
          kebele: kebele || null,
          houseNo: houseNo || null,
          vehicles: vehicle && vehicle.plateNumber ? {
            create: {
              plateNumber: vehicle.plateNumber.toUpperCase(),
              make: vehicle.make || 'Toyota',
              model: vehicle.model || '',
              chassisNumber: vehicle.chassisNumber || '',
              color: vehicle.color || '',
              year: vehicle.year ? parseInt(vehicle.year, 10) : undefined,
            },
          } : undefined,
        },
        include: {
          vehicles: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'CREATE',
          entity: 'CUSTOMER',
          entityId: customer.id,
          details: `Registered customer ${customer.name} with vehicle ${vehicle?.plateNumber || 'None'}`,
        },
      });

      return res.status(201).json(customer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
