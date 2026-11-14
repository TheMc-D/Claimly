
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <p>© 2026 Claimly. All rights reserved.</p>

        <div className="flex gap-6">
          <Link
            href="/"
            className="transition hover:text-blue-600"
          >
            Home
          </Link>

          <Link
            href="/claims"
            className="transition hover:text-blue-600"
          >
            My Claims
          </Link>
        </div>
      </div>
    </footer>
  );
}
