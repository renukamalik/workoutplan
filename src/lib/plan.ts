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

const t = (v: unknown, n = 600) => String(v ?? '').slice(0, n);
const rid = () => Math.random().toString(36).slice(2, 10);

// Makes sure any plan data (typed by the coach or written by Claude) has the right shape.
export function cleanPlan(data: any): PlanData {
  return {
    week: t(data?.week, 40), phase: t(data?.phase, 60),
    days: (Array.isArray(data?.days) ? data.days : []).slice(0, 14).map((d: any) => ({
      id: t(d?.id, 20) || rid(), name: t(d?.name, 60), tag: t(d?.tag, 80), focus: t(d?.focus, 300), note: t(d?.note, 600),
      items: (Array.isArray(d?.items) ? d.items : []).slice(0, 30).map((i: any) => ({
        id: t(i?.id, 20) || rid(), name: t(i?.name, 120), tag: t(i?.tag, 60), sets: t(i?.sets, 20), reps: t(i?.reps, 40), rest: t(i?.rest, 20), cue: t(i?.cue, 500), video: t(i?.video, 300),
      })),
    })),
  };
}
