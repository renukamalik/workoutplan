'use client';
import { useActionState } from 'react';
import { changePasswordAction } from '../login/actions';

export default function ChangePassword() {
  const [state, action, pending] = useActionState(changePasswordAction, null as any);
  return (
    <div className="login">
      <div className="form" style={{ flexBasis: '100%' }}>
        <form action={action}>
          <div>
            <h2>Choose your own password</h2>
            <p className="muted">Your temporary password only works once. Pick one you will remember.</p>
          </div>
          <label className="fld">New password (8 or more characters)<input type="password" name="password" minLength={8} autoComplete="new-password" required /></label>
          <label className="fld">Type it again<input type="password" name="confirm" minLength={8} autoComplete="new-password" required /></label>
          {state?.error && <p className="notice err" role="alert">{state.error}</p>}
          <button className="btn primary" style={{ minHeight: 50 }} disabled={pending}>{pending ? 'Saving...' : 'Save password'}</button>
        </form>
      </div>
    </div>
  );
}
