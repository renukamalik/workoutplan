import PDFDocument from 'pdfkit';
import type { PlanData } from './plan';
import { safeUrl } from './plan';

const PLUM = '#6E2442', ROSE = '#9C3E63', BLUSH = '#F2DAD5', SOFT = '#FBF4F2', INK = '#2B1B2E', MUTE = '#6F5A65', LINE = '#EAD6D1';

// Built-in PDF fonts only draw Latin text, so anything else becomes a plain character.
const clean = (s: string) => (s || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7E -ÿ•]/g, '').trim();

export type PdfInput = { title: string; clientName: string; kind: string; data: PlanData; appUrl: string };

export function buildPlanPdf(inp: PdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: { Title: clean(inp.title), Author: 'Rerise' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width, H = doc.page.height, M = 40, CW = W - M * 2, BOTTOM = H - 56;
    let y = 0;

    // Cover band
    doc.rect(0, 0, W, 150).fill(PLUM);
    doc.fillColor('#F2DAD5').font('Helvetica-Bold').fontSize(10).text('RERISE  ·  STRENGTH PLAN', M, 36, { characterSpacing: 2 });
    doc.fillColor('#FFFFFF').font('Times-Roman').fontSize(34).text(clean(inp.clientName) || 'Your plan', M, 56, { width: CW });
    doc.fillColor('#F2DAD5').font('Helvetica').fontSize(12).text(clean(inp.title).replace(new RegExp('^' + clean(inp.clientName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*'), ''), M, 108, { width: CW });
    y = 170;
    const pill = (label: string, value: string, x: number) => {
      doc.roundedRect(x, y, 150, 44, 8).fill(SOFT);
      doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), x + 12, y + 8, { characterSpacing: 1 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text(clean(value) || '-', x + 12, y + 22, { width: 128 });
    };
    pill('Week', inp.data.week, M);
    pill('Phase', inp.data.phase, M + 160);
    pill('Length', inp.kind === 'quarterly' ? 'Quarterly' : 'Monthly', M + 320);
    y += 62;
    doc.fillColor(MUTE).font('Helvetica').fontSize(9.5).text('Do the opener first on every training day. Move with control. Choose the lower end of the range when tired, and stay pain-free. If anything hurts, stop and tell your coach.', M, y, { width: CW, lineGap: 2 });
    y = doc.y + 18;

    const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = 40; } };

    for (const day of inp.data.days) {
      ensure(70);
      doc.roundedRect(M, y, CW, 34, 8).fill(BLUSH);
      doc.fillColor(PLUM).font('Times-Bold').fontSize(17).text(clean(day.name), M + 14, y + 8, { continued: false });
      if (day.tag) doc.fillColor(ROSE).font('Helvetica-Bold').fontSize(10).text(clean(day.tag).toUpperCase(), M + 14, y + 12, { width: CW - 28, align: 'right', characterSpacing: 1 });
      y += 42;
      if (day.focus) { doc.fillColor(MUTE).font('Helvetica-Oblique').fontSize(10).text(clean(day.focus), M + 4, y, { width: CW - 8 }); y = doc.y + 8; }
      if (day.note) { doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(clean(day.note), M + 4, y, { width: CW - 8, lineGap: 1.5 }); y = doc.y + 8; }

      for (const it of day.items) {
        const cue = clean(it.cue);
        const cueH = cue ? doc.font('Helvetica').fontSize(9.5).heightOfString(cue, { width: CW - 150 }) : 0;
        const nameH = doc.font('Helvetica-Bold').fontSize(11.5).heightOfString(clean(it.name), { width: CW - 150 });
        const rowH = Math.max(46, 8 + nameH + 3 + (it.tag ? 12 : 0) + cueH + 4 + (safeUrl(it.video) ? 13 : 0) + 8);
        ensure(rowH + 6);
        doc.moveTo(M, y).lineTo(M + CW, y).lineWidth(0.6).strokeColor(LINE).stroke();
        // left: name, tag, cue
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(11.5).text(clean(it.name), M + 4, y + 8, { width: CW - 150 });
        let ty = doc.y + 1;
        if (it.tag) { doc.fillColor(ROSE).font('Helvetica-Bold').fontSize(8).text(clean(it.tag).toUpperCase(), M + 4, ty, { width: CW - 150, characterSpacing: 0.8 }); ty = doc.y + 2; }
        if (cue) { doc.fillColor(MUTE).font('Helvetica').fontSize(9.5).text(cue, M + 4, ty, { width: CW - 150, lineGap: 1.2 }); ty = doc.y + 2; }
        const v = safeUrl(it.video);
        if (v) { doc.fillColor(ROSE).font('Helvetica-Bold').fontSize(9).text('Watch video', M + 4, ty, { width: 90, link: v, underline: true }); }
        // right: sets, reps, rest
        const cols: [string, string][] = [['SETS', it.sets], ['REPS', it.reps], ['REST', it.rest]];
        const cx = M + CW - 138;
        cols.forEach(([lab, val], i) => {
          const x = cx + i * 46;
          doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(7).text(lab, x, y + 9, { width: 44, align: 'center', characterSpacing: 1 });
          doc.fillColor(INK).font('Helvetica-Bold').fontSize(it.reps && lab === 'REPS' && it.reps.length > 6 ? 8.5 : 11).text(clean(val) || '-', x, y + 21, { width: 44, align: 'center' });
        });
        y += rowH;
      }
      y += 16;
    }

    // Footer on every page
    const n = doc.bufferedPageRange().count;
    for (let i = 0; i < n; i++) {
      doc.switchToPage(i);
      doc.moveTo(M, H - 40).lineTo(W - M, H - 40).lineWidth(0.6).strokeColor(LINE).stroke();
      doc.fillColor(MUTE).font('Helvetica').fontSize(8.5).text(`Rerise by Renuka  ·  ${inp.appUrl.replace(/^https?:\/\//, '')}`, M, H - 30, { width: CW / 2, lineBreak: false });
      doc.text(`Page ${i + 1} of ${n}`, M + CW / 2, H - 30, { width: CW / 2, align: 'right', lineBreak: false });
    }
    doc.end();
  });
}
