'use client';
export default function PrintButton() {
  return <button className="btn primary" onClick={() => window.print()}>Save as PDF</button>;
}
