import Link from "next/link";
import { Logo } from "./Icons";

export default function Footer() {
  return <footer className="site-footer"><Link className="brand" href="/"><Logo /><span>claimly</span></Link><p>Clarity from conversation to claim.</p><span>© {new Date().getFullYear()} Claimly</span></footer>;
}
