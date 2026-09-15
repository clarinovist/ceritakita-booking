import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getSession } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { changeBookingPackage, packageChangeSchema, readBookingPackageHistory } from '@/lib/services/booking-package-service';
import { createErrorResponse, logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

async function guard(req: NextRequest, permission: string) {
  const auth = await requireAuth(req);
  if (auth) return auth;
  const denied = await (await requirePermission(permission))(req);
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
  return rateLimiters.moderate(req);
}

export async function GET(req: NextRequest) {
  const denied = await guard(req, 'booking.view');
  if (denied) return denied;
  const id = z.string().uuid().safeParse(req.nextUrl.searchParams.get('bookingId'));
  if (!id.success) return NextResponse.json({ error: 'Booking ID tidak valid' }, { status: 400 });
  try {
    return NextResponse.json(readBookingPackageHistory(id.data));
  } catch (err) {
    const { error, statusCode } = createErrorResponse(err as Error);
    return NextResponse.json(error, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  const denied = await guard(req, 'booking.update');
  if (denied) return denied;
  try {
    const parsed = packageChangeSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Input tidak valid' }, { status: 400 });
    const session = await getSession();
    const user = session?.user as { id?: string; email?: string; name?: string } | undefined;
    const actor = user?.id || user?.email || user?.name || 'authenticated-admin';
    const result = await changeBookingPackage(parsed.data, actor);
    if (result.booking) logger.audit('CHANGE_BOOKING_PACKAGE', `booking:${parsed.data.bookingId}`, actor, { serviceId: parsed.data.serviceId });
    return NextResponse.json(result);
  } catch (err) {
    const { error, statusCode } = createErrorResponse(err as Error);
    return NextResponse.json(error, { status: statusCode });
  }
}
