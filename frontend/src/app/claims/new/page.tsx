
import Link from "next/link";

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

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-semibold">
            Product Information
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="product"
                className="block text-sm font-medium"
              >
                Product Name
              </label>
              <input
                id="product"
                type="text"
                placeholder="e.g. Wireless headphones"
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label
                htmlFor="issue"
                className="block text-sm font-medium"
              >
                Describe the Issue
              </label>
              <textarea
                id="issue"
                placeholder="What went wrong?"
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3"
              />
            </div>

            <div>
              <label
                htmlFor="evidence"
                className="block text-sm font-medium"
              >
                Upload Evidence
              </label>
              <input
                id="evidence"
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            disabled
            className="mt-8 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white disabled:opacity-50"
          >
            Continue (Coming Soon)
          </button>
        </div>
      </div>
    </main>
  );
}
