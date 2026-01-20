import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';

const SERVICES_PATH = path.join(process.cwd(), 'data', 'services.json');

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  discountValue: number;
  isActive: boolean;
  badgeText?: string;
  benefits?: string[];
}

export function readServices(): Service[] {
  if (!fs.existsSync(SERVICES_PATH)) {
    const defaultServices: Service[] = [
      { id: '1', name: 'Indoor Studio', basePrice: 0, discountValue: 0, isActive: true },
      { id: '2', name: 'Outdoor / On Location', basePrice: 0, discountValue: 0, isActive: true },
      { id: '3', name: 'Wedding', basePrice: 0, discountValue: 0, isActive: true },
      { id: '4', name: 'Prewedding Bronze', basePrice: 0, discountValue: 0, isActive: true },
      { id: '5', name: 'Prewedding Silver', basePrice: 0, discountValue: 0, isActive: true },
      { id: '6', name: 'Prewedding Gold', basePrice: 0, discountValue: 0, isActive: true },
      { id: '7', name: 'Wisuda', basePrice: 0, discountValue: 0, isActive: true },
      { id: '8', name: 'Family', basePrice: 0, discountValue: 0, isActive: true },
      { id: '9', name: 'Birthday', basePrice: 0, discountValue: 0, isActive: true },
      { id: '10', name: 'Pas Foto', basePrice: 0, discountValue: 0, isActive: true },
      { id: '11', name: 'Self Photo', basePrice: 0, discountValue: 0, isActive: true },
    ];
    fs.writeFileSync(SERVICES_PATH, JSON.stringify(defaultServices, null, 2), 'utf-8');
    return defaultServices;
  }

  try {
    const fileContent = fs.readFileSync(SERVICES_PATH, 'utf-8');
    return JSON.parse(fileContent) as Service[];
  } catch (error) {
    console.error("Error parsing services file:", error);
    return [];
  }
}

export async function writeServices(data: Service[]): Promise<void> {
  let release: (() => Promise<void>) | null = null;

  try {
    // Acquire exclusive lock
    release = await lockfile.lock(SERVICES_PATH, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
      }
    });

    // Write data
    fs.writeFileSync(SERVICES_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing services file:", error);
    throw error;
  } finally {
    if (release) {
      await release();
    }
  }
}
