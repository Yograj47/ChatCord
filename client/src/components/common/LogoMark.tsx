import React from 'react';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Container Background */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="#1e1b4b"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Circuit / Cord Network Lines */}
      <path
        d="M10 11H22M10 21H22M10 11L16 21M22 11L16 21"
        stroke="#818cf8"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Nodes (Socket/Server) */}
      <circle cx="10" cy="11" r="2.25" fill="#a5b4fc" />
      <circle cx="22" cy="11" r="2.25" fill="#a5b4fc" />

      {/* Bottom Nodes (Clients) */}
      <circle cx="10" cy="21" r="2.25" fill="#818cf8" />
      <circle cx="22" cy="21" r="2.25" fill="#818cf8" />

      {/* Real-time Socket Connection Dot (Center Node) */}
      <circle cx="16" cy="21" r="1.75" fill="#34d399" />
    </svg>
  );
};