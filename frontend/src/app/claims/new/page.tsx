
import Link from "next/link";
import ClaimForm from "@/components/ClaimForm";

export default function NewClaimPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-blue-600">
          ← Back to Home
        </Link>

        <h1 className="mt-8 text-4xl font-bold">
          Start a New Claim
        </h1>

        <p className="mt-3 text-slate-600">
          Tell us about your product and what went wrong.
        </p>

        <ClaimForm />
      </div>
    </main>
  );
}
