import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = String(username).trim();
  const cleanPassword = String(password).trim();

  try {
    // 1. Find user by username or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: cleanUsername.toLowerCase() },
          { phone: cleanUsername },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: `User "${cleanUsername}" not found. Try clicking one of the demo buttons below.` });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'This user account is currently deactivated.' });
    }

    // 2. Compare password
    const isValid = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. (Default is admin123 for admin, manager123 for manager)' });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });

    // Record login in audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        username: user.username,
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
        details: `User ${user.username} logged in successfully`,
      },
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMsg = error?.message || String(error);
    return res.status(500).json({ 
      error: `Login failed: ${errorMsg}` 
    });
  }
}
