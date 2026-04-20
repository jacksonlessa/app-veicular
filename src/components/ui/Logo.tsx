import React from "react";

interface LogoProps {
  size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-[28%] bg-accent flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 21l4-18h8l4 18"/>
          <path d="M9.5 11h5"/>
          <path d="M8 17h8"/>
        </svg>
      </div>
      <div className="leading-none flex items-center">
        <span className="font-extrabold text-text tracking-tight" style={{ fontSize: size * 0.5 }}>Rodagem</span>
        <span className="font-extrabold text-accent tracking-tight" style={{ fontSize: size * 0.5 }}>App</span>
      </div>
    </div>
  );
}
