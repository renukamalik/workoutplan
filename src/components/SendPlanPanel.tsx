'use client';
import { useState, useTransition } from 'react';
import { waLink } from '@/lib/plan';
import { recordSendAction } from '@/app/(coach)/send/actions';
import { emailPlanPdfAction } from '@/app/(coach)/plans/actions';

type P = { planId: string; clientId: string; name: string; phone: string; email: string; pdfLink: string; appUrl: string; emailReady: boolean };

export default function SendPlanPanel(p: P) {
  const first = p.name.split(' ')[0];
  const [subject, setSubject] = useState('Your Rerise plan is ready');
  const [text, setText] = useState(
    `Hi ${first}, your new plan is ready. Download your PDF here: ${p.pdfLink}\n\nYou can also log in to see it, tick off each exercise and send your weekly check-in: ${p.appUrl}/\n\nSee you in our live session. Coach Renuka`);
  const [msg, setMsg] = useState('');
  const [, start] = useTransition();
  const log = (ch: string) => start(() => recordSendAction(p.clientId, p.planId, ch, subject));
  return (
    <section className="card" id="send">
      <h3>Send to {p.name}</h3>
      <p className="small muted">Save your changes first, then make or send the PDF. The PDF link works for 60 days and opens without a login, so only send it to {first}.</p>
      <div className="row">
        <a className="btn" href={`/api/plans/${p.planId}/pdf`} target="_blank" rel="noopener">Open PDF</a>
        <a className="btn" href={`/api/plans/${p.planId}/pdf`} download>Download PDF</a>
      </div>
      <label className="fld">Message<textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <label className="fld">Email subject<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
      <div className="row">
        {p.phone ? <a className="btn wa" href={waLink(p.phone, text)} target="_blank" rel="noopener" onClick={() => log('whatsapp')}>Send on WhatsApp</a> : <span className="small muted">No WhatsApp number on file.</span>}
        <a className="btn primary" href={`mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`} onClick={() => log('email')}>Email from my email app</a>
        {p.emailReady && <button className="btn" onClick={() => start(async () => { const r: any = await emailPlanPdfAction(p.planId, subject, text); setMsg(r.error || r.ok); })}>Email the PDF attached</button>}
      </div>
      <p className="small muted">WhatsApp cannot attach a file from a link, so it sends the PDF link. Tap send in WhatsApp.</p>
      {msg && <p className="notice" role="status">{msg}</p>}
    </section>
  );
}
