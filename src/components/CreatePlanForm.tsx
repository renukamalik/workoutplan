'use client';
import { useActionState, useState } from 'react';
import { createPlanAction } from '@/app/(coach)/create/actions';

type C = { id: string; name: string; goal: string; plan_length: string };
type T = { id: string; title: string; kind: string };

export default function CreatePlanForm({ clients, templates, aiReady }: { clients: C[]; templates: T[]; aiReady: boolean }) {
  const [state, act, pending] = useActionState(createPlanAction, null as any);
  const [source, setSource] = useState(templates[0] ? 't:' + templates[0].id : 'ai');
  const [client, setClient] = useState(clients[0]?.id ?? '');
  const c = clients.find((x) => x.id === client);
  if (clients.length === 0) return <section className="card"><p>Add a client first, then come back here.</p></section>;
  return (
    <form action={act} className="card" style={{ maxWidth: 720 }}>
      <h3>1. Who is it for</h3>
      <label className="fld">Client
        <select name="client" value={client} onChange={(e) => setClient(e.target.value)}>{clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      {c && <p className="small muted">Goal: {c.goal}. Plan length on file: {c.plan_length}.</p>}
      <h3>2. Where to start</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {templates.map((t) => (
          <label key={t.id} className="row" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px', minHeight: 44, flexWrap: 'nowrap' }}>
            <input type="radio" name="src" checked={source === 't:' + t.id} onChange={() => setSource('t:' + t.id)} style={{ width: 20, height: 20 }} />
            <span style={{ flex: 1 }}><b>{t.title}</b> <span className="small muted">(your template, {t.kind})</span></span>
          </label>
        ))}
        <label className="row" style={{ border: '1px solid var(--accent)', borderRadius: 12, padding: '8px 14px', minHeight: 44, flexWrap: 'nowrap', opacity: aiReady ? 1 : 0.6 }}>
          <input type="radio" name="src" checked={source === 'ai'} onChange={() => setSource('ai')} disabled={!aiReady} style={{ width: 20, height: 20 }} />
          <span style={{ flex: 1 }}><b>Write with Claude</b> <span className="small muted">{aiReady ? 'a first draft for you to edit' : '(add ANTHROPIC_API_KEY on Render to turn this on)'}</span></span>
        </label>
      </div>
      <input type="hidden" name="source" value={source} />
      {source === 'ai' && (
        <>
          <div className="row">
            <label className="fld" style={{ flex: '1 1 160px' }}>Training days a week
              <select name="days" defaultValue="5">{[2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label className="fld" style={{ flex: '1 1 160px' }}>Length
              <select name="kind" defaultValue="monthly"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>
          </div>
          <label className="fld">Anything Claude should know
            <textarea name="notes" rows={4} placeholder="Example: goal is to get stronger. Dumbbells and bands at home. Needs gentle hip hinge. No jumping." /></label>
          <p className="small muted">Claude sees her age, goal and health notes only if she has agreed to storage. It never sees her name, phone or email.</p>
        </>
      )}
      {state?.error && <p className="notice err" role="alert">{state.error}</p>}
      <div className="row">
        <button className="btn primary" disabled={pending}>{pending ? (source === 'ai' ? 'Claude is writing... about a minute' : 'Creating...') : 'Create plan'}</button>
      </div>
    </form>
  );
}
