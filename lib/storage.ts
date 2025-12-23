import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';

const DB_PATH = path.join(process.cwd(), 'data', 'db.txt');

export interface Payment {
  date: string;
  amount: number;
  note: string;
  proof_base64?: string;      // Deprecated: kept for backward compatibility during migration
  proof_filename?: string;    // New: relative path from uploads/ (e.g., "2024-12/bookingId_0_timestamp_uuid.jpg")
}

export interface FinanceData {
  total_price: number;
  payments: Payment[];
  // Price breakdown (optional for backward compatibility)
  service_base_price?: number;     // Service base price before discount
  base_discount?: number;           // Service discount value
  addons_total?: number;            // Total from all add-ons
  coupon_discount?: number;         // Coupon discount applied
  coupon_code?: string;             // Coupon code used (if any)
}

export interface CustomerData {
  name: string;
  whatsapp: string;
  category: 'Indoor' | 'Indoor Studio' | 'Outdoor' | 'Outdoor / On Location' | 'Wedding' | 'Prewedding Bronze' | 'Prewedding Gold' | 'Prewedding Silver' | 'Wisuda' | 'Family' | 'Birthday' | 'Pas Foto' | 'Self Photo';
  serviceId?: string;
}

export interface BookingData {
  date: string;
  notes: string;
  location_link: string;
}

export interface BookingAddon {
  addon_id: string;
  addon_name: string;
  quantity: number;
  price_at_booking: number;
}

export interface RescheduleHistory {
  id?: number;
  old_date: string;
  new_date: string;
  rescheduled_at: string;
  reason?: string;
}

export interface Booking {
  id: string;
  created_at: string;
  status: 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';
  customer: CustomerData;
  booking: BookingData;
  finance: FinanceData;
  photographer_id?: string;
  addons?: BookingAddon[];
  reschedule_history?: RescheduleHistory[];
}

// Ensure DB exists
function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    // If not exists, create empty array
    fs.writeFileSync(DB_PATH, JSON.stringify([]), 'utf-8');
  }
}

type RawBooking = Omit<Booking, 'status'> & { status?: string };

export function readData(): Booking[] {
  ensureDB();

  try {
    // Read data without locking for simplicity
    // Locking is only applied on writes to prevent concurrent write issues
    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(fileContent) as RawBooking[];

    // Backward compatibility: Ensure status exists and normalize to consistent format
    return data.map((b): Booking => {
      let status: 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';
      const rawStatus = b.status;
      
      if (rawStatus === 'Canceled') {
        status = 'Cancelled';
      } else if (rawStatus === 'Active' || rawStatus === 'Rescheduled' || rawStatus === 'Completed' || rawStatus === 'Cancelled') {
        status = rawStatus;
      } else {
        status = 'Active';
      }
      
      return {
        ...b,
        status: status
      };
    });
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

export async function writeData(data: Booking[]): Promise<void> {
  ensureDB();
  let release: (() => Promise<void>) | null = null;

  try {
    // Acquire exclusive lock
    release = await lockfile.lock(DB_PATH, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
      }
    });

    // Write data
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing DB file:", error);
    throw error;
  } finally {
    if (release) {
      await release();
    }
  }
}
