import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { clientsCsv } from '@/lib/backup';

export const dynamic = 'force-dynamic';
export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'admin') return new NextResponse('Not allowed', { status: 403 });
  return new NextResponse(await clientsCsv(), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="rerise-clients-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
