
import Link from "next/link";

export default function Home() {
  const steps = [
    {
      number: "01",
      title: "Show the problem",
      description:
        "Use your camera or upload a photo to document the issue.",
    },
    {
      number: "02",
      title: "Let AI organize it",
      description:
        "Claimly helps describe the issue and prepare supporting evidence.",
    },
    {
      number: "03",
      title: "Review your claim",
      description:
        "Check your information and prepare a request for the seller.",
    },
  ];

  return (
    <main className="bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-24 text-center">
        <div className="mb-6 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          AI-powered claims assistance
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Refund claims,
          <span className="text-blue-600"> made simple.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
          Stop struggling with customer support. Show us what went
          wrong, and Claimly helps you document the issue, gather
          evidence, and prepare your claim in minutes.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/claims/new"
            className="rounded-full bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Start a Claim
          </Link>

          <a
            href="#how-it-works"
            className="rounded-full border border-slate-300 bg-white px-8 py-4 font-semibold transition hover:bg-slate-50"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="border-t border-slate-200 bg-white px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Three steps. One simple claim.
            </h2>

            <p className="mt-4 text-slate-600">
              From damaged product to ready-to-send request.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-8"
              >
                <span className="text-sm font-bold text-blue-600">
                  {step.number}
                </span>

                <h3 className="mt-5 text-xl font-bold">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
