import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';
import { Service } from '../types';
import { AppError } from '../logger';

const DATA_DIR = path.join(process.cwd(), 'data');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

/**
 * Ensure the data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code === 'EACCES') {
      throw new AppError(`Permission denied: Cannot create directory ${DATA_DIR}`, 500, 'DIR_PERMISSION_ERROR');
    }
    throw error;
  }
}

/**
 * Read all services from JSON file
 */
export async function readServices(): Promise<Service[]> {
  try {
    await ensureDataDir();

    try {
      await fs.access(SERVICES_FILE);
    } catch {
      // File doesn't exist, return default services
      const defaultServices: Service[] = [
        { id: '1', name: 'Indoor Studio', basePrice: 0, discountValue: 0, isActive: true },
        { id: '2', name: 'Outdoor / On Location', basePrice: 0, discountValue: 0, isActive: true },
        { id: '3', name: 'Wedding', basePrice: 0, discountValue: 0, isActive: true },
      ];
      await fs.writeFile(SERVICES_FILE, JSON.stringify(defaultServices, null, 2));
      return defaultServices;
    }

    const data = await fs.readFile(SERVICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    console.error('Error reading services:', error);
    if (error.code === 'EACCES') {
      throw new AppError('Permission denied: Cannot read services.json', 500, 'FILE_READ_PERMISSION');
    }
    return [];
  }
}

/**
 * Write all services to JSON file with locking for safety
 */
export async function writeServices(services: Service[]): Promise<void> {
  await ensureDataDir();

  // Ensure file exists before locking
  try {
    await fs.access(SERVICES_FILE);
  } catch {
    // Create initial empty file if it doesn't exist
    await fs.writeFile(SERVICES_FILE, JSON.stringify([], null, 2));
  }

  let release;
  try {
    // Use lockfile to prevent concurrent writes
    release = await lockfile.lock(SERVICES_FILE, {
      retries: {
        retries: 5,
        factor: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
      }
    });

    await fs.writeFile(SERVICES_FILE, JSON.stringify(services, null, 2));
  } catch (error: any) {
    console.error('Error writing services:', error);

    if (error.code === 'ELOCKED') {
      throw new AppError('File is currently locked by another process. Please try again.', 409, 'FILE_LOCKED');
    }

    if (error.code === 'EACCES') {
      throw new AppError('Permission denied: Cannot write to services.json. Check folder ownership.', 500, 'FILE_WRITE_PERMISSION');
    }

    throw new AppError(`Failed to save services: ${error.message}`, 500, 'FILE_WRITE_ERROR');
  } finally {
    if (release) {
      await release();
    }
  }
}
