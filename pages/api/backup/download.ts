import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (user && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Unauthorized: Only Admins can download database backups' });
  }

  const { file } = req.query;
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ error: 'File parameter is required' });
  }

  const safeFilename = path.basename(file);
  const filePath = path.join(BACKUP_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Requested backup file does not exist' });
  }

  const fileStat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': fileStat.size,
    'Content-Disposition': `attachment; filename="${safeFilename}"`,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
}
