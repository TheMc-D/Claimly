
import Link from "next/link";

export type Claim = {
  id: string;
  product: string;
  issue: string;
  status: string;
};

type ClaimCardProps = {
  claim: Claim;
};

export default function ClaimCard({ claim }: ClaimCardProps) {
  return (
    <Link
      href={`/claims/${claim.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {claim.product}
        </h2>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
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
  );
}
