import type { Brand } from "../lib/types";

interface P {
  className?: string;
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconPulse = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M2.5 12h4.2l2.6-6.4 4.3 12.8L16.2 12h5.3" />
  </svg>
);

export const IconTerminal = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M7 9.5l3 2.7-3 2.7M12.5 15.2H17" />
  </svg>
);

export const IconLedger = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M4 6.2h16M4 12h16M4 17.8h9.5" />
    <circle cx="19" cy="17.8" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCode = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5" />
  </svg>
);

export const IconKey = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <circle cx="8" cy="15.5" r="4" />
    <path d="M10.8 12.7L20 3.5M16.5 7l2.6 2.6M13.5 10l2 2" />
  </svg>
);

export const IconCopy = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </svg>
);

export const IconCheck = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M4.5 12.8l4.6 4.7L19.5 6.6" />
  </svg>
);

export const IconX = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconRefund = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M9.5 14.5L4.5 9.5l5-5M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3.5" />
  </svg>
);

export const IconSearch = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L20.5 20.5" />
  </svg>
);

export const IconPause = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth={2.2} />
  </svg>
);

export const IconPlay = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M7.5 5.2l11 6.8-11 6.8z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPlus = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconChevron = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);

export const IconBolt = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M13 2.5L4.5 13.5H11L10 21.5l8.5-11H12l1-8z" />
  </svg>
);

export const IconShield = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M12 2.8l7.2 2.9v5.2c0 4.7-3 8.4-7.2 10.3-4.2-1.9-7.2-5.6-7.2-10.3V5.7L12 2.8z" />
    <path d="M8.8 12l2.2 2.2 4.2-4.4" />
  </svg>
);

export const IconRotate = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" />
  </svg>
);

export const IconAlert = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" />
    <path d="M12 10v4.2" />
    <circle cx="12" cy="17" r="0.4" fill="currentColor" />
  </svg>
);

export const IconClock = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2.4" />
  </svg>
);

export const IconSend = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M21 3L10.5 13.5M21 3l-6.8 18-3.7-8.3L2 9 21 3z" />
  </svg>
);

export const IconGlobe = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.2 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.2-4-8.5s1.4-6.2 4-8.5z" />
  </svg>
);

export const IconArrowUpRight = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M6.5 17.5l11-11M8.5 6.5h9v9" />
  </svg>
);

export const IconArrowDownRight = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <path d="M6.5 6.5l11 11M17.5 8.5v9h-9" />
  </svg>
);

export const IconInfo = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...S}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.4" fill="currentColor" />
  </svg>
);

/* ---------- brand marks ---------- */
export function BrandMark({ brand, className }: { brand: Brand; className?: string }) {
  switch (brand) {
    case "visa":
      return (
        <svg viewBox="0 0 36 24" className={className}>
          <rect width="36" height="24" rx="4" fill="#1a34b8" />
          <text
            x="18"
            y="16"
            textAnchor="middle"
            fontStyle="italic"
            fontWeight="800"
            fontSize="9.5"
            letterSpacing="0.4"
            fill="#fff"
            fontFamily="Arial, sans-serif"
          >
            VISA
          </text>
        </svg>
      );
    case "mastercard":
      return (
        <svg viewBox="0 0 36 24" className={className}>
          <rect width="36" height="24" rx="4" fill="#262626" />
          <circle cx="15" cy="12" r="6.5" fill="#eb001b" />
          <circle cx="22" cy="12" r="6.5" fill="#f79e1b" fillOpacity="0.92" />
        </svg>
      );
    case "amex":
      return (
        <svg viewBox="0 0 36 24" className={className}>
          <rect width="36" height="24" rx="4" fill="#2e77bc" />
          <text
            x="18"
            y="15"
            textAnchor="middle"
            fontWeight="700"
            fontSize="6.6"
            letterSpacing="0.6"
            fill="#fff"
            fontFamily="Arial, sans-serif"
          >
            AMEX
          </text>
        </svg>
      );
    case "discover":
      return (
        <svg viewBox="0 0 36 24" className={className}>
          <rect width="36" height="24" rx="4" fill="#f4f6f8" stroke="#d5dbe1" />
          <circle cx="22.5" cy="12" r="6" fill="#f48120" />
          <text
            x="11.5"
            y="14.4"
            textAnchor="middle"
            fontWeight="700"
            fontSize="6"
            fill="#3b4652"
            fontFamily="Arial, sans-serif"
          >
            DISC
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 24" className={className}>
          <rect width="36" height="24" rx="4" fill="#33475c" />
          <rect x="5" y="8" width="14" height="8" rx="1.6" fill="none" stroke="#b9c9d9" strokeWidth="1.6" />
          <path d="M24 10.5h7M24 13.5h5" stroke="#b9c9d9" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

export const IconAndroid = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4.5 13.5a7.5 7.5 0 0 1 15 0v1.5h-15v-1.5Z" />
    <path d="m7.2 5.4 1.5 2.5M16.8 5.4l-1.5 2.5" />
    <circle cx="9.2" cy="11.3" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="14.8" cy="11.3" r="0.5" fill="currentColor" stroke="none" />
    <path d="M5.5 15v2.2A2.8 2.8 0 0 0 8.3 20h7.4a2.8 2.8 0 0 0 2.8-2.8V15" />
  </svg>
);
export const IconDownload = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
export const IconTag = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 11V4a1 1 0 0 1 1-1h7l10 10-8 8L3 11Z" />
    <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
export const IconTrash = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" />
  </svg>
);
export const LogoMark = ({ className }: P) => (
  <svg viewBox="0 0 32 32" className={className}>
    <rect width="32" height="32" rx="7" fill="var(--color-pine-600)" />
    <path
      d="M7 11h11M7 16h18M7 21h11"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="22" cy="11" r="2.6" fill="#fff" />
    <circle cx="12" cy="21" r="2.6" fill="#fff" />
  </svg>
);
