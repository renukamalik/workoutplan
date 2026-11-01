export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.6" />
        <path d="M9 28c3-10 9-15 22-16" fill="none" stroke="#9C3E63" strokeWidth="3" strokeLinecap="round" />
        <path d="M23 10l9 2-4 8" fill="none" stroke="#9C3E63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Rerise
    </span>
  );
}
