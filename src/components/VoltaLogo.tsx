import React from 'react';

export const VoltaLogo: React.FC<{ className?: string }> = ({ className = 'w-72 h-auto' }) => (
  <svg
    viewBox="0 0 360 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="VOLTA Street Football"
  >
    {/* Angular kinetic lightning V emblem */}
    <path d="M12 18H40L58 68L78 18H104L68 96H48L12 18Z" fill="#F59E0B" />
    <path d="M36 18H50L60 48L70 18H82L63 66H53L36 18Z" fill="#090B10" />
    <path d="M54 62L74 18H86L58 84L54 62Z" fill="#FEF3C7" />

    {/* O L T A bold street geometric letterforms */}
    <path
      d="M112 22H154C161 22 166 27 166 34V82C166 89 161 94 154 94H112C105 94 100 89 100 82V34C100 27 105 22 112 22ZM120 40V76H146V40H120Z"
      fill="#F8FAFC"
    />
    <path d="M180 22H200V76H226V94H180V22Z" fill="#F8FAFC" />
    <path d="M224 22H284V40H264V94H244V40H224V22Z" fill="#F8FAFC" />
    <path d="M294 94L316 22H338L356 94H336L332 78H310L306 94H294ZM314 62H328L321 38L314 62Z" fill="#F59E0B" />

    {/* Crisp street pitch baseline */}
    <rect x="12" y="102" width="344" height="4" fill="#F59E0B" />
  </svg>
);

export const CrewCrest: React.FC<{
  shape: 'shield' | 'diamond' | 'hexagon';
  primary: string;
  secondary: string;
  size?: number;
}> = ({ shape, primary, secondary, size = 48 }) => {
  const path =
    shape === 'shield'
      ? 'M32 4L56 14V32C56 46 45 56 32 60C19 56 8 46 8 32V14L32 4Z'
      : shape === 'diamond'
      ? 'M32 3L60 32L32 61L4 32L32 3Z'
      : 'M32 3L57 17.5V46.5L32 61L7 46.5V17.5L32 3Z';

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={path} fill={primary} stroke="#F8FAFC" strokeWidth="2.5" />
      <path d="M20 20L32 46L44 20H37L32 32L27 20H20Z" fill={secondary} />
    </svg>
  );
};
