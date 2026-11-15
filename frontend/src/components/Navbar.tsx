"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Icons";

export default function Navbar() {
  const pathname = usePathname();
  return <header className={`site-header ${pathname === "/" ? "site-header--dark" : ""}`}>
    <Link className="brand" href="/" aria-label="Claimly home"><Logo /><span>claimly</span></Link>
    <nav aria-label="Main navigation">
      <Link className={pathname === "/" ? "active" : ""} href="/">Home</Link>
      <Link className={pathname.startsWith("/claims") ? "active" : ""} href="/claims">My claims</Link>
      <Link href="/#how-it-works">How it works</Link>
    </nav>
  </header>;
}
