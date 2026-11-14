
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Claimly<span className="text-blue-600">.</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            Home
          </Link>

          <Link
            href="/claims"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            My Claims
          </Link>

          <Link
            href="/claims/new"
            className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Start Claim
          </Link>
        </div>
      </nav>
    </header>
  );
}
