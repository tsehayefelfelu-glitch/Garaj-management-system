import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getBackupList() {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR);
  const backups = files
    .filter((f) => f.startsWith('garage_backup_') && (f.endsWith('.db') || f.endsWith('.sql')))
    .map((filename) => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        sizeBytes: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
        createdAt: stats.mtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return backups;
}

// Keep only the latest 30 backups to prevent disk full
function purgeOldBackups(keepCount = 30) {
  const backups = getBackupList();
  if (backups.length > keepCount) {
    const toDelete = backups.slice(keepCount);
    for (const b of toDelete) {
      const p = path.join(BACKUP_DIR, b.filename);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (user && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Only Admins and Managers can manage database backups' });
  }

  ensureBackupDir();

  // 1. GET: List all backups
  if (req.method === 'GET') {
    try {
      const backups = getBackupList();
      return res.status(200).json({
        storageLocation: BACKUP_DIR,
        totalBackups: backups.length,
        backups,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. POST: Create new snapshot backup
  if (req.method === 'POST') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sourceDb = path.join(process.cwd(), 'prisma', 'dev.db');
      const backupFilename = `garage_backup_${timestamp}.db`;
      const backupDbPath = path.join(BACKUP_DIR, backupFilename);

      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, backupDbPath);
      } else {
        return res.status(404).json({ error: 'Source database file not found at prisma/dev.db' });
      }

      // Purge backups older than 30 snapshots
      purgeOldBackups(30);

      const stats = fs.statSync(backupDbPath);

      // Audit Log
      await prisma.auditLog.create({
        data: {
          username: user?.username || 'system_auto_backup',
          action: 'BACKUP',
          entity: 'DATABASE',
          details: `Created snapshot backup ${backupFilename} (${(stats.size / 1024).toFixed(1)} KB) in ${BACKUP_DIR}`,
        },
      });

      return res.status(201).json({
        message: 'Backup created successfully',
        filename: backupFilename,
        path: backupDbPath,
        sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
        createdAt: new Date(),
        allBackups: getBackupList(),
      });
    } catch (error: any) {
      console.error('Backup creation error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // 3. DELETE: Remove backup file
  if (req.method === 'DELETE') {
    const { filename } = req.query;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const safeFilename = path.basename(filename);
    const targetPath = path.join(BACKUP_DIR, safeFilename);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return res.status(200).json({ message: `Backup file ${safeFilename} deleted successfully` });
    } else {
      return res.status(404).json({ error: 'Backup file not found' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
