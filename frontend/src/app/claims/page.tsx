
import Link from "next/link";

const demoClaims = [
  {
    id: "demo-001",
    product: "Wireless Headphones",
    status: "Draft",
    issue: "Left speaker stopped working",
  },
  {
    id: "demo-002",
    product: "Water Bottle",
    status: "Ready for Review",
    issue: "Cracked near the base",
  },
];

export default function ClaimsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-blue-600">
          ← Back to Home
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">
              My Claims
            </h1>
            <p className="mt-2 text-slate-600">
              View and manage your claims.
            </p>
          </div>

          <Link
            href="/claims/new"
            className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            + New Claim
          </Link>
        </div>

        <div className="mt-10 space-y-4">
          {demoClaims.map((claim) => (
            <Link
              key={claim.id}
              href={`/claims/${claim.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  {claim.product}
                </h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                  {claim.status}
                </span>
              </div>

              <p className="mt-3 text-slate-600">
                {claim.issue}
              </p>

              <p className="mt-4 text-sm font-medium text-blue-600">
                View Details →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
