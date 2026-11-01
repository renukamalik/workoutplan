import type { PlanData } from '@/lib/plan';
import { safeUrl } from '@/lib/plan';
import Logo from './Logo';
import ClientPlanChecks from './ClientPlanChecks';

export default function PlanView({ title, clientName, data, planId, doneIds }: { title: string; clientName?: string | null; data: PlanData; planId?: string; doneIds?: string[] }) {
  const interactive = !!planId;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header style={{ background: 'var(--band)', borderRadius: 18, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="row between"><Logo /><span className="small muted">Coach Renuka</span></div>
        <h1>{clientName ? <><em style={{ color: 'var(--accent)' }}>{clientName}</em>, your strength plan</> : title}</h1>
        <p className="muted">{title}</p>
        <div className="row"><span className="pill" style={{ background: '#fff' }}>Week {data.week}</span><span className="pill" style={{ background: '#fff' }}>{data.phase}</span></div>
      </header>
      <div className="row" style={{ gap: 8 }}>
        <span className="chip ok">Green: full session</span><span className="chip warn">Amber: fewer sets, skip anything that flares symptoms</span><span className="chip alert">Red: rest or a gentle walk</span>
      </div>
      {data.days.map((day) => (
        <section className="day" key={day.id} id={day.id}>
          <div className="dayhead"><div><div className="n">{day.name}{day.tag && <> <em>{day.tag}</em></>}</div><div className="small muted">{day.focus}</div></div>
            {day.items.length > 0 && <span className="pill" style={{ background: '#fff' }}>{day.items.length} exercises</span>}</div>
          {day.items.map((it, ii) => {
            const u = safeUrl(it.video);
            return (
              <div className="ex" key={it.id} data-item={it.id}>
                <div className="num">{ii + 1}</div>
                <div><div className="nm">{it.name}</div><div className="small muted">{it.tag}</div></div>
                <div className="row pills" style={{ gap: 6, justifyContent: 'flex-end' }}>
                  <span className="pill">{it.sets}{/^\d+$/.test(it.sets) ? (it.sets === '1' ? ' set' : ' sets') : ' sets'}</span>
                  <span className="pill">{it.reps}{/^[\d-]+$/.test(it.reps) ? ' reps' : ''}</span>
                  {it.rest && it.rest !== '-' && <span className="pill">Rest {it.rest}</span>}
                </div>
                {it.cue && <div className="cue">{it.cue}</div>}
                <div className="vid">
                  {u ? <a className="watch" href={u} target="_blank" rel="noopener">Watch video</a> : <span className="small muted">Video coming soon</span>}
                  {interactive && <ClientPlanChecks planId={planId!} itemId={it.id} initial={doneIds?.includes(it.id) ?? false} />}
                </div>
              </div>
            );
          })}
          {day.note && <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }} className="small muted">{day.note}</div>}
        </section>
      ))}
    </div>
  );
}
