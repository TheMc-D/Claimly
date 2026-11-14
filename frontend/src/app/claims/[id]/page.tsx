
import Link from "next/link";

type ClaimDetailsProps = {
  params: Promise<{ id: string }>;
};

export default async function ClaimDetailsPage({
  params,
}: ClaimDetailsProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/claims" className="text-blue-600">
          ← Back to Claims
        </Link>

        <h1 className="mt-8 text-4xl font-bold">
          Claim Details
        </h1>

        <p className="mt-3 text-slate-600">
          Claim ID: {id}
        </p>

        <div className="mt-10 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-semibold">
              Product Information
            </h2>
            <p className="mt-4 text-slate-600">
              Product information will appear here.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-semibold">
              Evidence
            </h2>
            <p className="mt-4 text-slate-600">
              Uploaded photos and video evidence will appear here.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-semibold">
              AI-Generated Claim
            </h2>
            <p className="mt-4 text-slate-600">
              Your AI-generated claim summary will appear here.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
