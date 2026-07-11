
import { type Booking } from '@/lib/types';
import { type BookingAddon, getAddonById } from '@/lib/repositories/addons';
import { safeNumber } from './type-utils';

export interface PriceAdjustmentInput {
    bookingId: string;
    addonId: string;
    quantity?: number;
    customPrice?: number; // For manual adjustments
    reason?: string;
}

/**
 * Add a price adjustment to an existing booking
 * Returns the new total price and updated addons list
 */
export async function addPriceAdjustment(
    currentBooking: Booking,
    adjustment: PriceAdjustmentInput
): Promise<{ newAddons: BookingAddon[], newTotalPrice: number }> {
    // Optimized: fetch single addon by ID
    const addon = getAddonById(adjustment.addonId);

    if (!addon) {
        throw new Error('Addon not found');
    }

    // Check if addon is applicable to this service category
    if (addon.applicable_categories && addon.applicable_categories.length > 0) {
        if (!addon.applicable_categories.includes(currentBooking.customer.category)) {
            throw new Error(`Addon '${addon.name}' is not applicable to service category '${currentBooking.customer.category}'`);
        }
    }

    // Determine price (use custom price if provided, otherwise use addon price)
    const price = adjustment.customPrice ?? addon.price;
    const quantity = adjustment.quantity ?? 1;

    // Get existing addons
    // Use spread to create a copy to avoid mutating original if needed
    const existingAddons = currentBooking.addons ? [...currentBooking.addons] : [];

    // Check if addon of this type already exists in the booking
    const existingAddonIndex = existingAddons.findIndex(a => a.addon_id === adjustment.addonId);

    let newAddons: BookingAddon[];
    if (existingAddonIndex >= 0) {
        // Update existing addon quantity
        newAddons = [...existingAddons];
        const existing = newAddons[existingAddonIndex];
        if (!existing) {
             throw new Error("Unexpected error: addon not found at index");
        }
        newAddons[existingAddonIndex] = {
            ...existing,
            quantity: existing.quantity + quantity
        };
    } else {
        // Add new addon
        newAddons = [
            ...existingAddons,
            {
                addon_id: adjustment.addonId,
                addon_name: addon.name,
                quantity,
                price_at_booking: price
            }
        ];
    }

    // Calculate new addons total
    const newAddonsTotal = newAddons.reduce((sum, a) =>
        sum + (safeNumber(a.price_at_booking) * safeNumber(a.quantity)), 0
    );

    const serviceBase = currentBooking.finance.service_base_price ?? 0;
    // If service_base_price is 0 (migrated data), we might need to rely on total_price minus old addons.
    // BUT for robustness, if we are recalculating, we should start from base.
    // If base is missing, we might have issues.
    // However, existing `update/route.ts` logic suggests `service_base_price` is reliable or we fallback.
    // Let's assume `serviceBase` is correct. If it's 0 and `total_price` > 0, it means it's an old record without breakdown.

    // Handling legacy data without breakdown:
    // If service_base_price is 0 but total_price is set, we might need to set service_base_price = total_price - existing_addons_total

    let basePrice = serviceBase;
    if (basePrice === 0 && currentBooking.finance.total_price > 0 && (!currentBooking.addons || currentBooking.addons.length === 0)) {
        // Very old booking with no addons and no breakdown
        basePrice = currentBooking.finance.total_price;
    }

    const baseDiscount = currentBooking.finance.base_discount ?? 0;
    const couponDiscount = currentBooking.finance.coupon_discount ?? 0;

    const newTotalPrice = Math.max(0, basePrice + newAddonsTotal - baseDiscount - couponDiscount);

    return { newAddons, newTotalPrice };
}

// Fixed Addon IDs matching scripts/seed-addons.js
export const ADDON_IDS = {
    TAMBAH_ORANG: "cff63d0e-9eca-49aa-9142-82195ea1d28b",
    UPGRADE_SILVER: "ad642dfe-8538-4148-9861-89c3161938a6",
    DOWNGRADE_BRONZE: "f9ec4884-95af-41e7-bbf6-fb2af429046e",
    TAMBAH_JAM: "9ee77fe3-d8bb-40a2-bc64-c71f9dd2eb2e",
    RUSH_ORDER: "84b453dc-2cba-4369-b034-f900c934acba",
    LAINNYA: "3eb8bfa0-16eb-431b-94fd-1290f81e4ee6"
} as const;

/**
 * Helper for common scenario: Add extra person
 */
export async function addExtraPerson(booking: Booking, count: number = 1) {
    const addonId = ADDON_IDS.TAMBAH_ORANG;

    return addPriceAdjustment(booking, {
        bookingId: booking.id,
        addonId: addonId,
        quantity: count,
        reason: `Tambah ${count} orang saat eksekusi`
    });
}

// Map defining which addon ID corresponds to which service transition
export type ServiceTransitionMap = Record<string, Record<string, string>>;

export const SERVICE_UPGRADE_MAP: ServiceTransitionMap = {
    'Prewedding Bronze': {
        'Prewedding Silver': ADDON_IDS.UPGRADE_SILVER,
    },
    'Prewedding Silver': {
        'Prewedding Bronze': ADDON_IDS.DOWNGRADE_BRONZE,
    },
    // Add more transitions here as needed
};

/**
 * Helper to find the addon ID for a service upgrade/downgrade
 */
export function getServiceUpgradeAddonId(currentCategory: string, targetCategory: string): string | null {
    const transitions = SERVICE_UPGRADE_MAP[currentCategory];
    if (!transitions) return null;
    return transitions[targetCategory] || null;
}

/**
 * Helper for service upgrade
 */
export async function upgradeService(booking: Booking, targetService: string) {
    const currentCategory = booking.customer.category;
    const addonId = getServiceUpgradeAddonId(currentCategory, targetService);

    if (!addonId) {
        throw new Error(`Automatic upgrade path from ${currentCategory} to ${targetService} not defined`);
    }

    return addPriceAdjustment(booking, {
        bookingId: booking.id,
        addonId: addonId,
        quantity: 1,
        reason: `Upgrade dari ${currentCategory} ke ${targetService}`
    });
}
