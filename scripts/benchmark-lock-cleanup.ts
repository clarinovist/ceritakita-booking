
import fs from 'fs/promises';
import path from 'path';
import { cleanupStaleLocks } from '../lib/file-lock';

const LOCK_DIR = path.join(process.cwd(), 'data', 'locks');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'locks_backup');
const LOCK_TIMEOUT = 30000;

async function setup() {
  // Backup existing locks
  try {
    await fs.access(LOCK_DIR);
    await fs.rename(LOCK_DIR, BACKUP_DIR);
  } catch (e) {
    // If LOCK_DIR doesn't exist, that's fine
  }
  await fs.mkdir(LOCK_DIR, { recursive: true });
}

async function teardown() {
  // Cleanup test locks
  try {
    await fs.rm(LOCK_DIR, { recursive: true, force: true });
  } catch (e) {}

  // Restore backup
  try {
    await fs.access(BACKUP_DIR);
    await fs.rename(BACKUP_DIR, LOCK_DIR);
  } catch (e) {
    // If backup doesn't exist, just recreate empty LOCK_DIR
     await fs.mkdir(LOCK_DIR, { recursive: true });
  }
}

async function createLocks(count: number, staleRatio: number) {
  const staleCount = Math.floor(count * staleRatio);
  const freshCount = count - staleCount;

  const staleTime = Date.now() - LOCK_TIMEOUT - 10000; // 10s older than timeout
  const freshTime = Date.now();

  const promises = [];

  for (let i = 0; i < staleCount; i++) {
    const data = { timestamp: staleTime, pid: 123, resource: `stale_${i}` };
    promises.push(fs.writeFile(path.join(LOCK_DIR, `stale_${i}.lock`), JSON.stringify(data)));
  }

  for (let i = 0; i < freshCount; i++) {
    const data = { timestamp: freshTime, pid: 123, resource: `fresh_${i}` };
    promises.push(fs.writeFile(path.join(LOCK_DIR, `fresh_${i}.lock`), JSON.stringify(data)));
  }

  await Promise.all(promises);
}

async function runBenchmark() {
  console.log('Setting up benchmark...');
  await setup();

  const FILE_COUNT = 1000;
  const STALE_RATIO = 0.5;

  console.log(`Creating ${FILE_COUNT} lock files (${STALE_RATIO * 100}% stale)...`);
  await createLocks(FILE_COUNT, STALE_RATIO);

  console.log('Running cleanupStaleLocks...');
  const start = performance.now();
  const cleaned = await cleanupStaleLocks();
  const end = performance.now();

  console.log(`Cleanup took ${(end - start).toFixed(2)}ms`);
  console.log(`Cleaned ${cleaned} files.`);

  await teardown();
  process.exit(0);
}

runBenchmark().catch(async (e) => {
  console.error(e);
  await teardown();
  process.exit(1);
});
