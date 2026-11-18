import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { username, password, fullName, role, phone } = req.body;

    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Username, password, full name, and role are required' });
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });

      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          username: username.toLowerCase().trim(),
          passwordHash,
          fullName: fullName.trim(),
          role: role.toUpperCase(),
          phone: phone || null,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          username: currentUser.username,
          action: 'CREATE',
          entity: 'USER',
          entityId: newUser.id,
          details: `Admin created staff user ${newUser.username} with role ${newUser.role}`,
        },
      });

      return res.status(201).json(newUser);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
