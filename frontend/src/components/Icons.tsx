import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;
const Icon = ({ children, ...props }: Props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const ArrowRight = (p: Props) => (
  <Icon {...p}>
    <path d="M5 12h14M14 7l5 5-5 5" />
  </Icon>
);
export const Plus = (p: Props) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const Check = (p: Props) => (
  <Icon {...p}>
    <path d="m5 12 4 4L19 6" />
  </Icon>
);
export const Close = (p: Props) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);
export const Sparkles = (p: Props) => (
  <Icon {...p}>
    <path d="m12 3 .8 2.7A4.8 4.8 0 0 0 16 9l2.7.8-2.7.8a4.8 4.8 0 0 0-3.2 3.2L12 16.5l-.8-2.7A4.8 4.8 0 0 0 8 10.6l-2.7-.8L8 9a4.8 4.8 0 0 0 3.2-3.3L12 3Z" />
    <path d="m19 16 .4 1.1a2.6 2.6 0 0 0 1.5 1.5l1.1.4-1.1.4a2.6 2.6 0 0 0-1.5 1.5L19 22l-.4-1.1a2.6 2.6 0 0 0-1.5-1.5L16 19l1.1-.4a2.6 2.6 0 0 0 1.5-1.5L19 16Z" />
  </Icon>
);
export const Camera = (p: Props) => (
  <Icon {...p}>
    <path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11h18V7a2 2 0 0 0-2-2h-4.5Z" />
    <circle cx="12" cy="11.5" r="3.5" />
  </Icon>
);
export const Video = (p: Props) => (
  <Icon {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3" />
  </Icon>
);
export const Upload = (p: Props) => (
  <Icon {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 19h16" />
  </Icon>
);
export const Download = (p: Props) => (
  <Icon {...p}>
    <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
  </Icon>
);
export const File = (p: Props) => (
  <Icon {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Icon>
);
export const Clock = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
export const Calendar = (p: Props) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M7 3v4M17 3v4M3 10h18" />
  </Icon>
);
export const Info = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);
export const Search = (p: Props) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m16 16 4 4" />
  </Icon>
);
export const Clipboard = (p: Props) => (
  <Icon {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V2h6v2M9 9h6M9 13h6" />
  </Icon>
);
export const Refund = (p: Props) => (
  <Icon {...p}>
    <path d="M20 7H6a3 3 0 0 0-3 3v7h18V8a1 1 0 0 0-1-1Z" />
    <path d="M6 7V5h12v2M3 11h18M7 14h3" />
  </Icon>
);
export const Replacement = (p: Props) => (
  <Icon {...p}>
    <path d="m4 7 8-4 8 4-8 4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7M12 11v10" />
    <path d="m8 13-2 2 2 2M6 15h4" />
  </Icon>
);
export const Package = Replacement;
export const Home = (p: Props) => (
  <Icon {...p}>
    <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z" />
  </Icon>
);
export const ChevronDown = (p: Props) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
export const Logo = (p: Props) => (
  <Icon {...p} viewBox="0 0 32 32">
    <path d="M24.5 6.5A11 11 0 1 0 25 24" />
    <path d="M12 8.5a8.5 8.5 0 0 0 11 12" />
    <path d="M17.5 4.8a11.5 11.5 0 0 1 9.7 9.7" />
  </Icon>
);
