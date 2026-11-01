import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { appUrl } from '@/lib/auth';
import { buildPlanPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Link sent to a client on WhatsApp or email. The signed token is the key, so keep the link private.
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [p] = await q<any>(`SELECT p.*, u.name AS client_name FROM plans p LEFT JOIN clients cl ON cl.id=p.client_id LEFT JOIN users u ON u.id=cl.user_id WHERE p.share_code=$1 AND p.share_expires > now()`, [token.slice(0, 40)]);
  if (!p) return new NextResponse('This link has expired or is not valid. Ask your coach for a new one.', { status: 410 });
  const buf = await buildPlanPdf({ title: p.title, clientName: p.client_name || 'Plan', kind: p.kind, data: p.data, appUrl: appUrl() });
  const name = (p.client_name || 'plan').replace(/[^A-Za-z0-9]+/g, '-');
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Rerise-${name}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
}
