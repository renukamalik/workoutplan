'use client';
import { useActionState, useState, useTransition } from 'react';
import { importAction, changeMyPasswordAction, resetUserAction } from '@/app/(coach)/admin/actions';
import CopyButton from './CopyButton';

export function ImportBox() {
  const [r, action, pending] = useActionState(importAction, null as any);
  return (
    <form action={action} className="card">
      <h3>Import</h3>
      <p className="small muted">Upload a Rerise backup (.json) or a clients sheet (.csv with name and email columns). Existing clients are never overwritten. New clients get their own temporary password.</p>
      <input type="file" name="file" accept=".json,.csv" aria-label="File to import" />
      <div><button className="btn primary" disabled={pending}>{pending ? 'Importing...' : 'Import file'}</button></div>
      {r?.error && <p className="notice err" role="alert">{r.error}</p>}
      {r && !r.error && (
        <div className="notice ok" role="status">
          {r.added !== undefined ? `${r.added} clients added, ${r.skipped} skipped.` : `${r.clientsAdded} clients, ${r.plansAdded} plans and ${r.checkinsAdded} check-ins added.`}
          {r.logins?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <b>Temporary passwords (shown only now):</b>
              {r.logins.map((l: any) => <div key={l.email} className="small">{l.name} · {l.email} · {l.pw}</div>)}
              <CopyButton label="Copy list" text={r.logins.map((l: any) => `${l.name}\t${l.email}\t${l.pw}`).join('\n')} />
            </div>
          )}
        </div>
      )}
    </form>
  );
}

export function MyPassword() {
  const [r, action, pending] = useActionState(changeMyPasswordAction, null as any);
  return (
    <form action={action} className="card">
      <h3>Your password</h3>
      <label className="fld">New password (8 or more characters)<input type="password" name="password" minLength={8} autoComplete="new-password" /></label>
      {r?.error && <p className="notice err" role="alert">{r.error}</p>}{r?.ok && <p className="notice ok" role="status">{r.ok}</p>}
      <div><button className="btn" disabled={pending}>Change my password</button></div>
    </form>
  );
}

export function ResetButton({ userId }: { userId: string }) {
  const [res, setRes] = useState<any>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button className="btn sm" disabled={pending} onClick={() => start(async () => setRes(await resetUserAction(userId)))}>Reset password</button>
      {res && <div className="small notice ok" style={{ marginTop: 6 }}>New temporary password for {res.name}: <b>{res.pw}</b></div>}
    </>
  );
}
