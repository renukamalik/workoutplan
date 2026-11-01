'use client';
import { useState, useTransition } from 'react';
import type { PlanData, Item } from '@/lib/plan';
import { savePlanAction, revisePlanAction } from '@/app/(coach)/plans/actions';

const BANK = ['Squat','Hip hinge','Side-lying hip abduction','Calf raises','Toe raises','Glute bridge','Supported split squat (shallow)','Lying dumbbell chest press','Standing dumbbell press','Standing dumbbell lateral raise (light)','Dumbbell triceps extension','Dumbbell biceps curl','Band row to the hip','Supported single-arm dumbbell row','IYTW raises','Mini-band shoulder external rotation','Counter push-up','Dead bug (single leg)','Bird dog','Side plank (on knees)','Prone back lift (small range)','Easy walk','Hip 90/90','Quadruped knee circles','Hip airplane (supported, small range)','Shoulder dislocates (band or broomstick)','Shoulder internal and external rotation','Standing chin tucks','Lying 90/90 breathing'];
const uid = () => Math.random().toString(36).slice(2, 10);

export default function PlanEditor({ id, title: t0, kind: k0, data: d0, aiReady }: { id: string; title: string; kind: string; data: PlanData; aiReady?: boolean }) {
  const [ask, setAsk] = useState('');
  const [askMsg, setAskMsg] = useState('');
  const [title, setTitle] = useState(t0);
  const [kind, setKind] = useState(k0);
  const [d, setD] = useState<PlanData>(d0);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const edit = (fn: (x: PlanData) => void) => { const n = structuredClone(d); fn(n); setD(n); setDirty(true); setMsg(''); };
  const setItem = (di: number, ii: number, k: keyof Item, v: string) => edit((n) => { (n.days[di].items[ii] as any)[k] = v; });
  const save = () => start(async () => { try { await savePlanAction(id, title, kind, d); setDirty(false); setMsg('Saved'); } catch { setMsg('Could not save. Try again.'); } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card">
        <div className="row">
          <label className="fld" style={{ flex: '3 1 280px' }}>Plan name<input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} /></label>
          <label className="fld" style={{ flex: '1 1 140px' }}>Length<select value={kind} onChange={(e) => { setKind(e.target.value); setDirty(true); }}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>
          <label className="fld" style={{ flex: '1 1 120px' }}>Week<input value={d.week} onChange={(e) => edit((n) => { n.week = e.target.value; })} /></label>
          <label className="fld" style={{ flex: '1 1 160px' }}>Phase<input value={d.phase} onChange={(e) => edit((n) => { n.phase = e.target.value; })} /></label>
        </div>
        <div className="row savebar">
          <button className="btn primary" onClick={save} disabled={pending || !dirty}>{pending ? 'Saving...' : 'Save plan'}</button>
          <span className="small muted" aria-live="polite">{dirty ? 'Unsaved changes' : msg}</span>
        </div>
      </div>
      {aiReady && (
        <div className="card">
          <h3>Ask AI to change this plan</h3>
          <div className="row">
            <input className="in" style={{ flex: '1 1 320px' }} value={ask} onChange={(e) => setAsk(e.target.value)} aria-label="What should the AI change" placeholder="Example: swap the squat for a supported split squat on Monday and add shoulder mobility on Thursday" />
            <button className="btn" disabled={pending || !ask.trim()} onClick={() => start(async () => { setAskMsg('AI is working...'); const r: any = await revisePlanAction(d, ask); if (r.data) { setD(r.data); setDirty(true); setAsk(''); setAskMsg('Done. Check the changes, then press Save plan.'); } else setAskMsg(r.error); })}>Change with AI</button>
          </div>
          {askMsg && <p className="small muted" role="status">{askMsg}</p>}
        </div>
      )}
      <datalist id="bank">{BANK.map((b) => <option key={b} value={b} />)}</datalist>
      {d.days.map((day, di) => (
        <section className="day" key={day.id}>
          <div className="dayhead" style={{ alignItems: 'flex-start' }}>
            <div className="row" style={{ flex: 1 }}>
              <input className="in" style={{ flex: '1 1 130px', fontWeight: 700 }} value={day.name} onChange={(e) => edit((n) => { n.days[di].name = e.target.value; })} aria-label="Day" />
              <input className="in" style={{ flex: '1 1 150px' }} value={day.tag} onChange={(e) => edit((n) => { n.days[di].tag = e.target.value; })} aria-label="Session" placeholder="Session" />
              <input className="in" style={{ flex: '2 1 220px' }} value={day.focus} onChange={(e) => edit((n) => { n.days[di].focus = e.target.value; })} aria-label="Focus" placeholder="Focus" />
            </div>
            <div className="row">
              <button className="btn sm" disabled={di === 0} onClick={() => edit((n) => { const t = n.days[di]; n.days[di] = n.days[di - 1]; n.days[di - 1] = t; })}>Up</button>
              <button className="btn sm danger" onClick={() => edit((n) => { n.days.splice(di, 1); })}>Remove day</button>
            </div>
          </div>
          {day.items.map((it, ii) => (
            <div className="ex" key={it.id}>
              <div className="num">{ii + 1}</div>
              <input className="in" list="bank" value={it.name} onChange={(e) => setItem(di, ii, 'name', e.target.value)} aria-label="Exercise" style={{ fontWeight: 700, gridColumn: '2 / 4', width: '100%' }} />
              <div className="edgrid">
                <label className="fld">Muscle or focus<input value={it.tag} onChange={(e) => setItem(di, ii, 'tag', e.target.value)} /></label>
                <label className="fld">Sets<input value={it.sets} onChange={(e) => setItem(di, ii, 'sets', e.target.value)} /></label>
                <label className="fld">Reps<input value={it.reps} onChange={(e) => setItem(di, ii, 'reps', e.target.value)} /></label>
                <label className="fld">Rest<input value={it.rest} onChange={(e) => setItem(di, ii, 'rest', e.target.value)} /></label>
              </div>
              <label className="fld" style={{ gridColumn: '2 / 4' }}>Coach cue<textarea rows={2} value={it.cue} onChange={(e) => setItem(di, ii, 'cue', e.target.value)} /></label>
              <label className="fld" style={{ gridColumn: '2 / 4' }}>Video link<input value={it.video} placeholder="Paste a YouTube, Drive or Instagram link" onChange={(e) => setItem(di, ii, 'video', e.target.value)} /></label>
              <div className="row" style={{ gridColumn: '2 / 4' }}>
                <button className="btn sm" disabled={ii === 0} onClick={() => edit((n) => { const a = n.days[di].items; [a[ii - 1], a[ii]] = [a[ii], a[ii - 1]]; })}>Move up</button>
                <button className="btn sm" disabled={ii === day.items.length - 1} onClick={() => edit((n) => { const a = n.days[di].items; [a[ii + 1], a[ii]] = [a[ii], a[ii + 1]]; })}>Move down</button>
                <button className="btn sm danger" onClick={() => edit((n) => { n.days[di].items.splice(ii, 1); })}>Remove</button>
              </div>
            </div>
          ))}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="fld">Note for this day<textarea rows={2} value={day.note} onChange={(e) => edit((n) => { n.days[di].note = e.target.value; })} /></label>
            <div><button className="btn sm primary" onClick={() => edit((n) => { n.days[di].items.push({ id: uid(), name: 'New exercise', tag: '', sets: '3', reps: '10', rest: '45s', cue: '', video: '' }); })}>Add exercise</button></div>
          </div>
        </section>
      ))}
      <div><button className="btn" onClick={() => edit((n) => { n.days.push({ id: uid(), name: 'New day', tag: '', focus: '', note: '', items: [] }); })}>Add day</button></div>
    </div>
  );
}
