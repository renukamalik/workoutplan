'use client';
import { useState, useTransition } from 'react';
import { toggleDoneAction } from '@/app/(client)/me/actions';

export default function ClientPlanChecks({ planId, itemId, initial }: { planId: string; itemId: string; initial: boolean }) {
  const [done, setDone] = useState(initial);
  const [, start] = useTransition();
  return (
    <label className="row small" style={{ marginLeft: 'auto', gap: 8, cursor: 'pointer', minHeight: 44 }}>
      <input type="checkbox" checked={done} style={{ width: 22, height: 22, accentColor: '#3F7560' }}
        onChange={(e) => { const v = e.target.checked; setDone(v); start(() => toggleDoneAction(planId, itemId, v)); }} />
      Done
    </label>
  );
}
