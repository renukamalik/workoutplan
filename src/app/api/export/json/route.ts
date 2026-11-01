import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { exportAll } from '@/lib/backup';

export const dynamic = 'force-dynamic';
export async function GET() {
  const s = await getSession();
  if (!s || s.role !== 'admin') return new NextResponse('Not allowed', { status: 403 });
  const data = await exportAll();
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="rerise-backup-${new Date().toISOString().slice(0, 10)}.json"` } });
}
