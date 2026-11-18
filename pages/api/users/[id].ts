import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }

  const { id } = req.query;
  const userId = String(id);

  if (req.method === 'PUT') {
    const { fullName, role, phone, status, password } = req.body;

    try {
      const dataToUpdate: any = {};
      if (fullName) dataToUpdate.fullName = fullName.trim();
      if (role) dataToUpdate.role = role.toUpperCase();
      if (phone !== undefined) dataToUpdate.phone = phone;
      if (status) dataToUpdate.status = status;
      if (password) {
        dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          phone: true,
          status: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          username: currentUser.username,
          action: 'UPDATE',
          entity: 'USER',
          entityId: updated.id,
          details: `Admin updated staff user ${updated.username}`,
        },
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      if (userId === currentUser.id) {
        return res.status(400).json({ error: 'Cannot delete your own admin account' });
      }

      const deleted = await prisma.user.delete({
        where: { id: userId },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          username: currentUser.username,
          action: 'DELETE',
          entity: 'USER',
          entityId: userId,
          details: `Admin deleted staff user ${deleted.username}`,
        },
      });

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
