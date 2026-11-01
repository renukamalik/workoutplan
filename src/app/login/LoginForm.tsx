'use client';
import { useActionState, useState } from 'react';
import { loginAction } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null as any);
  const [role, setRole] = useState<'client' | 'admin'>('client');
  return (
    <form action={action}>
      <div>
        <h2>Welcome back</h2>
        <p className="muted">Log in to see your plan or manage your clients.</p>
      </div>
      <input type="hidden" name="role" value={role} />
      <div className="row" role="group" aria-label="Who are you?" style={{ background: 'var(--pill)', borderRadius: 12, padding: 4, gap: 4, flexWrap: 'nowrap' }}>
        {(['client', 'admin'] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r}
            style={{ flex: 1, border: 0, borderRadius: 9, minHeight: 44, fontWeight: 700, cursor: 'pointer', background: role === r ? 'var(--accent)' : 'transparent', color: role === r ? '#fff' : 'var(--ink)' }}>
            {r === 'client' ? "I'm a client" : "I'm the coach"}
          </button>
        ))}
      </div>
      <label className="fld">Email<input type="email" name="email" autoComplete="username" required /></label>
      <label className="fld">Password<input type="password" name="password" autoComplete="current-password" required /></label>
      {state?.error && <p className="notice err" role="alert">{state.error}</p>}
      <button className="btn primary" style={{ minHeight: 50, fontSize: 16 }} disabled={pending}>{pending ? 'Logging in...' : 'Log in'}</button>
      <p className="small muted" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
        First time here? Use the email and temporary password your coach sent you. You will be asked to choose your own password.
      </p>
    </form>
  );
}
