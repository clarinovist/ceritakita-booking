import { NextRequest, NextResponse } from 'next/server';
import { recordPageView } from '@/lib/repositories/analytics';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { analyticsTrackSchema } from '@/lib/validation/api-routes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = analyticsTrackSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const { path, visitor_id, user_agent, device_type, referer } = validationResult.data;

    recordPageView({
      path,
      visitor_id,
      user_agent: user_agent || req.headers.get('user-agent'),
      device_type,
      referer: referer || null
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(
      error instanceof Error ? error : new AppError('Internal Server Error')
    );
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
