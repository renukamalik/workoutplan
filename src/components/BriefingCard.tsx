'use client';
import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { briefingAction } from '@/app/(coach)/dashboard/actions';

export default function BriefingCard({ aiReady }: { aiReady: boolean }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  return (
    <Card>
      <div className="row between"><h3>This week with AI</h3>
        <Button size="sm" disabled={pending || !aiReady} onClick={() => start(async () => { setErr(''); const r: any = await briefingAction(); if (r.text) setText(r.text); else setErr(r.error); })}>{pending ? 'Thinking...' : text ? 'Refresh' : <><Sparkles />Write my briefing</>}</Button></div>
      {!aiReady && <p className="muted small">Add GEMINI_API_KEY on Render to turn this on.</p>}
      {text && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>}
      {err && <p className="notice err" role="alert">{err}</p>}
      {aiReady && !text && !err && <p className="muted small">A short summary of who needs you this week. The AI only sees first names and counts.</p>}
    </Card>
  );
}
