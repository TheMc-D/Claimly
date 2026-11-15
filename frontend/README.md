This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Claimly API connection

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` and restart Next.js:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For the deployed demo backend, use `https://claimly-api-rkbt.onrender.com`.
The backend's `FRONTEND_URL` must match the browser origin (normally
`http://localhost:3000`). See `backend/README.md` for starting the API.

The frontend adapts the Figma export to the existing Next.js App Router:
`/` is the landing page, `/claims` is the shared demo dashboard, and
`/claims/[id]` shows live claim details, evidence, receipts, and corrections.
The old ID-entry page at `/claims/new` redirects to `/claims`.

For the hackathon, all backend records belong to one shared demo customer.
The dashboard calls `GET /api/claims` on load, every five seconds while visible,
and when returning to the tab. No login, localStorage index, claim ID entry,
or SMS is needed. A new browser/device using the same backend sees the same
claims automatically. This is a shared demo, not account-based user isolation.

The video agent owns creation, evidence, confirmation during the call, and
submission. The site is for viewing and tracking afterward; it no longer has
customer draft generation/submission controls. To demonstrate it, create and
submit a synthetic claim using the agent or backend `/docs`, then open My Claims
and watch it appear. The actual video/AI integration remains a separate service.

Edit claim opens `/claims/[id]/edit`, a full review page prefilled with product,
customer and purchase details, issue, preferred resolution, written request,
and collected evidence. Save changes updates the same claim through
`PUT /api/claims/{id}` and returns to its details page. Cancel saves nothing.
Optional customer/retailer/order/date fields are now supported by the backend.

Edits retain the original submission and inbox receipt, record the previous
values in `revisions`, and increment `version` to prevent stale editors from
overwriting newer edits. The details page shows the current request and offers
View original submitted request after editing. Saving does not resend anything
to a merchant. The earlier correction-request form has been removed; the legacy
corrections API remains compatible for existing records/integrations.

Deploy the updated backend as well as the frontend. Existing records need no
schema migration; optional metadata, version, and revision history have defaults.

Downloads are plain text (`.txt`), not PDFs. Submission still means storage in a
fictional inbox, not email delivery or a merchant decision.

Checks: `npx next typegen`, `npx tsc --noEmit`, `npm run build`.
Backend checks: from `backend/`, `.venv/bin/python -m unittest discover -s tests -v`.
