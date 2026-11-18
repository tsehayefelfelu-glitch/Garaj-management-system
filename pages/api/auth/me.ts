import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, username: true, fullName: true, role: true, phone: true },
  });

  if (!dbUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json({ user: dbUser });
}
