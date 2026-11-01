'use client';
import { useActionState } from 'react';
import { createClientAction } from '../actions';

export default function NewClientForm({ templates }: { templates: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(createClientAction, null as any);
  return (
    <form action={action} className="card" style={{ maxWidth: 720 }}>
      <label className="fld">Full name<input name="name" required /></label>
      <div className="row">
        <label className="fld" style={{ flex: '1 1 240px' }}>Email (her login)<input type="email" name="email" required /></label>
        <label className="fld" style={{ flex: '1 1 200px' }}>WhatsApp number<input type="tel" name="phone" placeholder="98XXXXXXXX" /></label>
      </div>
      <div className="row">
        <label className="fld" style={{ flex: '1 1 100px' }}>Age<input name="age" inputMode="numeric" /></label>
        <label className="fld" style={{ flex: '3 1 240px' }}>Main goal
          <select name="goal"><option>Get stronger</option><option>Lose fat</option><option>Posture and pain-free movement</option><option>Menopause support</option></select>
        </label>
      </div>
      <label className="fld">Health notes for her plan<textarea name="health_notes" rows={3} /></label>
      <div className="row">
        <label className="fld" style={{ flex: '1 1 200px' }}>Plan length
          <select name="plan_length"><option value="monthly">Monthly (4 weeks)</option><option value="quarterly">Quarterly (3 months)</option></select>
        </label>
        <label className="fld" style={{ flex: '1 1 200px' }}>Start date<input type="date" name="start_date" /></label>
        <label className="fld" style={{ flex: '2 1 240px' }}>Start from template
          <select name="template"><option value="">No plan yet</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
        </label>
      </div>
      <label className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        <input type="checkbox" name="consent" style={{ marginTop: 4, width: 20, height: 20 }} />
        <span>She has agreed that I store her health details to build her plan.</span>
      </label>
      {state?.error && <p className="notice err" role="alert">{state.error}</p>}
      <div className="row"><button className="btn primary" disabled={pending}>{pending ? 'Saving...' : 'Save and show login details'}</button></div>
    </form>
  );
}
