'use client';
import { useActionState } from 'react';
import { saveProfileAction } from '../actions';

export default function ProfileForm({ p }: { p: any }) {
  const [state, action, pending] = useActionState(saveProfileAction, null as any);
  return (
    <form action={action} className="card">
      <div className="row">
        <label className="fld" style={{ flex: '2 1 200px' }}>Full name<input name="name" defaultValue={p.name} required /></label>
        <label className="fld" style={{ flex: '1 1 80px' }}>Age<input name="age" defaultValue={p.age ?? ''} inputMode="numeric" /></label>
      </div>
      <label className="fld">WhatsApp number<input name="phone" type="tel" defaultValue={p.phone} /></label>
      <div className="row">
        <label className="fld" style={{ flex: '1 1 120px' }}>Height (cm)<input name="height_cm" defaultValue={p.height_cm ?? ''} inputMode="numeric" /></label>
        <label className="fld" style={{ flex: '1 1 120px' }}>Weight (kg)<input name="weight_kg" defaultValue={p.weight_kg ?? ''} inputMode="decimal" /></label>
      </div>
      <label className="fld">My goal<input name="goal" defaultValue={p.goal} /></label>
      <label className="fld">Anything I should know about my body<textarea name="health_notes" rows={3} defaultValue={p.health_notes} /></label>
      <label className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}><input type="checkbox" name="consent" defaultChecked={p.consent} style={{ marginTop: 4, width: 20, height: 20 }} /><span className="small">I agree that my coach stores these details to build my plan.</span></label>
      {state?.ok && <p className="notice ok" role="status">{state.ok}</p>}
      <button className="btn primary" style={{ minHeight: 50 }} disabled={pending}>{pending ? 'Saving...' : 'Save my profile'}</button>
    </form>
  );
}
