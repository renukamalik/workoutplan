'use client';
import { useState, useTransition } from 'react';
import { FileText, Download, MessageCircle, Mail, MailCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
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
    <Card id="send">
      <h3>Send to {p.name}</h3>
      <p className="small muted">Save your changes first, then make or send the PDF. The PDF link works for 60 days and opens without a login, so only send it to {first}.</p>
      <div className="row">
        <Button asChild variant="outline"><a href={`/api/plans/${p.planId}/pdf`} target="_blank" rel="noopener"><FileText />Open PDF</a></Button>
        <Button asChild variant="outline"><a href={`/api/plans/${p.planId}/pdf`} download><Download />Download</a></Button>
      </div>
      <div className="flex flex-col gap-1.5"><Label htmlFor="msg">Message</Label><Textarea id="msg" rows={7} value={text} onChange={(e) => setText(e.target.value)} /></div>
      <div className="flex flex-col gap-1.5"><Label htmlFor="subj">Email subject</Label><Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {p.phone ? <Button asChild variant="whatsapp" size="lg"><a href={waLink(p.phone, text)} target="_blank" rel="noopener" onClick={() => log('whatsapp')}><MessageCircle />Send on WhatsApp</a></Button> : <span className="small muted">No WhatsApp number on file.</span>}
        <Button asChild size="lg"><a href={`mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`} onClick={() => log('email')}><Mail />Email from my email app</a></Button>
        {p.emailReady && <Button variant="outline" size="lg" onClick={() => start(async () => { const r: any = await emailPlanPdfAction(p.planId, subject, text); setMsg(r.error || r.ok); })}><MailCheck />Email the PDF attached</Button>}
      </div>
      <p className="small muted">WhatsApp cannot attach a file from a link, so it sends the PDF link. Tap send in WhatsApp.</p>
      {msg && <p className="notice" role="status">{msg}</p>}
    </Card>
  );
}
