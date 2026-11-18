import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const customerId = String(id);
  const user = getUserFromRequest(req);

  if (req.method === 'GET') {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { vehicles: true, jobCards: true, proformas: true, credits: true },
      });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      return res.status(200).json(customer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { customerType, name, phone, tinNumber, vatNumber, address } = req.body;
    try {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: {
          customerType: customerType || undefined,
          name: name ? String(name).trim() : undefined,
          phone: phone ? String(phone).trim() : undefined,
          tinNumber: tinNumber !== undefined ? tinNumber : undefined,
          vatNumber: vatNumber !== undefined ? vatNumber : undefined,
          address: address !== undefined ? address : undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'UPDATE',
          entity: 'CUSTOMER',
          entityId: customerId,
          details: `Updated customer ${updated.name}`,
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { jobCards: { where: { status: 'ACTIVE' } } },
      });

      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      if (customer.jobCards.length > 0) {
        return res.status(400).json({ error: 'Cannot delete customer with active ongoing job cards' });
      }

      await prisma.customer.delete({ where: { id: customerId } });

      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system',
          action: 'DELETE',
          entity: 'CUSTOMER',
          entityId: customerId,
          details: `Deleted customer ${customer.name}`,
        },
      });

      return res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
