
import Link from "next/link";
import ClaimDetails from "@/components/ClaimDetails";

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

        <ClaimDetails key={id} id={id} />
      </div>
    </main>
  );
}
