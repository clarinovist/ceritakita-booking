import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.txt');

export interface Payment {
  date: string;
  amount: number;
  note: string;
  proof_base64: string;
}

export interface FinanceData {
  total_price: number;
  payments: Payment[];
}

export interface CustomerData {
  name: string;
  whatsapp: string;
  category: 'Indoor' | 'Outdoor' | 'Wedding' | 'Prewedding Bronze' | 'Prewedding Gold' | 'Prewedding Silver' | 'Wisuda' | 'Family' | 'Birthday' | 'Pas Foto' | 'Self Photo';
}

export interface BookingData {
  date: string;
  notes: string;
  location_link?: string;
}

export interface Booking {
  id: string;
  created_at: string;
  status: 'Active' | 'Canceled' | 'Rescheduled';
  customer: CustomerData;
  booking: BookingData;
  finance: FinanceData;
}

// Ensure DB exists
function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    // If not exists, create empty array
    fs.writeFileSync(DB_PATH, JSON.stringify([]), 'utf-8');
  }
}

export function readData(): Booking[] {
  ensureDB();
  const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    const data = JSON.parse(fileContent);
    // Backward compatibility: Ensure status exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((b: any) => ({
      ...b,
      status: b.status || 'Active'
    })) as Booking[];
  } catch (error) {
    console.error("Error parsing DB file:", error);
    return [];
  }
}


const SERVICES_PATH = path.join(process.cwd(), 'data', 'services.json');

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  discountValue: number;
  isActive: boolean;
  badgeText?: string;
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

export function writeServices(data: Service[]) {
  fs.writeFileSync(SERVICES_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function writeData(data: Booking[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
