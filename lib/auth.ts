import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'wise_digital_garage_secret_key_2026';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (err) {
    return null;
  }
}

export function getUserFromRequest(req: NextApiRequest): AuthUser | null {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => Promise<void> | void, allowedRoles?: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in' });
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    return handler(req, res, user);
  };
}
