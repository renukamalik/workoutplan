import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession, appUrl } from '@/lib/auth';
import { buildPlanPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s) return new NextResponse('Please log in', { status: 401 });
  const [p] = await q<any>(`SELECT p.*, u.name AS client_name, cl.user_id FROM plans p LEFT JOIN clients cl ON cl.id=p.client_id LEFT JOIN users u ON u.id=cl.user_id WHERE p.id=$1`, [id]);
  if (!p || (s.role !== 'admin' && p.user_id !== s.uid)) return new NextResponse('Not found', { status: 404 });
  const buf = await buildPlanPdf({ title: p.title, clientName: p.client_name || 'Template', kind: p.kind, data: p.data, appUrl: appUrl() });
  const name = (p.client_name || 'plan').replace(/[^A-Za-z0-9]+/g, '-');
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Rerise-${name}.pdf"`, 'Cache-Control': 'no-store' } });
}
