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

To check the frontend flow, open `/claims/new`, create a claim with a small
PNG/JPEG/WebP image or MP4/WebM video, review its quality manually as `Usable`,
generate the template draft, and explicitly submit after reviewing it. A demo
receipt should appear. Refresh the detail page to confirm server persistence,
and open `/claims` to see claims remembered by this browser.

The backend has no list endpoint: My Claims stores only IDs in localStorage,
scoped to the configured backend, then fetches their data from the API. Clearing
browser storage removes this local index. Claim detail links still work while
the backend retains their records. Evidence assessment is manual; generation is
the backend's template fallback; submission saves to a fictional inbox without
sending email. AI/video/voice provider integrations are separate.

Checks: `npx next typegen`, `npx tsc --noEmit`, and `npm run lint`.
