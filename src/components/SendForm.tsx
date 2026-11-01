'use client';
import { useState, useTransition } from 'react';
import { waLink, fillTemplate } from '@/lib/plan';
import { recordSendAction, saveGroupAction, deleteGroupAction, emailAllAction } from '@/app/(coach)/send/actions';

type C = { id: string; name: string; email: string; phone: string };
type G = { id: string; name: string; members: string[] };
const TEMPLATES: Record<string, { subject: string; body: string }> = {
  'New plan is ready': { subject: 'Your new plan is ready', body: 'Hi {name}, your new plan is ready. Open it here: {link}. Do the opener first on every training day, and send me your check-in on Sunday. See you in our live session.' },
  'Weekly check-in reminder': { subject: 'Your weekly check-in', body: 'Hi {name}, a quick reminder to fill in your weekly check-in here: {link}. It takes two minutes. See you in our live session.' },
  'Renewal for next month': { subject: 'Your next month with Rerise', body: 'Hi {name}, you have done really well this month. Shall we continue with the next block? I have your Month 2 plan ready. Log in here to see this month: {link}.' },
};

export default function SendForm({ clients, groups, plans, appUrl, emailReady }: { clients: C[]; groups: G[]; plans: { id: string; title: string }[]; appUrl: string; emailReady: boolean }) {
  const [mode, setMode] = useState<'one' | 'group'>('one');
  const [sel, setSel] = useState<string[]>([]);
  const [plan, setPlan] = useState(plans[0]?.id ?? '');
  const [tpl, setTpl] = useState('New plan is ready');
  const [subject, setSubject] = useState(TEMPLATES['New plan is ready'].subject);
  const [body, setBody] = useState(TEMPLATES['New plan is ready'].body);
  const [msg, setMsg] = useState('');
  const [gname, setGname] = useState('');
  const [, start] = useTransition();
  const chosen = clients.filter((c) => sel.includes(c.id));
  const first = chosen[0];
  const fill = (c: C) => fillTemplate(body, { name: c.name.split(' ')[0], link: appUrl });
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const log = (c: C, ch: string) => start(() => recordSendAction(c.id, plan || null, ch, subject));

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <div style={{ flex: '999 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="card">
          <h3>1. Who gets it</h3>
          <div className="row" role="group" aria-label="Recipients" style={{ background: 'var(--pill)', borderRadius: 12, padding: 4, gap: 4, maxWidth: 360, flexWrap: 'nowrap' }}>
            {(['one', 'group'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setSel([]); }} aria-pressed={mode === m}
                style={{ flex: 1, border: 0, borderRadius: 9, minHeight: 44, fontWeight: 700, cursor: 'pointer', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#fff' : 'var(--ink)' }}>{m === 'one' ? 'One client' : 'A group'}</button>
            ))}
          </div>
          {mode === 'group' && (
            <div className="row">
              <select className="in" aria-label="Group" defaultValue="" onChange={(e) => { const g = groups.find((x) => x.id === e.target.value); setSel(g ? g.members : []); }}>
                <option value="">Pick a saved group</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.members.length})</option>)}
              </select>
              {groups.map((g) => <button key={g.id} className="btn sm danger" onClick={() => start(() => deleteGroupAction(g.id))} aria-label={`Delete group ${g.name}`}>Delete {g.name}</button>)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clients.length === 0 && <p className="muted">Add clients first.</p>}
            {clients.map((c) => (
              <label key={c.id} className="row" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px', minHeight: 44, flexWrap: 'nowrap' }}>
                <input type={mode === 'one' ? 'radio' : 'checkbox'} name="who" checked={sel.includes(c.id)} onChange={() => (mode === 'one' ? setSel([c.id]) : toggle(c.id))} style={{ width: 20, height: 20 }} />
                <span style={{ fontWeight: 700, flex: 1 }}>{c.name}</span>
                <span className="small muted">{c.phone ? 'WhatsApp and email' : 'Email only'}</span>
              </label>
            ))}
          </div>
          {mode === 'group' && sel.length > 1 && (
            <div className="row"><input className="in" value={gname} onChange={(e) => setGname(e.target.value)} placeholder="Save these as a group" aria-label="Group name" />
              <button className="btn sm" onClick={() => start(async () => { const r: any = await saveGroupAction(gname, sel); setMsg(r.error || 'Group saved.'); setGname(''); })}>Save group</button></div>
          )}
          <p className="small muted">Each person gets her own message with her own name. Group members never see each other.</p>
        </section>
        <section className="card">
          <h3>2. Write the message</h3>
          <label className="fld">Plan to mention
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>{plans.length === 0 && <option value="">No plans yet</option>}{plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
          <label className="fld">Start from a template
            <select value={tpl} onChange={(e) => { setTpl(e.target.value); setSubject(TEMPLATES[e.target.value].subject); setBody(TEMPLATES[e.target.value].body); }}>{Object.keys(TEMPLATES).map((k) => <option key={k}>{k}</option>)}</select></label>
          <label className="fld">Email subject<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
          <label className="fld">Message<textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></label>
          <p className="small muted">{'{name}'} and {'{link}'} are filled in for each client. Do not put health details in a message.</p>
        </section>
      </div>
      <aside style={{ flex: '1 1 360px', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="card">
          <h3>Preview{first ? ` for ${first.name.split(' ')[0]}` : ''}</h3>
          {first ? <><div className="bubble">{fill(first)}</div><p className="small muted">Email subject: {subject}</p></> : <p className="muted">Pick a client to see her message.</p>}
        </section>
        <section className="card">
          <h3>3. Send</h3>
          <p className="small muted">WhatsApp opens one chat at a time with the message ready. Tap send there. Email opens in your own email app, or sends from here when email sending is set up.</p>
          {chosen.length === 0 && <p className="muted small">No one selected yet.</p>}
          {chosen.map((c) => (
            <div key={c.id} className="row between" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
              <b>{c.name}</b>
              <div className="row" style={{ gap: 8 }}>
                {c.phone && <a className="btn wa sm" href={waLink(c.phone, fill(c))} target="_blank" rel="noopener" onClick={() => log(c, 'whatsapp')}>WhatsApp</a>}
                <a className="btn primary sm" href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fill(c))}`} onClick={() => log(c, 'email')}>Email</a>
              </div>
            </div>
          ))}
          {emailReady && chosen.length > 0 && <button className="btn" onClick={() => start(async () => { const r: any = await emailAllAction(sel, plan || null, subject, body); setMsg(r.error || r.ok); })}>Email all {chosen.length} from here</button>}
          {msg && <p className="notice" role="status">{msg}</p>}
        </section>
      </aside>
    </div>
  );
}
