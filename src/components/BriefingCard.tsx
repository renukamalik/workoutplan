'use client';
import { useState, useTransition } from 'react';
import { briefingAction } from '@/app/(coach)/dashboard/actions';

export default function BriefingCard({ aiReady }: { aiReady: boolean }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  return (
    <section className="card">
      <div className="row between"><h3>This week with Claude</h3>
        <button className="btn sm primary" disabled={pending || !aiReady} onClick={() => start(async () => { setErr(''); const r: any = await briefingAction(); if (r.text) setText(r.text); else setErr(r.error); })}>{pending ? 'Thinking...' : text ? 'Refresh' : 'Write my briefing'}</button></div>
      {!aiReady && <p className="muted small">Add ANTHROPIC_API_KEY on Render to turn this on.</p>}
      {text && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>}
      {err && <p className="notice err" role="alert">{err}</p>}
      {aiReady && !text && !err && <p className="muted small">A short summary of who needs you this week. Claude only sees first names and counts.</p>}
    </section>
  );
}
