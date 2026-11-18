/**
 * Wise Digital Garage Management System
 * Automated Nightly Database Backup Script
 * Can be run with: node scripts/backup.js
 * Or scheduled via Windows Task Scheduler / Linux crontab
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const SOURCE_DB = path.join(__dirname, '..', 'prisma', 'dev.db');
const MAX_BACKUPS_TO_KEEP = 30; // Keep last 30 daily snapshots

function runBackup() {
  console.log('--------------------------------------------------');
  console.log(`[${new Date().toISOString()}] Starting Automated Database Backup...`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`Created backup directory: ${BACKUP_DIR}`);
  }

  if (!fs.existsSync(SOURCE_DB)) {
    console.error(`ERROR: Source database not found at ${SOURCE_DB}`);
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `garage_backup_${timestamp}.db`;
  const targetPath = path.join(BACKUP_DIR, backupFileName);

  try {
    fs.copyFileSync(SOURCE_DB, targetPath);
    const stats = fs.statSync(targetPath);
    console.log(`SUCCESS: Snapshot saved as ${backupFileName} (${(stats.size / 1024).toFixed(1)} KB)`);
    console.log(`Location: ${targetPath}`);

    // Clean up older backups
    cleanOldBackups();
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('ERROR during backup creation:', err);
    process.exit(1);
  }
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const backups = files
    .filter((f) => f.startsWith('garage_backup_') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length > MAX_BACKUPS_TO_KEEP) {
    const toRemove = backups.slice(MAX_BACKUPS_TO_KEEP);
    for (const b of toRemove) {
      fs.unlinkSync(path.join(BACKUP_DIR, b.name));
      console.log(`Rotated old backup removed: ${b.name}`);
    }
  }
}

runBackup();
