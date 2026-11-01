'use client';
import { useActionState } from 'react';
import { checkinAction } from '../actions';

const scores = [['leg', 'Leg symptoms'], ['back', 'Back symptoms'], ['pelvic', 'Pelvic or period-related discomfort'], ['energy', 'Energy and sleep (10 is best)'], ['neck', 'Neck and shoulder tension']];

export default function CheckinForm() {
  const [state, action, pending] = useActionState(checkinAction, null as any);
  return (
    <form action={action} className="card">
      <p className="muted small">Scores run from 0 (none) to 10 (very strong).</p>
      <div className="row">
        <label className="fld" style={{ flex: '1 1 120px' }}>Week<input name="week" placeholder="1" /></label>
        <label className="fld" style={{ flex: '1 1 180px' }}>Sessions done (out of 5)<input name="sessions" type="number" min={0} max={7} /></label>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        {scores.map(([k, l]) => <label className="fld" key={k}>{l}<input name={k} type="number" min={0} max={10} inputMode="numeric" /></label>)}
      </div>
      <label className="fld">Which exercise felt best?<input name="best" /></label>
      <label className="fld">What do you want to discuss in the live session?<input name="discuss" /></label>
      <label className="fld">Anything else I should know?<textarea name="notes" rows={3} /></label>
      {state?.ok && <p className="notice ok" role="status">{state.ok}</p>}
      <button className="btn primary" style={{ minHeight: 50 }} disabled={pending}>{pending ? 'Sending...' : 'Send check-in'}</button>
    </form>
  );
}
