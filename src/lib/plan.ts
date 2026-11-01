export type Item = { id: string; name: string; tag: string; sets: string; reps: string; rest: string; cue: string; video: string };
export type Day = { id: string; name: string; tag: string; focus: string; note: string; items: Item[] };
export type PlanData = { week: string; phase: string; days: Day[] };

export function safeUrl(u: string): string {
  u = (u || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { const p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:' ? p.href : ''; } catch { return ''; }
}

export function waLink(phone: string, text: string) {
  let d = (phone || '').replace(/\D/g, '');
  if (d.length === 10) d = '91' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
