import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExplorerInsights, getExplorerObjects } from '@/lib/repositories/meta-ads';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const format = sp.get('format') || 'json';
    const type = sp.get('type') || 'insights';
    const start = sp.get('start') || undefined;
    const end = sp.get('end') || undefined;
    const level = sp.get('level') || 'campaign';

    let data: any[] = [];
    if (type === 'insights') {
      const res = getExplorerInsights({ level, startDate: start, endDate: end, limit: 2000 });
      data = res.data;
    } else if (type === 'campaigns' || type === 'adsets' || type === 'ads' || type === 'creatives') {
      const singular = type.slice(0, -1) as any;
      const res = getExplorerObjects(singular, { limit: 2000 });
      data = res.data;
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return new NextResponse('', { headers: { 'Content-Type': 'text/csv' } });
      }
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      for (const row of data) {
        const values = headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="meta_${type}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
